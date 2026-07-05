"""snowflake_validation group - null-rate and referential integrity checks."""
import os

from common import get_snowflake_hook

MAX_NULL_RATE = float(os.getenv("DQ_MAX_NULL_RATE", "0.02"))


def data_quality_checks(**context) -> None:
    hook = get_snowflake_hook()
    failures = []

    drug_null_rate, tx_id_null_rate = hook.get_first(
        """
        SELECT
            AVG(CASE WHEN DRUG IS NULL OR DRUG = '' THEN 1.0 ELSE 0.0 END) AS drug_null_rate,
            AVG(CASE WHEN TX_ID IS NULL THEN 1.0 ELSE 0.0 END)             AS tx_id_null_rate
        FROM STAGING.STG_TRANSACTION
        WHERE LOAD_TIMESTAMP >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
        """
    )
    if drug_null_rate and drug_null_rate > MAX_NULL_RATE:
        failures.append(f"DRUG null rate {drug_null_rate:.4f} exceeds {MAX_NULL_RATE}")
    if tx_id_null_rate and tx_id_null_rate > MAX_NULL_RATE:
        failures.append(f"TX_ID null rate {tx_id_null_rate:.4f} exceeds {MAX_NULL_RATE}")

    fact_table_exists = hook.get_first(
        """
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'FACTS' AND TABLE_NAME = 'FACT_PRESCRIPTION_TRANSACTION'
        """
    )[0]

    if fact_table_exists:
        (orphan_fact_rows,) = hook.get_first(
            """
            SELECT COUNT(*)
            FROM   FACTS.FACT_PRESCRIPTION_TRANSACTION f
            LEFT JOIN DIMENSIONS.DIM_DRUG d ON f.DRUG_SK = d.DRUG_SK
            WHERE  d.DRUG_SK IS NULL
            """
        )
        if orphan_fact_rows and orphan_fact_rows > 0:
            failures.append(f"{orphan_fact_rows} FACT rows have no matching DIM_DRUG.")
    else:
        print("FACTS.FACT_PRESCRIPTION_TRANSACTION not deployed yet - skipping FACT/DIM checks.")

    if failures:
        raise RuntimeError("Data quality checks failed:\n- " + "\n- ".join(failures))
    print("All data quality checks passed.")
