# Snowflake Schema & Databricks-Snowflake Integration

This folder contains Snowflake schema DDL and a Databricks notebook helper for connecting Databricks to Snowflake. The artifacts define the database schema used by the DataDose analytics pipelines and provide example code for reading and writing Snowflake tables from Databricks.

---

**Table of Contents**

- Overview
- Files
- Run order and dependencies
- External dependencies and credentials
- Inputs and outputs (formats & locations)
- Known limitations and manual steps

---

## Overview

The `SnowFlake/Code` directory provides:

- A fully specified Snowflake schema for the DataDose pharmaceutical analytics platform, including staging, dimension, fact, and analytics tables (`DataDoseSchema.sql`).
- A Databricks Python notebook (`databricks_snowflake_Connection_notebook.py`) that demonstrates how to configure Snowflake connection options using Databricks secrets, test connectivity, read and write tables, and run JDBC operations via the Snowflake Python connector.

The schema defines staging tables (`STG_DRUG_METADATA`, `STG_TRANSACTION`), normalized dimension tables (`DIM_DRUG`, `DIM_INGREDIENT`, `DIM_PHARMACY`, `DIM_PATIENT`, `DIM_DATE`, etc.), fact table `FACT_PRESCRIPTION_TRANSACTION`, and several analytics and export tables/views.

---

## Files

| File | Purpose | Input | Output |
|---|---|---:|---|
| `databricks_snowflake_Connection_notebook.py` | Databricks notebook cells (Python) to configure Snowflake connector options (using Databricks `dbutils.secrets`), test connectivity, read sample tables, write staging rows, and run direct Snowflake SQL via `snowflake.connector`. Intended to be pasted into Databricks notebook cells. | Requires Databricks `dbutils` and a Spark session. Reads secrets from Databricks Secret scope `pharma-snowflake` (keys: `snowflake-user`, `snowflake-password`). | Demonstration DataFrames read from Snowflake (e.g., `DIMENSIONS.DIM_DRUG`, view queries) and writes to `STAGING.STG_DRUG_METADATA` using Spark `DataFrame.write.format('net.snowflake.spark.snowflake')`. Also executes example JDBC updates via `snowflake.connector`. |
| `DataDoseSchema.sql` | Snowflake DDL that creates the database `PHARMA_ANALYTICS_DB`, schemas (`STAGING`, `DIMENSIONS`, `FACTS`, `ANALYTICS`), staging tables, dimension tables, fact table, analytics tables, views, and helper SQL. Includes population script for `DIM_DATE` and verification queries. | None (DDL script). | Snowflake database objects: tables, views, warehouse, and populated `DIM_DATE`. Intended to be executed in Snowsight or via Snowflake client. |
| `snowflake_databricks_setup.sql` | (Open the file to confirm content) | | |

---

## Run order and dependencies

1. Run `DataDoseSchema.sql` in Snowsight or a Snowflake client to create the database, warehouse, schemas, and tables. Recommended order inside the script (already arranged):
   - Block 0: Create warehouse `PHARMA_WH` and `USE WAREHOUSE`.
   - Block 1: Create database and schemas.
   - Block 2: Create staging tables.
   - Block 3: Create dimension tables (run `DIM_DATE` population immediately after creating `DIM_DATE`).
   - Block 4: Create fact tables (requires dimensions to exist).
   - Block 5: Create analytics tables and views.
   - Block 9: Run verification queries to confirm table creation.

2. In Databricks, install required Snowflake connector JARs on the cluster (see `databricks_snowflake_Connection_notebook.py` Cell 1), then paste the notebook cells and run them in order to validate connections and read/write data.

Notes:
- `databricks_snowflake_Connection_notebook.py` expects that the Snowflake schema and required roles/privileges have been provisioned; if `sf_options` point to an account/schema that does not yet contain the tables, some read operations will fail.

---

## External dependencies and credentials

- Snowflake connector JARs required on Databricks cluster:

```text
net.snowflake:spark-snowflake_2.12:2.15.0-spark_3.4
net.snowflake:snowflake-jdbc:3.14.4
```

- Python package (Databricks cluster / notebook):

```text
snowflake-connector-python  # install via cluster library (PyPI) if using direct JDBC calls
```

