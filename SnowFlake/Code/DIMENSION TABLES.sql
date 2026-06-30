-- ----------------------------------------------------------------------------
-- DIM_DATE — run first, all FK date columns depend on it
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_DATE (
    DATE_SK                     NUMBER PRIMARY KEY                        COMMENT 'Surrogate key: integer in YYYYMMDD format (e.g. 20240101)',
    FULL_DATE                   DATE NOT NULL UNIQUE                      COMMENT 'Calendar date value',
    DAY_OF_WEEK                 NUMBER(1,0)                               COMMENT 'Day of week: 1=Sunday through 7=Saturday',
    DAY_NAME                    VARCHAR(10)                               COMMENT 'Full day name: Monday, Tuesday, etc.',
    DAY_OF_MONTH                NUMBER(2,0)                               COMMENT 'Day of month: 1 through 31',
    DAY_OF_YEAR                 NUMBER(3,0)                               COMMENT 'Day of year: 1 through 366',
    WEEK_OF_YEAR                NUMBER(2,0)                               COMMENT 'ISO week number: 1 through 53',
    MONTH_NUMBER                NUMBER(2,0)                               COMMENT 'Month number: 1 through 12',
    MONTH_NAME                  VARCHAR(10)                               COMMENT 'Full month name: January, February, etc.',
    QUARTER                     NUMBER(1,0)                               COMMENT 'Calendar quarter: 1 through 4',
    YEAR                        NUMBER(4,0)                               COMMENT 'Calendar year (4-digit)',
    IS_WEEKEND                  BOOLEAN                                   COMMENT 'TRUE if Saturday or Sunday',
    IS_HOLIDAY                  BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE if US federal holiday (manually maintained)',
    FISCAL_YEAR                 NUMBER(4,0)                               COMMENT 'Fiscal year — adjust for your org fiscal calendar',
    FISCAL_QUARTER              NUMBER(1,0)                               COMMENT 'Fiscal quarter: 1 through 4'
)
COMMENT = 'Standard date dimension — covers 2020-01-01 to 2035-12-31 (v3.0: extended from 2030)';


