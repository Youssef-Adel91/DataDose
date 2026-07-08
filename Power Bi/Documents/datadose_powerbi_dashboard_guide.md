# DataDose Power BI Dashboard Guide
Source: DW.VW_PRESCRIPTION_REPORTING (or DIM_* / FACT_PRESCRIPTION_EVENT with relationships built manually)

## Model setup
Import or DirectQuery these tables, relate on the key columns:

- FACT_PRESCRIPTION_EVENT (fact, grain = one row per transaction)
- DIM_DATE — join on DATE_KEY
- DIM_DRUG — join on DRUG_KEY
- DIM_PHARMACY — join on PHARMACY_KEY
- DIM_INTERACTION_SEVERITY — join on SEVERITY_KEY

Mark DIM_DATE as a Date table (Model view > right-click > Mark as date table > CALENDAR_DATE).
All relationships: one-to-many, single direction, from DIM to FACT.

If you'd rather skip relationship setup, import VW_PRESCRIPTION_REPORTING as one flat table — faster to build, but no drill-through between dims and no separate DIM_DATE for time intelligence unless you split CALENDAR_DATE out.

---

## Core DAX measures
Create these in FACT_PRESCRIPTION_EVENT (or a dedicated Measures table):

```
Total Prescriptions = COUNTROWS(FACT_PRESCRIPTION_EVENT)

New Prescriptions = CALCULATE([Total Prescriptions], FACT_PRESCRIPTION_EVENT[IS_NEW_PRESCRIPTION] = TRUE)

Refill Rate = DIVIDE([Total Prescriptions] - [New Prescriptions], [Total Prescriptions])

Interaction Rate % = DIVIDE(
    CALCULATE([Total Prescriptions], FACT_PRESCRIPTION_EVENT[INTERACTION_FOUND] = TRUE),
    [Total Prescriptions]
)

High Risk Patients = CALCULATE([Total Prescriptions], FACT_PRESCRIPTION_EVENT[HIGH_RISK_PATIENT] = TRUE)

Polypharmacy Rate % = DIVIDE(
    CALCULATE([Total Prescriptions], FACT_PRESCRIPTION_EVENT[POLYPHARMACY_FLAG] = TRUE),
    [Total Prescriptions]
)

Avg Drug Risk Score = AVERAGE(FACT_PRESCRIPTION_EVENT[DRUG_RISK_SCORE])

Avg Patient Risk Score = AVERAGE(FACT_PRESCRIPTION_EVENT[PATIENT_RISK_SCORE])

Avg Meds Per Patient = AVERAGE(FACT_PRESCRIPTION_EVENT[CURRENT_MEDS_COUNT])

Major Interactions = CALCULATE([Total Prescriptions], DIM_INTERACTION_SEVERITY[SEVERITY_NAME] = "Major")

MoM Prescription Growth % =
VAR CurrMonth = [Total Prescriptions]
VAR PrevMonth = CALCULATE([Total Prescriptions], DATEADD(DIM_DATE[CALENDAR_DATE], -1, MONTH))
RETURN DIVIDE(CurrMonth - PrevMonth, PrevMonth)
```

---

## Page 1 — Executive Overview
Purpose: single-glance health of the pipeline and clinical risk exposure.

| Visual | Columns / Measures | Insight |
|---|---|---|
| KPI cards | Total Prescriptions, Interaction Rate %, High Risk Patients, Polypharmacy Rate % | Top-line volume and risk exposure at a glance |
| Line chart | DIM_DATE[CALENDAR_DATE] (axis) x Total Prescriptions (value) | Volume trend, spot spikes/drops in ingestion or prescribing |
| Donut chart | DIM_INTERACTION_SEVERITY[SEVERITY_NAME] x Total Prescriptions | Share of Major/Moderate/Minor/None — how much of the volume carries real risk |
| Card + trend arrow | MoM Prescription Growth % | Momentum, whether volume is accelerating |
| Table (top 5) | DIM_DRUG[DRUG_NAME], Total Prescriptions, Interaction Rate % | Which drugs dominate volume and whether that concentration is risky |

---

## Page 2 — Drug Interaction & Risk Analysis
Purpose: clinical decision support — where the actual danger is.

