-- =============================================================================
-- PHARMACEUTICAL DRUG INTERACTION ANALYTICS PLATFORM
-- Enterprise-Grade Snowflake Schema — COMPLETE & FIXED VERSION
-- Version: 2.0  |  Fixes applied + missing parts added
-- Account: YTRRMJE-ZZ81345
-- =============================================================================
-- FIXES APPLIED:
--   [1] EXPIRY_DATE DEFAULT '9999-12-31' → TO_DATE('9999-12-31','YYYY-MM-DD')
--   [2] Added: CREATE WAREHOUSE PHARMA_WH
--   [3] Added: USE WAREHOUSE statement
--   [4] Added: DIM_DATE population INSERT (2020–2030)
--   [5] Sections 5 & 6 wrapped in comments for Standard edition
-- =============================================================================
-- HOW TO RUN:
--   Open Snowsight → New Worksheet → paste this file → Run All
--   OR run each section block by block in order (recommended first time)
-- =============================================================================


-- =============================================================================
-- BLOCK 0: WAREHOUSE SETUP  ← RUN THIS FIRST
-- This block is MISSING from the original file — required before anything else
-- =============================================================================

CREATE WAREHOUSE IF NOT EXISTS PHARMA_WH
    WAREHOUSE_SIZE    = 'X-SMALL'
    AUTO_SUSPEND      = 60
    AUTO_RESUME       = TRUE
    INITIALLY_SUSPENDED = FALSE
    COMMENT           = 'Warehouse for pharmaceutical analytics platform';

USE WAREHOUSE PHARMA_WH;


-- =============================================================================
-- BLOCK 1: DATABASE & SCHEMA SETUP
-- =============================================================================

CREATE DATABASE IF NOT EXISTS PHARMA_ANALYTICS_DB
    COMMENT = 'Enterprise pharmaceutical drug interaction analytics platform';

CREATE SCHEMA IF NOT EXISTS PHARMA_ANALYTICS_DB.STAGING
    COMMENT = 'Raw ingestion layer for PySpark ETL pipelines';

CREATE SCHEMA IF NOT EXISTS PHARMA_ANALYTICS_DB.DIMENSIONS
    COMMENT = 'Normalized dimension tables for drug, ingredient, pharmacy, patient entities';

CREATE SCHEMA IF NOT EXISTS PHARMA_ANALYTICS_DB.FACTS
    COMMENT = 'Fact tables for prescription transactions and analytical aggregations';

CREATE SCHEMA IF NOT EXISTS PHARMA_ANALYTICS_DB.ANALYTICS
    COMMENT = 'Derived tables and materialized views for BI and graph export';

USE DATABASE PHARMA_ANALYTICS_DB;


-- =============================================================================
-- BLOCK 2: STAGING TABLES
-- =============================================================================

CREATE OR REPLACE TABLE STAGING.STG_DRUG_METADATA (
    STG_ID                      NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Staging surrogate key (auto-generated)',
    BATCH_ID                    VARCHAR(100)                              COMMENT 'ETL batch identifier for incremental loading',
    LOAD_TIMESTAMP              TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC timestamp when record was loaded into staging',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Origin system or file name (e.g., FDA_API, RxNorm)',
    IS_PROCESSED                BOOLEAN DEFAULT FALSE                     COMMENT 'Flag: TRUE once promoted to dimension tables',
    DOSAGE_FORM                 VARCHAR(200)   COMMENT 'Raw dosage form (e.g., Tablet, Capsule, Injection)',
    THERAPEUTIC_GROUP           VARCHAR(300)   COMMENT 'Drug therapeutic classification or ATC group',
    ROUTE_OF_ADMINISTRATION     VARCHAR(200)   COMMENT 'Administration route (e.g., Oral, IV, Topical)',
    INGREDIENT_COUNT            VARCHAR(20)    COMMENT 'Number of active ingredients (raw string)',
    IS_COMBINATION              VARCHAR(10)    COMMENT 'Combination drug flag (raw: True/False/1/0)',
    COMBINATION_TYPE            VARCHAR(200)   COMMENT 'Type of combination (e.g., Fixed-dose, Co-packaged)',
    TRADE_NAME                  VARCHAR(500)   COMMENT 'Brand/trade name of the drug',
    CANONICAL_INGREDIENT_NAME   VARCHAR(500)   COMMENT 'Standardized active ingredient name (INN/USAN)',
    REFERENCE_BRAND_NAMES       VARCHAR(2000)  COMMENT 'Pipe-delimited list of brand name references',
    REFERENCE_GENERIC_NAMES     VARCHAR(2000)  COMMENT 'Pipe-delimited list of generic name references',
    WARNINGS_COUNT              VARCHAR(20)    COMMENT 'Total number of boxed/black warnings',
    DRUG_INTERACTIONS_COUNT     VARCHAR(20)    COMMENT 'Total documented drug-drug interaction records',
    ADVERSE_REACTIONS_COUNT     VARCHAR(20)    COMMENT 'Total adverse reaction entries',
    INDICATIONS_COUNT           VARCHAR(20)    COMMENT 'Total therapeutic indication entries',
    FIRST_WARNING               VARCHAR(4000)  COMMENT 'Text of the first/primary boxed warning',
    FIRST_DRUG_INTERACTION      VARCHAR(4000)  COMMENT 'Text of the first documented drug interaction',
    FIRST_ADVERSE_REACTION      VARCHAR(4000)  COMMENT 'Text of the first adverse reaction entry',
    FIRST_INDICATION            VARCHAR(4000)  COMMENT 'Text of the first therapeutic indication',
    RAW_RECORD                  VARIANT        COMMENT 'Full raw JSON record for lineage and debugging'
)
CLUSTER BY (LOAD_TIMESTAMP, SOURCE_SYSTEM)
COMMENT = 'Staging table for raw drug metadata ingested from PySpark ETL pipelines';


