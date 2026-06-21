<div align="center">

```
 ____        ____                  _    
|  _ \ _   _/ ___| _ __   __ _ _ __| | __
| |_) | | | \___ \| '_ \ / _` | '__| |/ /
|  _ <| |_| |___) | |_) | (_| | |  |   < 
|_| \_\\__, |____/| .__/ \__,_|_|  |_|\_\
       |___/      |_|                    
        Kafka → PySpark → Neo4j → Snowflake
```

# 🔥 PySpark Streaming Pipeline

![Platform](https://img.shields.io/badge/platform-Databricks-FF3621?logo=databricks&logoColor=white)
![Language](https://img.shields.io/badge/python-3.x-3776AB?logo=python&logoColor=white)
![Framework](https://img.shields.io/badge/PySpark-Structured%20Streaming-E25A1C?logo=apachespark&logoColor=white)
![Kafka](https://img.shields.io/badge/Aiven-Kafka-1B1E2E?logo=apachekafka&logoColor=white)
![Graph](https://img.shields.io/badge/Neo4j-AuraDB-008CC1?logo=neo4j&logoColor=white)
![Warehouse](https://img.shields.io/badge/Snowflake-Staging-29B5E8?logo=snowflake&logoColor=white)
![License](https://img.shields.io/badge/license-unspecified-lightgrey)

> Streams prescription events off Aiven Kafka, enriches each one against a Neo4j drug-interaction graph, scores patient risk in real time, and lands the result in Snowflake — all from a single Databricks notebook.

</div>

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Module Details](#-module-details)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact](#-contact)

---

## ✨ Features

**Streaming ingestion**
- Consumes JSON prescription events from an Aiven Kafka topic over `SASL_SSL` with `SCRAM-SHA-256` auth and a PEM-based SSL truststore
- Structured Streaming reader with a 10-second micro-batch trigger and a durable DBFS checkpoint

**Graph-based drug safety checks**
- Looks up `Drug` nodes and `INTERACTS_WITH` relationships in Neo4j AuraDB to flag drug-drug interactions, with severity ranked `Major` → `Moderate` → `Minor`
- Cross-references `HAS_INGREDIENT` relationships to catch shared active ingredients between a new prescription and a patient's current medications

**Real-time risk scoring**
- Computes a `DRUG_RISK_SCORE` from interaction severity, interaction count, ingredient overlap, and a polypharmacy flag (≥5 concurrent medications)
- Applies an age-based multiplier to produce a `PATIENT_RISK_SCORE`, with a `HIGH_RISK_PATIENT` flag at a score ≥ 60

**Snowflake staging**
- Writes enriched, flattened rows into `STAGING.STG_TRANSACTION` via the Snowflake Spark connector in append mode

**Built-in operational tooling**
- 17 numbered debug cells (masked-credential printouts, connectivity pings, schema checks, dry-runs, live stream monitoring) so each stage of the pipeline can be verified before moving to the next

---

## 🛠 Tech Stack

| Category | Technology | Notes |
|---|---|---|
| Compute | Databricks notebook | Assumes a pre-existing `spark` session on the cluster |
| Streaming engine | PySpark Structured Streaming | `foreachBatch` micro-batch processing |
| Message broker | Aiven Kafka | `spark-sql-kafka` connector, SASL_SCRAM-SHA-256 over SSL |
| Graph database | Neo4j AuraDB | Accessed via the official `neo4j` Python driver |
| Data warehouse | Snowflake | `net.snowflake.spark.snowflake` Spark connector |
| Secrets | Databricks Secrets / env vars | `get_env` / `get_secret_or_env` helpers in Step 1 |
| Language | Python 3 | Runs inside the Databricks notebook runtime |

---

## 🏗 Architecture

```
Aiven Kafka topic (DataDose.in)
        │  JSON prescription events
        ▼
Spark Structured Streaming reader  ──►  from_json (prescription_schema)
        │
        ▼
foreachBatch(process_batch)
        │
        ├──► Neo4j AuraDB  (check_interactions: INTERACTS_WITH, HAS_INGREDIENT)
        │
        ├──► Risk scoring  (drug_risk_score, patient_risk_score, polypharmacy/high-risk flags)
        │
        ▼
Snowflake STAGING.STG_TRANSACTION  (append)
```

Each Kafka micro-batch is collected to the driver, enriched row-by-row against Neo4j, scored, and written as a single Snowflake append. The streaming query checkpoints to DBFS so it can resume after a restart.

---

## 📁 Folder Structure

```
.
├── DataBricks_Pyspark.ipynb   # End-to-end notebook: config, Kafka reader, Neo4j enrichment,
│                               # process_batch, Snowflake writes, debug/monitoring cells
└── README.md                  # This file
```

> The notebook is self-contained — there is no separate `src/` package. All configuration, helper functions, and the streaming job live in one `.ipynb`.

---

## ⚠ Prerequisites

1. **Databricks workspace** with a cluster that has Spark available and the following JARs installed:
   - `spark-sql-kafka` (matching your Spark/Scala version)
   - `snowflake-spark-connector`
2. **Aiven Kafka** instance with a topic (default `DataDose.in`), SCRAM-SHA-256 credentials, and the cluster's **CA certificate** (`ca.pem`) uploaded to a Databricks Workspace path
3. **Neo4j AuraDB** instance pre-loaded with `Drug` and `Ingredient` nodes plus `INTERACTS_WITH` and `HAS_INGREDIENT` relationships
4. **Snowflake** account with a `STAGING.STG_TRANSACTION` table, and a role/warehouse with write access to it
5. Credentials available either as environment variables or as entries in a Databricks **secret scope** named `datadose`
6. *(Optional, for testing)* A local message simulator (referred to in the notebook's debug cells as `simulator.py`) producing JSON messages onto the Kafka topic — this script is **not** included in this repository

---

## 🚀 Installation

1. **Upload the notebook to your Databricks workspace**
   ```text
   Workspace → Import → DataBricks_Pyspark.ipynb
   ```

2. **Attach the required JARs to your cluster** (Cluster → Libraries → Install New):
   ```text
   spark-sql-kafka (matching your Spark version)
   snowflake-spark-connector
   ```

3. **Upload your Aiven Kafka CA certificate** to a Workspace path and note the path — it's required by `KAFKA_CA_PEM_PATH`.

4. **Set credentials**, either as cluster environment variables or in a Databricks secret scope called `datadose`:
   ```text
   KAFKA_USERNAME / kafka-username
   KAFKA_PASSWORD / kafka-password
   NEO4J_USER     / neo4j-user
   NEO4J_PASSWORD / neo4j-password
   SNOWFLAKE_USER     / snowflake-user
   SNOWFLAKE_PASSWORD / snowflake-password
   ```

5. **Run the notebook top to bottom**, executing each Step cell followed by its corresponding Debug cell(s) — see [Usage](#-usage).

---

## 📖 Usage

### Basic Usage — run the pipeline step by step

```text
Step 0 → Install neo4j Python driver (%pip install neo4j)
Step 1 → Load credentials/config; run Debug 1 to confirm masked values
Step 2 → Verify ca.pem and copy to /tmp/ca.pem; run Debug 2
Step 3 → Define Neo4j driver + check_interactions(); run Debug 3a/3b/3c
Step 4 → Test Snowflake connection + verify STG_TRANSACTION schema; run Debug 4a/4b
Step 5 → Define kafka_stream_df; run Debug 5a/5b
Step 6 → Define prescription_schema and parsed_df; run Debug 6a/6b
Step 7 → Define process_batch(); run Debug 7 (dry-run write to Snowflake)
Step 8 → Start the live streaming query (writeStream.foreachBatch(process_batch))
Step 9 → Monitor with Debug 8a–8d, then query.stop() when done
```

### Advanced Usage — inspecting an enrichment result directly

```python
result = check_interactions(
    new_drug="warfarin",
    current_drugs=["aspirin", "ibuprofen", "metformin"],
)
# result -> dict with interaction_found, interaction_count,
#           interacting_drugs, interaction_severity,
#           interaction_type, shared_ingredient, ingredient_overlap_count
```

### Common Scenario — monitoring a running stream

```python
print(query.isActive)
print(query.lastProgress)   # rows/sec, batch duration, etc.
```

```python
query.stop()
```

---

## ⚙ Configuration

All configuration is resolved through `get_env()` (plain env var, with optional default) or `get_secret_or_env()` (env var first, falling back to a Databricks secret scope named `datadose`).

| Variable | Required | Default | Description |
|---|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | No | `datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15816` | Aiven Kafka bootstrap host:port |
| `KAFKA_TOPIC` | No | `DataDose.in` | Kafka topic to subscribe to |
| `KAFKA_USERNAME` | Yes (secret: `kafka-username`) | — | SCRAM-SHA-256 username |
| `KAFKA_PASSWORD` | Yes (secret: `kafka-password`) | — | SCRAM-SHA-256 password |
| `KAFKA_CA_PEM_PATH` | Yes | — | Workspace path to the Aiven CA certificate |
| `NEO4J_URI` | Yes | — | Neo4j AuraDB connection URI (`neo4j+s://...`) |
| `NEO4J_USER` | Yes (secret: `neo4j-user`) | — | Neo4j username |
| `NEO4J_PASSWORD` | Yes (secret: `neo4j-password`) | — | Neo4j password |
| `SNOWFLAKE_URL` | Yes | — | Snowflake account URL |
| `SNOWFLAKE_USER` | Yes (secret: `snowflake-user`) | — | Snowflake username |
| `SNOWFLAKE_PASSWORD` | Yes (secret: `snowflake-password`) | — | Snowflake password |
| `SNOWFLAKE_DATABASE` | No | `PHARMA_ANALYTICS_DB` | Target database |
| `SNOWFLAKE_SCHEMA` | No | `STAGING` | Target schema |
| `SNOWFLAKE_WAREHOUSE` | No | `PHARMA_WH` | Snowflake warehouse |
| `SNOWFLAKE_ROLE` | No | `PYSPARK_ROLE` | Snowflake role used for writes |

> **Note:** the notebook's Step 1 cell currently has these variables wired with literal fallback values for local testing. For production use, rely on the Databricks secret scope path and avoid leaving real credentials in the notebook itself.

**Risk-scoring constants** (hard-coded in `process_batch`, Step 7):

| Constant | Value | Used for |
|---|---|---|
| Severity weight — Major | `40` | Base of `drug_risk_score` |
| Severity weight — Moderate | `20` | Base of `drug_risk_score` |
| Severity weight — Minor | `10` | Base of `drug_risk_score` |
| Polypharmacy threshold | `≥ 5` current meds | Adds `+5` to `drug_risk_score`; sets `POLYPHARMACY_FLAG` |
| Age multiplier | `1.0 + (age - 40) * 0.005` | Scales `drug_risk_score` → `patient_risk_score` |
| High-risk threshold | `patient_risk_score ≥ 60` | Sets `HIGH_RISK_PATIENT` |

---

## 📦 Module Details

### `DataBricks_Pyspark.ipynb`
> Single notebook implementing the full Kafka → Neo4j → Snowflake streaming pipeline.

- **Key Components:**
  - `get_env()`, `get_secret_or_env()` — config/secret resolution (Step 1)
  - `get_neo4j_driver()`, `check_interactions()` — Neo4j enrichment (Step 3)
  - `kafka_stream_df` — Structured Streaming Kafka reader (Step 5)
  - `prescription_schema`, `parsed_df` — JSON schema and parsed stream (Step 6)
  - `process_batch(batch_df, batch_id)` — per-micro-batch enrichment, scoring, and Snowflake write (Step 7)
  - `query` — the live `writeStream` handle started in Step 8
  - 17 `Debug` cells (0, 1, 2, 3a–3c, 4a–4b, 5a–5b, 6a–6b, 7, 8a–8d) for verifying each stage
- **Dependencies:** `pyspark` (provided by the Databricks runtime), `neo4j` (installed via `%pip install neo4j`), Spark `spark-sql-kafka` and `snowflake-spark-connector` JARs on the cluster
- **Notes:** `process_batch` calls `batch_df.collect()`, pulling each micro-batch fully onto the driver before enrichment — see [Known Limitations](#-known-limitations).

---



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-change`)
3. Commit your changes with a clear message
4. Push the branch and open a Pull Request describing what changed and why

---

## 📄 License

No `LICENSE` file is included in this repository. Add one (e.g. MIT, Apache 2.0) before distributing this project publicly.

---

## 🙏 Acknowledgments

- [Apache Spark](https://spark.apache.org/) Structured Streaming
- [Aiven](https://aiven.io/) for managed Kafka
- [Neo4j AuraDB](https://neo4j.com/cloud/aura/) for the drug-interaction graph
- [Snowflake](https://www.snowflake.com/) and its Spark connector
- The [`neo4j` Python driver](https://pypi.org/project/neo4j/)

---

## 📬 Contact

No contact information was found in the provided files. Add a maintainer name, email, or issue-tracker link here before publishing.
