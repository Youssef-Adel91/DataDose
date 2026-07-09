/* ============================================================================
   ONE-TIME SEED SCRIPT — 10,000 synthetic rows into STAGING.STG_TRANSACTION
   Purpose: populate DW star schema with sample data for Power BI testing.
   Safe to run once. Re-running adds another 10,000 rows (TX_ID is unique
   per run via UUID, so no collisions with FACT_PRESCRIPTION_EVENT dedupe).
   ============================================================================ */

USE DATABASE PHARMA_ANALYTICS_DB;
-- USE ROLE PYSPARK_ROLE;
USE SCHEMA STAGING;

INSERT INTO STAGING.STG_TRANSACTION (
    TX_ID, DRUG, PHARMACY, CITY, INTERACTION_SEVERITY,
    SOURCE_SYSTEM, BATCH_ID, IS_NEW_PRESCRIPTION, CURRENT_MEDS_COUNT,
    INTERACTION_FOUND, INTERACTION_COUNT, INTERACTING_DRUGS, INTERACTION_TYPE,
    ACTIVE_INGREDIENT_MATCH, SHARED_INGREDIENT, INGREDIENT_OVERLAP_COUNT,
    POLYPHARMACY_FLAG, HIGH_RISK_PATIENT, DRUG_RISK_SCORE, PATIENT_RISK_SCORE,
    INTERACTION_RATE, LOAD_TIMESTAMP, IS_PROCESSED
)
SELECT
    UUID_STRING()                                                          AS TX_ID,

    ARRAY_CONSTRUCT('Metformin','Atorvastatin','Lisinopril','Amlodipine',
        'Omeprazole','Metoprolol','Losartan','Albuterol','Gabapentin',
        'Sertraline','Ibuprofen','Warfarin','Levothyroxine','Amoxicillin',
        'Hydrochlorothiazide','Simvastatin','Clopidogrel','Furosemide',
        'Prednisone','Insulin Glargine')[UNIFORM(0,19,RANDOM())]::VARCHAR  AS DRUG,

    'PH-' || LPAD(UNIFORM(1,150,RANDOM())::VARCHAR, 4, '0')                AS PHARMACY,

    ARRAY_CONSTRUCT('Cairo','Giza','Alexandria','Mansoura','Tanta',
        'Aswan','Luxor','Zagazig','Ismailia','Suez')[UNIFORM(0,9,RANDOM())]::VARCHAR AS CITY,

    ARRAY_CONSTRUCT('Major','Moderate','Minor','None','Unknown')[UNIFORM(0,4,RANDOM())]::VARCHAR AS INTERACTION_SEVERITY,

    ARRAY_CONSTRUCT('EHR_A','EHR_B','PharmacyPOS','MobileApp')[UNIFORM(0,3,RANDOM())]::VARCHAR AS SOURCE_SYSTEM,

    'BATCH-SEED-' || TO_CHAR(CURRENT_DATE(), 'YYYYMMDD')                   AS BATCH_ID,

    ARRAY_CONSTRUCT('New','Refill')[UNIFORM(0,1,RANDOM())]::VARCHAR        AS IS_NEW_PRESCRIPTION,

    UNIFORM(1,12,RANDOM())::VARCHAR                                        AS CURRENT_MEDS_COUNT,

    ARRAY_CONSTRUCT('TRUE','FALSE')[UNIFORM(0,1,RANDOM())]::VARCHAR        AS INTERACTION_FOUND,

    UNIFORM(0,4,RANDOM())::VARCHAR                                         AS INTERACTION_COUNT,

    ARRAY_CONSTRUCT('Warfarin,Aspirin','Metformin,Contrast Dye',
        'Simvastatin,Clarithromycin','Lisinopril,Spironolactone',
        NULL)[UNIFORM(0,4,RANDOM())]::VARCHAR                              AS INTERACTING_DRUGS,

    ARRAY_CONSTRUCT('Pharmacodynamic','Pharmacokinetic','Additive Toxicity',
        'None')[UNIFORM(0,3,RANDOM())]::VARCHAR                            AS INTERACTION_TYPE,

    ARRAY_CONSTRUCT('TRUE','FALSE')[UNIFORM(0,1,RANDOM())]::VARCHAR        AS ACTIVE_INGREDIENT_MATCH,

    ARRAY_CONSTRUCT('Acetaminophen','Ibuprofen','Metformin HCl',
        NULL)[UNIFORM(0,3,RANDOM())]::VARCHAR                              AS SHARED_INGREDIENT,

    UNIFORM(0,3,RANDOM())::VARCHAR                                         AS INGREDIENT_OVERLAP_COUNT,

    ARRAY_CONSTRUCT('TRUE','FALSE')[UNIFORM(0,1,RANDOM())]::VARCHAR        AS POLYPHARMACY_FLAG,

    ARRAY_CONSTRUCT('TRUE','FALSE')[UNIFORM(0,1,RANDOM())]::VARCHAR        AS HIGH_RISK_PATIENT,

    ROUND(UNIFORM(0::FLOAT, 100::FLOAT, RANDOM()), 2)::VARCHAR             AS DRUG_RISK_SCORE,

    ROUND(UNIFORM(0::FLOAT, 100::FLOAT, RANDOM()), 2)::VARCHAR             AS PATIENT_RISK_SCORE,

    ROUND(UNIFORM(0::FLOAT, 1::FLOAT, RANDOM()), 4)::VARCHAR               AS INTERACTION_RATE,

    DATEADD(second, MOD(ABS(RANDOM()), DATEDIFF(second, '2023-01-01'::TIMESTAMP_NTZ, CURRENT_TIMESTAMP())), '2023-01-01'::TIMESTAMP_NTZ) AS LOAD_TIMESTAMP,

    'FALSE'                                                                AS IS_PROCESSED
FROM TABLE(GENERATOR(ROWCOUNT => 10000));

-- Confirm insert
SELECT COUNT(*) AS SEEDED_ROWS FROM STAGING.STG_TRANSACTION WHERE BATCH_ID = 'BATCH-SEED-' || TO_CHAR(CURRENT_DATE(), 'YYYYMMDD');

/* ----------------------------------------------------------------------
   Run the existing ETL to push these rows through the star schema.
   ---------------------------------------------------------------------- */
USE SCHEMA DW;
CALL DW.SP_LOAD_DIM_MODEL();

-- Sanity checks after load
SELECT COUNT(*) AS FACT_ROWS FROM DW.FACT_PRESCRIPTION_EVENT;
SELECT COUNT(*) AS DRUG_ROWS FROM DW.DIM_DRUG;
SELECT COUNT(*) AS PHARMACY_ROWS FROM DW.DIM_PHARMACY;