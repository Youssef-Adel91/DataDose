```
██████╗ ██╗  ██╗ █████╗ ██████╗ ███╗   ███╗ █████╗ ██████╗  ██████╗ ███████╗
██╔══██╗██║  ██║██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗██╔═══██╗██╔════╝
██████╔╝███████║███████║██████╔╝██╔████╔██║███████║██║  ██║██║   ██║███████╗
██╔═══╝ ██╔══██║██╔══██║██╔══██╗██║╚██╔╝██║██╔══██║██║  ██║██║   ██║╚════██║
██║     ██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║██████╔╝╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝
                  Databricks PySpark Streaming Pipeline
```

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)
![PySpark](https://img.shields.io/badge/PySpark-Structured%20Streaming-orange?style=flat-square&logo=apachespark)
![Databricks](https://img.shields.io/badge/Databricks-Runtime-red?style=flat-square&logo=databricks)
![Kafka](https://img.shields.io/badge/Aiven-Kafka-231F20?style=flat-square&logo=apachekafka)
![Neo4j](https://img.shields.io/badge/Neo4j-AuraDB-008CC1?style=flat-square&logo=neo4j)
![Snowflake](https://img.shields.io/badge/Snowflake-Data%20Warehouse-29B5E8?style=flat-square&logo=snowflake)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> A real-time pharmaceutical prescription risk pipeline that streams JSON events from Aiven Kafka, enriches them with drug-drug interaction data from a Neo4j knowledge graph, computes patient risk scores, and lands enriched records into Snowflake — all orchestrated in a single Databricks notebook.

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

### Streaming Ingestion
- Consumes real-time JSON prescription events from an **Aiven Kafka** topic using Spark Structured Streaming
- Supports **SASL/SCRAM-256** authentication and **TLS/SSL** with a CA PEM certificate
- Configurable starting offsets, fault-tolerant checkpoint recovery, and `failOnDataLoss=false` for resilience

### Drug Interaction Enrichment
- Queries a **Neo4j AuraDB** knowledge graph for `Drug → INTERACTS_WITH → Drug` relationships per micro-batch
- Detects **shared active ingredients** via `HAS_INGREDIENT` traversal
- Returns severity ranking (Major / Moderate / Minor), interaction type, and interacting drug pairs

### Risk Scoring
- Computes a **drug risk score** (0–100) based on severity weight, interaction count, and ingredient overlap
- Computes a **patient risk score** adjusted by age multiplier (`1.0 + (age - 40) × 0.005`)
- Flags **high-risk patients** (score ≥ 60) and **polypharmacy cases** (≥ 5 concurrent medications)

### Snowflake Output
- Writes enriched rows to `STAGING.STG_TRANSACTION` in append mode via the **Snowflake Spark Connector**
- Each row carries `BATCH_ID`, `SOURCE_SYSTEM`, interaction fields, risk scores, and the full raw JSON
- Supports write verification queries and a pipeline health summary dashboard

### Developer Experience
- Structured as **9 numbered steps** with matching debug cells for incremental testing
- Includes masked credential printing, graph content checks, and dry-run batch writes
- Live monitoring loop tracks batch IDs, input rows/sec, and Snowflake record counts

---

## 🛠 Tech Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Databricks | Latest LTS | Managed Spark environment |
| **Stream Processing** | Apache Spark Structured Streaming | 3.x | Micro-batch streaming engine |
| **Message Broker** | Aiven Kafka | Managed | Source of prescription events |
| **Graph Database** | Neo4j AuraDB | Cloud | Drug interaction knowledge graph |
| **Data Warehouse** | Snowflake | Cloud | Enriched record storage |
| **Language** | Python | 3.9+ | Pipeline logic |
| **Spark Connector** | spark-sql-kafka | Cluster JAR | Kafka ↔ Spark integration |
| **Spark Connector** | snowflake-spark-connector | Cluster JAR | Snowflake ↔ Spark writes |
| **Python Driver** | neo4j | Latest | Neo4j Cypher query client |

---

## 🏗 Architecture

```
┌─────────────────┐     JSON      ┌───────────────────────────────────────────────────┐
│   simulator.py  │ ─────────────▶│              Aiven Kafka (SASL/SSL)               │
│  (Event Source) │               │            Topic: DataDose.in                     │
└─────────────────┘               └──────────────────────┬────────────────────────────┘
                                                         │  Spark readStream
                                                         ▼
                                  ┌───────────────────────────────────────────────────┐
                                  │          Databricks / PySpark Notebook            │
                                  │                                                   │
                                  │  Step 6: Parse JSON → prescription_schema         │
                                  │  Step 7: foreachBatch → process_batch()           │
                                  │    ├─ collect() micro-batch rows                  │
                                  │    ├─ check_interactions() → Neo4j AuraDB ──────▶ │
                                  │    │     MATCH Drug → INTERACTS_WITH → Drug        │
                                  │    │     MATCH Drug → HAS_INGREDIENT → Ingredient  │
                                  │    ├─ Compute drug_risk_score (0–100)             │
                                  │    ├─ Compute patient_risk_score (age-adjusted)   │
                                  │    └─ Write enriched rows → Snowflake ──────────▶ │
                                  └───────────────────────────────────────────────────┘
                                                         │
                                                         ▼
                                  ┌───────────────────────────────────────────────────┐
                                  │  Snowflake: PHARMA_ANALYTICS_DB                   │
                                  │  Schema: STAGING                                  │
                                  │  Table:  STG_TRANSACTION                          │
                                  └───────────────────────────────────────────────────┘
```

**Data flow summary:**
1. A Kafka producer (simulator) publishes prescription-like JSON to the `DataDose.in` topic
2. Spark reads the stream via `readStream.format('kafka')`
3. Each micro-batch is handed to `process_batch()` via `foreachBatch`
4. `check_interactions()` queries Neo4j for interactions and shared ingredients
5. Risk scores are computed and the enriched row dict is written to Snowflake via the Spark connector
6. Checkpoints in DBFS ensure exactly-once delivery semantics on restart

---

## 📁 Folder Structure

```
project-root/
├── DataBricks_Pyspark.ipynb   # End-to-end pipeline notebook (Steps 0–9 + debug cells)
└── README.md                  # This file
```

> **Note:** The notebook is self-contained. All pipeline logic — configuration, streaming reader, Neo4j helpers, enrichment function, and Snowflake writes — lives in a single `.ipynb` file designed to run on Databricks.

---

## ⚠ Prerequisites

1. **Databricks Workspace** with an active cluster (Spark 3.x runtime)
2. **Cluster libraries** installed:
   - `spark-sql-kafka` assembly JAR (matching Kafka/Spark version)
   - `net.snowflake:snowflake-spark-connector` JAR
3. **Python package** available on the driver: `neo4j` (installed via `%pip install neo4j` in Step 0)
4. **Aiven Kafka** service with:
   - A topic named `DataDose.in` (or configured via `KAFKA_TOPIC`)
   - SASL/SCRAM credentials (username & password)
   - CA certificate (`ca.pem`) downloaded from the Aiven Dashboard
5. **Neo4j AuraDB** instance with:
   - `Drug` nodes (with `name` property)
   - `INTERACTS_WITH` relationships (with `severity` and `type` properties)
   - `Ingredient` nodes and `HAS_INGREDIENT` relationships
6. **Snowflake** account with:
   - Database `PHARMA_ANALYTICS_DB`, schema `STAGING`, table `STG_TRANSACTION`
   - Role `PYSPARK_ROLE` with `INSERT` privileges on the staging table
   - Warehouse `PHARMA_WH`
7. **Outbound network access** from the Databricks cluster to:
   - Aiven Kafka bootstrap server (TCP port varies)
   - Neo4j AuraDB (TCP port 7687)
   - Snowflake account URL (HTTPS 443)

---

## 🚀 Installation

### 1. Clone or import the notebook

```bash
# Option A: Clone this repo and import the .ipynb into Databricks
git clone https://github.com/your-org/pharma-streaming-pipeline.git
```

Or upload `DataBricks_Pyspark.ipynb` directly via **Databricks Workspace → Import**.

### 2. Install cluster JARs

In your cluster's **Libraries** tab, add:

```
Maven: org.apache.spark:spark-sql-kafka-0-10_2.12:<spark-version>
Maven: net.snowflake:snowflake-spark-connector_2.12:<connector-version>
```

### 3. Upload the Kafka CA certificate

```
1. Download ca.pem from Aiven Dashboard → Your Kafka Service → Overview → CA Certificate
2. Upload to Databricks Workspace: Workspace → your-user-folder → Upload
3. Note the workspace path (e.g. /Users/you@org.com/ca.pem)
```

### 4. Configure secrets (recommended)

```bash
# Using Databricks CLI
databricks secrets create-scope --scope datadose
databricks secrets put --scope datadose --key kafka-username
databricks secrets put --scope datadose --key kafka-password
databricks secrets put --scope datadose --key neo4j-user
databricks secrets put --scope datadose --key neo4j-password
databricks secrets put --scope datadose --key snowflake-user
databricks secrets put --scope datadose --key snowflake-password
```

### 5. Set environment variables on the cluster

```
KAFKA_BOOTSTRAP_SERVERS = <aiven-host>:<port>
KAFKA_TOPIC             = DataDose.in
KAFKA_CA_PEM_PATH       = /Users/you@org.com/ca.pem
NEO4J_URI               = neo4j+s://<your-instance>.databases.neo4j.io
SNOWFLAKE_URL           = https://<account>.snowflakecomputing.com
SNOWFLAKE_DATABASE      = PHARMA_ANALYTICS_DB
SNOWFLAKE_SCHEMA        = STAGING
SNOWFLAKE_WAREHOUSE     = PHARMA_WH
SNOWFLAKE_ROLE          = PYSPARK_ROLE
```

---

## 📖 Usage

### Basic Usage — Run the Pipeline Step by Step

Run each numbered cell in order, executing the matching debug cell before proceeding:

```
Step 0 → Install neo4j driver       → Debug 0: confirm import
Step 1 → Load credentials           → Debug 1: print masked config
Step 2 → Verify ca.pem              → Debug 2: inspect certificate
Step 3 → Neo4j helpers              → Debug 3a/3b/3c: ping + graph check + interaction test
Step 4 → Snowflake connection       → Debug 4a/4b: identity + schema check
Step 5 → Kafka reader               → Debug 5a/5b: schema + 5 live messages
Step 6 → Parse JSON stream          → Debug 6a/6b: schema shape + end-to-end parse
Step 7 → Define process_batch       → Debug 7: dry-run write to Snowflake
Step 8 → Start live stream          → (stream is now active)
Step 9 → Monitor / stop stream      → Debug 8a/8b/8c/8d: status, watch, rows, health
```

### Advanced Usage — Start Streaming

After all debug cells pass, run Step 8 to launch the live pipeline:

```python
CHECKPOINT_PATH = 'dbfs:/tmp/pharma_pipeline/checkpoints/kafka_to_snowflake'

query = (
    parsed_df.writeStream
    .foreachBatch(process_batch)
    .option('checkpointLocation', CHECKPOINT_PATH)
    .trigger(processingTime='10 seconds')
    .start()
)
```

### Monitoring

```python
# Check stream status (Debug 8a)
print(query.isActive)
print(query.status)
print(query.lastProgress)

# Watch live for 60 seconds (Debug 8b)
# Polls every 10 seconds x 6 iterations

# Stop the stream
query.stop()
```

### Verifying Output in Snowflake

```sql
-- Latest enriched records
SELECT TX_ID, DRUG, CITY, INTERACTION_FOUND,
       INTERACTION_SEVERITY, HIGH_RISK_PATIENT,
       PATIENT_RISK_SCORE, BATCH_ID, LOAD_TIMESTAMP
FROM   STAGING.STG_TRANSACTION
ORDER  BY LOAD_TIMESTAMP DESC
LIMIT  20;

-- Pipeline health summary
SELECT
    COUNT(*)                                                     AS TOTAL_RECORDS,
    SUM(CASE WHEN INTERACTION_FOUND = 'TRUE' THEN 1 ELSE 0 END) AS INTERACTIONS_DETECTED,
    SUM(CASE WHEN HIGH_RISK_PATIENT = 'TRUE' THEN 1 ELSE 0 END) AS HIGH_RISK_PATIENTS,
    ROUND(AVG(PATIENT_RISK_SCORE::FLOAT), 2)                    AS AVG_RISK_SCORE
FROM STAGING.STG_TRANSACTION;
```

---

## ⚙ Configuration

All configuration is resolved in **Step 1** via `get_env()` and `get_secret_or_env()`. The functions check environment variables first, then fall back to Databricks Secrets, then to hard-coded defaults.

### Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | string | *(Aiven host:port)* | Kafka bootstrap server address |
| `KAFKA_TOPIC` | string | `DataDose.in` | Kafka topic to consume |
| `KAFKA_CA_PEM_PATH` | string | **required** | Workspace path to Aiven CA certificate |
| `NEO4J_URI` | string | **required** | Neo4j AuraDB URI (`neo4j+s://...`) |
| `SNOWFLAKE_URL` | string | **required** | Snowflake account URL |
| `SNOWFLAKE_DATABASE` | string | `PHARMA_ANALYTICS_DB` | Target Snowflake database |
| `SNOWFLAKE_SCHEMA` | string | `STAGING` | Target Snowflake schema |
| `SNOWFLAKE_WAREHOUSE` | string | `PHARMA_WH` | Snowflake virtual warehouse |
| `SNOWFLAKE_ROLE` | string | `PYSPARK_ROLE` | Snowflake role for writes |

### Databricks Secret Scope Keys (`scope = datadose`)

| Secret Key | Maps To | Description |
|---|---|---|
| `kafka-username` | `KAFKA_USERNAME` | Aiven Kafka SASL username |
| `kafka-password` | `KAFKA_PASSWORD` | Aiven Kafka SASL password |
| `neo4j-user` | `NEO4J_USER` | Neo4j database user |
| `neo4j-password` | `NEO4J_PASSWORD` | Neo4j database password |
| `snowflake-user` | `SNOWFLAKE_USER` | Snowflake login user |
| `snowflake-password` | `SNOWFLAKE_PASSWORD` | Snowflake login password |

### Streaming Parameters

| Parameter | Value | Description |
|---|---|---|
| `startingOffsets` | `latest` | Consume only new messages |
| `failOnDataLoss` | `false` | Continue on offset gaps |
| `processingTime` | `10 seconds` | Micro-batch trigger interval |
| `CHECKPOINT_PATH` | `dbfs:/tmp/pharma_pipeline/checkpoints/kafka_to_snowflake` | DBFS checkpoint directory |

### Risk Scoring Weights

| Factor | Weight | Notes |
|---|---|---|
| Major interaction | +40 | Highest severity |
| Moderate interaction | +20 | Mid severity |
| Minor interaction | +10 | Low severity |
| Per additional interaction | +5 | Multiplied by count |
| Per shared ingredient | +3 | Multiplied by overlap count |
| Polypharmacy (≥ 5 drugs) | +5 | Flat bonus |
| Age multiplier | `1.0 + (age − 40) × 0.005` | Applied to drug risk score |
| High-risk threshold | ≥ 60 | `HIGH_RISK_PATIENT = TRUE` |

---

## 📦 Module Details

### `DataBricks_Pyspark.ipynb`

> End-to-end Databricks notebook implementing the Kafka → Neo4j → Snowflake streaming pipeline across 9 logical steps with corresponding debug cells.

**Key Components:**

| Function / Variable | Description |
|---|---|
| `get_env(name, default, required)` | Reads an environment variable with optional default and required enforcement |
| `get_secret_or_env(env_name, scope, key, ...)` | Reads from env var first, falls back to Databricks Secrets (`dbutils.secrets.get`) |
| `get_neo4j_driver()` | Lazy singleton factory for the Neo4j `GraphDatabase.driver`; connection pool size = 10 |
| `_empty_interaction()` | Returns a zero-value dict for when no current drugs exist |
| `_worst_severity(severities)` | Ranks a list of severities (Major > Moderate > Minor) and returns the worst |
| `check_interactions(new_drug, current_drugs)` | Main Neo4j enrichment function; runs two Cypher queries (interactions + shared ingredients) |
| `kafka_stream_df` | Spark Structured Streaming DataFrame reading from Aiven Kafka with SASL/SSL |
| `prescription_schema` | `StructType` defining the expected JSON shape: 11 fields covering patient, pharmacy, drug, and timestamp |
| `parsed_df` | Streaming DataFrame with `from_json`-parsed prescription fields plus `raw_json` and `kafka_timestamp` |
| `process_batch(batch_df, batch_id)` | `foreachBatch` handler: collects rows, calls Neo4j, computes risk scores, writes to Snowflake |
| `query` | The active `StreamingQuery` object returned by `writeStream.start()` |

**Cypher Queries Used:**

```cypher
-- Drug-drug interaction lookup
MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug)
WHERE toLower(d1.name) = toLower($new_drug)
  AND ANY(med IN $current_drugs WHERE toLower(d2.name) = toLower(med))
RETURN d1.name AS drug_a, d2.name AS drug_b,
       r.severity AS severity, r.type AS interaction_type
ORDER BY CASE r.severity
    WHEN 'Major'    THEN 1
    WHEN 'Moderate' THEN 2
    WHEN 'Minor'    THEN 3
    ELSE 4 END

-- Shared ingredient lookup
MATCH (d1:Drug)-[:HAS_INGREDIENT]->(i:Ingredient)<-[:HAS_INGREDIENT]-(d2:Drug)
WHERE toLower(d1.name) = toLower($new_drug)
  AND ANY(med IN $current_drugs WHERE toLower(d2.name) = toLower(med))
RETURN DISTINCT i.name AS ingredient
```

**Output Schema (`STG_TRANSACTION` columns written per row):**

| Column | Description |
|---|---|
| `BATCH_ID` | Unique batch identifier (`KAFKA-{batch_id}-{uuid}`) |
| `SOURCE_SYSTEM` | Always `AIVEN_KAFKA` |
| `TX_ID` | Prescription transaction ID |
| `PHARMACY` | Pharmacy ID |
| `CITY` | Pharmacy city |
| `DRUG` | New drug name |
| `CURRENT_MEDS` | Pipe-delimited list of current medications |
| `INTERACTION_FOUND` | `TRUE` / `FALSE` |
| `INTERACTION_COUNT` | Number of interactions detected |
| `INTERACTING_DRUGS` | Pipe-delimited `DrugA↔DrugB` pairs |
| `INTERACTION_SEVERITY` | Worst severity among detected interactions |
| `INTERACTION_TYPE` | Pipe-delimited interaction types |
| `ACTIVE_INGREDIENT_MATCH` | `TRUE` if shared ingredients found |
| `SHARED_INGREDIENT` | Pipe-delimited shared ingredient names |
| `INGREDIENT_OVERLAP_COUNT` | Number of shared ingredients |
| `DRUG_RISK_SCORE` | Computed score 0–100 |
| `PATIENT_RISK_SCORE` | Age-adjusted score 0–100 |
| `HIGH_RISK_PATIENT` | `TRUE` if score ≥ 60 |
| `POLYPHARMACY_FLAG` | `TRUE` if ≥ 5 concurrent medications |
| `RAW_RECORD` | Full original JSON string from Kafka |

**Dependencies:**

- `neo4j` Python package (installed in Step 0)
- `pyspark.sql.functions`, `pyspark.sql.types` (provided by Databricks runtime)
- `spark-sql-kafka` JAR (cluster-level)
- `net.snowflake.spark.snowflake` JAR (cluster-level)
- `dbutils` (Databricks-provided global for secrets and file ops)

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes with a clear message: `git commit -m "feat: describe your change"`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request with a description of the change and any relevant test results

> Before submitting, ensure all debug cells in the notebook pass against real services, and that no credentials are committed to version control.

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Apache Spark Structured Streaming](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html) — micro-batch stream processing engine
- [Aiven](https://aiven.io/) — managed Kafka with TLS/SASL support
- [Neo4j AuraDB](https://neo4j.com/cloud/platform/aura-graph-database/) — fully managed graph database for drug interaction modeling
- [Snowflake](https://www.snowflake.com/) — cloud data warehouse for enriched analytical storage
- [Snowflake Spark Connector](https://docs.snowflake.com/en/user-guide/spark-connector) — Spark-native write integration
- [neo4j Python Driver](https://neo4j.com/docs/api/python-driver/current/) — Cypher query client

---

## 📬 Contact

For questions about this pipeline, open an issue in the repository or reach out through your organization's internal channels.

---

*Built for real-time pharmaceutical analytics on Databricks.*