- Databricks secrets: the notebook reads Snowflake credentials from Databricks Secret scope `pharma-snowflake`:

```python
dbutils.secrets.get(scope="pharma-snowflake", key="snowflake-user")
dbutils.secrets.get(scope="pharma-snowflake", key="snowflake-password")
```

- Snowflake privileges and roles: the `sf_options` expect a user and role (`PYSPARK_ROLE`) with privileges to read/write the `PHARMA_ANALYTICS_DB` schemas (especially `STAGING` write permissions for ETL). The SQL setup script contains DDL that may require ACCOUNTADMIN or SYSADMIN privileges to create warehouses and databases.

---

## Inputs and outputs (formats & locations)

- The artifacts are SQL and Databricks notebook cells; inputs and outputs are Snowflake tables accessed via the Spark Snowflake connector.

Key database objects created by `DataDoseSchema.sql`:

- Staging tables (written by ETL pipelines):
  - `STAGING.STG_DRUG_METADATA` (variant `RAW_RECORD` column for JSON lineage)
  - `STAGING.STG_TRANSACTION`

- Dimension tables:
  - `DIMENSIONS.DIM_DATE` (populated by the script)
  - `DIMENSIONS.DIM_DRUG`, `DIMENSIONS.DIM_INGREDIENT`, `DIMENSIONS.DIM_PHARMACY`, `DIMENSIONS.DIM_PATIENT`, `DIMENSIONS.DIM_DRUG_INGREDIENT`

- Fact table:
  - `FACTS.FACT_PRESCRIPTION_TRANSACTION`

- Analytics tables and views (examples):
  - `ANALYTICS.DRUG_INTERACTION_SUMMARY`, `ANALYTICS.PHARMACY_RISK_SUMMARY`, `ANALYTICS.PATIENT_RISK_PROFILE`, `ANALYTICS.V_HIGH_RISK_PRESCRIPTIONS`, etc.

Databricks notebook read/write examples:

- Reading a table via Spark Snowflake connector:

```python
df = spark.read.format('net.snowflake.spark.snowflake').options(**sf_options).option('dbtable','DIMENSIONS.DIM_DRUG').load()
```

- Writing a Spark DataFrame to Snowflake staging table `STAGING.STG_DRUG_METADATA`:

```python
df_test_write.write.format('net.snowflake.spark.snowflake').options(**sf_options).option('dbtable','STAGING.STG_DRUG_METADATA').mode('append').save()
```

- Direct JDBC via `snowflake.connector` for DDL/updates (requires `snowflake-connector-python` installed): executes SQL updates with a regular connector session.

---

## Known limitations and manual steps

- `DataDoseSchema.sql` includes DDL that requires elevated privileges to run (CREATE WAREHOUSE, CREATE DATABASE). Run blocks in order and use an account with the necessary rights.
- The script populates `DIM_DATE` for 2020–2030; adjust date ranges if your dataset requires wider coverage.
- The `databricks_snowflake_Connection_notebook.py` file shows using `dbutils.secrets` for credentials. You must create the secret scope `pharma-snowflake` and store `snowflake-user` and `snowflake-password` before running the notebook cells.
- Cluster libraries: the Spark Snowflake connector and JDBC JAR must be installed on the Databricks cluster and the cluster restarted before running the connectivity test cell.
- The sample write in Cell 6 uses `Row` and simple test data and writes to `STAGING.STG_DRUG_METADATA`. In production, use DataFrames produced by ETL jobs and ensure column names match the staging table schema (uppercase names expected in examples).
- Error handling: `safe_snowflake_read` helper in the notebook prints diagnostic messages for common errors (network, credentials, missing JAR). Use it to debug failed reads.
- Role/privilege gaps: if `PYSPARK_ROLE` lacks grants for schemas/tables, follow the DDL in `DataDoseSchema.sql` to create roles/grants or ask the Snowflake administrator to grant required privileges.

---

If you want, I can:

- Add a short migration checklist for running `DataDoseSchema.sql` safely (order of execution, required privileges),
- Replace the hard-coded account name in the notebook with a template and add a snippet to create the Databricks secret scope, or
- Generate a minimal `requirements.txt` and a Databricks cluster library list for the connectors used.

Which would you like next?