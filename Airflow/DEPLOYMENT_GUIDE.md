# DataDose — Airflow Deployment Guide (Connections-based)

## 1. Layout
Keep this project's `docker/`, `dags/`, `src/`, `sql/`, `certs/`, `data/`
folders together, at whatever path makes sense next to your existing
`datadose-backend`/`datadose-frontend` setup — the compose file uses
relative paths (`../dags`, `../src`, etc.) assuming
`docker/docker-compose.airflow.yaml` sits one level under this project
root, so keep that relative structure intact.

## 2. Files you need to provide
```bash
cp .env.example .env
mkdir -p certs data
cp /path/to/ca.pem certs/ca.pem
chmod 600 certs/ca.pem
cp /path/to/output_FINAL.csv data/output_FINAL.csv
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"   # -> AIRFLOW__CORE__FERNET_KEY
python3 -c "import secrets; print(secrets.token_hex(16))"                                      # -> AIRFLOW__WEBSERVER__SECRET_KEY
```
Fill in `.env`'s producer-simulator Kafka credentials (these are the ONLY
pipeline secrets that live in `.env` — see `ARCHITECTURE.md` for why
everything else is an Airflow Connection instead).

## 3. Bring up the stack
```bash
cd docker
docker compose -f docker-compose.airflow.yaml up airflow-init
docker compose -f docker-compose.airflow.yaml up -d
docker compose -f docker-compose.airflow.yaml ps
```
Confirm no collisions with your existing containers:
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```
You should see `datadose-airflow-*` containers plus `producer-simulator`
on their own `datadose-airflow-net` network, alongside your existing
`datadose-backend`/`datadose-frontend`/`postgres`, with no shared ports.

Open http://localhost:8081 and log in with your admin credentials.

## 4. Create the Airflow Connections (this is the important part)
Run each of these — they store credentials encrypted in Airflow's metadata
DB, not as plaintext env vars:

```bash
COMPOSE="docker compose -f docker-compose.airflow.yaml exec airflow-webserver"

# Snowflake
$COMPOSE airflow connections add snowflake_default \
  --conn-type snowflake \
  --conn-login "<SNOWFLAKE_USER>" \
  --conn-password "<SNOWFLAKE_PASSWORD>" \
  --conn-extra '{"account": "<account>", "warehouse": "PHARMA_WH", "database": "PHARMA_ANALYTICS_DB", "role": "PYSPARK_ROLE"}'

# Neo4j (generic connection type: host=URI, login=user, password=password)
$COMPOSE airflow connections add neo4j_default \
  --conn-type generic \
  --conn-host "neo4j+s://<instance-id>.databases.neo4j.io" \
  --conn-login "<NEO4J_USER>" \
  --conn-password "<NEO4J_PASSWORD>"

# Kafka (generic connection type: host=bootstrap servers, extra=topic/mechanism)
$COMPOSE airflow connections add kafka_default \
  --conn-type generic \
  --conn-host "datadosekafka-901-datadosedepiproject001.l.aivencloud.com:15807" \
  --conn-login "<KAFKA_USERNAME>" \
  --conn-password "<KAFKA_PASSWORD>" \
  --conn-extra '{"topic": "DataDose.in", "sasl_mechanism": "SCRAM-SHA-256"}'

# Databricks
$COMPOSE airflow connections add databricks_default \
  --conn-type databricks \
  --conn-host "<https://your-workspace.azuredatabricks.net>" \
  --conn-password "<DATABRICKS_TOKEN>"

# Slack (optional — skip if you don't have a webhook yet)
$COMPOSE airflow connections add slack_default \
  --conn-type slackwebhook \
  --conn-password "<your-slack-webhook-url>"
```

And two Airflow Variables:
```bash
$COMPOSE airflow variables set databricks_notebook_path "/Workspace/Users/<you>/Drafts/DataDose_pipeline_v3"
# Only set this one if you're using an existing all-purpose cluster instead of serverless:
$COMPOSE airflow variables set databricks_existing_cluster_id "<cluster-id>"
```

Verify everything landed:
```bash
$COMPOSE airflow connections list
$COMPOSE airflow variables list
```

## 5. Confirm the DAG loads
```bash
docker compose -f docker-compose.airflow.yaml logs airflow-scheduler | grep -i datadose
```
Should appear in the UI's DAG list within ~30 seconds.

## 6. Deploy the promotion SQL to match your real schema
Open `sql/promote_dimensional_model.sql` and check every column name
against your actual `DataDoseSchema_v3.sql` (this file is a documented
template — see the warning at its top). Adjust before running against
real data.

## 7. Test manually before trusting the schedule
Trigger `datadose_pipeline` once from the UI. Watch task groups in order:
`kafka_orchestration` → `databricks_processing` → `snowflake_transformation`
→ `snowflake_validation` → `notify_success`.

## 8. Turn on the schedule
Unpause the DAG — it now runs every 2 minutes, `max_active_runs=1` so
promotion SQL never runs twice concurrently against the same rows.

See `VERIFICATION_GUIDE.md` for proving all of this actually works, not
just that it's deployed.