-- [IMPROVEMENT #3 + #4] DIM_DATE population: 2020-01-01 to 2035-12-31
-- Uses Snowflake GENERATOR + SEQ4() — no external data source needed
-- Row count: 5,844 rows covering 2020 through 2035
INSERT INTO DIMENSIONS.DIM_DATE (
    DATE_SK, FULL_DATE,
    DAY_OF_WEEK, DAY_NAME, DAY_OF_MONTH, DAY_OF_YEAR,
    WEEK_OF_YEAR, MONTH_NUMBER, MONTH_NAME,
    QUARTER, YEAR, IS_WEEKEND, IS_HOLIDAY,
    FISCAL_YEAR, FISCAL_QUARTER
)
WITH DATE_SPINE AS (
    SELECT DATEADD(DAY, SEQ4(), DATE '2020-01-01') AS DT
    FROM TABLE(GENERATOR(ROWCOUNT => 5844))
    WHERE DATEADD(DAY, SEQ4(), DATE '2020-01-01') <= DATE '2035-12-31'
)
SELECT
    TO_NUMBER(TO_CHAR(DT, 'YYYYMMDD'))              AS DATE_SK,
    DT                                               AS FULL_DATE,
    DAYOFWEEK(DT) + 1                                AS DAY_OF_WEEK,
    DAYNAME(DT)                                      AS DAY_NAME,
    DAY(DT)                                          AS DAY_OF_MONTH,
    DAYOFYEAR(DT)                                    AS DAY_OF_YEAR,
    WEEKOFYEAR(DT)                                   AS WEEK_OF_YEAR,
    MONTH(DT)                                        AS MONTH_NUMBER,
    MONTHNAME(DT)                                    AS MONTH_NAME,
    QUARTER(DT)                                      AS QUARTER,
    YEAR(DT)                                         AS YEAR,
    CASE WHEN DAYOFWEEK(DT) IN (0, 6)
         THEN TRUE ELSE FALSE END                    AS IS_WEEKEND,
    FALSE                                            AS IS_HOLIDAY,
    YEAR(DT)                                         AS FISCAL_YEAR,
    QUARTER(DT)                                      AS FISCAL_QUARTER
FROM DATE_SPINE;

-- Quick check — expected: 5844 rows, 2020-01-01 to 2035-12-31
SELECT COUNT(*) AS total_rows, MIN(FULL_DATE) AS first_date, MAX(FULL_DATE) AS last_date
FROM DIMENSIONS.DIM_DATE;


-- ----------------------------------------------------------------------------
-- DIM_DRUG — SCD Type 2 drug master dimension
-- [IMPROVEMENT #1] EXPIRY_DATE default fixed: TO_DATE() instead of string literal
-- [IMPROVEMENT #5] Cluster key updated to (IS_CURRENT, THERAPEUTIC_GROUP, DOSAGE_FORM)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_DRUG (
    -- Keys
    DRUG_SK                     NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key (system-generated, immutable)',
    DRUG_NK                     VARCHAR(100) NOT NULL                     COMMENT 'Natural key: canonical trade name or drug code from source',
    -- Drug identity
    TRADE_NAME                  VARCHAR(500)   COMMENT 'Official brand/trade name of the drug',
    CANONICAL_INGREDIENT_NAME   VARCHAR(500)   COMMENT 'Standardized INN/USAN active ingredient name',
    REFERENCE_BRAND_NAMES       VARCHAR(2000)  COMMENT 'Semicolon-delimited list of known brand name references',
    REFERENCE_GENERIC_NAMES     VARCHAR(2000)  COMMENT 'Semicolon-delimited list of known generic name references',
    -- Formulation
    DOSAGE_FORM                 VARCHAR(200)   COMMENT 'Physical form: Tablet, Capsule, Syrup, Injection, Cream, etc.',
    ROUTE_OF_ADMINISTRATION     VARCHAR(200)   COMMENT 'Administration route: Oral, IV, Topical, Otic, etc.',
    THERAPEUTIC_GROUP           VARCHAR(300)   COMMENT 'Pharmacological class or ATC therapeutic group',
    IS_COMBINATION              BOOLEAN        COMMENT 'TRUE if drug contains multiple active ingredients',
    COMBINATION_TYPE            VARCHAR(200)   COMMENT 'Combination category: Fixed-dose, Co-packaged, etc.',
    INGREDIENT_COUNT            NUMBER(5,0)    COMMENT 'Number of distinct active ingredients',
    -- Safety profile
    WARNINGS_COUNT              NUMBER(5,0)    COMMENT 'Number of black-box/boxed FDA warnings',
    DRUG_INTERACTIONS_COUNT     NUMBER(6,0)    COMMENT 'Total documented drug-drug interaction records',
    ADVERSE_REACTIONS_COUNT     NUMBER(6,0)    COMMENT 'Total adverse reaction report count',
    INDICATIONS_COUNT           NUMBER(5,0)    COMMENT 'Count of approved therapeutic indications',
    HAS_ADVERSE_REACTION        BOOLEAN        COMMENT '[v3.0 ADDED] TRUE if at least one adverse reaction is on record',
    -- First-record text
    FIRST_WARNING               VARCHAR(4000)  COMMENT 'Text of the primary/first boxed warning',
    FIRST_DRUG_INTERACTION      VARCHAR(4000)  COMMENT 'Text of the first documented drug-drug interaction',
    FIRST_ADVERSE_REACTION      VARCHAR(4000)  COMMENT 'Text of the first adverse reaction description',
    FIRST_INDICATION            VARCHAR(4000)  COMMENT 'Text of the first therapeutic indication',
    -- SCD Type 2 metadata
    EFFECTIVE_DATE              DATE DEFAULT CURRENT_DATE()                        COMMENT 'Date this version of the record became effective',
    EXPIRY_DATE                 DATE DEFAULT TO_DATE('9999-12-31','YYYY-MM-DD')    COMMENT '[v3.0 FIX] Date this version expired; 9999-12-31 = active/current record',
    IS_CURRENT                  BOOLEAN DEFAULT TRUE                               COMMENT 'TRUE = active/current version of this drug record',
    RECORD_VERSION              NUMBER(5,0) DEFAULT 1                              COMMENT 'Version counter for SCD Type 2 history tracking',
    -- Audit
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Source system that provided this drug record',
    STG_BATCH_ID                VARCHAR(100)                              COMMENT 'ETL batch ID from staging for lineage'
)
-- [IMPROVEMENT #5] Better cluster key — matches dominant BI filter patterns
CLUSTER BY (IS_CURRENT, THERAPEUTIC_GROUP, DOSAGE_FORM)
COMMENT = 'Drug master dimension (SCD2): metadata, formulation, and safety profile per drug entity';


-- ----------------------------------------------------------------------------
-- DIM_INGREDIENT — active pharmaceutical ingredients master
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_INGREDIENT (
    INGREDIENT_SK               NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for ingredient',
    INGREDIENT_NK               VARCHAR(200) NOT NULL                     COMMENT 'Natural key: canonical INN/USAN ingredient name',
    INGREDIENT_NAME             VARCHAR(500) NOT NULL                     COMMENT 'Standardized ingredient name (INN preferred)',
    INGREDIENT_CLASS            VARCHAR(200)                              COMMENT 'Pharmacological class (e.g. Beta-blocker, SSRI, ACE-inhibitor)',
    IS_CONTROLLED_SUBSTANCE     BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE if ingredient is a DEA-scheduled controlled substance',
    DEA_SCHEDULE                VARCHAR(20)                               COMMENT 'DEA schedule I through V; NULL if not controlled',
    MECHANISM_OF_ACTION         VARCHAR(2000)                             COMMENT 'Brief mechanism of action description',
    -- Neo4j integration
    NEO4J_NODE_ID               VARCHAR(200)                              COMMENT 'Node identifier exported to Neo4j graph',
    NEO4J_LABELS                VARCHAR(500)                              COMMENT 'Comma-delimited Neo4j node labels (e.g. Ingredient:ActiveAPI)',
    -- Audit
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Source system: RxNorm, DrugBank, etc.'
)
CLUSTER BY (INGREDIENT_CLASS)
COMMENT = 'Active pharmaceutical ingredient master — used for interaction graph and Neo4j integration';


-- ----------------------------------------------------------------------------
-- DIM_PHARMACY — pharmacy master dimension
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_PHARMACY (
    PHARMACY_SK                 NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for pharmacy',
    PHARMACY_NK                 VARCHAR(200) NOT NULL                     COMMENT 'Natural key: pharmacy name or NPI/NCPDP identifier',
    PHARMACY_NAME               VARCHAR(300) NOT NULL                     COMMENT 'Full pharmacy name or chain name',
    PHARMACY_TYPE               VARCHAR(100)                              COMMENT 'Type: Retail, Hospital, Specialty, Mail-Order',
    CITY                        VARCHAR(200)                              COMMENT 'City where pharmacy is located',
    STATE                       VARCHAR(100)                              COMMENT 'State or province',
    COUNTRY                     VARCHAR(100) DEFAULT 'USA'                COMMENT 'Country code or name',
    POSTAL_CODE                 VARCHAR(20)                               COMMENT 'Zip or postal code',
    NPI_NUMBER                  VARCHAR(50)                               COMMENT 'National Provider Identifier (NPI) if applicable',
    NCPDP_ID                    VARCHAR(50)                               COMMENT 'NCPDP pharmacy identifier if applicable',
    IS_ACTIVE                   BOOLEAN DEFAULT TRUE                      COMMENT 'TRUE if pharmacy is currently active',
    -- Audit
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)'
)
CLUSTER BY (CITY, STATE)
COMMENT = 'Pharmacy master dimension with geographic and classification data';


-- ----------------------------------------------------------------------------
-- DIM_PATIENT — HIPAA-compliant de-identified patient dimension
-- No PII is stored here — only tokenized identifiers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_PATIENT (
    PATIENT_SK                  NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for patient (no PII stored)',
    PATIENT_TOKEN               VARCHAR(200) NOT NULL UNIQUE              COMMENT 'Hashed/tokenized patient identifier (HIPAA-safe)',
    AGE_BAND                    VARCHAR(20)                               COMMENT 'Anonymized age band: 18-35, 36-65, 65+',
    GENDER_CODE                 VARCHAR(10)                               COMMENT 'De-identified gender code: M/F/U',
    PATIENT_RISK_TIER           VARCHAR(20)                               COMMENT 'Risk tier: Low / Medium / High / Critical',
    IS_CHRONIC_PATIENT          BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE if patient has a chronic medication history',
    FIRST_SEEN_DATE             DATE                                      COMMENT 'Earliest transaction date observed for this patient',
    LAST_SEEN_DATE              DATE                                      COMMENT 'Most recent transaction date for this patient',
    -- Audit
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    UPDATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record last updated timestamp (UTC)'
)
COMMENT = 'De-identified patient dimension — HIPAA-compliant tokenized patient tracking, no PII';


-- ----------------------------------------------------------------------------
-- DIM_DRUG_INGREDIENT — many-to-many bridge between drugs and ingredients
-- Depends on DIM_DRUG and DIM_INGREDIENT — run those first
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE DIMENSIONS.DIM_DRUG_INGREDIENT (
    DRUG_INGREDIENT_SK          NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for bridge record',
    DRUG_SK                     NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG.DRUG_SK',
    INGREDIENT_SK               NUMBER NOT NULL                           COMMENT 'FK to DIM_INGREDIENT.INGREDIENT_SK',
    IS_PRIMARY_INGREDIENT       BOOLEAN DEFAULT TRUE                      COMMENT 'TRUE if this is the primary active ingredient in the formulation',
    INGREDIENT_STRENGTH         VARCHAR(100)                              COMMENT 'Dosage strength of this ingredient (e.g. 500mg, 0.05%)',
    INGREDIENT_UNIT             VARCHAR(50)                               COMMENT 'Unit of strength: mg, mcg, %, IU, etc.',
    CREATED_AT                  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp (UTC)',
    CONSTRAINT FK_DI_DRUG       FOREIGN KEY (DRUG_SK)       REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    CONSTRAINT FK_DI_INGREDIENT FOREIGN KEY (INGREDIENT_SK) REFERENCES DIMENSIONS.DIM_INGREDIENT(INGREDIENT_SK),
    CONSTRAINT UQ_DRUG_INGREDIENT UNIQUE (DRUG_SK, INGREDIENT_SK)
)
CLUSTER BY (DRUG_SK, INGREDIENT_SK)
COMMENT = 'Many-to-many bridge between drug formulations and their active pharmaceutical ingredients';
