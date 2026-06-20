#  Kafka Simulators

This folder contains a Kafka producer simulator that streams synthetic prescription messages to an Aiven Kafka topic, a simple consumer example, and certificate files required for TLS connections.

---

**Table of Contents**

- Overview
- Files
- Run order
- Configuration and credentials
- Inputs and outputs (formats & locations)
- External dependencies
- Known limitations, edge cases, and manual steps

---

## Overview

The code here provides tools to simulate pharmacy prescription events and send them to an Aiven Kafka topic for downstream processing (e.g., the Databricks streaming pipeline). The producer reads a verified ingredient CSV to build a realistic drug pool, constructs JSON prescription records, and publishes them to Kafka over SASL_SSL. The consumer is a minimal example showing how to connect and receive messages.

---

## Files

| File | Purpose | Input | Output |
|---|---|---:|---|
| `producer_simulator.py` | Main simulator: loads a verified ingredient CSV, generates realistic prescription JSON messages, and publishes them to an Aiven Kafka topic (SASL_SSL). Supports dry-run and rate/limit options. | `DATASET_PATH` (CSV, default variable in file). `CA_PEM` (PEM file path). | JSON messages sent to Kafka `TOPIC`. Console logs when in dry-run or live mode. |
| `consumer_Simulator.py` | Minimal Kafka consumer example demonstrating SASL_SSL connectivity and message polling. Not a production consumer — intended for local testing. | Connects to Aiven Kafka using credentials and `ssl_cafile` path in the file. Subscribes to `TOPIC_NAME` variable. | Prints received messages to console. |
| `certs/ca.pem` (directory) | Certificate file(s) required for TLS verification with Aiven Kafka. | Downloaded from Aiven Dashboard. | Used by both producer and consumer SSL contexts. |

---

## Run order

1. Place a verified ingredient dataset `output_FINAL.csv` next to `producer_simulator.py` or update `DATASET_PATH` in `producer_simulator.py` to point to your file.
2. Ensure `ca.pem` is present and `CA_PEM` in `producer_simulator.py` points to it (the producer copies the PEM into an SSL context). For the consumer example, set `ssl_cafile` to the correct path.
3. Start the producer to send messages to Kafka (or use `--dry-run` to test without Kafka). The consumer example can be started independently to receive messages.

Example commands:

```bash
python producer_simulator.py              # runs at default rate
python producer_simulator.py --rate 5    # 5 messages/second
python producer_simulator.py --max 100   # send exactly 100 messages
python producer_simulator.py --dry-run   # print messages only (no Kafka)
python consumer_Simulator.py             # run example consumer (adjust paths/creds first)
```

---

## Configuration and credentials

`producer_simulator.py` defines connection and dataset variables near the top of the file. Update them before running:

```python
BOOTSTRAP_SERVERS   # Aiven Kafka host:port
SASL_USERNAME       # Kafka username
SASL_PASSWORD       # Kafka password
SASL_MECHANISM      # set to 'SCRAM-SHA-256'
CA_PEM              # Path to ca.pem downloaded from Aiven Dashboard
TOPIC               # Kafka topic name (e.g. 'DataDose.in')
DATASET_PATH        # Path to output_FINAL.csv (verified ingredients)
```

`consumer_Simulator.py` contains a separate set of credentials and paths. Note: the consumer in this repo uses `TOPIC_NAME = 'events.in'` and a different password value. Make sure topic names, bootstrap servers, and credentials match your Aiven service if you intend to run the consumer.

Security note: credentials are currently hard-coded in the files. For production use, move credentials to environment variables, a config file outside version control, or a secrets manager.

---

## Inputs and outputs (formats & locations)

- Input CSV: the producer expects a CSV containing verified ingredients. By default `producer_simulator.py` points to:

```text
DATASET_PATH = Path(r"C:\Users\Arasc\Desktop\Kafka\Kafka\output_FINAL.csv")
```

The producer expects the CSV to contain either an `ingredient_corrected` column or an `activeingredient_clean` column. If present, an `ingredient_verified_flag` column will be used to filter to verified rows.

- Output: the producer publishes JSON-serialized prescription records to the Kafka topic configured in `TOPIC` (default `DataDose.in` in the producer). Each message has this JSON structure:

```json
{
  "transaction_id": 123456,
  "patient_id": 123,
  "pharmacy_id": "PHX_001",
  "pharmacy_city": "Cairo",
  "new_drug": "paracetamol",
  "new_drug_dose": "500mg",
  "new_drug_form": "tablet",
  "current_drugs": ["aspirin", "metformin"],
  "patient_age": 45,
  "patient_gender": "M",
  "timestamp": "2026-06-20T12:34:56"
}
```

- Consumer example prints received message values decoded as UTF-8 strings.

---

## External dependencies

Python packages required:

```text
kafka-python
pandas
```

Install with:

```bash
pip install kafka-python pandas
```

Runtime requirements:

- Network access to the Aiven Kafka brokers (bootstrap server host and port) on the cluster/machine running the producer/consumer.
- Correct `ca.pem` from Aiven Dashboard; the producer builds an `ssl.SSLContext` from the PEM.

---

## Known limitations, edge cases, and manual steps

- Hard-coded credentials and file paths: both `producer_simulator.py` and `consumer_Simulator.py` contain hard-coded passwords and local paths. Update these to match your environment and replace with secret-backed configuration before use.

- Topic name mismatch: `producer_simulator.py` publishes to `TOPIC = 'DataDose.in'` while `consumer_Simulator.py` subscribes to `TOPIC_NAME = 'events.in'`. Make sure both use the same topic if you expect the consumer to receive messages.

- Certificate paths differ: the producer expects `CA_PEM` at the path set in the file; the consumer uses a different `ssl_cafile` path. Ensure both point to the same `ca.pem` file appropriate for your environment.

- CSV format expectations: the producer expects a verified dataset with specific column names. If the CSV uses different column names, update `load_drug_pool()` to point to the correct column names.

- Scale/throughput: `producer_simulator.py` is acceptable for low-to-moderate throughput tests. For high-throughput testing adjust rate and ensure the network and Kafka cluster can handle the load.

- Error handling: the producer captures send errors and surfaces them; the consumer example uses `consumer.poll()` and prints the first message from each polled batch — it is not resilient or intended for production use.

- Local vs cluster paths: example paths use Windows-style or absolute paths. Update `DATASET_PATH` and `CA_PEM` to workspace-appropriate paths if running in a different environment.

---

