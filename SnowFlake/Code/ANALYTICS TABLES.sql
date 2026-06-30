-- =============================================================================
-- BLOCK 6: ANALYTICS TABLES
-- Precomputed aggregations refreshed by scheduled PySpark or Snowflake Task jobs
-- =============================================================================

-- ----------------------------------------------------------------------------
-- DRUG_INTERACTION_SUMMARY — interaction pair aggregation and Neo4j export source
-- [IMPROVEMENT #9] Unique constraint added on (DRUG_A_SK, DRUG_B_SK)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE ANALYTICS.DRUG_INTERACTION_SUMMARY (
    INTERACTION_SUMMARY_SK      NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    DRUG_A_SK                   NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG — first drug in the interaction pair',
    DRUG_B_SK                   NUMBER NOT NULL                           COMMENT 'FK to DIM_DRUG — second drug in the interaction pair',
    DRUG_A_NAME                 VARCHAR(500)                              COMMENT 'Drug A trade name (denormalized for query performance)',
    DRUG_B_NAME                 VARCHAR(500)                              COMMENT 'Drug B trade name (denormalized for query performance)',
    SHARED_INGREDIENT           VARCHAR(500)                              COMMENT 'Ingredient responsible for the interaction',
    INTERACTION_TYPE            VARCHAR(200)                              COMMENT 'Mechanism: PK / PD / Additive / Synergistic',
    INTERACTION_SEVERITY        VARCHAR(50)                               COMMENT 'Severity: Major / Moderate / Minor',
    OBSERVED_TX_COUNT           NUMBER(10,0) DEFAULT 0                    COMMENT 'Transactions where this drug pair co-occurred',
    AVG_DRUG_RISK_SCORE         NUMBER(10,4)                              COMMENT 'Average drug risk score when pair is co-prescribed',
    INTERACTION_RATE            NUMBER(10,6)                              COMMENT 'Rate of this pair interaction across all transactions',
    FIRST_OBSERVED_DATE         DATE                                      COMMENT 'Earliest date this interaction pair was observed',
    LAST_OBSERVED_DATE          DATE                                      COMMENT 'Most recent date this interaction pair was observed',
    -- Neo4j export metadata
    NEO4J_REL_TYPE              VARCHAR(100) DEFAULT 'INTERACTS_WITH'     COMMENT 'Neo4j relationship type for graph export',
    NEO4J_EXPORTED_AT           TIMESTAMP_NTZ                             COMMENT 'Last timestamp this record was exported to Neo4j',
    COMPUTED_AT                 TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Timestamp when this summary was computed (UTC)',
    STG_BATCH_ID                VARCHAR(100)                              COMMENT 'Source ETL batch ID',
    CONSTRAINT FK_DIS_DRUG_A    FOREIGN KEY (DRUG_A_SK) REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    CONSTRAINT FK_DIS_DRUG_B    FOREIGN KEY (DRUG_B_SK) REFERENCES DIMENSIONS.DIM_DRUG(DRUG_SK),
    -- [IMPROVEMENT #9] Prevent duplicate interaction pairs in the summary
    CONSTRAINT UQ_INTERACTION_PAIR UNIQUE (DRUG_A_SK, DRUG_B_SK)
)
CLUSTER BY (INTERACTION_SEVERITY, DRUG_A_SK, DRUG_B_SK)
COMMENT = 'Precomputed drug interaction pair summary for BI dashboards and Neo4j graph export';


-- ----------------------------------------------------------------------------
-- PHARMACY_RISK_SUMMARY — daily pharmacy-level risk rollup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE ANALYTICS.PHARMACY_RISK_SUMMARY (
    PHARMACY_RISK_SK            NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    PHARMACY_SK                 NUMBER NOT NULL                           COMMENT 'FK to DIM_PHARMACY',
    SUMMARY_DATE_SK             NUMBER NOT NULL                           COMMENT 'FK to DIM_DATE',
    PHARMACY_NAME               VARCHAR(300)                              COMMENT 'Pharmacy name (denormalized)',
    CITY                        VARCHAR(200)                              COMMENT 'City (denormalized)',
    TOTAL_PRESCRIPTIONS         NUMBER(12,0) DEFAULT 0                    COMMENT 'Total prescription fills on this date',
    TOTAL_INTERACTIONS_DETECTED NUMBER(12,0) DEFAULT 0                    COMMENT 'Total interactions detected across all fills',
    HIGH_RISK_PATIENT_COUNT     NUMBER(10,0) DEFAULT 0                    COMMENT 'Unique high-risk patients on this date',
    POLYPHARMACY_PATIENT_COUNT  NUMBER(10,0) DEFAULT 0                    COMMENT 'Patients flagged for polypharmacy on this date',
    AVG_PATIENT_RISK_SCORE      NUMBER(10,4)                              COMMENT 'Average patient risk score across all fills',
    AVG_DRUG_RISK_SCORE         NUMBER(10,4)                              COMMENT 'Average drug risk score across all fills',
    INTERACTION_RATE            NUMBER(10,6)                              COMMENT 'Pharmacy-level interaction rate for this date',
    MAJOR_INTERACTION_COUNT     NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of Major severity interactions',
    MODERATE_INTERACTION_COUNT  NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of Moderate severity interactions',
    MINOR_INTERACTION_COUNT     NUMBER(10,0) DEFAULT 0                    COMMENT 'Count of Minor severity interactions',
    COMPUTED_AT                 TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Computation timestamp (UTC)',
    CONSTRAINT FK_PRS_PHARMACY  FOREIGN KEY (PHARMACY_SK)     REFERENCES DIMENSIONS.DIM_PHARMACY(PHARMACY_SK),
    CONSTRAINT FK_PRS_DATE      FOREIGN KEY (SUMMARY_DATE_SK) REFERENCES DIMENSIONS.DIM_DATE(DATE_SK)
)
CLUSTER BY (SUMMARY_DATE_SK, PHARMACY_SK)
COMMENT = 'Daily pharmacy-level risk aggregation — feeds pharmacy monitoring dashboards';


-- ----------------------------------------------------------------------------
-- PATIENT_RISK_PROFILE — longitudinal patient risk snapshot per date
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE ANALYTICS.PATIENT_RISK_PROFILE (
    PATIENT_RISK_SK             NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    PATIENT_SK                  NUMBER NOT NULL                           COMMENT 'FK to DIM_PATIENT',
    PROFILE_DATE_SK             NUMBER NOT NULL                           COMMENT 'FK to DIM_DATE',
    CURRENT_MEDS_COUNT          NUMBER(5,0)                               COMMENT 'Active medications at profile date',
    POLYPHARMACY_FLAG           BOOLEAN                                   COMMENT 'TRUE if current meds >= polypharmacy threshold',
    HIGH_RISK_PATIENT           BOOLEAN                                   COMMENT 'TRUE if patient meets high-risk classification',
    PATIENT_RISK_SCORE          NUMBER(10,4)                              COMMENT 'Composite patient risk score at profile date (0.0–100.0)',
    TOTAL_INTERACTIONS_EVER     NUMBER(10,0) DEFAULT 0                    COMMENT 'Cumulative interactions detected in patient history',
    DISTINCT_DRUGS_PRESCRIBED   NUMBER(10,0) DEFAULT 0                    COMMENT 'Distinct drugs prescribed to patient up to profile date',
    MAX_INTERACTION_SEVERITY    VARCHAR(50)                               COMMENT 'Highest severity interaction ever recorded for patient',
    COMPUTED_AT                 TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Computation timestamp (UTC)',
    CONSTRAINT FK_PRP_PATIENT   FOREIGN KEY (PATIENT_SK)      REFERENCES DIMENSIONS.DIM_PATIENT(PATIENT_SK),
    CONSTRAINT FK_PRP_DATE      FOREIGN KEY (PROFILE_DATE_SK) REFERENCES DIMENSIONS.DIM_DATE(DATE_SK)
)
CLUSTER BY (PROFILE_DATE_SK, PATIENT_SK)
COMMENT = 'Longitudinal patient risk profile for trend analysis and patient monitoring dashboards';


-- ----------------------------------------------------------------------------
-- NEO4J_EXPORT_LOG — audit trail for all Snowflake → Neo4j export runs
-- [IMPROVEMENT #7] New table — enables idempotent exports and run-level auditing
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TABLE ANALYTICS.NEO4J_EXPORT_LOG (
    EXPORT_LOG_SK               NUMBER AUTOINCREMENT PRIMARY KEY          COMMENT 'Surrogate key',
    EXPORT_TIMESTAMP            TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'UTC timestamp when the export run started',
    EXPORT_TYPE                 VARCHAR(100)                              COMMENT 'Export category: DRUG_NODE, INGREDIENT_NODE, INTERACTION_REL, PHARMACY_NODE, PATIENT_NODE',
    RECORD_COUNT                NUMBER(12,0)                              COMMENT 'Number of records exported in this run',
    TARGET_NEO4J_INSTANCE       VARCHAR(200)                              COMMENT 'Target Neo4j database URI or environment alias',
    EXPORT_STATUS               VARCHAR(50)                               COMMENT 'Run status: SUCCESS, PARTIAL, FAILED',
    ERROR_MESSAGE               VARCHAR(4000)                             COMMENT 'Error detail if status is FAILED or PARTIAL; NULL on SUCCESS',
    BATCH_ID                    VARCHAR(100)                              COMMENT 'ETL batch ID for lineage back to staging'
)
COMMENT = 'Audit log for all data export runs from Snowflake to Neo4j graph database — v3.0 new table';
