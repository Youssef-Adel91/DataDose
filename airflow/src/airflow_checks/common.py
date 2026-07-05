"""Single source of truth for how every task gets its credentials.
Nothing in this project should call os.getenv() for a pipeline secret
outside of this file — everything goes through an Airflow Connection.
See ARCHITECTURE.md for why."""
import os

from airflow.hooks.base import BaseHook
from airflow.providers.snowflake.hooks.snowflake import SnowflakeHook


def get_snowflake_hook() -> SnowflakeHook:
    """Snowflake connection, database/schema/warehouse/role read from the
    Connection's 'extra' field (set once via `airflow connections add`,
    see DEPLOYMENT_GUIDE.md). No credentials pass through env vars."""
    return SnowflakeHook(snowflake_conn_id="snowflake_default")


def get_neo4j_config() -> dict:
    """Neo4j Connection is type 'generic': host -> URI, login -> user,
    password -> password."""
    conn = BaseHook.get_connection("neo4j_default")
    return {
        "uri": conn.host,
        "user": conn.login,
        "password": conn.password,
    }


def get_kafka_config() -> dict:
    """Kafka Connection is type 'generic': host -> bootstrap servers,
    login/password -> SASL credentials, extra -> topic + mechanism."""
    conn = BaseHook.get_connection("kafka_default")
    extra = conn.extra_dejson
    return {
        "bootstrap_servers": "datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15816",        "username": conn.login,
        "password": conn.password,
        "topic": extra.get("topic", "DataDose.in"),
        "sasl_mechanism": extra.get("sasl_mechanism", "SCRAM-SHA-256"),
    }


def get_ca_pem_path() -> str:
    """The one exception to 'everything is a Connection' — ca.pem is a
    file, mounted read-only into the container. Path is a small piece of
    config, not a secret, so a plain env var is appropriate here."""
    path = os.getenv("KAFKA_CA_PEM_PATH", "/opt/certs/ca.pem")
    if not os.path.exists(path):
        raise FileNotFoundError(f"ca.pem not found at {path} — check the volume mount.")
    return path
