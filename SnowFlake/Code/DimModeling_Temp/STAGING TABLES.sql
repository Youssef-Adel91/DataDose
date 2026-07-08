-- STG_DRUG_METADATA
-- ----------------------------------------------------------------------------
-- STG_DRUG_METADATA
-- Landing zone for drug metadata from FDA API, RxNorm, DrugBank, etc.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE STAGING.STG_DRUG_METADATA (
    STG_ID                      NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Staging surrogate key (auto-generated)',
    BATCH_ID                    VARCHAR(100)                              COMMENT 'ETL batch identifier for incremental loading',
    LOAD_TIMESTAMP              TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC timestamp when record was loaded into staging',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Origin system or file name (e.g. FDA_API, RxNorm, CSV_LOAD)',
    IS_PROCESSED                BOOLEAN DEFAULT FALSE                     COMMENT 'Set TRUE after record is promoted to dimension tables',
    -- Drug identity
    DOSAGE_FORM                 VARCHAR(200)   COMMENT 'Raw dosage form string (e.g. Tablet, Capsule, Injection, Cream)',
    THERAPEUTIC_GROUP           VARCHAR(300)   COMMENT '[v3.0 ADDED] Drug therapeutic class or ATC group — maps to DIM_DRUG.THERAPEUTIC_GROUP',
    ROUTE_OF_ADMINISTRATION     VARCHAR(200)   COMMENT 'Administration route (e.g. Oral, IV, Topical, Otic)',
    INGREDIENT_COUNT            VARCHAR(20)    COMMENT 'Number of active ingredients (raw string — cast on promotion)',
    IS_COMBINATION              VARCHAR(10)    COMMENT 'Combination drug flag (raw: True/False/1/0)',
    COMBINATION_TYPE            VARCHAR(200)   COMMENT 'Combination category (e.g. Fixed-dose, Co-packaged)',
    TRADE_NAME                  VARCHAR(500)   COMMENT 'Brand/trade name of the drug as received from source',
    CANONICAL_INGREDIENT_NAME   VARCHAR(500)   COMMENT 'Standardized active ingredient name (INN/USAN)',
    REFERENCE_BRAND_NAMES       VARCHAR(2000)  COMMENT 'Pipe-delimited list of brand name references',
    REFERENCE_GENERIC_NAMES     VARCHAR(2000)  COMMENT 'Pipe-delimited list of generic name references',
    -- Safety counts (raw strings)
    WARNINGS_COUNT              VARCHAR(20)    COMMENT 'Total number of boxed/black-box warnings (raw string)',
    DRUG_INTERACTIONS_COUNT     VARCHAR(20)    COMMENT 'Total documented drug-drug interaction records (raw string)',
    ADVERSE_REACTIONS_COUNT     VARCHAR(20)    COMMENT 'Total adverse reaction entry count (raw string)',
    INDICATIONS_COUNT           VARCHAR(20)    COMMENT 'Total therapeutic indication entries (raw string)',
    HAS_ADVERSE_REACTION        VARCHAR(10)    COMMENT '[v3.0 ADDED] Flag: 1/0 or True/False — has at least one adverse reaction entry',
    -- First-record text fields
    FIRST_WARNING               VARCHAR(4000)  COMMENT 'Text of the primary/first boxed warning',
    FIRST_DRUG_INTERACTION      VARCHAR(4000)  COMMENT 'Text of the first documented drug-drug interaction',
    FIRST_ADVERSE_REACTION      VARCHAR(4000)  COMMENT 'Text of the first adverse reaction description',
    FIRST_INDICATION            VARCHAR(4000)  COMMENT 'Text of the first therapeutic indication',
    -- Lineage
    RAW_RECORD                  VARIANT        COMMENT 'Full raw JSON payload for lineage and debugging'
)
CLUSTER BY (LOAD_TIMESTAMP, SOURCE_SYSTEM)
COMMENT = 'Staging table for raw drug metadata — v3.0: added THERAPEUTIC_GROUP, HAS_ADVERSE_REACTION';


-- ----------------------------------------------------------------------------
-- STG_TRANSACTION
-- Landing zone for prescription transaction data from pharmacy systems
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE STAGING.STG_TRANSACTION (
    STG_ID                      NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Staging surrogate key',
    BATCH_ID                    VARCHAR(100)                              COMMENT 'ETL batch identifier',
    LOAD_TIMESTAMP              TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC load timestamp',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Source system identifier',
    IS_PROCESSED                BOOLEAN DEFAULT FALSE                     COMMENT 'TRUE once promoted to fact table',
    -- Transaction fields (all raw VARCHAR)
    TX_ID                       VARCHAR(100)   COMMENT 'Source transaction/prescription identifier',
    PHARMACY                    VARCHAR(300)   COMMENT 'Pharmacy name or NPI identifier',
    CITY                        VARCHAR(200)   COMMENT 'City where prescription was dispensed',
    IS_NEW_PRESCRIPTION         VARCHAR(10)    COMMENT 'New vs refill flag (raw: New/Refill/1/0)',
    DRUG                        VARCHAR(500)   COMMENT 'Drug name as recorded in the transaction',
    CURRENT_MEDS                VARCHAR(4000)  COMMENT 'Pipe-delimited list of patient current medications',
    INTERACTION_FOUND           VARCHAR(10)    COMMENT 'Whether an interaction was detected (raw Boolean)',
    INTERACTION_COUNT           VARCHAR(20)    COMMENT 'Number of interactions detected (raw int)',
    INTERACTING_DRUGS           VARCHAR(2000)  COMMENT 'Pipe-delimited interacting drug pairs',
    INTERACTION_SEVERITY        VARCHAR(50)    COMMENT 'Severity label (Major/Moderate/Minor)',
    INTERACTION_TYPE            VARCHAR(200)   COMMENT 'Mechanism type (PK/PD/Additive/Synergistic)',
    ACTIVE_INGREDIENT_MATCH     VARCHAR(10)    COMMENT 'Active ingredient matched a known interaction (raw Boolean)',
    SHARED_INGREDIENT           VARCHAR(500)   COMMENT 'Shared ingredient name causing the overlap',
    INGREDIENT_OVERLAP_COUNT    VARCHAR(20)    COMMENT 'Count of overlapping ingredients (raw int)',
    CURRENT_MEDS_COUNT          VARCHAR(20)    COMMENT 'Count of current medications (raw int)',
    POLYPHARMACY_FLAG           VARCHAR(10)    COMMENT 'Polypharmacy flag: TRUE if current_meds >= 5',
    HIGH_RISK_PATIENT           VARCHAR(10)    COMMENT 'High-risk patient flag (raw Boolean)',
    DRUG_RISK_SCORE             VARCHAR(20)    COMMENT 'Drug-level risk score 0–100 (raw float)',
    PATIENT_RISK_SCORE          VARCHAR(20)    COMMENT 'Patient-level risk score 0–100 (raw float)',
    INTERACTION_RATE            VARCHAR(20)    COMMENT 'Interaction rate ratio (raw float)',
    -- Lineage
    RAW_RECORD                  VARIANT        COMMENT 'Full raw JSON payload for lineage'
)
CLUSTER BY (LOAD_TIMESTAMP, PHARMACY, CITY)
COMMENT = 'Staging table for raw prescription transaction data from PySpark ETL pipelines';
