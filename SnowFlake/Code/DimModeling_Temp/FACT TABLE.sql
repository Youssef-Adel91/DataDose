-- =============================================================================
-- BLOCK 5: FACT TABLE
-- Grain: one prescription dispensing event
-- Depends on ALL dimension tables above — run after Block 4 completes
-- =============================================================================

CREATE OR REPLACE TABLE FACTS.FACT_PRESCRIPTION_TRANSACTION (
    -- Surrogate key
    TX_SK                       NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key for transaction fact',
    TX_ID                       VARCHAR(100) NOT NULL                     COMMENT 'Natural key: source transaction/prescription identifier',
    -- Foreign keys to dimensions
    DRUG_SK                     NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG — drug dispensed in this transaction',
    PHARMACY_SK                 NUMBER NOT NULL                           COMMENT 'FK to DIM_PHARMACY — pharmacy that dispensed the prescription',
    PATIENT_SK                  NUMBER                                    COMMENT 'FK to DIM_PATIENT — patient receiving prescription (nullable)',
    TX_DATE_SK                  NUMBER                                    COMMENT 'FK to DIM_DATE — date of transaction (YYYYMMDD int)',
    LOAD_DATE_SK                NUMBER                                    COMMENT 'FK to DIM_DATE — date this record was loaded by ETL',
    -- Transaction measures
    IS_NEW_PRESCRIPTION         BOOLEAN                                   COMMENT 'TRUE = new Rx; FALSE = refill',
    DRUG_NAME_AS_DISPENSED      VARCHAR(500)                              COMMENT 'Drug name exactly as recorded at the point of dispensing',
    CURRENT_MEDS                VARCHAR(4000)                             COMMENT 'Semicolon-delimited current medications at time of fill',
    CURRENT_MEDS_COUNT          NUMBER(5,0)                               COMMENT 'Count of current medications at time of fill',
    POLYPHARMACY_FLAG           BOOLEAN                                   COMMENT 'TRUE if current medications >= 5',
    -- Interaction detection
    INTERACTION_FOUND           BOOLEAN                                   COMMENT 'TRUE if at least one drug interaction was detected',
    INTERACTION_COUNT           NUMBER(5,0) DEFAULT 0                     COMMENT 'Number of unique drug interactions detected',
    INTERACTING_DRUGS           VARCHAR(2000)                             COMMENT 'Semicolon-delimited list of interacting drug pairs',
    INTERACTION_SEVERITY        VARCHAR(50)                               COMMENT 'Highest severity: Major / Moderate / Minor / None',
    INTERACTION_TYPE            VARCHAR(200)                              COMMENT 'Primary interaction mechanism: PK / PD / Additive / Synergistic',
    ACTIVE_INGREDIENT_MATCH     BOOLEAN                                   COMMENT 'TRUE if active ingredient matched a known interaction record',
    SHARED_INGREDIENT           VARCHAR(500)                              COMMENT 'Shared ingredient name causing the overlap',
    INGREDIENT_OVERLAP_COUNT    NUMBER(5,0) DEFAULT 0                     COMMENT 'Count of overlapping ingredients across current medications',
    -- Risk measures
    HIGH_RISK_PATIENT           BOOLEAN                                   COMMENT 'TRUE if patient meets high-risk risk-score threshold',
    DRUG_RISK_SCORE             NUMBER(10,4)                              COMMENT 'Drug-level risk score: 0.0 to 100.0',
    PATIENT_RISK_SCORE          NUMBER(10,4)                              COMMENT 'Aggregate patient-level risk score: 0.0 to 100.0',
    INTERACTION_RATE            NUMBER(10,6)                              COMMENT 'Ratio of interactions to total medications in patient profile',
    -- Audit
    LOAD_TIMESTAMP              TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC timestamp when record was loaded into fact table',
    STG_BATCH_ID                VARCHAR(100)                              COMMENT 'ETL batch ID from staging for lineage',
    SOURCE_SYSTEM               VARCHAR(100)                              COMMENT 'Origin system identifier',
    -- Foreign key constraints (informational in Snowflake — enforced by ETL)
    CONSTRAINT FK_FPT_DRUG      FOREIGN KEY (DRUG_SK)      REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    CONSTRAINT FK_FPT_PHARMACY  FOREIGN KEY (PHARMACY_SK)  REFERENCES DIMENSIONS.DIM_PHARMACY(PHARMACY_SK),
    CONSTRAINT FK_FPT_PATIENT   FOREIGN KEY (PATIENT_SK)   REFERENCES DIMENSIONS.DIM_PATIENT(PATIENT_SK),
    CONSTRAINT FK_FPT_DATE      FOREIGN KEY (TX_DATE_SK)   REFERENCES DIMENSIONS.DIM_DATE(DATE_SK),
    CONSTRAINT FK_FPT_LDATE     FOREIGN KEY (LOAD_DATE_SK) REFERENCES DIMENSIONS.DIM_DATE(DATE_SK)
)
CLUSTER BY (TX_DATE_SK, PHARMACY_SK, INTERACTION_SEVERITY)
COMMENT = 'Central prescription transaction fact table. Grain: one dispensing event per prescription fill.';