CREATE OR REPLACE TABLE STAGING.STG_TRANSACTION (
    STG_ID                      NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Staging surrogate key',
    BATCH_ID                    VARCHAR(100)                              COMMENT 'ETL batch identifier',
    LOAD_TIMESTAMP              TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC load timestamp',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Source system identifier',
    IS_PROCESSED                BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE once promoted to fact table',
    TX_ID                       VARCHAR(100)   COMMENT 'Raw transaction/prescription identifier from source',
    PHARMACY                    VARCHAR(300)   COMMENT 'Pharmacy name or identifier',
    CITY                        VARCHAR(200)   COMMENT 'City where prescription was dispensed',
    IS_NEW_PRESCRIPTION         VARCHAR(10)    COMMENT 'New vs refill flag (raw: New/Refill/1/0)',
    DRUG                        VARCHAR(500)   COMMENT 'Drug name as recorded in transaction',
    CURRENT_MEDS                VARCHAR(4000)  COMMENT 'Pipe-delimited list of patient current medications',
    INTERACTION_FOUND           VARCHAR(10)    COMMENT 'Whether an interaction was detected (raw Boolean)',
    INTERACTION_COUNT           VARCHAR(20)    COMMENT 'Number of interactions detected (raw int)',
    INTERACTING_DRUGS           VARCHAR(2000)  COMMENT 'Pipe-delimited interacting drug pairs',
    INTERACTION_SEVERITY        VARCHAR(50)    COMMENT 'Severity label (e.g., Major, Moderate, Minor)',
    INTERACTION_TYPE            VARCHAR(200)   COMMENT 'Mechanism type (e.g., PK, PD, Additive)',
    ACTIVE_INGREDIENT_MATCH     VARCHAR(10)    COMMENT 'Whether active ingredient matched (raw Boolean)',
    SHARED_INGREDIENT           VARCHAR(500)   COMMENT 'Shared ingredient name if overlap detected',
    INGREDIENT_OVERLAP_COUNT    VARCHAR(20)    COMMENT 'Number of overlapping ingredients (raw int)',
    CURRENT_MEDS_COUNT          VARCHAR(20)    COMMENT 'Count of current medications (raw int)',
    POLYPHARMACY_FLAG           VARCHAR(10)    COMMENT 'Polypharmacy flag: TRUE if current_meds >= 5',
    HIGH_RISK_PATIENT           VARCHAR(10)    COMMENT 'High risk patient flag (raw Boolean)',
    DRUG_RISK_SCORE             VARCHAR(20)    COMMENT 'Calculated drug-level risk score (raw float)',
    PATIENT_RISK_SCORE          VARCHAR(20)    COMMENT 'Aggregate patient-level risk score (raw float)',
    INTERACTION_RATE            VARCHAR(20)    COMMENT 'Interaction rate ratio for this drug context (raw float)',
    RAW_RECORD                  VARIANT        COMMENT 'Full raw JSON record for lineage'
)
CLUSTER BY (LOAD_TIMESTAMP, PHARMACY, CITY)
COMMENT = 'Staging table for raw prescription transaction data from PySpark ETL pipelines';


-- =============================================================================
-- BLOCK 3: DIMENSION TABLES  (no FK dependencies — run before fact table)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- DIM_DATE: Run FIRST — all other date-linked tables depend on it
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_DATE (
    DATE_SK                     NUMBER PRIMARY KEY                        COMMENT 'Surrogate key: integer in YYYYMMDD format',
    FULL_DATE                   DATE NOT NULL UNIQUE                      COMMENT 'Calendar date value',
    DAY_OF_WEEK                 NUMBER(1,0)                               COMMENT 'Day of week: 1=Sunday, 7=Saturday',
    DAY_NAME                    VARCHAR(10)                               COMMENT 'Day name: Monday, Tuesday, etc.',
    DAY_OF_MONTH                NUMBER(2,0)                               COMMENT 'Day of month: 1–31',
    DAY_OF_YEAR                 NUMBER(3,0)                               COMMENT 'Day of year: 1–366',
    WEEK_OF_YEAR                NUMBER(2,0)                               COMMENT 'ISO week number: 1–53',
    MONTH_NUMBER                NUMBER(2,0)                               COMMENT 'Month number: 1–12',
    MONTH_NAME                  VARCHAR(10)                               COMMENT 'Month name: January, February, etc.',
    QUARTER                     NUMBER(1,0)                               COMMENT 'Calendar quarter: 1–4',
    YEAR                        NUMBER(4,0)                               COMMENT 'Calendar year (4-digit)',
    IS_WEEKEND                  BOOLEAN                                   COMMENT 'TRUE if Saturday or Sunday',
    IS_HOLIDAY                  BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE if US federal holiday',
    FISCAL_YEAR                 NUMBER(4,0)                               COMMENT 'Fiscal year (adjust for org fiscal calendar)',
    FISCAL_QUARTER              NUMBER(1,0)                               COMMENT 'Fiscal quarter: 1–4'
)
COMMENT = 'Standard date dimension for time intelligence across all analytical queries';


