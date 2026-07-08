"""Infra group - confirm every required Airflow Connection and Variable
exists before any task tries to use one. Fails with a specific list rather
than letting the first real task fail with a confusing 'connection not
found' error deep in a hook."""
from airflow.exceptions import AirflowNotFoundException
from airflow.hooks.base import BaseHook
from airflow.models import Variable

REQUIRED_CONNECTIONS = ["snowflake_default", "neo4j_default", "kafka_default", "databricks_default"]
REQUIRED_VARIABLES = ["databricks_notebook_path"]


def verify_connections(**context) -> None:
    missing_conns = []
    for conn_id in REQUIRED_CONNECTIONS:
        try:
            BaseHook.get_connection(conn_id)
        except AirflowNotFoundException:
            missing_conns.append(conn_id)

    missing_vars = []
    for var_key in REQUIRED_VARIABLES:
        try:
            Variable.get(var_key)
        except KeyError:
            missing_vars.append(var_key)

    if missing_conns or missing_vars:
        raise RuntimeError(
            f"Missing Airflow Connections: {missing_conns or 'none'}. "
            f"Missing Airflow Variables: {missing_vars or 'none'}. "
            f"See DEPLOYMENT_GUIDE.md section 5."
        )
    print(f"All {len(REQUIRED_CONNECTIONS)} connections and {len(REQUIRED_VARIABLES)} variables present.")
