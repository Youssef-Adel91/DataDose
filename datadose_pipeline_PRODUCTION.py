"""
DataDose — Production Orchestration DAG

Task groups, in order (see ARCHITECTURE.md for the reasoning behind each
boundary):

    kafka_orchestration       -- broker reachable, producer actively producing
    databricks_processing     -- pre-checks + trigger the ONE notebook job, wait for it
    snowflake_transformation  -- promote new staging rows into the dimensional model
    snowflake_validation      -- freshness + data-quality checks
    notify

All credentials come from Airflow Connections (snowflake_default,
neo4j_default, kafka_default, databricks_default), never from environment
variables — see src/airflow_checks/common.py.

Kafka topics handled:
    DataDose.in  — ingestion topic (producer → Databricks)
    DataDose.out — transformation topic (Databricks → downstream)
Both topics are verified in kafka_orchestration before Databricks is triggered.

PRODUCTION DEPLOYMENT NOTES:
    This file is the fully restored production version. All EmptyOperator
    placeholders used during local WSL2 handover have been replaced with
    their original PythonOperator and DatabricksSubmitRunOperator tasks.

    Before deploying to production, ensure:
    1. All four Airflow Connections exist:
           snowflake_default  (type: Snowflake)
           neo4j_default      (type: Generic)
           kafka_default      (type: Generic)
           databricks_default (type: Databricks)
    2. Airflow Variable 'databricks_notebook_path' is set.
    3. KAFKA_BROKER_CHECK_BYPASS=false (or unset) in the environment.
    4. SNOWFLAKE_CHECK_BYPASS=false (or unset) in the environment.
    5. Host has sufficient RAM (8GB+ recommended) for Snowflake and
       Databricks provider C-extensions.
"""
import sys
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.databricks.operators.databricks import DatabricksSubmitRunOperator
from airflow.utils.task_group import TaskGroup

sys.path.append("/opt/airflow/src/airflow_checks")  # mounted in docker-compose.airflow.yaml

from verify_connections import verify_connections
from verify_certificate import verify_certificate
from verify_kafka_broker import verify_kafka_broker
from verify_kafka_producer_activity import verify_kafka_producer_activity
from verify_snowflake import verify_snowflake
from verify_neo4j import verify_neo4j
from load_dimensional_model import load_dimensional_model
from validate_snowflake_load import validate_snowflake_load
from data_quality_checks import data_quality_checks

sys.path.append("/opt/airflow/dags")
from databricks_job_spec import build_databricks_run_spec

SLACK_CONN_ID = "slack_default"


def _notify_failure(context):
    """On-failure callback — sends Slack alert if slack_default is configured,
    logs a warning and continues silently if it isn't."""
    try:
        from airflow.providers.slack.notifications.slack import send_slack_notification
        from airflow.hooks.base import BaseHook
        BaseHook.get_connection(SLACK_CONN_ID)
        send_slack_notification(
            slack_conn_id=SLACK_CONN_ID,
            text=(
                "DataDose task failed: {{ ti.task_id }} "
                "in {{ ti.dag_id }} (run {{ ti.run_id }})"
            ),
            channel="#datadose-alerts",
        )(context)
    except Exception as exc:
        print(f"[WARN] Slack notification skipped: {exc}")


def _notify_success(**context):
    """Notify task callable — sends Slack alert if slack_default is configured,
    logs and continues silently if it isn't."""
    try:
        from airflow.providers.slack.notifications.slack import send_slack_notification
        from airflow.hooks.base import BaseHook
        BaseHook.get_connection(SLACK_CONN_ID)
        send_slack_notification(
            slack_conn_id=SLACK_CONN_ID,
            text="DataDose run succeeded ✅ (run {{ run_id }})",
            channel="#datadose-alerts",
        )(context)
    except Exception as exc:
        print(f"[WARN] Slack notification skipped: {exc}")


default_args = {
    "owner": "datadose",
    "retries": 2,
    "retry_delay": timedelta(seconds=30),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(minutes=8),
    "on_failure_callback": _notify_failure,
}