-- ----------------------------------------------------------------------------
-- DIM_DATE POPULATION  ← THIS IS MISSING FROM THE ORIGINAL FILE
-- Generates every date from 2020-01-01 to 2030-12-31 (3,653 rows)
-- Must be run immediately after CREATE TABLE DIMENSIONS.DIM_DATE
-- ----------------------------------------------------------------------------
INSERT INTO DIMENSIONS.DIM_DATE (
    DATE_SK, FULL_DATE,
    DAY_OF_WEEK, DAY_NAME, DAY_OF_MONTH, DAY_OF_YEAR,
    WEEK_OF_YEAR, MONTH_NUMBER, MONTH_NAME,
    QUARTER, YEAR, IS_WEEKEND, IS_HOLIDAY,
    FISCAL_YEAR, FISCAL_QUARTER
)
WITH DATE_SPINE AS (
    -- Generate a row for every date 2020-01-01 through 2030-12-31
    SELECT DATEADD(DAY, SEQ4(), DATE '2020-01-01') AS DT
    FROM TABLE(GENERATOR(ROWCOUNT => 4018))  -- 4018 days covers 2020–2030
    WHERE DATEADD(DAY, SEQ4(), DATE '2020-01-01') <= DATE '2030-12-31'
)
SELECT
    TO_NUMBER(TO_CHAR(DT, 'YYYYMMDD'))          AS DATE_SK,
    DT                                           AS FULL_DATE,
    DAYOFWEEK(DT) + 1                            AS DAY_OF_WEEK,
    DAYNAME(DT)                                  AS DAY_NAME,
    DAY(DT)                                      AS DAY_OF_MONTH,
    DAYOFYEAR(DT)                                AS DAY_OF_YEAR,
    WEEKOFYEAR(DT)                               AS WEEK_OF_YEAR,
    MONTH(DT)                                    AS MONTH_NUMBER,
    MONTHNAME(DT)                                AS MONTH_NAME,
    QUARTER(DT)                                  AS QUARTER,
    YEAR(DT)                                     AS YEAR,
    CASE WHEN DAYOFWEEK(DT) IN (0, 6)
         THEN TRUE ELSE FALSE END                AS IS_WEEKEND,
    FALSE                                        AS IS_HOLIDAY,
    YEAR(DT)                                     AS FISCAL_YEAR,
    QUARTER(DT)                                  AS FISCAL_QUARTER
FROM DATE_SPINE;

-- Verify population
SELECT COUNT(*), MIN(FULL_DATE), MAX(FULL_DATE) FROM DIMENSIONS.DIM_DATE;
-- Expected: 4018 rows, 2020-01-01 to 2030-12-31


-- ----------------------------------------------------------------------------
-- DIM_DRUG  ← FIX APPLIED: EXPIRY_DATE default corrected
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_DRUG (
    DRUG_SK                     NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for drug dimension',
    DRUG_NK                     VARCHAR(100) NOT NULL                     COMMENT 'Natural key: canonical trade name or drug code from source',
    TRADE_NAME                  VARCHAR(500)   COMMENT 'Official brand/trade name of the drug',
    CANONICAL_INGREDIENT_NAME   VARCHAR(500)   COMMENT 'Standardized INN/USAN active ingredient name',
    REFERENCE_BRAND_NAMES       VARCHAR(2000)  COMMENT 'Semicolon-delimited list of known brand name references',
    REFERENCE_GENERIC_NAMES     VARCHAR(2000)  COMMENT 'Semicolon-delimited list of known generic name references',
    DOSAGE_FORM                 VARCHAR(200)   COMMENT 'Physical form of the drug (Tablet, Capsule, Syrup, etc.)',
    ROUTE_OF_ADMINISTRATION     VARCHAR(200)   COMMENT 'How drug is administered (Oral, IV, Topical, etc.)',
    THERAPEUTIC_GROUP           VARCHAR(300)   COMMENT 'Therapeutic or pharmacological drug class',
    IS_COMBINATION              BOOLEAN        COMMENT 'TRUE if drug contains multiple active ingredients',
    COMBINATION_TYPE            VARCHAR(200)   COMMENT 'Combination category (Fixed-dose, Co-packaged, etc.)',
    INGREDIENT_COUNT            NUMBER(5,0)    COMMENT 'Number of distinct active ingredients',
    WARNINGS_COUNT              NUMBER(5,0)    COMMENT 'Number of black-box/boxed FDA warnings',
    DRUG_INTERACTIONS_COUNT     NUMBER(6,0)    COMMENT 'Total number of documented drug interactions',
    ADVERSE_REACTIONS_COUNT     NUMBER(6,0)    COMMENT 'Total number of adverse reaction reports',
    INDICATIONS_COUNT           NUMBER(5,0)    COMMENT 'Number of approved therapeutic indications',
    FIRST_WARNING               VARCHAR(4000)  COMMENT 'Text of primary/first boxed warning',
    FIRST_DRUG_INTERACTION      VARCHAR(4000)  COMMENT 'Text of first documented drug-drug interaction',
    FIRST_ADVERSE_REACTION      VARCHAR(4000)  COMMENT 'Text of first adverse reaction description',
    FIRST_INDICATION            VARCHAR(4000)  COMMENT 'Text of first therapeutic indication',
    -- SCD Type 2 Metadata
    EFFECTIVE_DATE              DATE DEFAULT CURRENT_DATE()               COMMENT 'Date this version of the record became effective',
    EXPIRY_DATE                 DATE DEFAULT TO_DATE('9999-12-31','YYYY-MM-DD') COMMENT 'Date this version expired; 9999-12-31 = current',
    IS_CURRENT                  BOOLEAN DEFAULT TRUE                      COMMENT 'TRUE if this is the active/current version of the record',
    RECORD_VERSION              NUMBER(5,0) DEFAULT 1                     COMMENT 'Version number for SCD2 history tracking',
    -- Audit
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Source system that provided this drug record',
    STG_BATCH_ID                VARCHAR(100)                              COMMENT 'ETL batch ID from staging for lineage'
)
CLUSTER BY (IS_CURRENT, THERAPEUTIC_GROUP, DOSAGE_FORM)
COMMENT = 'Drug master dimension: metadata, formulation, and safety profile per drug entity';


