```
██╗  ██╗ █████╗ ███████╗██╗  ██╗ █████╗    
██║ ██╔╝██╔══██╗██╔════╝██║ ██╔╝██╔══██╗    
█████╔╝ ███████║█████╗  █████╔╝ ███████║    
██╔═██╗ ██╔══██║██╔══╝  ██╔═██╗ ██╔══██║    
██║  ██╗██║  ██║██║     ██║  ██╗██║  ██║    
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝    
        DataDose Pharmacy Prescription Simulator → Aiven Kafka
```

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)
![kafka-python](https://img.shields.io/badge/kafka--python-SASL__SSL-231F20?style=flat-square&logo=apachekafka)
![Aiven](https://img.shields.io/badge/Aiven-Kafka-FF3F00?style=flat-square)
![pandas](https://img.shields.io/badge/pandas-Dataset%20Loader-150458?style=flat-square&logo=pandas)
![TLS](https://img.shields.io/badge/TLS-SCRAM--SHA--256-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-brightgreen?style=flat-square)

> A realistic pharmacy prescription event simulator that streams verified drug INN data as JSON messages to Aiven Kafka over SASL_SSL — powering the DataDose real-time drug interaction analytics pipeline.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture](#-architecture)
- [📁 Folder Structure](#-folder-structure)
- [⚠ Prerequisites](#-prerequisites)
- [🚀 Installation](#-installation)
- [📖 Usage](#-usage)
- [⚙ Configuration](#-configuration)
- [📦 Module Details](#-module-details)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📬 Contact](#-contact)

---

## ✨ Features

### 🏭 Producer Simulator
- **Verified drug pool** — loads INNs from a CSV dataset, filters to `ingredient_verified_flag = TRUE` rows, expands combination products (`A | B | C` → individual names), and strips known non-drug terms (vitamins, oils, unknown entries)
- **Realistic prescription generation** — randomizes transaction ID, patient ID, pharmacy (120 pharmacies), Egyptian city assignment, new drug, dose (value + unit), dose form, current medications (0–5), patient age (18–85), and gender
- **Configurable throughput** — `--rate` flag controls messages per second; `--max` stops after N messages
- **Dry-run mode** — `--dry-run` prints prescriptions to console without connecting to Kafka; useful for local development and schema validation
- **Explicit SSL context** — works around a known `kafka-python` bug where `ssl_cafile=` silently fails for SASL_SSL by building an `ssl.SSLContext` explicitly with TLS 1.2 minimum
- **Live progress reporting** — prints a formatted table row per message and a stats summary every 50 messages (sent count, error count, msg/s, elapsed time)
- **Session summary** — on exit (Ctrl+C or max reached) prints total messages sent, errors, duration, average rate, and endpoint

### 📥 Consumer Simulator
- Minimal SASL_SSL consumer using `kafka-python` for local testing and pipeline verification
- `auto_offset_reset="earliest"` to replay messages from the beginning of the topic
- UTF-8 value deserializer with `poll(timeout_ms=1000)` loop
- Explicit SSL context built from `ca.pem` via `ssl.create_default_context()`

### 🔐 Security
- SASL/SCRAM-SHA-256 authentication against Aiven Kafka
- TLS 1.2 minimum enforced on the producer SSL context
- CA certificate loaded from `ca.pem` downloaded from the Aiven Dashboard
- Credentials resolved from environment variables with `required=True` enforcement — no silent fallback to empty strings

---

## 🛠 Tech Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Language** | Python | 3.10+ | Core runtime |
| **Kafka Client** | kafka-python | Latest | Producer and consumer API |
| **Data Processing** | pandas | Latest | CSV dataset loading and INN extraction |
| **Message Broker** | Aiven Kafka | Managed | Target event stream |
| **Auth Protocol** | SASL/SCRAM-SHA-256 | — | Kafka authentication |
| **Transport Security** | TLS 1.2+ (ca.pem) | — | Encrypted broker connection |
| **Serialization** | JSON (UTF-8) | — | Message payload format |
| **CLI** | argparse | stdlib | `--rate`, `--max`, `--dry-run` flags |
| **Standard Library** | ssl, os, pathlib, random, time | stdlib | SSL context, env vars, paths, generation |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                 producer_simulator.py                            │
│                                                                  │
│  load_drug_pool(output_FINAL.csv)                                │
│    ├─ filter: ingredient_verified_flag = TRUE                    │
│    ├─ expand: "A | B" → ["A", "B"]                               │
│    └─ deduplicate + sort → drug_pool[]                           │
│                                                                  │
│  PrescriptionGenerator(drug_pool)                                │
│    └─ .next() → {                                                │
│         transaction_id, patient_id,                              │
│         pharmacy_id, pharmacy_city,                              │
│         new_drug, new_drug_dose, new_drug_form,                  │
│         current_drugs[], patient_age, patient_gender,            │
│         timestamp                                                │
│       }                                                          │
│                                                                  │
│  build_producer()                                                │
│    └─ ssl.SSLContext(ca.pem) + SASL/SCRAM-SHA-256                │
│         → KafkaProducer                                          │
│                                                                  │
│  run(rate, dry_run, max_msgs)                                    │
│    └─ while True: generate → serialize → producer.send(TOPIC)    │
└──────────────────────────────────┬───────────────────────────────┘
                                   │  JSON over SASL_SSL
                                   ▼
                    ┌──────────────────────────┐
                    │   Aiven Kafka            │
                    │   Topic: DataDose.in     │
                    └──────────────┬───────────┘
                                   │
         ┌─────────────────────────┴──────────────────────────┐
         │                                                    │
         ▼                                                    ▼
┌─────────────────────┐                   ┌──────────────────────────┐
│ consumer_Simulator  │                   │  Databricks PySpark      │
│   (local testing)   │                   │  Structured Streaming    │
│ poll → print UTF-8  │                   │  (production pipeline)   │
└─────────────────────┘                   └──────────────────────────┘
```

**Data flow:**
1. The producer loads and validates the drug INN pool from `output_FINAL.csv`
2. `PrescriptionGenerator.next()` produces one prescription dict per iteration
3. The producer serializes it to JSON (UTF-8) and sends it to the Kafka topic at the configured rate
4. The consumer (or Databricks Structured Streaming) reads messages from the topic for processing or testing

---

## 📁 Folder Structure

```
Kafka/
├── producer_simulator.py     # Main producer — generates and streams prescription events
├── consumer_Simulator.py     # Minimal consumer — local testing and message verification
├── certs/
│   └── ca.pem                # Aiven Kafka CA certificate (download from Aiven Dashboard)
├── output_FINAL.csv          # Verified drug INN dataset (place here or set DATASET_PATH)
└── README.md                 # This file
```

> **`output_FINAL.csv` is not included in the repository** — place it in the same directory as `producer_simulator.py` or point `DATASET_PATH` to its location via environment variable.

---

## ⚠ Prerequisites

1. **Python 3.10 or higher** — required for the `str | None` union type annotation used in `get_env()`
2. **pip packages** — `kafka-python` and `pandas` (see Installation)
3. **Aiven Kafka service** — an active Aiven Kafka instance with:
   - A topic named `DataDose.in` (or your configured topic name)
   - SASL/SCRAM credentials (username and password)
   - CA certificate (`ca.pem`) downloaded from the Aiven Dashboard
4. **CA certificate** — `ca.pem` must be present at `certs/ca.pem` relative to the scripts, or at the path set in `KAFKA_CA_PEM_PATH`
5. **Drug dataset** — `output_FINAL.csv` with at least one of the columns `ingredient_corrected` or `activeingredient_clean`; optionally an `ingredient_verified_flag` column for filtering
6. **Network access** — outbound TCP to the Aiven Kafka bootstrap server on its configured port (default: `15816`)
7. **Environment variables** — `KAFKA_USERNAME` and `KAFKA_PASSWORD` are **required** (`required=True`); the producer will raise `RuntimeError` if they are absent

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/datadose-kafka-simulator.git
cd datadose-kafka-simulator
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### 3. Install Python dependencies

```bash
pip install kafka-python pandas
```

### 4. Download and place the CA certificate

```
1. Go to Aiven Dashboard → Your Kafka Service → Overview
2. Click "Download CA Certificate" → save as ca.pem
3. Place it at:  certs/ca.pem
```

Verify the file is a valid PEM certificate:

```bash
head -1 certs/ca.pem
# Expected: -----BEGIN CERTIFICATE-----
```

### 5. Place the drug dataset

```bash
# Copy or symlink your verified ingredient CSV
cp /path/to/output_FINAL.csv ./output_FINAL.csv
```

### 6. Set required environment variables

```bash
export KAFKA_USERNAME="your-aiven-kafka-username"
export KAFKA_PASSWORD="your-aiven-kafka-password"

# Optional overrides (defaults shown)
export KAFKA_BOOTSTRAP_SERVERS="datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15816"
export KAFKA_TOPIC="DataDose.in"
export KAFKA_CA_PEM_PATH="certs/ca.pem"
export DATASET_PATH="output_FINAL.csv"
```

### 7. Verify the setup with a dry run

```bash
python producer_simulator.py --dry-run --max 5
```

Expected output:
```
DataDoseDepi Pharmacy Simulator v4.2
Mode: DRY RUN (console only)
Topic: DataDose.in
Rate: 1.0 msg/sec
...
Loading dataset: output_FINAL.csv
Verified rows: X,XXX / XX,XXX
Unique drug INNs: X,XXX

TX ID       Pharmacy    City                    New Drug                      Current Meds
----------  ----------  ----------------------  ----------------------------  ------------------------------
123456      PHX_042     Cairo                   paracetamol                   aspirin, metformin
...
```

---

## 📖 Usage

### Basic Usage — Stream at Default Rate

```bash
python producer_simulator.py
```

Streams 1 prescription per second to Kafka indefinitely. Press `Ctrl+C` to stop and see the session summary.

### Stream at Custom Rate

```bash
# 5 prescriptions per second
python producer_simulator.py --rate 5

# 0.5 prescriptions per second (one every 2 seconds)
python producer_simulator.py --rate 0.5
```

### Send a Fixed Number of Messages

```bash
# Send exactly 100 messages then exit
python producer_simulator.py --max 100

# Send 500 messages at 10/sec
python producer_simulator.py --rate 10 --max 500
```

### Dry Run — No Kafka Required

```bash
# Validate prescription generation and dataset loading without connecting to Kafka
python producer_simulator.py --dry-run

# Combine with --max for a quick schema check
python producer_simulator.py --dry-run --max 10
```

### Run the Consumer (Local Testing)

```bash
# Set credentials for the consumer
export KAFKA_USERNAME="your-username"
export KAFKA_PASSWORD="your-password"

python consumer_Simulator.py
```

The consumer reads from the earliest offset and prints each received message:

```
Got message using SASL: {"transaction_id": 123456, "patient_id": 1234, ...}
Got message using SASL: {"transaction_id": 123457, ...}
```

### Override the Dataset Path

```bash
DATASET_PATH="/data/verified_drugs.csv" python producer_simulator.py --dry-run --max 5
```

### Session Summary Example

After stopping with `Ctrl+C` or reaching `--max`:

```
-------------------------------------------------------
SESSION SUMMARY
-------------------------------------------------------
Messages sent: 250
Errors: 0
Duration: 50.2s
Avg rate: 4.98 msg/s
Kafka topic: DataDose.in
Endpoint: datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15816
-------------------------------------------------------
```

---

## ⚙ Configuration

All configuration is resolved by `get_env()` — environment variables take priority over defaults. `KAFKA_USERNAME` and `KAFKA_PASSWORD` are required; missing them raises `RuntimeError` immediately.

### Producer (`producer_simulator.py`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | string | `datadosekafka-901-...l.aivencloud.com:15816` | Aiven Kafka bootstrap host:port |
| `KAFKA_USERNAME` | string | **required** | Aiven Kafka SASL username |
| `KAFKA_PASSWORD` | string | **required** | Aiven Kafka SASL password |
| `KAFKA_SASL_MECHANISM` | string | `SCRAM-SHA-256` | SASL mechanism (do not change for Aiven) |
| `KAFKA_TOPIC` | string | `DataDose.in` | Target Kafka topic name |
| `KAFKA_CA_PEM_PATH` | string | `certs/ca.pem` (relative to script) | Path to Aiven CA certificate |
| `DATASET_PATH` | string | `output_FINAL.csv` (relative to script) | Path to verified drug INN CSV |

### Consumer (`consumer_Simulator.py`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `KAFKA_TOPIC` | string | `events.in` | Topic to subscribe to |
| `KAFKA_BOOTSTRAP_SERVERS` | string | `datadosekafka-901-...l.aivencloud.com:15816` | Aiven Kafka bootstrap host:port |
| `KAFKA_CLIENT_ID` | string | `CONSUMER_CLIENT_ID` | Kafka client identifier |
| `KAFKA_GROUP_ID` | string | `CONSUMER_GROUP_ID` | Kafka consumer group identifier |
| `KAFKA_USERNAME` | string | **required** | Aiven Kafka SASL username |
| `KAFKA_PASSWORD` | string | **required** | Aiven Kafka SASL password |
| `KAFKA_SASL_MECHANISM` | string | `SCRAM-SHA-256` | SASL mechanism |
| `KAFKA_CA_PEM_PATH` | string | `certs/ca.pem` (relative to script) | Path to Aiven CA certificate |

### Simulation Parameters (in `producer_simulator.py`)

| Constant | Value | Description |
|---|---|---|
| `RATE_PER_SECOND` | `1` | Default messages per second (overridden by `--rate`) |
| `NUM_PHARMACIES` | `120` | Pharmacy pool size (`PHX_001` – `PHX_120`) |
| `NUM_PATIENTS` | `50,000` | Patient ID range (1 – 50,000) |
| `MAX_CURRENT_MEDS` | `5` | Maximum concurrent medications per prescription |
| `EGYPT_CITIES` | 25 cities | City pool for pharmacy location assignment |
| `DOSE_VALUES` | 15 values | Dose amount pool (5, 10, 20, … 1000) |
| `DOSE_UNITS` | 6 units | mg, mcg, g, mg/ml, IU, % |
| `DOSE_FORMS` | 9 forms | tablet, capsule, syrup, injection, cream, drops, inhaler, patch, suppository |

### CLI Flags

| Flag | Short | Default | Description |
|---|---|---|---|
| `--rate` | `-r` | `1.0` | Prescriptions per second |
| `--max` | `-m` | `None` (unlimited) | Stop after N messages |
| `--dry-run` | — | `False` | Console output only; no Kafka connection |

> **Topic mismatch warning:** `producer_simulator.py` defaults to `DataDose.in`; `consumer_Simulator.py` defaults to `events.in`. Set `KAFKA_TOPIC` on both sides to the same value if you want the consumer to receive the producer's messages.

---

## 📦 Module Details

### `producer_simulator.py`

> DataDose pharmacy prescription producer that streams verified drug INN events to Aiven Kafka at a configurable rate, with dry-run and message-limit support.

**Key Components:**

| Function / Class | Description |
|---|---|
| `get_env(name, default, required)` | Resolves config from environment variables; raises `RuntimeError` on missing required vars |
| `load_drug_pool(csv_path)` | Reads `output_FINAL.csv`, filters verified rows, expands combination drugs, strips non-drug terms, returns a sorted `List[str]` of unique INNs |
| `PrescriptionGenerator.__init__(drugs)` | Seeds pharmacy pool (120 pharmacies with fixed city assignments) and starts `_tx_id` counter |
| `PrescriptionGenerator.next()` | Returns one prescription dict with randomized patient, pharmacy, drug, dose, form, current meds, age, gender, and UTC timestamp |
| `build_producer()` | Creates `ssl.SSLContext` from `ca.pem`, enforces TLS 1.2 minimum, connects `KafkaProducer` with SASL/SCRAM-SHA-256; works around `kafka-python` `ssl_cafile=` bug |
| `run(rate, dry_run, max_msgs)` | Main simulation loop: generates prescriptions, sends (or prints in dry-run), logs progress every 50 messages, prints session summary on exit |
| `__main__` block | Parses `--rate`, `--max`, `--dry-run` via `argparse` and calls `run()` |

**Dependencies:** `kafka-python`, `pandas`, `ssl`, `json`, `os`, `pathlib`, `random`, `time`, `datetime`, `argparse`, `typing`

**Notes:**
- `SKIP_TERMS` is a hardcoded set of strings excluded from the drug pool (vitamins, oils, unknown, antifoam agents, etc.)
- Progress stats are printed every 50 messages and on `KeyboardInterrupt`
- `producer.flush()` and `producer.close()` are called in the `finally` block to ensure all buffered messages are delivered before exit
- `linger_ms=10` and `acks=1` balance throughput and delivery confirmation at low-moderate rates

---

### `consumer_Simulator.py`

> Minimal Aiven Kafka consumer for local message inspection and pipeline connectivity testing.

**Key Components:**

| Component | Description |
|---|---|
| `get_env(name, default, required)` | Same pattern as producer — resolves config from environment variables |
| `ssl_context` | Built via `ssl.create_default_context(cafile=str(CA_PEM))` from the resolved `CA_PEM` path |
| `KafkaConsumer(...)` | Connects with SASL_SSL, SCRAM-SHA-256, earliest offset reset, UTF-8 value deserializer |
| `while True` poll loop | Calls `consumer.poll(timeout_ms=1000)` and prints each message value |

**Dependencies:** `kafka-python`, `ssl`, `os`, `pathlib`

**Notes:**
- `auto_offset_reset="earliest"` means the consumer will replay all messages from the beginning of the topic on first run in a new group
- Not designed for production use — no error handling, no commit management, no graceful shutdown
- `TOPIC_NAME` defaults to `events.in`, which differs from the producer's default (`DataDose.in`); set `KAFKA_TOPIC` via environment variable to align them

---

### `certs/ca.pem`

> Aiven Kafka project CA certificate used to verify the TLS connection to the Kafka broker.

**Notes:**
- This is a standard X.509 PEM certificate (begins with `-----BEGIN CERTIFICATE-----`)
- Issued by the Aiven project CA; specific to your Aiven project — do not share across projects
- Both the producer and consumer build their SSL context from this file
- Download a fresh copy from: **Aiven Dashboard → Your Kafka Service → Overview → Download CA Certificate**
- The current certificate in this repo expires **2036-02-28** (10-year validity from issuance)

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request with a description of the change and any testing performed

> Before submitting, run `python producer_simulator.py --dry-run --max 20` to validate prescription generation. Do not commit real Kafka credentials or your personal `output_FINAL.csv` dataset.

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [kafka-python](https://kafka-python.readthedocs.io/) — Kafka producer and consumer client for Python
- [pandas](https://pandas.pydata.org/) — CSV loading and INN dataset processing
- [Aiven](https://aiven.io/) — Managed Kafka service with SASL/SSL support
- [Apache Kafka](https://kafka.apache.org/) — Distributed event streaming platform

---

## 📬 Contact

For questions about the simulator, dataset format, or Kafka connectivity, open an issue in the repository or contact the DataDose Data Engineering team through your organization's internal channels.

---

*Part of the DataDose Pharmaceutical Drug Interaction Analytics Platform — Kafka Simulator v4.2*
