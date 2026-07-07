-- =============================================================================
-- SNOWFLAKE → AZURE DATABRICKS CONNECTION SETUP
-- Account: YTRRMJE-ZZ81345  |  Database: PHARMA_ANALYTICS_DB
-- Version: 3.0  |  Real user DATADOSE01 applied throughout
-- =============================================================================


-- =============================================================================
-- STEP 1: Switch to ACCOUNTADMIN role
-- =============================================================================

USE ROLE ACCOUNTADMIN;


-- =============================================================================
-- STEP 2: Create the dedicated PySpark role
-- =============================================================================

CREATE ROLE IF NOT EXISTS PYSPARK_ROLE;


-- =============================================================================
-- STEP 3: Grant database and schema access
-- =============================================================================

GRANT USAGE ON DATABASE PHARMA_ANALYTICS_DB TO ROLE PYSPARK_ROLE;
GRANT USAGE ON ALL SCHEMAS IN DATABASE PHARMA_ANALYTICS_DB TO ROLE PYSPARK_ROLE;

-- Cover any NEW schemas created after this script runs
GRANT USAGE ON FUTURE SCHEMAS IN DATABASE PHARMA_ANALYTICS_DB TO ROLE PYSPARK_ROLE;


-- =============================================================================
-- STEP 4: Grant table access — database level
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN DATABASE PHARMA_ANALYTICS_DB TO ROLE PYSPARK_ROLE;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON FUTURE TABLES IN DATABASE PHARMA_ANALYTICS_DB TO ROLE PYSPARK_ROLE;


-- =============================================================================
-- STEP 5: Per-schema future table grants
-- =============================================================================

-- STAGING schema
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL    TABLES IN SCHEMA PHARMA_ANALYTICS_DB.STAGING TO ROLE PYSPARK_ROLE;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON FUTURE TABLES IN SCHEMA PHARMA_ANALYTICS_DB.STAGING TO ROLE PYSPARK_ROLE;

-- DIMENSIONS schema
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL    TABLES IN SCHEMA PHARMA_ANALYTICS_DB.DIMENSIONS TO ROLE PYSPARK_ROLE;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON FUTURE TABLES IN SCHEMA PHARMA_ANALYTICS_DB.DIMENSIONS TO ROLE PYSPARK_ROLE;

-- FACTS schema
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL    TABLES IN SCHEMA PHARMA_ANALYTICS_DB.FACTS TO ROLE PYSPARK_ROLE;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON FUTURE TABLES IN SCHEMA PHARMA_ANALYTICS_DB.FACTS TO ROLE PYSPARK_ROLE;

-- ANALYTICS schema
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL    TABLES IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS TO ROLE PYSPARK_ROLE;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON FUTURE TABLES IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS TO ROLE PYSPARK_ROLE;


-- =============================================================================
-- STEP 6: Grant VIEW access
-- =============================================================================

GRANT SELECT ON ALL VIEWS IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS TO ROLE PYSPARK_ROLE;
GRANT SELECT ON FUTURE VIEWS IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS TO ROLE PYSPARK_ROLE;


-- =============================================================================
-- STEP 7: Grant warehouse compute usage
-- =============================================================================

GRANT USAGE ON WAREHOUSE PHARMA_WH TO ROLE PYSPARK_ROLE;


-- =============================================================================
-- STEP 8: Create the PySpark service user + grant role to DATADOSE01
-- NOTE: Change the password after running and store it in Azure Key Vault
--       Never commit this file to git with the real password
-- =============================================================================

CREATE USER IF NOT EXISTS PYSPARK_SVC
    PASSWORD             = 'PharmaAzure2024!'
    DEFAULT_ROLE         = PYSPARK_ROLE
    DEFAULT_WAREHOUSE    = PHARMA_WH
    DEFAULT_NAMESPACE    = PHARMA_ANALYTICS_DB.STAGING
    MUST_CHANGE_PASSWORD = FALSE;

-- Grant role to the service user
GRANT ROLE PYSPARK_ROLE TO USER PYSPARK_SVC;

-- Grant role to the real admin user so they can USE ROLE PYSPARK_ROLE
GRANT ROLE PYSPARK_ROLE TO USER DATADOSE01;


-- =============================================================================
-- STEP 9: Verify
-- =============================================================================

-- Confirm PYSPARK_ROLE is granted to both users
SHOW GRANTS TO USER PYSPARK_SVC;
SHOW GRANTS TO USER DATADOSE01;

-- Confirm all privileges on the role
SHOW GRANTS TO ROLE PYSPARK_ROLE;

-- Switch to PYSPARK_ROLE as DATADOSE01 and smoke test
USE ROLE PYSPARK_ROLE;
USE WAREHOUSE PHARMA_WH;
SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_DATABASE(), CURRENT_WAREHOUSE();
-- Expected: DATADOSE01 | PYSPARK_ROLE | PHARMA_ANALYTICS_DB | PHARMA_WH

-- Switch back to admin
USE ROLE ACCOUNTADMIN;