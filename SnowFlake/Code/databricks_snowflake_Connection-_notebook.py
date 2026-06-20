# Azure Databricks to Snowflake connection notebook.
# Account: YTRRMJE-ZZ81345 | Database: PHARMA_ANALYTICS_DB
# Paste each cell into a separate Databricks notebook cell.

# Cell 1: install check. Run once, then restart the cluster.
# Verify the Snowflake JAR is installed on the cluster.
# If spark-snowflake is missing, install:
#   Type: Maven
#   Coordinates: net.snowflake:spark-snowflake_2.12:2.15.0-spark_3.4
# Also install:
#   net.snowflake:snowflake-jdbc:3.14.4
# Restart the cluster before running Cell 2.

# Cell 2: connection setup using Azure Key Vault secrets.
SNOWFLAKE_SOURCE = "net.snowflake.spark.snowflake"

sf_options = {
    "sfURL": "YTRRMJE-ZZ81345.snowflakecomputing.com",
    "sfUser": dbutils.secrets.get(scope="pharma-snowflake", key="snowflake-user"),
    "sfPassword": dbutils.secrets.get(scope="pharma-snowflake", key="snowflake-password"),
    "sfDatabase": "PHARMA_ANALYTICS_DB",
    "sfSchema": "STAGING",
    "sfWarehouse": "PHARMA_WH",
    "sfRole": "PYSPARK_ROLE",
}

print("Connection options ready.")
print(f"Connecting as: {sf_options['sfUser']}")
print(f"Target: {sf_options['sfURL']}")

# Cell 3: connectivity test.
connection_test_df = (
    spark.read
    .format(SNOWFLAKE_SOURCE)
    .options(**sf_options)
    .option(
        "query",
        """
        SELECT
            CURRENT_USER()      AS connected_user,
            CURRENT_ROLE()      AS active_role,
            CURRENT_DATABASE()  AS database,
            CURRENT_WAREHOUSE() AS warehouse,
            CURRENT_SCHEMA()    AS schema
        """,
    )
    .load()
)

connection_test_df.show()

# Expected output:
# connected_user | active_role | database | warehouse | schema

# Cell 4: read a full table from Snowflake.
# Read the DIM_DRUG dimension table.
drug_dimension_df = (
    spark.read
    .format(SNOWFLAKE_SOURCE)
    .options(**sf_options)
    .option("dbtable", "DIMENSIONS.DIM_DRUG")
    .load()
)

print(f"DIM_DRUG rows: {drug_dimension_df.count()}")
drug_dimension_df.printSchema()
drug_dimension_df.show(5, truncate=40)

# Cell 5: read a custom SQL query from Snowflake.
high_risk_interactions_df = (
    spark.read
    .format(SNOWFLAKE_SOURCE)
    .options(**sf_options)
    .option(
        "query",
        """
        SELECT
            TX_ID,
            DRUG_NAME_AS_DISPENSED,
            INTERACTION_SEVERITY,
            PATIENT_RISK_SCORE,
            DRUG_RISK_SCORE,
            POLYPHARMACY_FLAG,
            INTERACTION_COUNT
        FROM FACTS.FACT_PRESCRIPTION_TRANSACTION
        WHERE INTERACTION_FOUND = TRUE
          AND INTERACTION_SEVERITY IN ('Major', 'Moderate')
        ORDER BY PATIENT_RISK_SCORE DESC
        LIMIT 1000
        """,
    )
    .load()
)

print(f"High-risk interactions: {high_risk_interactions_df.count()}")
high_risk_interactions_df.show(10, truncate=50)

# Cell 6: append new raw records to the staging table.
# df_raw = your DataFrame with new raw drug metadata records
# Replace df_raw with your actual DataFrame variable name.

# Example: create a small test DataFrame first.
from pyspark.sql import Row

test_data = [Row(
    BATCH_ID="TEST_BATCH_001",
    SOURCE_SYSTEM="DATABRICKS_TEST",
    DOSAGE_FORM="Tablet",
    THERAPEUTIC_GROUP="antibiotic",
    ROUTE_OF_ADMINISTRATION="oral",
    INGREDIENT_COUNT="1",
    IS_COMBINATION="FALSE",
    COMBINATION_TYPE="Single",
    TRADE_NAME="Test Drug A",
    CANONICAL_INGREDIENT_NAME="test_ingredient",
    REFERENCE_BRAND_NAMES="Brand X",
    REFERENCE_GENERIC_NAMES="Generic Y",
    WARNINGS_COUNT="2",
    DRUG_INTERACTIONS_COUNT="3",
    ADVERSE_REACTIONS_COUNT="1",
    INDICATIONS_COUNT="2",
    FIRST_WARNING="Test warning text",
    FIRST_DRUG_INTERACTION="No interaction recorded",
    FIRST_ADVERSE_REACTION="Mild rash",
    FIRST_INDICATION="For treatment of test condition",
    IS_PROCESSED=False,
    RAW_RECORD=None,
)]

