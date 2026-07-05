"""snowflake_validation group - confirm fresh rows landed and got promoted."""
from datetime import datetime, timedelta, timezone
import os

from common import get_snowflake_hook

FRESHNESS_MINUTES = int(os.getenv("FRESHNESS_MINUTES", "5"))


def validate_snowflake_load(**context) -> None:
    hook = get_snowflake_hook()

    total, interactions, high_risk, last_write = hook.get_first(
        """
        SELECT
            COUNT(*)                                                     AS TOTAL_RECORDS,
            SUM(CASE WHEN INTERACTION_FOUND = 'TRUE' THEN 1 ELSE 0 END) AS INTERACTIONS_DETECTED,
            SUM(CASE WHEN HIGH_RISK_PATIENT = 'TRUE' THEN 1 ELSE 0 END) AS HIGH_RISK_PATIENTS,
            MAX(LOAD_TIMESTAMP)                                          AS LAST_WRITE
        FROM STAGING.STG_TRANSACTION
        """
    )
    print(f"TOTAL_RECORDS={total}  INTERACTIONS={interactions}  HIGH_RISK={high_risk}  LAST_WRITE={last_write}")

    if last_write is None:
        raise RuntimeError("No rows in STG_TRANSACTION yet - has the pipeline ever run successfully?")

    age = datetime.now(timezone.utc) - last_write.replace(tzinfo=timezone.utc)
    if age > timedelta(minutes=FRESHNESS_MINUTES):
        raise RuntimeError(
            f"Last write was {age} ago, exceeds freshness threshold of {FRESHNESS_MINUTES} minutes."
        )
    print(f"Freshness OK - last write {age} ago (threshold {FRESHNESS_MINUTES}m).")
