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
"""
import sys
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.databricks.operators.databricks import DatabricksSubmitRunOperator
from airflow.providers.slack.notifications.slack import send_slack_notification
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

default_args = {
    "owner": "datadose",
    "retries": 2,
    "retry_delay": timedelta(seconds=30),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(minutes=8),
    "on_failure_callback": [
        send_slack_notification(
            slack_conn_id=SLACK_CONN_ID,
            text="DataDose task failed: {{ ti.task_id }} in {{ ti.dag_id }} (run {{ ti.run_id }})",
            channel="#datadose-alerts",
        )
    ],
}

with DAG(
    dag_id="datadose_pipeline",
    description="DataDose: Kafka health -> Databricks AvailableNow run -> Snowflake promotion -> validation",
    default_args=default_args,
    schedule="*/2 * * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["datadose", "streaming", "production"],
) as dag:

    start = EmptyOperator(task_id="start")

    # ---------------- Kafka orchestration ----------------
    # The producer runs continuously as its own Docker service
    # (see docker-compose.airflow.yaml) — Airflow doesn't start/stop it,
    # only confirms it's alive and the broker is reachable.
    with TaskGroup("kafka_orchestration") as kafka_orchestration:
        t_conn = PythonOperator(task_id="verify_connections", python_callable=verify_connections)
        t_cert = PythonOperator(task_id="verify_certificate", python_callable=verify_certificate)
        t_broker = PythonOperator(task_id="verify_kafka_broker", python_callable=verify_kafka_broker)
        t_producer = PythonOperator(
            task_id="verify_kafka_producer_activity", python_callable=verify_kafka_producer_activity
        )
        t_conn >> t_cert >> t_broker >> t_producer

    # ---------------- Databricks processing ----------------
    with TaskGroup("databricks_processing") as databricks_processing:
        t_snowflake_pre = PythonOperator(task_id="verify_snowflake", python_callable=verify_snowflake)
        t_neo4j_pre = PythonOperator(task_id="verify_neo4j", python_callable=verify_neo4j)

        # Blocks until the run finishes (default wait_for_termination=True) —
        # safe because AvailableNow always terminates on its own.
        t_run_notebook = DatabricksSubmitRunOperator(
            task_id="run_databricks_notebook",
            databricks_conn_id="databricks_default",
            json=build_databricks_run_spec(),
            polling_period_seconds=15,
        )
        [t_snowflake_pre, t_neo4j_pre] >> t_run_notebook

    # ---------------- Snowflake transformation ----------------
    with TaskGroup("snowflake_transformation") as snowflake_transformation:
        t_promote = PythonOperator(task_id="load_dimensional_model", python_callable=load_dimensional_model)

    # ---------------- Snowflake validation ----------------
    with TaskGroup("snowflake_validation") as snowflake_validation:
        t_freshness = PythonOperator(task_id="validate_snowflake_load", python_callable=validate_snowflake_load)
        t_dq = PythonOperator(task_id="data_quality_checks", python_callable=data_quality_checks)
        t_freshness >> t_dq

    # ---------------- Notify ----------------
    notify_success = send_slack_notification(
        slack_conn_id=SLACK_CONN_ID,
        text="DataDose run succeeded ✅ (run {{ run_id }})",
        channel="#datadose-alerts",
    )
    notify_success_task = PythonOperator(task_id="notify_success", python_callable=lambda **_: notify_success)

    end = EmptyOperator(task_id="end")

    start >> kafka_orchestration >> databricks_processing
    databricks_processing >> snowflake_transformation >> snowflake_validation
    snowflake_validation >> notify_success_task >> end
