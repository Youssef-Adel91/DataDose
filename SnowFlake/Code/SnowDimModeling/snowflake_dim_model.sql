/* ============================================================================
   PHARMA PRESCRIPTION PIPELINE — SNOWFLAKE DIMENSIONAL MODEL (v2 - lean)
   Source: STAGING.STG_TRANSACTION (populated directly by the PySpark
   process_batch() foreachBatch writer in the Databricks notebook)

   CHANGE FROM v1: DIM_PATIENT is REMOVED. It was reconstructed by parsing
   RAW_RECORD JSON, but patient_id/age/gender are never guaranteed to be
   populated there (many rows came back NULL) - PySpark's process_batch()
   never writes them as real columns. Every dim/fact column below is sourced
   directly from a STG_TRANSACTION column that process_batch() ALWAYS sets,
   so there are no structurally-null columns in this model.

   Data lands directly in real Snowflake tables (DW.DIM_* / DW.FACT_*) via
   the load procedure below - not just a view - so Power BI (Import or
   DirectQuery) sees populated physical tables immediately.
   ============================================================================
   Star schema:
     FACT_PRESCRIPTION_EVENT  (grain: one row per Kafka transaction)
       -> DIM_DRUG
       -> DIM_PHARMACY
       -> DIM_INTERACTION_SEVERITY
       -> DIM_DATE
   ============================================================================ */

USE DATABASE PHARMA_ANALYTICS_DB;
USE ROLE PYSPARK_ROLE;

CREATE SCHEMA IF NOT EXISTS DW;
USE SCHEMA DW;

