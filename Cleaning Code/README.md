# Cleaning & Pipeline Notebooks 

This directory documents the data cleaning and enrichment notebooks used to transform raw DataDose inputs into cleaned, validated, and reference-enriched ingredient and tradename datasets.

---

**Table of Contents**

- Overview
- Notebooks
- Pipeline Order
- Setup & External Dependencies
- Inputs and Outputs (formats & locations)
- Known Limitations and Manual Steps

---

## Overview

This collection of notebooks performs initial dataset standardization, active-ingredient cleaning and verification, FDA enrichment (via external APIs), tradename cleaning and validation, and CSV merge utilities. The goal is to convert raw product rows into normalized ingredient strings, confirm pharmaceutical ingredients against reference sources, and produce CSV/JSON outputs that downstream processes can consume.

---

## Notebooks

| Notebook | Purpose | Input | Output |
|---|---|---:|---|
| [Cleaning Code/01_DataDose_Initial_Cleaning.ipynb](Cleaning Code/01_DataDose_Initial_Cleaning.ipynb#L1) | Load raw DataDose CSV, drop unused columns, normalize textual columns (lowercase/strip), and standardize the `form` (dosage form) field into a `form_standardized` category. | `INPUT_FILE` variable, set in notebook to `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset.csv"` (notebook variable `INPUT_FILE`). | `OUTPUT_FILE` variable, set to `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset_Cleaned.csv"` (CSV written by `df_clean.to_csv(...)`). |
| [Cleaning Code/02_Active_Ingredient_Cleaning_and_Verification.ipynb](Cleaning Code/02_Active_Ingredient_Cleaning_and_Verification.ipynb#L1) | Two-stage pipeline: (1) clean and normalize raw active ingredient text into canonicalized combinations separated by ` + ` (function `clean_active_ingredient`), (2) verification helpers for fuzzy matching and LLM-assisted checks. Writes cleaned ingredient CSV. | Reads `INPUT_FILE` variable: `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset.csv"` (notebook). Expects an ingredient column such as `activeingredient`, `ActiveIngredient`, `ingredients`, etc. | `CLEANED_CSV` variable: `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset_ActiveIngredient_Cleaned.csv"` (CSV). Also produces intermediate `df_valid` in memory. |
| [Cleaning Code/03_FDA_Enrichment.ipynb](Cleaning Code/03_FDA_Enrichment.ipynb#L1) | Extract unique ingredients from a cleaned-ingredients CSV, validate/canonicalize using an LLM (Groq) and query OpenFDA for drug metadata. Provides functions to filter confirmed drugs and export CSV/JSON results. | Expects `CLEANED_CSV` variable: `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset_ActiveIngredient_Cleaned.csv"`. | `OUTPUT_CSV` (`ingredients_fda_results.csv`) and `OUTPUT_JSON` (`ingredients_fda_results.json`) under `BASE_DIR`. Also writes `PROGRESS_FILE` and `LOG_FILE` if used. |
| [Cleaning Code/04_Tradename_Cleaning_and_Validation.ipynb](Cleaning Code/04_Tradename_Cleaning_and_Validation.ipynb#L1) | Remove dosage-form and pack-count text from brand/trade names (regex cleaning), then optionally validate cleaned trade names via an LLM. Provides pipeline to sample rows and export validated tradenames as CSV/JSON. | `INPUT_CSV` variable (notebook default `"/content/drive/MyDrive/DataDoseClean/Tradename Clean/DataDoseDataset_FinalV.csv"`). Expects tradename column named one of `tradename`, `trade_name`, `brand_name`, `brandname`. | `OUTPUT_CSV` (`dataset_with_validated_tradenames.csv`) and `OUTPUT_JSON` (`tradenames_validated.json`) under `BASE_DIR`. |
| [Cleaning Code/05_Merge_Utilities.ipynb](Cleaning Code/05_Merge_Utilities.ipynb#L1) | Utility functions to merge CSV files in a folder into one DataFrame and write a merged CSV; supports batch merging of multiple folders. | Any folder path containing `*.csv` files (passed to `merge_csv_files(folder_path, output_file, ...)`). | Arbitrary `output_file` CSV (example: `merged_output.csv`). Returns `merged_df` in memory. |

---

## Pipeline Order

Recommended order when starting from raw DataDose CSVs in the notebooks' default configuration:

1. `Cleaning Code/01_DataDose_Initial_Cleaning.ipynb` — run to produce `DataDoseDataset_Cleaned.csv`.
2. `Cleaning Code/02_Active_Ingredient_Cleaning_and_Verification.ipynb` — run on the raw or cleaned dataset to create `DataDoseDataset_ActiveIngredient_Cleaned.csv` (this notebook detects common ingredient column names).  
3. `Cleaning Code/03_FDA_Enrichment.ipynb` — run using the cleaned-ingredient CSV produced by notebook 02 to extract unique ingredients, call the LLM/API and OpenFDA, and produce `ingredients_fda_results.csv` / `.json`.

Notes on where `04_Tradename_Cleaning_and_Validation.ipynb` fits:

- `04_Tradename_Cleaning_and_Validation.ipynb` operates on a dataset named `DataDoseDataset_FinalV.csv` by default. That file is not produced automatically by the other notebooks; run it after you have the dataset you want to validate tradenames on (for example, after you perform initial cleaning and any manual curation that yields `DataDoseDataset_FinalV.csv`). It can also be run independently on any CSV that contains a tradename column.

- `05_Merge_Utilities.ipynb` is a general-purpose helper and can be used at any point to consolidate CSV outputs produced across the pipeline.

---

## Setup & External Dependencies

- Python libraries used (explicit in notebooks):

```text
pandas
numpy
requests
difflib
re
json
time
pathlib
datetime
glob
```

- LLM / external API configuration (set in the notebooks' top cells):

```text
GROQ_API_KEYS     # list variable in notebooks (e.g., 02, 03, 04)
OPENROUTER_API_KEYS  # used in 02 (optional)
OPENFDA_API_KEY   # optional key for OpenFDA queries (03)
GROQ_URL, GROQ_MODEL, OPENFDA_BASE  # endpoint and model variables defined in notebooks
```

- Where to set keys: each notebook that calls an external API defines variables near the top (for example `GROQ_API_KEYS = []` or `OPENFDA_API_KEY = ""`). Populate those variables in the notebook before running the LLM/API call cells.

- Runtime notes: notebooks include Google Colab-style `BASE_DIR` defaults such as:

```python
BASE_DIR = '/content/drive/MyDrive/DataDoseDepi'
# or other BASE_DIR strings present in each notebook
```

These are literal paths used in the notebooks; update `BASE_DIR` or `INPUT_FILE`/`OUTPUT_FILE` variables to match your local workspace paths before running.

---

## Inputs and Outputs (formats & locations)

This section lists the main filenames and variables as used exactly in the notebooks (change them in the notebooks if you want different locations):

- Notebook 01 (Initial Cleaning)
  - Input (variable): `INPUT_FILE` (default `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset.csv"`).
  - Output (variable): `OUTPUT_FILE` (default `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset_Cleaned.csv"`).
  - Format: CSV (`.csv`) written via `DataFrame.to_csv(..., index=False)`.

- Notebook 02 (Active Ingredient Cleaning)
  - Input (variable): `INPUT_FILE` (default `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset.csv"`). The notebook auto-detects ingredient columns such as `activeingredient`, `ActiveIngredient`, `ingredients`, etc.
  - Output (variable): `CLEANED_CSV` (default `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset_ActiveIngredient_Cleaned.csv"`).
  - Format: CSV (`.csv`).

- Notebook 03 (FDA Enrichment)
  - Input (variable): `CLEANED_CSV` (default `"/content/drive/MyDrive/DataDoseDepi/DataDoseDataset_ActiveIngredient_Cleaned.csv"`).
  - Outputs: `OUTPUT_CSV` (`ingredients_fda_results.csv`), `OUTPUT_JSON` (`ingredients_fda_results.json`), plus optional progress/log files `PROGRESS_FILE`, `LOG_FILE`.
  - Format: CSV and JSON (written via `pandas.DataFrame.to_csv` and `json.dump`).

- Notebook 04 (Tradename Cleaning and Validation)
  - Input (variable): `INPUT_CSV` (default `"/content/drive/MyDrive/DataDoseClean/Tradename Clean/DataDoseDataset_FinalV.csv"`). Expects a tradename column (`tradename`, `trade_name`, `brand_name`, or `brandname`).
  - Outputs: `OUTPUT_CSV` (`dataset_with_validated_tradenames.csv`) and `OUTPUT_JSON` (`tradenames_validated.json`).
  - Format: CSV and JSON.

- Notebook 05 (Merge Utilities)
  - Input: any folder containing `*.csv` files (argument `folder_path` to `merge_csv_files`).
  - Output: `output_file` (arbitrary path you pass, e.g., `merged_output.csv`).
  - Format: CSV.

---

## Known Limitations and Manual Steps

- File paths are hard-coded for a Google Colab-style `BASE_DIR` in each notebook. Before running locally, update `BASE_DIR`, `INPUT_FILE`, and `OUTPUT_FILE` variables to point to workspace paths (for example, the `Data/` folder in this repository).

- LLM/API calls are optional and gated by `GROQ_API_KEYS`, `OPENROUTER_API_KEYS`, and `OPENFDA_API_KEY` variables. If these are empty, the notebooks provide the cleaning and fuzzy-matching logic but do not perform remote validation. Populate keys and confirm endpoints before enabling network calls.

- Sample/limit behavior: some notebooks process a limited sample for demonstration (`unique_ingredients[:sample_size]` or `[:100]`). Review and adjust the sample sizes and any hard-coded limits before running a full dataset.

- Column name assumptions: the active-ingredient notebook attempts to auto-detect common ingredient column names. If your CSV uses a different column name, set the column or rename it before running.

- Regex and heuristics are conservative but not exhaustive:
  - `form` standardization in notebook 01 uses fixed mappings and may not cover all free-text forms.
  - Ingredient normalization (02) removes tokens, applies spell fixes, and token-based heuristics; some multi-ingredient strings may still need manual review.
  - Tradename cleaning (04) uses regex to strip dosage and pack info — false positives or incomplete removals are possible (manual inspection recommended for edge cases).

- Merging CSVs (05) concatenates rows and does not align or reconcile differing column sets; downstream deduplication or schema normalization may be required.

- LLM validation results should be reviewed and treated as advisory. The notebooks include confidence thresholds and filtering, but human verification is recommended for production use.

---