with DAG(
    dag_id="datadose_pipeline",
    description=(
        "DataDose: Kafka health (in + out topics) → "
        "Databricks AvailableNow → Snowflake promotion → validation"
    ),
    default_args=default_args,
    schedule="*/2 * * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["datadose", "streaming", "production"],
) as dag:

    start = EmptyOperator(task_id="start")

    # ─────────────────────────────────────────────────────────────────────────
    # kafka_orchestration
    #
    # The producer runs continuously as its own Docker service
    # (producer-simulator in docker-compose.airflow.yaml) — Airflow doesn't
    # start/stop it, only confirms it's alive and both broker topics exist.
    #
    # verify_connections          — all four Airflow Connections present
    # verify_certificate          — ca.pem mounted and valid
    # verify_kafka_broker         — broker reachable, DataDose.in + DataDose.out exist
    # verify_kafka_producer_activity — producer actively sending to DataDose.in
    # ─────────────────────────────────────────────────────────────────────────
    with TaskGroup("kafka_orchestration") as kafka_orchestration:

        t_conn = PythonOperator(
            task_id="verify_connections",
            python_callable=verify_connections,
        )

        t_cert = PythonOperator(
            task_id="verify_certificate",
            python_callable=verify_certificate,
        )

        t_broker = PythonOperator(
            task_id="verify_kafka_broker",
            python_callable=verify_kafka_broker,
        )

        t_producer = PythonOperator(
            task_id="verify_kafka_producer_activity",
            python_callable=verify_kafka_producer_activity,
        )

        t_conn >> t_cert >> t_broker >> t_producer

    # ─────────────────────────────────────────────────────────────────────────
    # databricks_processing
    #
    # Snowflake and Neo4j pre-checks run in parallel before the notebook is
    # triggered — fail fast if either dependency is unavailable.
    # DatabricksSubmitRunOperator blocks until the run finishes
    # (wait_for_termination=True by default), safe because AvailableNow
    # always terminates on its own.
    # ─────────────────────────────────────────────────────────────────────────
    with TaskGroup("databricks_processing") as databricks_processing:

        t_snowflake_pre = PythonOperator(
            task_id="verify_snowflake",
            python_callable=verify_snowflake,
        )

        t_neo4j_pre = PythonOperator(
            task_id="verify_neo4j",
            python_callable=verify_neo4j,
        )

        t_run_notebook = DatabricksSubmitRunOperator(
            task_id="run_databricks_notebook",
            databricks_conn_id="databricks_default",
            json=build_databricks_run_spec(),
            polling_period_seconds=15,
        )

        [t_snowflake_pre, t_neo4j_pre] >> t_run_notebook

    # ─────────────────────────────────────────────────────────────────────────
    # snowflake_transformation
    #
    # Promotes new staging rows (written by Databricks) into DIM_* / FACT_*
    # tables. SQL is idempotent — safe to retry; NOT EXISTS guards prevent
    # duplicate rows on re-runs with no new staging data.
    # ─────────────────────────────────────────────────────────────────────────
    with TaskGroup("snowflake_transformation") as snowflake_transformation:

        t_promote = PythonOperator(
            task_id="load_dimensional_model",
            python_callable=load_dimensional_model,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # snowflake_validation
    #
    # validate_snowflake_load — freshness check (last staging write < FRESHNESS_MINUTES)
    # data_quality_checks     — null rates, row counts within expected thresholds
    #
    # If validation fails, dashboards should not be trusted — the failure
    # callback fires a Slack alert to #datadose-alerts.
    # ─────────────────────────────────────────────────────────────────────────
    with TaskGroup("snowflake_validation") as snowflake_validation:

        t_freshness = PythonOperator(
            task_id="validate_snowflake_load",
            python_callable=validate_snowflake_load,
        )

        t_dq = PythonOperator(
            task_id="data_quality_checks",
            python_callable=data_quality_checks,
        )

        t_freshness >> t_dq

    # ─────────────────────────────────────────────────────────────────────────
    # notify_success
    #
    # Fires only when every upstream group succeeded. Slack notification is
    # best-effort — a missing slack_default Connection logs a warning and
    # does not fail the DAG run.
    # ─────────────────────────────────────────────────────────────────────────
    notify_success_task = PythonOperator(
        task_id="notify_success",
        python_callable=_notify_success,
    )

    end = EmptyOperator(task_id="end")

    # ── Pipeline dependency chain ─────────────────────────────────────────────
    (
        start
        >> kafka_orchestration
        >> databricks_processing
        >> snowflake_transformation
        >> snowflake_validation
        >> notify_success_task
        >> end
    )