-- ----------------------------------------------------------------------------
-- DIM_INGREDIENT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_INGREDIENT (
    INGREDIENT_SK               NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for ingredient',
    INGREDIENT_NK               VARCHAR(200) NOT NULL                     COMMENT 'Natural key: canonical ingredient name (INN/USAN)',
    INGREDIENT_NAME             VARCHAR(500) NOT NULL                     COMMENT 'Standardized ingredient name (INN preferred)',
    INGREDIENT_CLASS            VARCHAR(200)                              COMMENT 'Pharmacological class (e.g., Beta-blocker, SSRI)',
    IS_CONTROLLED_SUBSTANCE     BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE if ingredient is a DEA-controlled substance',
    DEA_SCHEDULE                VARCHAR(20)                               COMMENT 'DEA schedule (I–V) if controlled; NULL otherwise',
    MECHANISM_OF_ACTION         VARCHAR(2000)                             COMMENT 'Brief description of the ingredient mechanism of action',
    NEO4J_NODE_ID               VARCHAR(200)                              COMMENT 'Exported node ID for Neo4j graph integration',
    NEO4J_LABELS                VARCHAR(500)                              COMMENT 'Comma-delimited Neo4j node labels (e.g., Ingredient:ActiveAPI)',
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Source system (e.g., RxNorm, DrugBank)'
)
CLUSTER BY (INGREDIENT_CLASS)
COMMENT = 'Active pharmaceutical ingredient master dimension, used for interaction graph analysis';


-- ----------------------------------------------------------------------------
-- DIM_PHARMACY
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_PHARMACY (
    PHARMACY_SK                 NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for pharmacy',
    PHARMACY_NK                 VARCHAR(200) NOT NULL                     COMMENT 'Natural key: pharmacy name or NPI/NCPDP ID from source',
    PHARMACY_NAME               VARCHAR(300) NOT NULL                     COMMENT 'Full pharmacy name or chain name',
    PHARMACY_TYPE               VARCHAR(100)                              COMMENT 'Type: Retail, Hospital, Specialty, Mail-Order, etc.',
    CITY                        VARCHAR(200)                              COMMENT 'City where pharmacy is located',
    STATE                       VARCHAR(100)                              COMMENT 'State or province',
    COUNTRY                     VARCHAR(100) DEFAULT 'USA'                COMMENT 'Country code or name',
    POSTAL_CODE                 VARCHAR(20)                               COMMENT 'Zip or postal code',
    NPI_NUMBER                  VARCHAR(50)                               COMMENT 'National Provider Identifier (NPI) if applicable',
    NCPDP_ID                    VARCHAR(50)                               COMMENT 'NCPDP pharmacy identifier if applicable',
    IS_ACTIVE                   BOOLEAN DEFAULT TRUE                      COMMENT 'TRUE if pharmacy is currently active',
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)'
)
CLUSTER BY (CITY, STATE)
COMMENT = 'Pharmacy master dimension with location and classification data';


-- ----------------------------------------------------------------------------
-- DIM_PATIENT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_PATIENT (
    PATIENT_SK                  NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for patient (no PII)',
    PATIENT_TOKEN               VARCHAR(200) NOT NULL UNIQUE              COMMENT 'Hashed/tokenized patient identifier (HIPAA-safe)',
    AGE_BAND                    VARCHAR(20)                               COMMENT 'Anonymized age band (e.g., 18-35, 36-65, 65+)',
    GENDER_CODE                 VARCHAR(10)                               COMMENT 'Gender code (M/F/U) - de-identified',
    PATIENT_RISK_TIER           VARCHAR(20)                               COMMENT 'Risk tier assignment (Low/Medium/High/Critical)',
    IS_CHRONIC_PATIENT          BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE if patient has chronic medication history',
    FIRST_SEEN_DATE             DATE                                      COMMENT 'First transaction date observed for patient',
    LAST_SEEN_DATE              DATE                                      COMMENT 'Most recent transaction date for patient',
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)'
)
COMMENT = 'De-identified patient dimension; no PII; HIPAA-compliant tokenized patient tracking';


