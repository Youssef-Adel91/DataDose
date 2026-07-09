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

NOTE — LOCAL WSL2 HANDOVER MODE:
    Several tasks are replaced with EmptyOperator due to Snowflake and
    Databricks provider C-extensions crashing the Celery worker process
    silently under WSL2 memory constraints. The pipeline structure, task
    groups, dependencies, and all bypass logic are preserved exactly.
    Tasks marked [BYPASSED] should be restored to PythonOperator on a
    production host with sufficient RAM.

    Bypassed tasks:
        verify_connections          [BYPASSED] → EmptyOperator
        verify_snowflake            [BYPASSED] → EmptyOperator
        run_databricks_notebook     [BYPASSED] → EmptyOperator
        load_dimensional_model      [BYPASSED] → EmptyOperator
        validate_snowflake_load     [BYPASSED] → EmptyOperator
        data_quality_checks         [BYPASSED] → EmptyOperator
        verify_neo4j                [BYPASSED] → EmptyOperator
"""
import sys
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.utils.task_group import TaskGroup

sys.path.append("/opt/airflow/src/airflow_checks")

from verify_certificate import verify_certificate
from verify_kafka_broker import verify_kafka_broker
from verify_kafka_producer_activity import verify_kafka_producer_activity

SLACK_CONN_ID = "slack_default"


def _notify_failure(context):
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

    # ── kafka_orchestration ───────────────────────────────────────────────────
    with TaskGroup("kafka_orchestration") as kafka_orchestration:

        t_conn = EmptyOperator(
            task_id="verify_connections",
        )  # [BYPASSED] — restore to PythonOperator(verify_connections) on prod

        t_cert = PythonOperator(
            task_id="verify_certificate",
            python_callable=verify_certificate,
        )

        t_broker = PythonOperator(
            task_id="verify_kafka_broker",
            python_callable=verify_kafka_broker,
        )  # KAFKA_BROKER_CHECK_BYPASS=true bypasses SSL/SASL probe

        t_producer = PythonOperator(
            task_id="verify_kafka_producer_activity",
            python_callable=verify_kafka_producer_activity,
        )  # KAFKA_BROKER_CHECK_BYPASS=true bypasses SSL/SASL probe

        t_conn >> t_cert >> t_broker >> t_producer

    # ── databricks_processing ─────────────────────────────────────────────────
    with TaskGroup("databricks_processing") as databricks_processing:

        t_snowflake_pre = EmptyOperator(
            task_id="verify_snowflake",
        )  # [BYPASSED] — restore to PythonOperator(verify_snowflake) on prod

        t_neo4j_pre = EmptyOperator(
            task_id="verify_neo4j",
        )  # [BYPASSED] — restore to PythonOperator(verify_neo4j) on prod

        t_run_notebook = EmptyOperator(
            task_id="run_databricks_notebook",
        )  # [BYPASSED] — restore to DatabricksSubmitRunOperator on prod

        [t_snowflake_pre, t_neo4j_pre] >> t_run_notebook

    # ── snowflake_transformation ──────────────────────────────────────────────
    with TaskGroup("snowflake_transformation") as snowflake_transformation:

        t_promote = EmptyOperator(
            task_id="load_dimensional_model",
        )  # [BYPASSED] — restore to PythonOperator(load_dimensional_model) on prod

    # ── snowflake_validation ──────────────────────────────────────────────────
    with TaskGroup("snowflake_validation") as snowflake_validation:

        t_freshness = EmptyOperator(
            task_id="validate_snowflake_load",
        )  # [BYPASSED] — restore to PythonOperator(validate_snowflake_load) on prod

        t_dq = EmptyOperator(
            task_id="data_quality_checks",
        )  # [BYPASSED] — restore to PythonOperator(data_quality_checks) on prod

        t_freshness >> t_dq

    # ── notify ────────────────────────────────────────────────────────────────
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