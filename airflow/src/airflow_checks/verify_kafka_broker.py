"""
kafka_orchestration group — task 3 of 4.

Verifies:
  1. The Aiven Kafka broker is reachable over SASL_SSL.
  2. Both pipeline topics exist on the broker:
       DataDose.in  — ingestion (producer → Databricks)
       DataDose.out — transformation (Databricks → downstream)
  3. Each topic has at least one partition.

BYPASS MODE (KAFKA_BROKER_CHECK_BYPASS=true):
  The full SSL/SASL probe is skipped and the task returns immediately.
  This exists because the local Docker Airflow container has a certificate
  volume mapping issue that causes 'Connection reset during recv' during
  the SASL handshake, even though the Aiven broker itself is healthy
  (confirmed by the Databricks notebook which connects successfully).
  Set KAFKA_BROKER_CHECK_BYPASS=false to re-enable the full check once
  the ca.pem volume mount is resolved.

Called by: datadose_pipeline.py → kafka_orchestration task group
Credentials: common.get_kafka_config() + common.get_ca_pem_path()
"""
import os
import ssl

from kafka import KafkaConsumer
from kafka.errors import KafkaError, NoBrokersAvailable

from common import get_kafka_config, get_ca_pem_path


def verify_kafka_broker(**context) -> None:
    """Probe the Aiven Kafka broker and confirm both pipeline topics exist.

    Set environment variable KAFKA_BROKER_CHECK_BYPASS=true to skip the
    SSL/SASL probe and return immediately (for local dev / handover use).
    """

    # ── Bypass mode ────────────────────────────────────────────────────────
    bypass = os.getenv("KAFKA_BROKER_CHECK_BYPASS", "false").lower() == "true"
    if bypass:
        print(
            "[BYPASS] KAFKA_BROKER_CHECK_BYPASS=true — skipping SSL/SASL probe.\n"
            "  Reason : Local Docker container ca.pem volume mount issue causes\n"
            "           'Connection reset during recv' during SASL handshake.\n"
            "  Status : Aiven broker confirmed healthy via Databricks notebook.\n"
            "  Action : Set KAFKA_BROKER_CHECK_BYPASS=false once the volume\n"
            "           mount (../certs:/opt/certs:ro) is resolved in\n"
            "           docker-compose.airflow.yaml to re-enable this check."
        )
        return

    # ── Full probe ──────────────────────────────────────────────────────────
    cfg = get_kafka_config()
    ca_pem_path = get_ca_pem_path()

    required_topics = {cfg["topic_in"], cfg["topic_out"]}

    print(f"[INFO] Bootstrap servers : {cfg['bootstrap_servers']}")
    print(f"[INFO] SASL mechanism    : {cfg['sasl_mechanism']}")
    print(f"[INFO] CA cert path      : {ca_pem_path}")
    print(f"[INFO] Required topics   : {required_topics}")

    try:
        ssl_context = ssl.create_default_context(cafile=ca_pem_path)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to build SSL context from ca.pem at '{ca_pem_path}': {exc}. "
            "Check that the file is a valid PEM certificate and the volume "
            "mount '../certs:/opt/certs:ro' is correct in docker-compose.airflow.yaml."
        ) from exc

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

        available_topics = consumer.topics()
        print(f"[INFO] Topics visible on broker: {available_topics}")

        missing = required_topics - available_topics
        if missing:
            raise RuntimeError(
                f"Required topic(s) not found on broker: {missing}. "
                f"Available topics: {available_topics}. "
                "Create the missing topic(s) in the Aiven console and retry."
            )

        for topic in sorted(required_topics):
            partitions = consumer.partitions_for_topic(topic)
            if not partitions:
                raise RuntimeError(
                    f"Topic '{topic}' exists on the broker but has no partitions. "
                    "Check the topic settings in the Aiven console."
                )
            print(
                f"[OK] Topic '{topic}' — {len(partitions)} partition(s): "
                f"{sorted(partitions)}"
            )

        print(f"[OK] Broker check passed. Both topics reachable: {sorted(required_topics)}")

    except NoBrokersAvailable as exc:
        raise RuntimeError(
            f"No brokers available at '{cfg['bootstrap_servers']}'. "
            "Check host:port in kafka_default Connection, IP whitelist on Aiven, "
            "and network firewall."
        ) from exc

    except KafkaError as exc:
        raise RuntimeError(
            f"Kafka broker check failed: {exc}. "
            "Verify ca.pem matches the Aiven cluster CA and credentials are correct."
        ) from exc

    finally:
        if consumer is not None:
            try:
                consumer.close()
            except Exception:
                pass