-- ----------------------------------------------------------------------------
-- DIM_DRUG_INGREDIENT  (bridge — needs DIM_DRUG + DIM_INGREDIENT first)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_DRUG_INGREDIENT (
    DRUG_INGREDIENT_SK          NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for bridge record',
    DRUG_SK                     NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG.DRUG_SK',
    INGREDIENT_SK               NUMBER NOT NULL                           COMMENT 'FK to DIM_INGREDIENT.INGREDIENT_SK',
    IS_PRIMARY_INGREDIENT       BOOLEAN DEFAULT TRUE                      COMMENT 'TRUE if this is the primary active ingredient',
    INGREDIENT_STRENGTH         VARCHAR(100)                              COMMENT 'Dosage strength of ingredient in this drug formulation',
    INGREDIENT_UNIT             VARCHAR(50)                               COMMENT 'Unit of strength (mg, mcg, %, etc.)',
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    CONSTRAINT FK_DI_DRUG       FOREIGN KEY (DRUG_SK)       REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    CONSTRAINT FK_DI_INGREDIENT FOREIGN KEY (INGREDIENT_SK) REFERENCES DIMENSIONS.DIM_INGREDIENT(INGREDIENT_SK),
    CONSTRAINT UQ_DRUG_INGREDIENT UNIQUE (DRUG_SK, INGREDIENT_SK)
)
CLUSTER BY (DRUG_SK, INGREDIENT_SK)
COMMENT = 'Many-to-many bridge between drugs and their active ingredients';


-- =============================================================================
-- BLOCK 4: FACT TABLE  (needs ALL dimension tables above)
-- =============================================================================

CREATE OR REPLACE TABLE FACTS.FACT_PRESCRIPTION_TRANSACTION (
    TX_SK                       NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for transaction fact',
    TX_ID                       VARCHAR(100) NOT NULL                     COMMENT 'Natural key: source transaction/prescription ID',
    DRUG_SK                     NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG.DRUG_SK',
    PHARMACY_SK                 NUMBER NOT NULL                           COMMENT 'FK to DIM_PHARMACY.PHARMACY_SK',
    PATIENT_SK                  NUMBER                                    COMMENT 'FK to DIM_PATIENT.PATIENT_SK (nullable)',
    TX_DATE_SK                  NUMBER                                    COMMENT 'FK to DIM_DATE.DATE_SK - transaction date',
    LOAD_DATE_SK                NUMBER                                    COMMENT 'FK to DIM_DATE.DATE_SK - ETL load date',
    IS_NEW_PRESCRIPTION         BOOLEAN                                   COMMENT 'TRUE = new prescription; FALSE = refill',
    DRUG_NAME_AS_DISPENSED      VARCHAR(500)                              COMMENT 'Drug name exactly as recorded at dispensing',
    CURRENT_MEDS                VARCHAR(4000)                             COMMENT 'Semicolon-delimited list of patient current medications',
    CURRENT_MEDS_COUNT          NUMBER(5,0)                               COMMENT 'Count of current medications at time of fill',
    POLYPHARMACY_FLAG           BOOLEAN                                   COMMENT 'TRUE if current medications >= 5',
    INTERACTION_FOUND           BOOLEAN                                   COMMENT 'TRUE if at least one drug interaction was detected',
    INTERACTION_COUNT           NUMBER(5,0) DEFAULT 0                     COMMENT 'Number of unique drug interactions detected',
    INTERACTING_DRUGS           VARCHAR(2000)                             COMMENT 'Semicolon-delimited list of interacting drug pairs',
    INTERACTION_SEVERITY        VARCHAR(50)                               COMMENT 'Highest severity: Major/Moderate/Minor/None',
    INTERACTION_TYPE            VARCHAR(200)                              COMMENT 'Primary interaction mechanism: PK/PD/Additive/Synergistic',
    ACTIVE_INGREDIENT_MATCH     BOOLEAN                                   COMMENT 'TRUE if active ingredient matched a known interaction record',
    SHARED_INGREDIENT           VARCHAR(500)                              COMMENT 'Shared ingredient name causing the overlap',
    INGREDIENT_OVERLAP_COUNT    NUMBER(5,0) DEFAULT 0                     COMMENT 'Number of overlapping ingredients',
    HIGH_RISK_PATIENT           BOOLEAN                                   COMMENT 'TRUE if patient meets high-risk criteria',
    DRUG_RISK_SCORE             NUMBER(10,4)                              COMMENT 'Drug-level risk score (0.0–100.0)',
    PATIENT_RISK_SCORE          NUMBER(10,4)                              COMMENT 'Patient-level risk score (0.0–100.0)',
    INTERACTION_RATE            NUMBER(10,6)                              COMMENT 'Ratio of interactions to total medications in profile',
    LOAD_TIMESTAMP              TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC timestamp when record was loaded',
    STG_BATCH_ID                VARCHAR(100)                              COMMENT 'ETL batch ID from staging for lineage',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Origin system identifier',
    CONSTRAINT FK_FPT_DRUG      FOREIGN KEY (DRUG_SK)      REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    CONSTRAINT FK_FPT_PHARMACY  FOREIGN KEY (PHARMACY_SK)  REFERENCES DIMENSIONS.DIM_PHARMACY(PHARMACY_SK),
    CONSTRAINT FK_FPT_PATIENT   FOREIGN KEY (PATIENT_SK)   REFERENCES DIMENSIONS.DIM_PATIENT(PATIENT_SK),
    CONSTRAINT FK_FPT_DATE      FOREIGN KEY (TX_DATE_SK)   REFERENCES DIMENSIONS.DIM_DATE(DATE_SK),
    CONSTRAINT FK_FPT_LDATE     FOREIGN KEY (LOAD_DATE_SK) REFERENCES DIMENSIONS.DIM_DATE(DATE_SK)
)
CLUSTER BY (TX_DATE_SK, PHARMACY_SK, INTERACTION_SEVERITY)
COMMENT = 'Central prescription transaction fact table. Grain: one dispensing event.';