/* ----------------------------------------------------------------------
   1. DIM_DATE — standard calendar dimension
   ---------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS DW.DIM_DATE (
    DATE_KEY        NUMBER(8)      PRIMARY KEY,   -- YYYYMMDD
    CALENDAR_DATE   DATE           NOT NULL,
    YEAR            NUMBER(4),
    QUARTER         NUMBER(1),
    MONTH           NUMBER(2),
    MONTH_NAME      VARCHAR(9),
    DAY             NUMBER(2),
    DAY_NAME        VARCHAR(9),
    WEEK_OF_YEAR    NUMBER(2),
    IS_WEEKEND      BOOLEAN
);

-- Populate ~5 years of dates (idempotent)
INSERT INTO DW.DIM_DATE
SELECT
    TO_NUMBER(TO_CHAR(d, 'YYYYMMDD'))                  AS DATE_KEY,
    d                                                    AS CALENDAR_DATE,
    YEAR(d)                                              AS YEAR,
    QUARTER(d)                                           AS QUARTER,
    MONTH(d)                                             AS MONTH,
    MONTHNAME(d)                                         AS MONTH_NAME,
    DAY(d)                                               AS DAY,
    DAYNAME(d)                                           AS DAY_NAME,
    WEEKOFYEAR(d)                                        AS WEEK_OF_YEAR,
    CASE WHEN DAYOFWEEK(d) IN (0,6) THEN TRUE ELSE FALSE END AS IS_WEEKEND
FROM (
    SELECT DATEADD(day, SEQ4(), '2023-01-01'::DATE) AS d
    FROM TABLE(GENERATOR(ROWCOUNT => 3650))
) x
WHERE NOT EXISTS (
    SELECT 1 FROM DW.DIM_DATE dd WHERE dd.CALENDAR_DATE = x.d
);

/* ----------------------------------------------------------------------
   2. DIM_DRUG
   ---------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS DW.DIM_DRUG (
    DRUG_KEY        NUMBER          IDENTITY START 1 INCREMENT 1 PRIMARY KEY,
    DRUG_NAME       VARCHAR(200)    NOT NULL,
    FIRST_SEEN_TS   TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (DRUG_NAME)
);

/* ----------------------------------------------------------------------
   3. DIM_PHARMACY
   ---------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS DW.DIM_PHARMACY (
    PHARMACY_KEY    NUMBER          IDENTITY START 1 INCREMENT 1 PRIMARY KEY,
    PHARMACY_ID     VARCHAR(100)    NOT NULL,
    CITY            VARCHAR(200),
    FIRST_SEEN_TS   TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    UNIQUE (PHARMACY_ID)
);

/* ----------------------------------------------------------------------
   4. DIM_INTERACTION_SEVERITY — small static lookup, seeded once
   ---------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS DW.DIM_INTERACTION_SEVERITY (
    SEVERITY_KEY    NUMBER          PRIMARY KEY,
    SEVERITY_NAME   VARCHAR(20)     NOT NULL UNIQUE,
    SEVERITY_RANK   NUMBER(1)       -- 1 = worst
);

MERGE INTO DW.DIM_INTERACTION_SEVERITY tgt
USING (
    SELECT * FROM VALUES
        (1, 'Major',    1),
        (2, 'Moderate', 2),
        (3, 'Minor',    3),
        (4, 'None',     4),
        (5, 'Unknown',  9)
) AS src (SEVERITY_KEY, SEVERITY_NAME, SEVERITY_RANK)
ON tgt.SEVERITY_KEY = src.SEVERITY_KEY
WHEN NOT MATCHED THEN
    INSERT (SEVERITY_KEY, SEVERITY_NAME, SEVERITY_RANK)
    VALUES (src.SEVERITY_KEY, src.SEVERITY_NAME, src.SEVERITY_RANK);

/* ----------------------------------------------------------------------
   5. FACT_PRESCRIPTION_EVENT
   ---------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS DW.FACT_PRESCRIPTION_EVENT (
    FACT_KEY                 NUMBER         IDENTITY START 1 INCREMENT 1 PRIMARY KEY,
    TX_ID                    VARCHAR(50)    NOT NULL,
    DATE_KEY                 NUMBER(8)      REFERENCES DW.DIM_DATE(DATE_KEY),
    DRUG_KEY                 NUMBER         REFERENCES DW.DIM_DRUG(DRUG_KEY),
    PHARMACY_KEY             NUMBER         REFERENCES DW.DIM_PHARMACY(PHARMACY_KEY),
    SEVERITY_KEY             NUMBER         REFERENCES DW.DIM_INTERACTION_SEVERITY(SEVERITY_KEY),
    SOURCE_SYSTEM            VARCHAR(50),
    BATCH_ID                 VARCHAR(100),
    IS_NEW_PRESCRIPTION      BOOLEAN,
    CURRENT_MEDS_COUNT       NUMBER,
    INTERACTION_FOUND        BOOLEAN,
    INTERACTION_COUNT        NUMBER,
    INTERACTING_DRUGS        VARCHAR(2000),
    INTERACTION_TYPE         VARCHAR(200),
    ACTIVE_INGREDIENT_MATCH  BOOLEAN,
    SHARED_INGREDIENT        VARCHAR(500),
    INGREDIENT_OVERLAP_COUNT NUMBER,
    POLYPHARMACY_FLAG        BOOLEAN,
    HIGH_RISK_PATIENT        BOOLEAN,
    DRUG_RISK_SCORE          FLOAT,
    PATIENT_RISK_SCORE       FLOAT,
    INTERACTION_RATE         FLOAT,
    LOAD_TIMESTAMP           TIMESTAMP_NTZ,
    DW_INSERT_TS             TIMESTAMP_NTZ  DEFAULT CURRENT_TIMESTAMP()
);

/* Helpful clustering for a fact table that will grow steadily by load date */
ALTER TABLE DW.FACT_PRESCRIPTION_EVENT CLUSTER BY (DATE_KEY);


/* ============================================================================
   6. ETL PROCEDURE — STAGING.STG_TRANSACTION  ->  DW star schema
      Uses STG_TRANSACTION.IS_PROCESSED = 'FALSE' as the incremental
      watermark (the PySpark writer always inserts new rows as FALSE).
   ============================================================================ */
