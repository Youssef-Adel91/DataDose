"""databricks_processing - job payload for ONE AvailableNow run.
Runs as a notebook_task (the notebook's cells share Python state across
Steps 0-9, so it must execute as one whole notebook, not separate scripts).
No cluster specified by default -> Databricks uses serverless job compute,
which this notebook already targets (see its own Step 2/Step 8 comments)."""
from airflow.models import Variable


def build_databricks_run_spec() -> dict:
    notebook_path = Variable.get("databricks_notebook_path")
    existing_cluster_id = Variable.get("databricks_existing_cluster_id", default_var=None)

    spec = {
        "run_name": "datadose-pipeline-availablenow-run",
        "notebook_task": {"notebook_path": notebook_path},
        "timeout_seconds": 600,
    }
    if existing_cluster_id:
        spec["existing_cluster_id"] = existing_cluster_id

    return spec