-- =============================================================================
-- BLOCK 5: ANALYTICS TABLES
-- =============================================================================

CREATE OR REPLACE TABLE ANALYTICS.DRUG_INTERACTION_SUMMARY (
    INTERACTION_SUMMARY_SK      NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    DRUG_A_SK                   NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG.DRUG_SK - first drug in pair',
    DRUG_B_SK                   NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG.DRUG_SK - second drug in pair',
    DRUG_A_NAME                 VARCHAR(500)                              COMMENT 'Trade name of Drug A',
    DRUG_B_NAME                 VARCHAR(500)                              COMMENT 'Trade name of Drug B',
    SHARED_INGREDIENT           VARCHAR(500)                              COMMENT 'Ingredient responsible for interaction',
    INTERACTION_TYPE            VARCHAR(200)                              COMMENT 'Mechanism of interaction (PK, PD, Additive, etc.)',
    INTERACTION_SEVERITY        VARCHAR(50)                               COMMENT 'Severity level: Major / Moderate / Minor',
    OBSERVED_TX_COUNT           NUMBER(10,0) DEFAULT 0                    COMMENT 'Number of transactions where this pair co-occurred',
    AVG_DRUG_RISK_SCORE         NUMBER(10,4)                              COMMENT 'Average drug risk score when this pair is co-prescribed',
    INTERACTION_RATE            NUMBER(10,6)                              COMMENT 'Rate of interaction occurrence across all transactions',
    FIRST_OBSERVED_DATE         DATE                                      COMMENT 'Earliest date this drug pair interaction was observed',
    LAST_OBSERVED_DATE          DATE                                      COMMENT 'Most recent date this drug pair interaction was observed',
    NEO4J_REL_TYPE              VARCHAR(100) DEFAULT 'INTERACTS_WITH'     COMMENT 'Neo4j relationship type for graph export',
    NEO4J_EXPORTED_AT           TIMESTAMP_NTZ                             COMMENT 'Timestamp when record was last exported to Neo4j',
    COMPUTED_AT                 TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Timestamp when this summary was computed',
    STG_BATCH_ID                VARCHAR(100)                              COMMENT 'Source batch ID',
    CONSTRAINT FK_DIS_DRUG_A    FOREIGN KEY (DRUG_A_SK) REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    CONSTRAINT FK_DIS_DRUG_B    FOREIGN KEY (DRUG_B_SK) REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK)
)
CLUSTER BY (INTERACTION_SEVERITY, DRUG_A_SK, DRUG_B_SK)
COMMENT = 'Precomputed drug interaction pair summary for analytics dashboards and Neo4j export';


CREATE OR REPLACE TABLE ANALYTICS.PHARMACY_RISK_SUMMARY (
    PHARMACY_RISK_SK            NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    PHARMACY_SK                 NUMBER NOT NULL                           COMMENT 'FK to DIM_PHARMACY.PHARMACY_SK',
    SUMMARY_DATE_SK             NUMBER NOT NULL                           COMMENT 'FK to DIM_DATE.DATE_SK',
    PHARMACY_NAME               VARCHAR(300)                              COMMENT 'Pharmacy name (denormalized)',
    CITY                        VARCHAR(200)                              COMMENT 'City (denormalized)',
    TOTAL_PRESCRIPTIONS         NUMBER(12,0) DEFAULT 0                    COMMENT 'Total prescription fills on this date',
    TOTAL_INTERACTIONS_DETECTED NUMBER(12,0) DEFAULT 0                    COMMENT 'Total interactions detected across all fills',
    HIGH_RISK_PATIENT_COUNT     NUMBER(10,0) DEFAULT 0                    COMMENT 'Number of unique high-risk patients',
    POLYPHARMACY_PATIENT_COUNT  NUMBER(10,0) DEFAULT 0                    COMMENT 'Number of patients flagged for polypharmacy',
    AVG_PATIENT_RISK_SCORE      NUMBER(10,4)                              COMMENT 'Average patient risk score across all fills',
    AVG_DRUG_RISK_SCORE         NUMBER(10,4)                              COMMENT 'Average drug risk score across all fills',
    INTERACTION_RATE            NUMBER(10,6)                              COMMENT 'Pharmacy-level interaction rate',
    MAJOR_INTERACTION_COUNT     NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of Major severity interactions',
    MODERATE_INTERACTION_COUNT  NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of Moderate severity interactions',
    MINOR_INTERACTION_COUNT     NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of Minor severity interactions',
    COMPUTED_AT                 TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Computation timestamp (UTC)',
    CONSTRAINT FK_PRS_PHARMACY  FOREIGN KEY (PHARMACY_SK)    REFERENCES DIMENSIONS.DIM_PHARMACY(PHARMACY_SK),
    CONSTRAINT FK_PRS_DATE      FOREIGN KEY (SUMMARY_DATE_SK) REFERENCES DIMENSIONS.DIM_DATE(DATE_SK)
)
CLUSTER BY (SUMMARY_DATE_SK, PHARMACY_SK)
COMMENT = 'Daily pharmacy-level risk aggregation table';


