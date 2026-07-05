-- DataDose — Validation SQL, matching the Airflow tasks.

-- 1. Freshness / row summary
SELECT
    COUNT(*)                                                     AS TOTAL_RECORDS,
    SUM(CASE WHEN INTERACTION_FOUND = 'TRUE' THEN 1 ELSE 0 END) AS INTERACTIONS_DETECTED,
    SUM(CASE WHEN HIGH_RISK_PATIENT = 'TRUE' THEN 1 ELSE 0 END) AS HIGH_RISK_PATIENTS,
    MAX(LOAD_TIMESTAMP)                                          AS LAST_WRITE
FROM STAGING.STG_TRANSACTION;

-- 2. Null-rate check, last hour
SELECT
    AVG(CASE WHEN DRUG IS NULL OR DRUG = '' THEN 1.0 ELSE 0.0 END) AS drug_null_rate,
    AVG(CASE WHEN TX_ID IS NULL THEN 1.0 ELSE 0.0 END)             AS tx_id_null_rate
FROM STAGING.STG_TRANSACTION
WHERE LOAD_TIMESTAMP >= DATEADD(hour, -1, CURRENT_TIMESTAMP());

-- 3. Referential integrity FACT -> DIM_DRUG (once promotion has run)
SELECT COUNT(*) AS orphan_fact_rows
FROM   FACTS.FACT_PRESCRIPTION_TRANSACTION f
LEFT JOIN DIMENSIONS.DIM_DRUG d ON f.DRUG_SK = d.DRUG_SK
WHERE  d.DRUG_SK IS NULL;

-- 4. How many staging rows are still waiting to be promoted
SELECT COUNT(*) AS unpromoted_rows
FROM STAGING.STG_TRANSACTION
WHERE IS_PROCESSED = FALSE;