CREATE OR REPLACE PROCEDURE DW.SP_LOAD_DIM_MODEL()
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN

    -- ---- 6a. Upsert DIM_DRUG ----
    MERGE INTO DW.DIM_DRUG tgt
    USING (
        SELECT DISTINCT DRUG AS DRUG_NAME
        FROM STAGING.STG_TRANSACTION
        WHERE IS_PROCESSED = 'FALSE' AND DRUG IS NOT NULL AND DRUG <> ''
    ) src
    ON tgt.DRUG_NAME = src.DRUG_NAME
    WHEN NOT MATCHED THEN INSERT (DRUG_NAME) VALUES (src.DRUG_NAME);

    -- ---- 6b. Upsert DIM_PHARMACY ----
    MERGE INTO DW.DIM_PHARMACY tgt
    USING (
        SELECT DISTINCT PHARMACY AS PHARMACY_ID, CITY
        FROM STAGING.STG_TRANSACTION
        WHERE IS_PROCESSED = 'FALSE' AND PHARMACY IS NOT NULL AND PHARMACY <> ''
    ) src
    ON tgt.PHARMACY_ID = src.PHARMACY_ID
    WHEN NOT MATCHED THEN INSERT (PHARMACY_ID, CITY) VALUES (src.PHARMACY_ID, src.CITY)
    WHEN MATCHED AND tgt.CITY IS DISTINCT FROM src.CITY THEN UPDATE SET CITY = src.CITY;

    -- ---- 6c. Insert new FACT rows ----
    INSERT INTO DW.FACT_PRESCRIPTION_EVENT (
        TX_ID, DATE_KEY, DRUG_KEY, PHARMACY_KEY, SEVERITY_KEY,
        SOURCE_SYSTEM, BATCH_ID, IS_NEW_PRESCRIPTION, CURRENT_MEDS_COUNT,
        INTERACTION_FOUND, INTERACTION_COUNT, INTERACTING_DRUGS, INTERACTION_TYPE,
        ACTIVE_INGREDIENT_MATCH, SHARED_INGREDIENT, INGREDIENT_OVERLAP_COUNT,
        POLYPHARMACY_FLAG, HIGH_RISK_PATIENT, DRUG_RISK_SCORE, PATIENT_RISK_SCORE,
        INTERACTION_RATE, LOAD_TIMESTAMP
    )
    SELECT
        s.TX_ID,
        TO_NUMBER(TO_CHAR(s.LOAD_TIMESTAMP::DATE, 'YYYYMMDD'))     AS DATE_KEY,
        dd.DRUG_KEY,
        dp.PHARMACY_KEY,
        COALESCE(sev.SEVERITY_KEY, 5)                              AS SEVERITY_KEY,
        s.SOURCE_SYSTEM,
        s.BATCH_ID,
        (s.IS_NEW_PRESCRIPTION = 'New')                            AS IS_NEW_PRESCRIPTION,
        TRY_CAST(s.CURRENT_MEDS_COUNT AS NUMBER),
        (s.INTERACTION_FOUND = 'TRUE'),
        TRY_CAST(s.INTERACTION_COUNT AS NUMBER),
        s.INTERACTING_DRUGS,
        s.INTERACTION_TYPE,
        (s.ACTIVE_INGREDIENT_MATCH = 'TRUE'),
        s.SHARED_INGREDIENT,
        TRY_CAST(s.INGREDIENT_OVERLAP_COUNT AS NUMBER),
        (s.POLYPHARMACY_FLAG = 'TRUE'),
        (s.HIGH_RISK_PATIENT = 'TRUE'),
        TRY_CAST(s.DRUG_RISK_SCORE AS FLOAT),
        TRY_CAST(s.PATIENT_RISK_SCORE AS FLOAT),
        TRY_CAST(s.INTERACTION_RATE AS FLOAT),
        s.LOAD_TIMESTAMP
    FROM STAGING.STG_TRANSACTION s
    LEFT JOIN DW.DIM_DRUG    dd  ON dd.DRUG_NAME    = s.DRUG
    LEFT JOIN DW.DIM_PHARMACY dp ON dp.PHARMACY_ID  = s.PHARMACY
    LEFT JOIN DW.DIM_INTERACTION_SEVERITY sev ON sev.SEVERITY_NAME = s.INTERACTION_SEVERITY
    WHERE s.IS_PROCESSED = 'FALSE'
      AND NOT EXISTS (
          SELECT 1 FROM DW.FACT_PRESCRIPTION_EVENT f WHERE f.TX_ID = s.TX_ID
      );

    -- ---- 6d. Mark staging rows as processed ----
    UPDATE STAGING.STG_TRANSACTION
    SET IS_PROCESSED = 'TRUE'
    WHERE IS_PROCESSED = 'FALSE';

    RETURN 'DW load complete at ' || CURRENT_TIMESTAMP()::STRING;
END;
$$;

-- Run it manually once to test:
-- CALL DW.SP_LOAD_DIM_MODEL();


/* ============================================================================
   7. AUTOMATION — Snowflake TASK to run the ETL every 5 minutes
      (matches the notebook's availableNow/Job-scheduled micro-batch cadence)
   ============================================================================ */