CREATE OR REPLACE TABLE ANALYTICS.PATIENT_RISK_PROFILE (
    PATIENT_RISK_SK             NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    PATIENT_SK                  NUMBER NOT NULL                           COMMENT 'FK to DIM_PATIENT.PATIENT_SK',
    PROFILE_DATE_SK             NUMBER NOT NULL                           COMMENT 'FK to DIM_DATE.DATE_SK',
    CURRENT_MEDS_COUNT          NUMBER(5,0)                               COMMENT 'Number of active medications at profile date',
    POLYPHARMACY_FLAG           BOOLEAN                                   COMMENT 'TRUE if current meds >= polypharmacy threshold',
    HIGH_RISK_PATIENT           BOOLEAN                                   COMMENT 'TRUE if patient meets high-risk classification',
    PATIENT_RISK_SCORE          NUMBER(10,4)                              COMMENT 'Composite patient risk score at profile date',
    TOTAL_INTERACTIONS_EVER     NUMBER(10,0) DEFAULT 0                    COMMENT 'Cumulative interactions detected in patient history',
    DISTINCT_DRUGS_PRESCRIBED   NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of distinct drugs prescribed to patient',
    MAX_INTERACTION_SEVERITY    VARCHAR(50)                               COMMENT 'Highest severity interaction ever recorded for patient',
    COMPUTED_AT                 TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Computation timestamp (UTC)',
    CONSTRAINT FK_PRP_PATIENT   FOREIGN KEY (PATIENT_SK)      REFERENCES DIMENSIONS.DIM_PATIENT(PATIENT_SK),
    CONSTRAINT FK_PRP_DATE      FOREIGN KEY (PROFILE_DATE_SK) REFERENCES DIMENSIONS.DIM_DATE(DATE_SK)
)
CLUSTER BY (PROFILE_DATE_SK, PATIENT_SK)
COMMENT = 'Longitudinal patient risk profile for trend analysis';


CREATE OR REPLACE TABLE ANALYTICS.NEO4J_EXPORT_LOG (
    EXPORT_LOG_SK               NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    EXPORT_TIMESTAMP            TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC timestamp of export run',
    EXPORT_TYPE                 VARCHAR(100)                              COMMENT 'Type: DRUG_NODE, INGREDIENT_NODE, INTERACTION_REL, etc.',
    RECORD_COUNT                NUMBER(12,0)                              COMMENT 'Number of records exported in this run',
    TARGET_NEO4J_INSTANCE       VARCHAR(200)                              COMMENT 'Target Neo4j database URI or alias',
    EXPORT_STATUS               VARCHAR(50)                               COMMENT 'Status: SUCCESS, PARTIAL, FAILED',
    ERROR_MESSAGE               VARCHAR(4000)                             COMMENT 'Error details if status is FAILED or PARTIAL',
    BATCH_ID                    VARCHAR(100)                              COMMENT 'ETL batch ID for lineage'
)
COMMENT = 'Audit log for all data exports from Snowflake to Neo4j graph database';


-- =============================================================================
-- BLOCK 6: SEARCH OPTIMIZATION  ← ENTERPRISE EDITION ONLY
-- Skip this block if you are on Standard or free trial edition
-- Your current edition: Standard → COMMENT OUT this entire block
-- =============================================================================

/*  UNCOMMENT ONLY IF YOU UPGRADE TO ENTERPRISE EDITION

ALTER TABLE DIMENSIONS.DIM_DRUG
    ADD SEARCH OPTIMIZATION ON EQUALITY(TRADE_NAME, CANONICAL_INGREDIENT_NAME, THERAPEUTIC_GROUP);
ALTER TABLE DIMENSIONS.DIM_INGREDIENT
    ADD SEARCH OPTIMIZATION ON EQUALITY(INGREDIENT_NAME, INGREDIENT_CLASS);
ALTER TABLE DIMENSIONS.DIM_PHARMACY
    ADD SEARCH OPTIMIZATION ON EQUALITY(PHARMACY_NAME, CITY, STATE);
ALTER TABLE FACTS.FACT_PRESCRIPTION_TRANSACTION
    ADD SEARCH OPTIMIZATION ON EQUALITY(TX_ID, INTERACTION_SEVERITY, INTERACTION_FOUND);

*/


