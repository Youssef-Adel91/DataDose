-- =========================================================
-- DataDose — Staging -> Dimensional Model Promotion
-- Run by src/airflow_checks/load_dimensional_model.py
--
-- Template based on DataDose_Dimensional_Model_Guide.docx's description of
-- DataDoseSchema_v3.sql. VERIFY every column name against the actual DDL
-- before running against production data — the guide describes the design
-- in prose, this file assumes reasonable column names matching that prose.
-- =========================================================

-- 1. Promote new pharmacies (dimension without history tracking).
INSERT INTO DIMENSIONS.DIM_PHARMACY (PHARMACY_ID, PHARMACY_NAME, CITY)
SELECT DISTINCT s.PHARMACY, NULL, s.CITY
FROM STAGING.STG_TRANSACTION s
WHERE s.IS_PROCESSED = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM DIMENSIONS.DIM_PHARMACY p WHERE p.PHARMACY_ID = s.PHARMACY
  );

-- 2. Promote new drugs — SCD2: only insert a new current row if the drug
--    name hasn't been seen before (a real SCD2 CHANGE-DETECTION merge would
--    also compare therapeutic group / warnings and close out the old row;
--    this simplified version only covers brand-new drug names).
INSERT INTO DIMENSIONS.DIM_DRUG (DRUG_NAME, IS_CURRENT, EFFECTIVE_DATE, EXPIRY_DATE)
SELECT DISTINCT s.DRUG, TRUE, CURRENT_DATE(), NULL
FROM STAGING.STG_TRANSACTION s
WHERE s.IS_PROCESSED = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM DIMENSIONS.DIM_DRUG d
      WHERE d.DRUG_NAME = s.DRUG AND d.IS_CURRENT = TRUE
  );

-- 3. Promote new (de-identified) patients. TX_ID and the staging row don't
--    carry a real patient identifier by design (see Step07's enrichment
--    logic) — adjust this if/when a hashed PATIENT_TOKEN is added upstream.
-- (Left as a no-op placeholder until a patient token exists in staging.)

-- 4. Insert fact rows for every unprocessed staging row, resolving
--    surrogate keys via joins to the dimensions just promoted above.
INSERT INTO FACTS.FACT_PRESCRIPTION_TRANSACTION (
    TX_ID, DRUG_SK, PHARMACY_SK, TX_DATE_SK,
    INTERACTION_FOUND, INTERACTION_COUNT, INTERACTION_SEVERITY,
    POLYPHARMACY_FLAG, HIGH_RISK_PATIENT, DRUG_RISK_SCORE, PATIENT_RISK_SCORE
)
SELECT
    s.TX_ID,
    d.DRUG_SK,
    p.PHARMACY_SK,
    dd.DATE_SK,
    s.INTERACTION_FOUND,
    TRY_CAST(s.INTERACTION_COUNT AS INTEGER),
    s.INTERACTION_SEVERITY,
    s.POLYPHARMACY_FLAG,
    s.HIGH_RISK_PATIENT,
    TRY_CAST(s.DRUG_RISK_SCORE AS FLOAT),
    TRY_CAST(s.PATIENT_RISK_SCORE AS FLOAT)
FROM STAGING.STG_TRANSACTION s
JOIN DIMENSIONS.DIM_DRUG d ON d.DRUG_NAME = s.DRUG AND d.IS_CURRENT = TRUE
JOIN DIMENSIONS.DIM_PHARMACY p ON p.PHARMACY_ID = s.PHARMACY
JOIN DIMENSIONS.DIM_DATE dd ON dd.FULL_DATE = CURRENT_DATE()
WHERE s.IS_PROCESSED = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM FACTS.FACT_PRESCRIPTION_TRANSACTION f WHERE f.TX_ID = s.TX_ID
  );

-- 5. Mark staging rows as processed so the next run only picks up new ones.
UPDATE STAGING.STG_TRANSACTION
SET IS_PROCESSED = TRUE
WHERE IS_PROCESSED = FALSE
  AND TX_ID IN (SELECT TX_ID FROM FACTS.FACT_PRESCRIPTION_TRANSACTION);
