# DataDose — Airflow Verification Guide

## Layer 1 — Connections exist and each check script works standalone

```bash
docker compose -f docker-compose.airflow.yaml exec airflow-worker bash
cd /opt/airflow/src/airflow_checks
python3 -c "from verify_connections import verify_connections; verify_connections()"
python3 -c "from verify_certificate import verify_certificate; verify_certificate()"
python3 -c "from verify_kafka_broker import verify_kafka_broker; verify_kafka_broker()"
python3 -c "from verify_kafka_producer_activity import verify_kafka_producer_activity; verify_kafka_producer_activity()"
python3 -c "from verify_snowflake import verify_snowflake; verify_snowflake()"
python3 -c "from verify_neo4j import verify_neo4j; verify_neo4j()"
```
All six clean before moving on. `verify_kafka_producer_activity` requires
the `producer-simulator` container to actually be running and sending —
check `docker compose -f docker-compose.airflow.yaml logs producer-simulator`
if this one fails.

## Layer 2 — Producer simulator is genuinely alive

```bash
docker compose -f docker-compose.airflow.yaml logs -f producer-simulator
```
You should see prescription rows streaming in the log continuously. If it
exited, check for a missing `data/output_FINAL.csv` or bad Kafka creds in
`.env` — this container's failure mode is visible directly in its logs
since it's not hidden behind an Airflow task.

## Layer 3 — Dimensional model promotion, tested against real staging data

Before trusting the DAG's `snowflake_transformation` group, run the
promotion SQL by hand in Snowsight against a few real staging rows, and
confirm:
- new pharmacies/drugs actually appear in `DIM_PHARMACY`/`DIM_DRUG`
- fact rows appear in `FACT_PRESCRIPTION_TRANSACTION` with correctly resolved surrogate keys (no NULLs where a join should have matched)
- re-running the same SQL again doesn't create duplicates (the `NOT EXISTS` guards should prevent this — confirm row counts don't change on a second run with no new staging data)

## Layer 4 — One manual DAG run

Trigger `datadose_pipeline` manually. Expected per group:

| Group | Expected |
|---|---|
| `kafka_orchestration` | All 4 tasks green within ~30s |
| `databricks_processing` | `verify_snowflake`/`verify_neo4j` green fast, `run_databricks_notebook` takes as long as the notebook actually takes — cross-check the same run in the Databricks Jobs UI |
| `snowflake_transformation` | `load_dimensional_model` green, check Snowflake row counts increased |
| `snowflake_validation` | Green if freshness + null rates are within threshold |
| `notify_success` | Message in `#datadose-alerts` |

## Layer 5 — Let the schedule run unattended

Unpause, wait 3-4 scheduled runs (6-8 min at the default 2-minute cadence).
Confirm via `sql/validation_queries.sql` query #4 that `unpromoted_rows`
isn't growing unboundedly — if it keeps climbing, promotion is falling
behind ingestion and needs a tighter schedule or a faster promotion query.

## Layer 6 — Break things on purpose

- **Stop `producer-simulator`** (`docker compose stop producer-simulator`) → `verify_kafka_producer_activity` should fail with a specific staleness message within one scheduled run.
- **Delete the `snowflake_default` Connection** → `verify_connections` should fail immediately, before any Snowflake call is attempted.
- **Manually set some `STG_TRANSACTION.DRUG` values to NULL** for recent rows → `data_quality_checks` should fail with the specific null-rate message, not a generic error.

Restart the producer / recreate the Connection / fix the data after each
test and confirm the DAG self-heals on the next scheduled run.

## Quick reference: is everything alive right now?

```sql
SELECT
  (SELECT COUNT(*) FROM STAGING.STG_TRANSACTION WHERE IS_PROCESSED = FALSE) AS pending_promotion,
  (SELECT MAX(LOAD_TIMESTAMP) FROM STAGING.STG_TRANSACTION) AS last_staging_write;
```