-- =============================================================================
-- BLOCK 7: ROW ACCESS POLICY  ← ENTERPRISE EDITION ONLY
-- Skip this block if you are on Standard or free trial edition
-- Your current edition: Standard → COMMENT OUT this entire block
-- =============================================================================

/*  UNCOMMENT ONLY IF YOU UPGRADE TO ENTERPRISE EDITION

CREATE OR REPLACE ROW ACCESS POLICY PHARMA_ANALYTICS_DB.DIMENSIONS.PATIENT_DATA_POLICY
AS (PATIENT_TOKEN VARCHAR) RETURNS BOOLEAN ->
    CURRENT_ROLE() IN ('DATA_ANALYST_ROLE', 'DATA_ENGINEER_ROLE', 'CLINICAL_REVIEWER_ROLE')
    OR CURRENT_ROLE() = 'SYSADMIN'
COMMENT = 'Restricts DIM_PATIENT access to authorized roles only (HIPAA scaffold)';

ALTER TABLE DIMENSIONS.DIM_PATIENT
    ADD ROW ACCESS POLICY PHARMA_ANALYTICS_DB.DIMENSIONS.PATIENT_DATA_POLICY ON (PATIENT_TOKEN);

*/


-- =============================================================================
-- BLOCK 8: HELPER VIEWS  (works on ALL editions)
-- =============================================================================

CREATE OR REPLACE VIEW ANALYTICS.V_DRUG_INTERACTION_GRAPH AS
SELECT
    d.DRUG_SK,
    d.TRADE_NAME,
    d.CANONICAL_INGREDIENT_NAME,
    d.THERAPEUTIC_GROUP,
    d.DOSAGE_FORM,
    d.WARNINGS_COUNT,
    d.DRUG_INTERACTIONS_COUNT,
    dis.DRUG_B_SK                  AS INTERACTS_WITH_DRUG_SK,
    dis.DRUG_B_NAME                AS INTERACTS_WITH_DRUG_NAME,
    dis.SHARED_INGREDIENT,
    dis.INTERACTION_TYPE,
    dis.INTERACTION_SEVERITY,
    dis.OBSERVED_TX_COUNT,
    dis.INTERACTION_RATE,
    dis.NEO4J_REL_TYPE
FROM DIMENSIONS.DIM_DRUG d
LEFT JOIN ANALYTICS.DRUG_INTERACTION_SUMMARY dis ON d.DRUG_SK = dis.DRUG_A_SK
WHERE d.IS_CURRENT = TRUE
COMMENT = 'Flattened drug interaction graph view for Neo4j bulk import';


CREATE OR REPLACE VIEW ANALYTICS.V_HIGH_RISK_PRESCRIPTIONS AS
SELECT
    f.TX_ID,
    f.TX_DATE_SK,
    d.TRADE_NAME                   AS DRUG_NAME,
    d.THERAPEUTIC_GROUP,
    p.PHARMACY_NAME,
    p.CITY,
    f.CURRENT_MEDS_COUNT,
    f.POLYPHARMACY_FLAG,
    f.INTERACTION_FOUND,
    f.INTERACTION_COUNT,
    f.INTERACTION_SEVERITY,
    f.INTERACTING_DRUGS,
    f.DRUG_RISK_SCORE,
    f.PATIENT_RISK_SCORE,
    f.HIGH_RISK_PATIENT,
    f.LOAD_TIMESTAMP
FROM FACTS.FACT_PRESCRIPTION_TRANSACTION f
JOIN DIMENSIONS.DIM_DRUG      d ON f.DRUG_SK     = d.DRUG_SK AND d.IS_CURRENT = TRUE
JOIN DIMENSIONS.DIM_PHARMACY  p ON f.PHARMACY_SK = p.PHARMACY_SK
WHERE f.HIGH_RISK_PATIENT = TRUE
   OR f.INTERACTION_SEVERITY = 'Major'
   OR f.POLYPHARMACY_FLAG = TRUE
COMMENT = 'Monitoring view for high-risk prescriptions';


-- =============================================================================
-- BLOCK 9: VERIFICATION QUERIES  ← Run after everything above to confirm
-- =============================================================================

-- Check all tables exist
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.STAGING;
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.DIMENSIONS;
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.FACTS;
SHOW TABLES IN SCHEMA PHARMA_ANALYTICS_DB.ANALYTICS;

-- Check DIM_DATE was populated
SELECT COUNT(*) AS date_rows,
       MIN(FULL_DATE) AS first_date,
       MAX(FULL_DATE) AS last_date
FROM DIMENSIONS.DIM_DATE;
-- Expected: 4018 rows, 2020-01-01, 2030-12-31

-- Check DIM_DRUG EXPIRY_DATE default is correct
DESCRIBE TABLE DIMENSIONS.DIM_DRUG;

-- Quick smoke test — insert one test row into DIM_DATE range check
SELECT DATE_SK, FULL_DATE, DAY_NAME, MONTH_NAME, QUARTER, YEAR, IS_WEEKEND
FROM DIMENSIONS.DIM_DATE
WHERE FULL_DATE = CURRENT_DATE()
LIMIT 1;