| Visual | Columns / Measures | Insight |
|---|---|---|
| Bar chart (horizontal) | FACT_PRESCRIPTION_EVENT[INTERACTION_TYPE] x Total Prescriptions | Which interaction mechanism (pharmacodynamic/pharmacokinetic/additive) is most common |
| Matrix | DIM_DRUG[DRUG_NAME] (rows) x DIM_INTERACTION_SEVERITY[SEVERITY_NAME] (columns) x Total Prescriptions (values) | Drug-by-severity heatmap — which specific drugs generate Major interactions |
| Scatter chart | Avg Drug Risk Score (X) x Avg Patient Risk Score (Y), size = Total Prescriptions, DIM_DRUG[DRUG_NAME] as legend/tooltip | Flags drugs that are both high-risk themselves and given to high-risk patients — priority review list |
| Table | FACT_PRESCRIPTION_EVENT[SHARED_INGREDIENT], INGREDIENT_OVERLAP_COUNT, Total Prescriptions | Ingredient-duplication exposure — same active ingredient prescribed under different brand names |
| Card | Major Interactions | Absolute count needing clinical follow-up, not just rate |

---

## Page 3 — Pharmacy Operations
Purpose: where prescriptions originate, geographic and channel patterns.

| Visual | Columns / Measures | Insight |
|---|---|---|
| Map (bubble) | DIM_PHARMACY[CITY], Total Prescriptions (size) | Geographic concentration of prescribing volume |
| Bar chart | DIM_PHARMACY[PHARMACY_ID] (top N by Total Prescriptions) | Highest-volume pharmacies — capacity/monitoring priorities |
| Stacked bar | DIM_PHARMACY[CITY] x DIM_INTERACTION_SEVERITY[SEVERITY_NAME] x Total Prescriptions | Whether interaction risk clusters in specific cities/regions |
| Bar chart | FACT_PRESCRIPTION_EVENT[SOURCE_SYSTEM] x Total Prescriptions | Ingestion split across EHR/POS/mobile — useful for pipeline validation too |

---

## Page 4 — Patient Risk & Polypharmacy
Purpose: population-health view on medication burden.

| Visual | Columns / Measures | Insight |
|---|---|---|
| Histogram (bin CURRENT_MEDS_COUNT) | FACT_PRESCRIPTION_EVENT[CURRENT_MEDS_COUNT] | Distribution of medication load per patient-event; long tail = polypharmacy candidates |
| KPI card + gauge | Polypharmacy Rate %, High Risk Patients | Population-level risk burden |
| Line chart | DIM_DATE[CALENDAR_DATE] (axis, month) x Polypharmacy Rate % | Whether polypharmacy is trending up over time |
| Scatter | Avg Patient Risk Score x Avg Meds Per Patient, size = Total Prescriptions | Correlation check — does higher med count actually track higher risk score |

---

## Page 5 — Time Intelligence / Trend Deep-Dive
Purpose: leverage DIM_DATE for seasonality and day-of-week patterns.

| Visual | Columns / Measures | Insight |
|---|---|---|
| Column chart | DIM_DATE[DAY_NAME] x Total Prescriptions | Day-of-week prescribing pattern (weekday vs weekend load) |
| Column chart | DIM_DATE[MONTH_NAME] x Total Prescriptions, sliced by DIM_DATE[YEAR] | Seasonal patterns, year-over-year comparison |
| Line chart | DIM_DATE[CALENDAR_DATE] x New Prescriptions vs Refill Rate (dual axis) | New-patient acquisition vs existing-patient continuity trend |

---

## Slicers (apply on every page)
- DIM_DATE[CALENDAR_DATE] — date range slicer
- DIM_PHARMACY[CITY]
- DIM_INTERACTION_SEVERITY[SEVERITY_NAME]
- FACT_PRESCRIPTION_EVENT[SOURCE_SYSTEM]

## Design notes
- Use SEVERITY_RANK (not SEVERITY_NAME) for sort order on any severity axis — keeps Major first regardless of alphabetical default.
- HIGH_RISK_PATIENT, POLYPHARMACY_FLAG, ACTIVE_INGREDIENT_MATCH, INTERACTION_FOUND are booleans — good for conditional formatting rules (red icon = TRUE) instead of raw column display.
- Theme: pharma/healthcare palette (deep blue/teal + red for risk flags) — matches the glassmorphism assets already built for this project; reuse those color tokens for consistency across Power BI and the HTML/SVG dashboard pieces.
