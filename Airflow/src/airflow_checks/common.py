"""Single source of truth for how every task gets its credentials.
Nothing in this project should call os.getenv() for a pipeline secret
outside of this file — everything goes through an Airflow Connection.
See ARCHITECTURE.md for why."""
import os

from airflow.hooks.base import BaseHook
from airflow.providers.snowflake.hooks.snowflake import SnowflakeHook

def get_snowflake_hook():
    """Returns None if snowflake_default connection does not exist."""
    try:
        from airflow.hooks.base import BaseHook
        BaseHook.get_connection("snowflake_default")
    except Exception:
        return None
    from airflow.providers.snowflake.hooks.snowflake import SnowflakeHook
    return SnowflakeHook(snowflake_conn_id="snowflake_default")

def get_neo4j_config() -> dict:
    """Neo4j Connection is type 'generic': host -> URI, login -> user,
    password -> password."""
    conn = BaseHook.get_connection("neo4j_default")
    return {
        "uri":      conn.host,
        "user":     conn.login,
        "password": conn.password,
    }


def get_kafka_config() -> dict:
    """Kafka Connection is type 'generic': host -> bootstrap servers (host:port),
    login/password -> SASL credentials, extra -> topics + mechanism.

    The Connection host field must contain the full host:port string,
    e.g. 'datadosekafka-901-....aivencloud.com:15816' — if only the hostname
    is stored, kafka-python falls back to its default plaintext port 9092."""
    conn = BaseHook.get_connection("kafka_default")
    extra = conn.extra_dejson

    # Combine host and port safely — port may be embedded in host already
    # or stored separately in conn.port by Airflow's connection parser.
    host = conn.host
    if conn.port and str(conn.port) not in host:
        bootstrap = f"{host}:{conn.port}"
    else:
        bootstrap = host  # host already contains :15816

    return {
        "bootstrap_servers": bootstrap,
        "username":          conn.login,
        "password":          conn.password,
        "topic_in":          extra.get("topic_in",       "DataDose.in"),
        "topic_out":         extra.get("topic_out",      "DataDose.out"),
        "sasl_mechanism":    extra.get("sasl_mechanism", "SCRAM-SHA-256"),
    }


def get_kafka_topic_config(topic_key: str) -> dict:
    """Return a config dict scoped to a single topic.

    topic_key must be 'topic_in' or 'topic_out'.

    Usage:
        cfg = get_kafka_topic_config("topic_in")
        cfg["topic"]  # -> "DataDose.in"

        cfg = get_kafka_topic_config("topic_out")
        cfg["topic"]  # -> "DataDose.out"
    """
    if topic_key not in ("topic_in", "topic_out"):
        raise ValueError(
            f"topic_key must be 'topic_in' or 'topic_out', got '{topic_key}'"
        )
    cfg = get_kafka_config()
    return {
        "bootstrap_servers": cfg["bootstrap_servers"],
        "username":          cfg["username"],
        "password":          cfg["password"],
        "sasl_mechanism":    cfg["sasl_mechanism"],
        "topic":             cfg[topic_key],
    }


def get_ca_pem_path() -> str:
    """The one exception to 'everything is a Connection' — ca.pem is a
    file, mounted read-only into the container. Path is a small piece of
    config, not a secret, so a plain env var is appropriate here."""
    path = os.getenv("KAFKA_CA_PEM_PATH", "/opt/certs/ca.pem")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"ca.pem not found at {path} — check the volume mount in "
            "docker-compose.airflow.yaml (volumes: ../certs:/opt/certs:ro)."
        )
    return path