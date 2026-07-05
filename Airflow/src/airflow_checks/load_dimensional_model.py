"""snowflake_transformation group - promote unprocessed STG_TRANSACTION
rows into the dimensional model (DIM_DRUG, DIM_PATIENT, DIM_PHARMACY,
FACT_PRESCRIPTION_TRANSACTION), then mark those staging rows IS_PROCESSED
= TRUE so the next run only picks up what's new.

IMPORTANT: the exact column names below follow the concepts documented in
DataDose_Dimensional_Model_Guide.docx (surrogate keys, SCD2 on DIM_DRUG via
IS_CURRENT/EXPIRY_DATE, DATE_SK from DIM_DATE, de-identified PATIENT_TOKEN)
but the guide describes DataDoseSchema_v3.sql in prose rather than listing
every column. Check this SQL against your actual DataDoseSchema_v3.sql
before relying on it in production — treat this as a correct-shaped
template to adjust column-for-column, not a guaranteed-exact match.
"""
from pathlib import Path

from common import get_snowflake_hook

SQL_FILE = Path("/opt/airflow/sql/promote_dimensional_model.sql")


def load_dimensional_model(**context) -> None:
    hook = get_snowflake_hook()
    sql_text = SQL_FILE.read_text()

    # Split on ';' to run each statement separately so a failure midway
    # gives you the specific statement number, not a wall of SQL.
    statements = [s.strip() for s in sql_text.split(";") if s.strip() and not s.strip().startswith("--")]

    for i, statement in enumerate(statements, start=1):
        print(f"Running promotion statement {i}/{len(statements)}...")
        hook.run(statement)

    promoted_count = hook.get_first(
        "SELECT COUNT(*) FROM STAGING.STG_TRANSACTION WHERE IS_PROCESSED = TRUE"
    )[0]
    print(f"Promotion complete. Total processed staging rows so far: {promoted_count}")
