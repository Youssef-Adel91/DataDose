# DataDose — Airflow Architecture, Explained

## The rule that decides what goes in Airflow and what doesn't

An Airflow task should have a beginning and an end. If a piece of work runs
forever, it isn't a task — it's a service, and it belongs in Docker Compose
with its own restart policy, with Airflow only checking on it periodically.

Applying that rule to each piece of your platform:

| Component | Runs forever? | Where it lives |
|---|---|---|
| Kafka broker | Yes (Aiven-managed) | External — Airflow only checks connectivity |
| Producer simulator | Yes (`while True`) | Docker Compose service, `restart: always` — Airflow only checks it's producing |
| Databricks notebook run | No — `availableNow=True` drains and exits | One Airflow task, triggered on a schedule |
| Snowflake staging → dimensional model promotion | No — a SQL statement that finishes | One Airflow task |
| Snowflake data-quality checks | No | One Airflow task |

## Why Airflow Connections instead of `.env` variables for pipeline secrets

Docker Compose `environment:` values are plaintext in the container's
process environment — readable by `docker inspect`, visible in `/proc`,
and easy to accidentally leak into logs. Airflow Connections are:
- encrypted at rest in Airflow's metadata database using the Fernet key
- only decrypted in-memory at the moment a task actually uses them
- swappable later for a real secrets backend (Airflow supports Azure Key
  Vault natively — the same Key Vault your Setup Guide already uses for
  Databricks) with zero DAG code changes

So in this version: `.env` only holds *Airflow's own* bootstrap secrets
(Fernet key, webserver secret, admin password, Postgres password) —
nothing about Kafka, Snowflake, Neo4j, or Databricks. Those are created as
Airflow Connections after the stack starts (see `DEPLOYMENT_GUIDE.md`),
and every task reads them through a Connection, not `os.getenv()`.

The one exception: `ca.pem`. TLS truststores are files, not strings — they
don't fit into a Connection's login/password/extra shape well, so it stays
a mounted file (read-only, gitignored), same as before.

## The DAG's task groups, and why each boundary is where it is

```
kafka_orchestration          -- is the broker up, is the producer actually producing
        |
databricks_processing        -- trigger the ONE notebook job, wait for it to finish
        |
snowflake_transformation     -- promote staging rows into DIM_*/FACT_* tables
        |
snowflake_validation         -- freshness + data-quality checks on the result
        |
notify
```

Each group is a unit that either fully succeeds or fully fails together,
and each group's failure means something specific and actionable:
- `kafka_orchestration` fails → no point calling Databricks, there's nothing new to process
- `databricks_processing` fails → the run itself broke; staging never got new rows
- `snowflake_transformation` fails → staging has rows, but they're not promoted yet — safe to retry, nothing lost
- `snowflake_validation` fails → data landed but looks wrong — investigate before trusting dashboards

## What didn't change

The Databricks notebook stays exactly as one job (`notebook_task`, not
split into pieces) — that decision from before still holds and is the
right call given the shared-state design of your cells.
