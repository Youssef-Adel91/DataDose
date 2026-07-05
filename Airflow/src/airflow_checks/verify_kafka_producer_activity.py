"""kafka_orchestration group - is the producer simulator actually
producing right now. This is the health check that replaces "Airflow runs
the producer" — the producer is its own long-running Docker service
(see docker-compose.airflow.yaml), and this task just confirms it's alive
by reading the most recent message's offset/timestamp without consuming
from (or interfering with) the consumer group Databricks uses."""
import ssl
import time

from kafka import KafkaConsumer, TopicPartition
from kafka.errors import KafkaError

from common import get_kafka_config, get_ca_pem_path

MAX_ACCEPTABLE_STALENESS_SECONDS = 180


def verify_kafka_producer_activity(**context) -> None:
    cfg = get_kafka_config()
    ca_pem_path = get_ca_pem_path()
    ssl_context = ssl.create_default_context(cafile=ca_pem_path)

    consumer = None
    try:
        # A throwaway, unique group_id: we're peeking at the tail of the
        # topic, not participating in the real consumer group Databricks
        # uses for its offsets — using the real group id here could shift
        # its committed offset and cause Databricks to skip messages.
        consumer = KafkaConsumer(
            bootstrap_servers=cfg["bootstrap_servers"],
            client_id="airflow-producer-activity-check",
            group_id=f"airflow-health-check-{int(time.time())}",
            sasl_mechanism=cfg["sasl_mechanism"],
            sasl_plain_username=cfg["username"],
            sasl_plain_password=cfg["password"],
            security_protocol="SASL_SSL",
            ssl_context=ssl_context,
            consumer_timeout_ms=10000,
        )
        partitions = consumer.partitions_for_topic(cfg["topic"])
        if not partitions:
            raise RuntimeError(f"Topic '{cfg['topic']}' has no partitions.")

        tps = [TopicPartition(cfg["topic"], p) for p in partitions]
        consumer.assign(tps)
        end_offsets = consumer.end_offsets(tps)

        total_messages = sum(end_offsets.values())
        print(f"Topic '{cfg['topic']}' total messages across all partitions: {total_messages:,}")

        # Seek to the last message on the partition with the highest offset
        # and read its timestamp to check recency.
        busiest_tp = max(end_offsets, key=end_offsets.get)
        if end_offsets[busiest_tp] == 0:
            raise RuntimeError("Topic is empty — producer has never sent a message.")

        consumer.seek(busiest_tp, end_offsets[busiest_tp] - 1)
        record = next(iter(consumer.poll(timeout_ms=10000).values()), None)
        if not record:
            raise RuntimeError("Could not read the most recent message — producer may be stalled.")

        latest_record = record[-1]
        age_seconds = time.time() - (latest_record.timestamp / 1000)
        print(f"Most recent message is {age_seconds:.0f}s old.")

        if age_seconds > MAX_ACCEPTABLE_STALENESS_SECONDS:
            raise RuntimeError(
                f"Most recent Kafka message is {age_seconds:.0f}s old, exceeds "
                f"{MAX_ACCEPTABLE_STALENESS_SECONDS}s threshold. Producer may have stopped."
            )
    except KafkaError as e:
        raise RuntimeError(f"Producer activity check failed: {e}") from e
    finally:
        if consumer is not None:
            consumer.close()
