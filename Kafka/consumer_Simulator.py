import os
import ssl
from pathlib import Path

from kafka import KafkaConsumer


def get_env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.getenv(name)
    if value not in (None, ""):
        return value
    if default is not None:
        return default
    if required:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return ""


TOPIC_NAME = get_env("KAFKA_TOPIC", "events.in")
SASL_MECHANISM = get_env("KAFKA_SASL_MECHANISM", "SCRAM-SHA-256")
BOOTSTRAP_SERVERS = get_env(
    "KAFKA_BOOTSTRAP_SERVERS",
    "datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15816",
)
CLIENT_ID = get_env("KAFKA_CLIENT_ID", "CONSUMER_CLIENT_ID")
GROUP_ID = get_env("KAFKA_GROUP_ID", "CONSUMER_GROUP_ID")
SASL_USERNAME = get_env("KAFKA_USERNAME", required=True)
SASL_PASSWORD = get_env("KAFKA_PASSWORD", required=True)
CA_PEM = Path(get_env("KAFKA_CA_PEM_PATH", str(Path(__file__).resolve().parent / "certs" / "ca.pem")))

if not CA_PEM.exists():
    raise FileNotFoundError(f"Kafka CA certificate not found: {CA_PEM}")

ssl_context = ssl.create_default_context(cafile=str(CA_PEM))

consumer = KafkaConsumer(
    TOPIC_NAME,
    auto_offset_reset="earliest",
    bootstrap_servers=BOOTSTRAP_SERVERS,
    client_id=CLIENT_ID,
    group_id=GROUP_ID,
    sasl_mechanism=SASL_MECHANISM,
    sasl_plain_username=SASL_USERNAME,
    sasl_plain_password=SASL_PASSWORD,
    security_protocol="SASL_SSL",
    ssl_context=ssl_context,
    value_deserializer=lambda value: value.decode("utf-8"),
)

while True:
    for messages in consumer.poll(timeout_ms=1000).values():
        for message in messages:
            print(f"Got message using SASL: {message.value}")