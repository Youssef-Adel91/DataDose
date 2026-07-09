"""
DataDose — One-shot Kafka producer for SSE integration testing.
Sends a single FDA alert JSON message to the 'fda-alerts' topic on Aiven.

Fixes vs v1:
  - Uses explicit ssl_context (Aiven's CA cert isn't in the Windows system
    trust store, so the default ssl_cafile approach silently fails causing the
    KafkaTimeoutError on metadata).
  - Auto-creates the 'fda-alerts' topic if it doesn't exist on the cluster
    (it was missing — only DataDose.in / DataDose.out existed).
  - Credentials read directly from .env — no manual setup required.
"""
import json
import os
import ssl
import sys

# Force UTF-8 output so the script works on Windows cp1252 terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Load credentials from project .env ────────────────────────────────────────
def _load_env(path: str) -> dict:
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip().strip('"').strip("'")
    return env

env_path = os.path.join(os.path.dirname(__file__), ".env")
cfg = _load_env(env_path)

BOOTSTRAP = cfg.get("KAFKA_BOOTSTRAP_SERVERS", "")
USERNAME   = cfg.get("KAFKA_SASL_USERNAME", cfg.get("KAFKA_USERNAME", ""))
PASSWORD   = cfg.get("KAFKA_SASL_PASSWORD", cfg.get("KAFKA_PASSWORD", ""))
MECHANISM  = cfg.get("KAFKA_SASL_MECHANISM", "SCRAM-SHA-256")
TOPIC      = "fda-alerts"

# ── Test message payload ───────────────────────────────────────────────────────
MESSAGE = {
    "id":       "fda-test-999",
    "title":    "FDA Recall Alert",
    "body":     "Immediate recall for Amoxicillin Batch #404 due to cross-contamination.",
    "severity": "critical",
    "read":     False,
}

print("=" * 60)
print("  DataDose — Aiven Kafka SSE Test Producer  (v2)")
print("=" * 60)
print(f"  Broker  : {BOOTSTRAP}")
print(f"  Topic   : {TOPIC}")
print(f"  Protocol: SASL_SSL / {MECHANISM}")
print(f"  User    : {USERNAME}")
print("-" * 60)
print(f"  Payload :\n{json.dumps(MESSAGE, indent=4)}")
print("-" * 60)

try:
    from kafka import KafkaAdminClient, KafkaProducer
    from kafka.admin import NewTopic
    from kafka.errors import KafkaError, TopicAlreadyExistsError
except ImportError:
    print("[ERROR] kafka-python is not installed.  Run: pip install kafka-python")
    sys.exit(1)

# ── SSL context ────────────────────────────────────────────────────────────────
# Aiven's self-signed CA is NOT in the Windows certificate store, so we must
# disable peer verification (equivalent to the producer_simulator pattern of
# building an explicit context with the downloaded ca.pem — but since the
# ca.pem isn't present, we skip verification for this dev-only test script).
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

COMMON_KWARGS = dict(
    bootstrap_servers=BOOTSTRAP,
    security_protocol="SASL_SSL",
    sasl_mechanism=MECHANISM,
    sasl_plain_username=USERNAME,
    sasl_plain_password=PASSWORD,
    ssl_context=ssl_ctx,
    api_version=(2, 8, 0),
    request_timeout_ms=20_000,
)

# ── Step 1: ensure topic exists ────────────────────────────────────────────────
print("\n[1/2] Checking / creating topic ...")
try:
    admin = KafkaAdminClient(**COMMON_KWARGS)
    existing = admin.list_topics()
    if TOPIC not in existing:
        print(f"      Topic '{TOPIC}' not found. Creating with 1 partition, RF=1 ...")
        admin.create_topics([NewTopic(name=TOPIC, num_partitions=1, replication_factor=1)])
        print(f"      ✅ Topic '{TOPIC}' created.")
    else:
        print(f"      ✅ Topic '{TOPIC}' already exists.")
    admin.close()
except Exception as e:
    print(f"      [WARN] Admin client error (will attempt produce anyway): {e}")

# ── Step 2: produce the message ────────────────────────────────────────────────
print("\n[2/2] Producing message ...")
try:
    producer = KafkaProducer(
        **COMMON_KWARGS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        acks="all",
        retries=3,
        linger_ms=10,
    )
    future = producer.send(TOPIC, value=MESSAGE)
    meta   = future.get(timeout=20)

    print()
    print("  ✅  Message produced successfully!")
    print(f"      Topic     : {meta.topic}")
    print(f"      Partition : {meta.partition}")
    print(f"      Offset    : {meta.offset}")

except KafkaError as e:
    print(f"  [ERROR] Kafka produce failed: {e}")
    sys.exit(1)
finally:
    producer.flush()
    producer.close()

print()
print("=" * 60)
print("  Message is live on the broker.")
print("  Open the SSE stream to confirm delivery:")
print("    GET /api/fda-alerts/stream")
print("  Expected event:")
print(f'    data: {json.dumps(MESSAGE)}')
print("=" * 60)
