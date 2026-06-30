- =============================================================================
-- BLOCK 10: VERIFICATION QUERIES
-- Run these after all blocks above to confirm everything was created correctly
-- =============================================================================

-- 1. Check all schemas exist
SHOW SCHEMAS IN DATABASE PHARMA_ANALYTICS_DB;

-- 2. Check all tables per schema
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.STAGING;
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.DIMENSIONS;
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.FACTS;
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS;

-- 3. Check all views
SHOW VIEWS IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS;

-- 4. Verify DIM_DATE was populated correctly
SELECT
    COUNT(*)         AS total_rows,       -- Expected: 5844
    MIN(FULL_DATE)   AS first_date,       -- Expected: 2020-01-01
    MAX(FULL_DATE)   AS last_date,        -- Expected: 2035-12-31
    COUNT(CASE WHEN IS_WEEKEND = TRUE THEN 1 END) AS weekend_days  -- Expected: ~1669
FROM DIMENSIONS.DIM_DATE;

-- 5. Spot-check today's date row
SELECT DATE_SK, FULL_DATE, DAY_NAME, MONTH_NAME, QUARTER, YEAR, IS_WEEKEND, FISCAL_YEAR
FROM DIMENSIONS.DIM_DATE
WHERE FULL_DATE = CURRENT_DATE()
LIMIT 1;

-- 6. Verify EXPIRY_DATE default on DIM_DRUG is correct (TO_DATE, not string)
DESCRIBE TABLE DIMENSIONS.DIM_DRUG;

-- 7. Verify PYSPARK_ROLE grants are in place
SHOW GRANTS TO ROLE PYSPARK_ROLE;

-- 8. Smoke test connectivity as PYSPARK_ROLE
USE ROLE PYSPARK_ROLE;
USE WAREHOUSE PHARMA_WH;
SELECT CURRENT_USER()      AS user,
       CURRENT_ROLE()      AS role,
       CURRENT_DATABASE()  AS database,
       CURRENT_WAREHOUSE() AS warehouse;
-- Expected: DATADOSE01 | PYSPARK_ROLE | PHARMA_ANALYTICS_DB | PHARMA_WH

-- Switch back to admin
USE ROLE ACCOUNTADMIN;