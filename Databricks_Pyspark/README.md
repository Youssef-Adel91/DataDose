#  Databricks PySpark Streaming Pipeline

This folder contains a Databricks notebook that implements a streaming pipeline from Aiven Kafka into Spark Structured Streaming, enriches incoming prescription-like messages via a Neo4j graph lookup, and writes enriched rows into Snowflake.

---

**Table of Contents**

- Overview
- Files
- Setup & External Dependencies
- Configuration (where to set credentials)
- Run Order (step-by-step cells in the notebook)
- Inputs and Outputs (formats & locations)
- Known limitations and manual steps

---

## Overview

The pipeline reads JSON messages from an Aiven Kafka topic, parses a prescription-like schema, calls Neo4j to detect drug-drug interactions and shared ingredients, computes risk scores per message, and writes enriched records into Snowflake staging table `STAGING.STG_TRANSACTION`. The notebook is intended to run in a Databricks environment where Spark, the Kafka connector, and the Snowflake Spark connector are available.

---

## Files

| File | Purpose | Input | Output |
|---|---|---:|---|
| [DataBricks_Pyspark.ipynb](Databricks_Pyspark/DataBricks_Pyspark.ipynb#L1) | Single Databricks notebook implementing the end-to-end streaming pipeline: configuration, runtime checks, Kafka Structured Streaming reader, JSON parsing, Neo4j enrichment helpers, `process_batch` foreachBatch function, and Snowflake writes. | Kafka topic messages (JSON) as described in the notebook's `prescription_schema`; cluster must provide Spark session and configured jars/connectors. | Writes enriched records to Snowflake table `STAGING.STG_TRANSACTION`; also uses `/tmp/ca.pem` for Kafka TLS and `dbfs:/tmp/pharma_pipeline/checkpoints/kafka_to_snowflake` for streaming checkpoints. |

---

## Setup & External Dependencies

Required Python packages and Spark connectors (as used or referenced in the notebook):

- Python packages (install on driver/notebook cluster):

```text
neo4j
# PySpark is provided by Databricks runtime
```

- Spark runtime requirements:

```text
Spark Structured Streaming
spark-sql-kafka JAR (for Spark <-> Kafka integration)
snowflake-spark-connector (Snowflake Spark connector jar)
```

- External services the notebook connects to:

```text
Aiven Kafka (bootstrap host, topic, SASL/SCRAM credentials, CA certificate)
Neo4j AuraDB (neo4j+s:// URI, user, password)
Snowflake (account URL, user, password, database, schema, warehouse, role)
```

Notes:
- The notebook runs in Databricks and assumes a Spark session named `spark`. The Snowflake connector is invoked via `spark.read.format('net.snowflake.spark.snowflake')` and requires the connector jar to be installed on the cluster.
- The Kafka Structured Streaming integration requires the spark-sql-kafka assembly (the cluster must have the matching Kafka JARs configured).

---

## Configuration (where to set credentials)

The notebook defines credentials and connection options in the Step 1 cell. Update these variables before running the pipeline:

```python
KAFKA_BOOTSTRAP
KAFKA_TOPIC
KAFKA_USERNAME
KAFKA_PASSWORD
KAFKA_CA_PEM_PATH

NEO4J_URI
NEO4J_USER
NEO4J_PASSWORD

sf_options  # a dict containing 'sfURL','sfUser','sfPassword','sfDatabase','sfSchema','sfWarehouse','sfRole'

KAFKA_JAAS  # constructed from username/password in the notebook
```

Important notes about the CA certificate:

- The notebook expects a PEM certificate in `KAFKA_CA_PEM_PATH` (a Databricks Workspace path). It copies the file to `/tmp/ca.pem` and uses that path as `KAFKA_CA_PEM_SPARK` for the JVM to read:

```python
KAFKA_CA_PEM_SPARK = '/tmp/ca.pem'
```

- If `KAFKA_CA_PEM_PATH` is missing, the notebook raises a `FileNotFoundError` and provides instructions to download and upload the certificate from the Aiven Dashboard.

Security note: the current notebook includes credentials assigned to variables directly in the Step 1 cell. For production use, replace hard-coded secrets with a secure secrets manager (Databricks Secrets, environment variables, or credential passthrough).

---

## Run Order (cells / logical steps)

The notebook is structured as numbered steps. Run each step and its corresponding debug checks before proceeding to the next step:

1. Step 0 — Install Python dependency `neo4j` (cell uses `%pip install neo4j`).
2. Step 1 — Set credentials and configuration variables (Kafka, Neo4j, Snowflake). Run Debug 1 to confirm masked values.
3. Step 2 — Verify `ca.pem` exists and copy it to `/tmp/ca.pem`. Run Debug 2 to inspect the certificate.
4. Step 3 — Define Neo4j driver and helpers (`get_neo4j_driver`, `check_interactions`) and run Debug 3a/3b/3c to test connectivity and example lookups.
5. Step 4 — Test Snowflake connection and verify expected staging schema (`STAGING.STG_TRANSACTION`) via Debug 4a/4b.
6. Step 5 — Define the Kafka Structured Streaming reader (`kafka_stream_df`) and run Debug 5a/5b (batch reads) to confirm connectivity and message availability.
7. Step 6 — Define JSON schema `prescription_schema` and parse the stream (`parsed_df`). Run Debug 6a/6b to confirm parsed fields and parse real messages.
8. Step 7 — Define `process_batch(batch_df, batch_id)`: foreachBatch function that performs Neo4j enrichment and writes to Snowflake. Run Debug 7 for a dry-run (reads a small batch and writes to Snowflake with `BATCH_ID` markers).
9. Step 8 — Start the live streaming query with `parsed_df.writeStream.foreachBatch(process_batch)...start()`. The notebook sets `CHECKPOINT_PATH = 'dbfs:/tmp/pharma_pipeline/checkpoints/kafka_to_snowflake'`.
10. Step 9 — Use debug cells (8a–8d) to monitor the stream and stop the query when desired (`query.stop()`).

Always ensure each debug cell succeeds before proceeding to later steps.

---

## Inputs and Outputs (formats & locations)

Inputs

- Kafka messages: the notebook expects JSON messages on topic `KAFKA_TOPIC` (default in code: `DataDose.in`). The `prescription_schema` defined in Step 6 expects fields:

```text
transaction_id (Long)
patient_id (Integer)
pharmacy_id (String)
pharmacy_city (String)
new_drug (String)
new_drug_dose (String)
new_drug_form (String)
current_drugs (Array[String])
patient_age (Integer)
patient_gender (String)
timestamp (String)
```

- Neo4j graph: the notebook queries a Neo4j instance for `Drug` nodes and `INTERACTS_WITH` relationships. It expects drug names and ingredients to be present in the graph.

Configuration inputs (files/paths):

```text
KAFKA_CA_PEM_PATH  # workspace path to CA PEM for Aiven Kafka
/tmp/ca.pem         # copied path used by Spark JVM
```

Outputs

- Snowflake table: writes enriched rows into `STAGING.STG_TRANSACTION` (append mode). The notebook constructs a row dictionary (uppercase column names) including `BATCH_ID`, `TX_ID`, `DRUG`, `INTERACTION_FOUND`, `INTERACTION_SEVERITY`, `DRUG_RISK_SCORE`, `PATIENT_RISK_SCORE`, `RAW_RECORD`, etc.
- Streaming checkpoint: `dbfs:/tmp/pharma_pipeline/checkpoints/kafka_to_snowflake` (configured in Step 8). Use a persistent checkpoint path to support recovery.

Example checkpoint variable:

```python
CHECKPOINT_PATH = 'dbfs:/tmp/pharma_pipeline/checkpoints/kafka_to_snowflake'
```

---

## Known limitations and manual steps

- Credentials are hard-coded in the notebook. Replace with Databricks Secrets or environment-based secret management before production use.
- The notebook requires cluster-level Spark JARs for Kafka and Snowflake connectors. If those are missing, Kafka or Snowflake reads/writes will fail with JVM errors.
- The Kafka CA certificate must be placed in the Databricks Workspace and the `KAFKA_CA_PEM_PATH` variable must point to it. The notebook copies it to `/tmp/ca.pem` for JVM access; this copy step is required.
- The notebook assumes a Neo4j graph schema containing `Drug` and `Ingredient` nodes and `INTERACTS_WITH` relationships. If the graph schema differs or lacks nodes, `check_interactions` will return no interactions.
- The `process_batch` function collects micro-batch rows to the driver (`batch_df.collect()`), which may not scale for very large micro-batches. For high throughput use, consider refactoring to a distributed approach (avoid collecting full micro-batch to driver).
- The risk scoring and heuristics (severity weights, polypharmacy threshold, age multiplier) are implemented in the notebook as fixed rules; review and adjust to match domain requirements.
- Several debug/test cells read a small sample or limit results (e.g., `.limit(5)`) — these limits are for testing and should be adjusted before full production runs.
- Message schema validation is performed via `from_json` with a `prescription_schema`. Messages that do not match the schema may produce null fields; the debug cells check for nulls in key fields and report warnings.
- The notebook uses `foreachBatch(process_batch)` and an append write into Snowflake; ensure the Snowflake role and warehouse in `sf_options` have permissions to write into `STAGING.STG_TRANSACTION`.

---