CREATE OR REPLACE TASK DW.TASK_LOAD_DIM_MODEL
    WAREHOUSE = PHARMA_WH
    SCHEDULE  = '5 MINUTE'
AS
    CALL DW.SP_LOAD_DIM_MODEL();

ALTER TASK DW.TASK_LOAD_DIM_MODEL RESUME;

-- Check task history:
-- SELECT * FROM TABLE(INFORMATION_SCHEMA.TASK_HISTORY())
-- WHERE NAME = 'TASK_LOAD_DIM_MODEL' ORDER BY SCHEDULED_TIME DESC;


/* ============================================================================
   8. REPORTING VIEW — optional, flattened view over the star schema.
      NOTE: Power BI does NOT need this view to see data - DW.DIM_* and
      DW.FACT_PRESCRIPTION_EVENT are real physical tables populated directly
      by SP_LOAD_DIM_MODEL()/TASK_LOAD_DIM_MODEL, so Power BI can connect to
      them straight away. This view is just a convenience for a single-table
      import if you don't want to build relationships in Power BI yourself.
   ============================================================================ */
CREATE OR REPLACE VIEW DW.VW_PRESCRIPTION_REPORTING AS
SELECT
    f.FACT_KEY,
    f.TX_ID,
    dt.CALENDAR_DATE,
    dt.YEAR, dt.MONTH, dt.MONTH_NAME, dt.DAY_NAME, dt.IS_WEEKEND,
    dr.DRUG_NAME,
    ph.PHARMACY_ID,
    ph.CITY,
    sv.SEVERITY_NAME,
    sv.SEVERITY_RANK,
    f.IS_NEW_PRESCRIPTION,
    f.CURRENT_MEDS_COUNT,
    f.INTERACTION_FOUND,
    f.INTERACTION_COUNT,
    f.INTERACTING_DRUGS,
    f.INTERACTION_TYPE,
    f.ACTIVE_INGREDIENT_MATCH,
    f.SHARED_INGREDIENT,
    f.INGREDIENT_OVERLAP_COUNT,
    f.POLYPHARMACY_FLAG,
    f.HIGH_RISK_PATIENT,
    f.DRUG_RISK_SCORE,
    f.PATIENT_RISK_SCORE,
    f.INTERACTION_RATE,
    f.LOAD_TIMESTAMP
FROM DW.FACT_PRESCRIPTION_EVENT f
JOIN DW.DIM_DATE dt                  ON dt.DATE_KEY = f.DATE_KEY
LEFT JOIN DW.DIM_DRUG dr             ON dr.DRUG_KEY = f.DRUG_KEY
LEFT JOIN DW.DIM_PHARMACY ph         ON ph.PHARMACY_KEY = f.PHARMACY_KEY
LEFT JOIN DW.DIM_INTERACTION_SEVERITY sv ON sv.SEVERITY_KEY = f.SEVERITY_KEY;


/* ----------------------------------------------------------------------
   9. Recommended grants for the Power BI service account
   ---------------------------------------------------------------------- */
-- CREATE ROLE IF NOT EXISTS POWERBI_ROLE;
-- GRANT USAGE ON WAREHOUSE PHARMA_WH TO ROLE POWERBI_ROLE;
-- GRANT USAGE ON DATABASE PHARMA_ANALYTICS_DB TO ROLE POWERBI_ROLE;
-- GRANT USAGE ON SCHEMA DW TO ROLE POWERBI_ROLE;
-- GRANT SELECT ON ALL TABLES IN SCHEMA DW TO ROLE POWERBI_ROLE;
-- GRANT SELECT ON FUTURE TABLES IN SCHEMA DW TO ROLE POWERBI_ROLE;
-- GRANT SELECT ON ALL VIEWS IN SCHEMA DW TO ROLE POWERBI_ROLE;
-- GRANT SELECT ON FUTURE VIEWS IN SCHEMA DW TO ROLE POWERBI_ROLE;
-- CREATE USER IF NOT EXISTS POWERBI_SVC PASSWORD='...' DEFAULT_ROLE=POWERBI_ROLE DEFAULT_WAREHOUSE=PHARMA_WH;
-- GRANT ROLE POWERBI_ROLE TO USER POWERBI_SVC;
