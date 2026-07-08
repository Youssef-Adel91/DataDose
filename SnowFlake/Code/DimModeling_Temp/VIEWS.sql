-- Fix COMMENT placement: moved from after WHERE to CREATE VIEW header
-- Co-authored with CoCo
-- =============================================================================
-- BLOCK 9: VIEWS  (all editions — Standard edition compatible)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- V_DRUG_INTERACTION_GRAPH — flattened graph export surface for Neo4j
-- Used as the primary data source for APOC import and neo4j-admin CSV export
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ANALYTICS.V_DRUG_INTERACTION_GRAPH
  COMMENT = 'Flattened drug interaction graph view — primary surface for Neo4j bulk import via APOC or CSV'
AS
SELECT
    d.DRUG_SK,
    d.TRADE_NAME,
    d.CANONICAL_INGREDIENT_NAME,
    d.THERAPEUTIC_GROUP,
    d.DOSAGE_FORM,
    d.ROUTE_OF_ADMINISTRATION,
    d.WARNINGS_COUNT,
    d.DRUG_INTERACTIONS_COUNT,
    d.ADVERSE_REACTIONS_COUNT,
    d.IS_COMBINATION,
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
WHERE d.IS_CURRENT = TRUE;


-- ----------------------------------------------------------------------------
-- V_HIGH_RISK_PRESCRIPTIONS — real-time clinical monitoring view
-- Surfaces high-risk patient transactions for pharmacy alert dashboards
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ANALYTICS.V_HIGH_RISK_PRESCRIPTIONS
  COMMENT = 'Real-time monitoring view for high-risk prescriptions — feeds clinical alert dashboards'
AS
SELECT
    f.TX_SK,
    f.TX_ID,
    f.TX_DATE_SK,
    dd.FULL_DATE                   AS TX_DATE,
    d.TRADE_NAME                   AS DRUG_NAME,
    d.CANONICAL_INGREDIENT_NAME,
    d.THERAPEUTIC_GROUP,
    d.WARNINGS_COUNT               AS DRUG_WARNING_COUNT,
    p.PHARMACY_NAME,
    p.CITY,
    p.STATE,
    p.PHARMACY_TYPE,
    f.IS_NEW_PRESCRIPTION,
    f.CURRENT_MEDS_COUNT,
    f.POLYPHARMACY_FLAG,
    f.INTERACTION_FOUND,
    f.INTERACTION_COUNT,
    f.INTERACTION_SEVERITY,
    f.INTERACTING_DRUGS,
    f.SHARED_INGREDIENT,
    f.DRUG_RISK_SCORE,
    f.PATIENT_RISK_SCORE,
    f.HIGH_RISK_PATIENT,
    f.LOAD_TIMESTAMP
FROM FACTS.FACT_PRESCRIPTION_TRANSACTION f
JOIN DIMENSIONS.DIM_DRUG      d  ON f.DRUG_SK     = d.DRUG_SK     AND d.IS_CURRENT = TRUE
JOIN DIMENSIONS.DIM_PHARMACY  p  ON f.PHARMACY_SK = p.PHARMACY_SK
JOIN DIMENSIONS.DIM_DATE      dd ON f.TX_DATE_SK  = dd.DATE_SK
WHERE f.HIGH_RISK_PATIENT = TRUE
   OR f.INTERACTION_SEVERITY = 'Major'
   OR f.POLYPHARMACY_FLAG    = TRUE;


-- ----------------------------------------------------------------------------
-- V_DRUG_SAFETY_SUMMARY — pre-aggregated safety KPI view
-- [IMPROVEMENT #10] New view — feeds Power BI KPI cards without expensive live aggregation
-- Includes all base measures equivalent to the Power BI DAX measure file
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ANALYTICS.V_DRUG_SAFETY_SUMMARY
  COMMENT = '[v3.0 NEW] Pre-aggregated drug safety KPI view — feeds Power BI cards without live aggregation'
AS
SELECT
    d.TRADE_NAME,
    d.THERAPEUTIC_GROUP,
    d.DOSAGE_FORM,
    d.ROUTE_OF_ADMINISTRATION,
    d.IS_COMBINATION,
    d.COMBINATION_TYPE,
    d.INGREDIENT_COUNT,
    -- Safety counts
    d.WARNINGS_COUNT,
    d.DRUG_INTERACTIONS_COUNT,
    d.ADVERSE_REACTIONS_COUNT,
    d.INDICATIONS_COUNT,
    d.HAS_ADVERSE_REACTION,
    -- Composite risk score — mirrors Power BI DAX: Risk_Score formula
    -- (warnings * 0.4) + (interactions * 0.4) + (adverse_reactions * 0.2)
    ROUND(
        (COALESCE(d.WARNINGS_COUNT, 0)              * 0.4) +
        (COALESCE(d.DRUG_INTERACTIONS_COUNT, 0)     * 0.4) +
        (COALESCE(d.ADVERSE_REACTIONS_COUNT, 0)     * 0.2),
    4)                                              AS RISK_SCORE,
    -- Total safety burden (mirrors Power BI: Total_Safety_Burden)
    (COALESCE(d.WARNINGS_COUNT, 0) +
     COALESCE(d.DRUG_INTERACTIONS_COUNT, 0) +
     COALESCE(d.ADVERSE_REACTIONS_COUNT, 0))        AS TOTAL_SAFETY_BURDEN,
    -- First-record text fields
    d.FIRST_WARNING,
    d.FIRST_DRUG_INTERACTION,
    d.FIRST_ADVERSE_REACTION,
    d.FIRST_INDICATION,
    -- SCD2 metadata
    d.EFFECTIVE_DATE,
    d.IS_CURRENT,
    d.RECORD_VERSION,
    d.SOURCE_SYSTEM,
    d.UPDATED_AT
FROM DIMENSIONS.DIM_DRUG d
WHERE d.IS_CURRENT = TRUE;
