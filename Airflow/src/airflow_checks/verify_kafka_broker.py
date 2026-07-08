"""kafka_orchestration group - is the broker itself reachable and does the
topic exist. Does not consume messages."""
import ssl

from kafka import KafkaConsumer
from kafka.errors import KafkaError

from common import get_kafka_config, get_ca_pem_path


def verify_kafka_broker(**context) -> None:
    cfg = get_kafka_config()
    ca_pem_path = get_ca_pem_path()
    ssl_context = ssl.create_default_context(cafile=ca_pem_path)

    consumer = None
    try:
        consumer = KafkaConsumer(
            bootstrap_servers=cfg["bootstrap_servers"],
            client_id="airflow-broker-check",
            group_id=None,
            sasl_mechanism=cfg["sasl_mechanism"],
            sasl_plain_username=cfg["username"],
            sasl_plain_password=cfg["password"],
            security_protocol="SASL_SSL",
            ssl_context=ssl_context,
            consumer_timeout_ms=10000,
            api_version_auto_timeout_ms=10000,
        )
        topics = consumer.topics()
        if cfg["topic"] not in topics:
            raise RuntimeError(f"Topic '{cfg['topic']}' not found on broker.")
        partitions = consumer.partitions_for_topic(cfg["topic"])
        print(f"Kafka broker reachable. Topic '{cfg['topic']}' has {len(partitions)} partition(s).")
    except KafkaError as e:
        raise RuntimeError(f"Kafka broker check failed: {e}") from e
    finally:
        if consumer is not None:
            consumer.close()
