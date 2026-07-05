# DataDose — Airflow Orchestration (Professional / Connections-based)

Orchestrates the full loop: confirms Kafka + the producer are healthy,
triggers one Databricks AvailableNow run and waits for it, promotes new
staging rows into the dimensional model, validates the result, notifies.

Read `ARCHITECTURE.md` first — it explains *why* each piece is designed
the way it is. Then `DEPLOYMENT_GUIDE.md` to set up, `VERIFICATION_GUIDE.md`
to prove it works.

## Structure
```
├── ARCHITECTURE.md              # design rationale — read this first
├── DEPLOYMENT_GUIDE.md
├── VERIFICATION_GUIDE.md
├── .env.example                 # Airflow's OWN secrets + producer creds only
├── requirements.txt
├── dags/
│   ├── datadose_pipeline.py     # the DAG: 4 task groups + notify
│   └── databricks_job_spec.py
├── src/
│   ├── airflow_checks/
│   │   ├── common.py            # ALL Connection/config access goes through here
│   │   ├── verify_connections.py
│   │   ├── verify_certificate.py
│   │   ├── verify_kafka_broker.py
│   │   ├── verify_kafka_producer_activity.py   # NEW
│   │   ├── verify_snowflake.py
│   │   ├── verify_neo4j.py
│   │   ├── load_dimensional_model.py            # NEW
│   │   ├── validate_snowflake_load.py
│   │   └── data_quality_checks.py
│   └── producer/
│       └── producer_simulator.py                # runs as its own Docker service now
├── sql/
│   ├── promote_dimensional_model.sql            # NEW
│   └── validation_queries.sql
├── docker/
│   ├── docker-compose.airflow.yaml
│   ├── Dockerfile.airflow
│   └── Dockerfile.producer                      # NEW
├── certs/                        # gitignored — ca.pem goes here
└── data/                         # gitignored — output_FINAL.csv goes here
```

## What changed from the previous version
- Credentials moved from Docker Compose env vars to encrypted Airflow Connections
- Producer simulator is now its own always-on Docker service, not something Airflow starts
- New `verify_kafka_producer_activity` task — actually checks the producer is alive, not just that the broker is reachable
- New `snowflake_transformation` task group — Airflow now promotes staging rows into the dimensional model, not just validates staging