staging_write_df = spark.createDataFrame(test_data)

# Write to STG_DRUG_METADATA.
staging_write_df.write \
    .format(SNOWFLAKE_SOURCE) \
    .options(**sf_options) \
    .option("dbtable", "STAGING.STG_DRUG_METADATA") \
    .mode("append") \
    .save()

print("Write to STG_DRUG_METADATA complete.")

# Cell 7: write to a different schema by overriding sfSchema.
# To write to FACTS schema instead of STAGING.
sf_facts_options = {**sf_options, "sfSchema": "FACTS"}

# df_processed.write \
#     .format(SNOWFLAKE_SOURCE) \
#     .options(**sf_facts_options) \
#     .option("dbtable", "FACT_PRESCRIPTION_TRANSACTION") \
#     .mode("append") \
#     .save()

# To write to ANALYTICS schema.
sf_analytics_options = {**sf_options, "sfSchema": "ANALYTICS"}

# df_summary.write \
#     .format(SNOWFLAKE_SOURCE) \
#     .options(**sf_analytics_options) \
#     .option("dbtable", "PHARMACY_RISK_SUMMARY") \
#     .mode("append") \
#     .save()

# Cell 8: read the analytics views.
# Read the V_HIGH_RISK_PRESCRIPTIONS view.
high_risk_prescriptions_df = (
    spark.read
    .format(SNOWFLAKE_SOURCE)
    .options(**sf_analytics_options)
    .option("dbtable", "V_HIGH_RISK_PRESCRIPTIONS")
    .load()
)

print(f"High-risk prescriptions: {high_risk_prescriptions_df.count()}")
high_risk_prescriptions_df.show(10, truncate=50)

# Cell 9: run Snowflake SQL directly from Databricks using JDBC.
import snowflake.connector

# snowflake-connector-python must be installed on the cluster as a PyPI library.

conn = snowflake.connector.connect(
    user=dbutils.secrets.get(scope="pharma-snowflake", key="snowflake-user"),
    password=dbutils.secrets.get(scope="pharma-snowflake", key="snowflake-password"),
    account="YTRRMJE-ZZ81345",
    warehouse="PHARMA_WH",
    database="PHARMA_ANALYTICS_DB",
    schema="STAGING",
    role="PYSPARK_ROLE",
)

cursor = conn.cursor()

# Example: mark processed records.
cursor.execute("""
    UPDATE STAGING.STG_DRUG_METADATA
    SET IS_PROCESSED = TRUE
    WHERE BATCH_ID = 'TEST_BATCH_001'
""")

print(f"Rows updated: {cursor.rowcount}")
cursor.close()
conn.close()

# Cell 10: error handling template.
def safe_snowflake_read(query, schema="STAGING"):
    """Safe read from Snowflake with error handling."""
    try:
        options = {**sf_options, "sfSchema": schema}
        result_df = (
            spark.read
            .format(SNOWFLAKE_SOURCE)
            .options(**options)
            .option("query", query)
            .load()
        )
        print(f"Read successful: {result_df.count()} rows")
        return result_df
    except Exception as e:
        error_msg = str(e)
        if "Net connect timed out" in error_msg:
            print("ERROR: Cannot reach Snowflake. Check sfURL is correct.")
            print(f"  URL used: {sf_options['sfURL']}")
        elif "Incorrect username or password" in error_msg:
            print("ERROR: Wrong credentials. Check Key Vault secrets.")
        elif "Insufficient privileges" in error_msg:
            print("ERROR: PYSPARK_ROLE missing a grant. Re-run the Snowflake SQL setup.")
        elif "ClassNotFoundException" in error_msg:
            print("ERROR: Snowflake JAR not loaded. Restart cluster after installing Maven library.")
        else:
            print(f"ERROR: {error_msg}")
        return None

# Test it.
result_df = safe_snowflake_read("SELECT COUNT(*) AS cnt FROM DIMENSIONS.DIM_DATE", schema="DIMENSIONS")
if result_df:
    result_df.show()
