"""databricks_processing pre-check - Snowflake reachable, staging table
exists, using the Snowflake provider's Hook (reads the snowflake_default
Connection — no credentials handled in this file at all)."""
from common import get_snowflake_hook


def verify_snowflake(**context) -> None:
    hook = get_snowflake_hook()

    identity = hook.get_first(
        "SELECT CURRENT_USER(), CURRENT_DATABASE(), CURRENT_WAREHOUSE(), CURRENT_ROLE()"
    )
    user, database, warehouse, role = identity
    print(f"Snowflake OK - user={user} db={database} warehouse={warehouse} role={role}")

    exists = hook.get_first(
        """
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'STAGING' AND TABLE_NAME = 'STG_TRANSACTION'
        """
    )[0]
    if not exists:
        raise RuntimeError("STAGING.STG_TRANSACTION does not exist - run the Snowflake DDL first.")
    print("STAGING.STG_TRANSACTION table confirmed present.")
