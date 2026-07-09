"""
DataDose — Snowflake Analytics Microservice
============================================
Standalone FastAPI service that connects to Snowflake Cloud.
Deploy this separately on Railway / Render / Heroku — NOT on Vercel.

Reason: snowflake-connector-python (~50 MB installed) would push the
main Vercel Python bundle over the 225 MB serverless size limit.

Required environment variables:
    SNOWFLAKE_ACCOUNT    e.g. xy12345.us-east-1
    SNOWFLAKE_USER       e.g. datadose_api
    SNOWFLAKE_PASSWORD   (secret)
    SNOWFLAKE_WAREHOUSE  e.g. PHARMA_WH
    SNOWFLAKE_DATABASE   e.g. PHARMA_ANALYTICS_DB
    SNOWFLAKE_SCHEMA     e.g. STAGING
    SNOWFLAKE_ROLE       e.g. PYSPARK_ROLE  (optional)
    ALLOWED_ORIGINS      comma-separated list of allowed CORS origins
                         (default: localhost:3000 + *.vercel.app)

Start locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8001
"""

import os
from typing import Any, Dict, List, Optional
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Snowflake connection config (read from env at startup)
# ---------------------------------------------------------------------------

SF_ACCOUNT   = os.getenv("SNOWFLAKE_ACCOUNT",   "")
SF_USER      = os.getenv("SNOWFLAKE_USER",      "")
SF_PASSWORD  = os.getenv("SNOWFLAKE_PASSWORD",  "")
SF_WAREHOUSE = os.getenv("SNOWFLAKE_WAREHOUSE", "PHARMA_WH")
SF_DATABASE  = os.getenv("SNOWFLAKE_DATABASE",  "PHARMA_ANALYTICS_DB")
SF_SCHEMA    = os.getenv("SNOWFLAKE_SCHEMA",    "STAGING")
SF_ROLE      = os.getenv("SNOWFLAKE_ROLE",      "")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="DataDose Snowflake Microservice",
    version="1.0.0",
    description="Analytics endpoints backed by Snowflake PHARMA_ANALYTICS_DB.",
)

# CORS — allow the Next.js frontend on localhost and all Vercel deployments
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _raw_origins],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Snowflake connection helper
# ---------------------------------------------------------------------------

@contextmanager
def get_snowflake():
    """
    Context manager that opens a Snowflake connection for one request
    and closes it cleanly afterwards.  Raises HTTP 503 if credentials
    are missing or the connection fails.
    """
    if not SF_ACCOUNT or not SF_USER or not SF_PASSWORD:
        raise HTTPException(
            status_code=503,
            detail=(
                "Snowflake credentials not configured. "
                "Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD."
            ),
        )

    try:
        import snowflake.connector  # lazy — keeps import fast on startup

        conn_params: Dict[str, str] = {
            "account":   SF_ACCOUNT,
            "user":      SF_USER,
            "password":  SF_PASSWORD,
            "warehouse": SF_WAREHOUSE,
            "database":  SF_DATABASE,
            "schema":    SF_SCHEMA,
            "client_session_keep_alive": False,
        }
        if SF_ROLE:
            conn_params["role"] = SF_ROLE

        conn = snowflake.connector.connect(**conn_params)
        try:
            yield conn
        finally:
            conn.close()

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Snowflake connection failed: {exc}",
        )


def _query(conn, sql: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
    """Execute a query and return rows as a list of dicts."""
    cur = conn.cursor()
    try:
        cur.execute(sql, params or ())
        columns = [desc[0].lower() for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        cur.close()


# ---------------------------------------------------------------------------
# Mock fallback data (returned when Snowflake tables don't exist yet)
# Shape matches exactly what the frontend chart components expect.
# ---------------------------------------------------------------------------

MOCK_PRESCRIPTION_TRENDS = [
    {"date": "Mon", "prescriptions": 285, "alerts": 12, "interactions": 8},
    {"date": "Tue", "prescriptions": 412, "alerts": 18, "interactions": 11},
    {"date": "Wed", "prescriptions": 325, "alerts": 15, "interactions": 9},
    {"date": "Thu", "prescriptions": 498, "alerts": 24, "interactions": 14},
    {"date": "Fri", "prescriptions": 567, "alerts": 31, "interactions": 18},
]

MOCK_WEEKLY_TRENDS = {
    "barData": {
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "datasets": [
            {
                "label": "Prescriptions Scanned",
                "data": [1200, 1900, 1500, 2200, 1800, 800, 500],
                "backgroundColor": "#14b8a6",
                "borderRadius": 4,
            },
            {
                "label": "Alerts Triggered",
                "data": [150, 230, 180, 310, 220, 90, 60],
                "backgroundColor": "#f59e0b",
                "borderRadius": 4,
            },
        ],
    },
    "doughnutData": {
        "labels": ["Safe (Green)", "Warning (Yellow)", "Danger (Red)", "Critical (Purple)"],
        "datasets": [
            {
                "data": [82, 12, 4, 2],
                "backgroundColor": ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
                "borderWidth": 0,
                "cutout": "70%",
            }
        ],
    },
    "stats": [
        {"label": "Prescriptions Analyzed", "value": 124847},
        {"label": "Errors Prevented",        "value": 9284},
        {"label": "Overall Safety Score",     "value": 985},
        {"label": "Active Clinicians",        "value": 3621},
    ],
}


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

@app.get("/health", summary="Snowflake Connectivity Health Check")
def health():
    """
    Attempts a lightweight Snowflake connection and returns status.
    Safe to call frequently from monitoring tools.
    """
    if not SF_ACCOUNT:
        return {"status": "unconfigured", "detail": "SNOWFLAKE_ACCOUNT not set"}

    try:
        with get_snowflake() as conn:
            rows = _query(conn, "SELECT CURRENT_VERSION() AS ver")
            version = rows[0]["ver"] if rows else "unknown"
        return {
            "status": "connected",
            "snowflake_version": version,
            "database": SF_DATABASE,
            "schema": SF_SCHEMA,
            "warehouse": SF_WAREHOUSE,
        }
    except HTTPException as exc:
        return {"status": "failed", "detail": exc.detail}


# ---------------------------------------------------------------------------
# /api/snowflake/prescription-trends
# Used by: HospitalAnalytics.tsx (admin dashboard recharts LineChart + BarChart)
#
# Expected Snowflake table:  STAGING.DAILY_PRESCRIPTION_STATS
# Columns: RECORD_DATE (DATE), PRESCRIPTION_COUNT, ALERT_COUNT, INTERACTION_COUNT
# ---------------------------------------------------------------------------

@app.get(
    "/api/snowflake/prescription-trends",
    summary="Weekly prescription + alert trend (HospitalAnalytics chart)",
)
def prescription_trends():
    """
    Returns the last 7 days of prescription, alert, and interaction counts.
    Falls back to realistic mock data when the Snowflake table is unavailable.

    Response shape (array of objects):
        [
          { "date": "Mon", "prescriptions": 285, "alerts": 12, "interactions": 8 },
          ...
        ]
    """
    try:
        with get_snowflake() as conn:
            rows = _query(
                conn,
                """
                SELECT
                    TO_CHAR(RECORD_DATE, 'Dy')    AS date,
                    PRESCRIPTION_COUNT            AS prescriptions,
                    ALERT_COUNT                   AS alerts,
                    INTERACTION_COUNT             AS interactions
                FROM STAGING.DAILY_PRESCRIPTION_STATS
                WHERE RECORD_DATE >= DATEADD(day, -7, CURRENT_DATE())
                ORDER BY RECORD_DATE ASC
                LIMIT 7
                """,
            )
            # If the table exists but is empty, still fall through to mock
            if rows:
                return rows
    except HTTPException:
        pass  # Snowflake not connected — fall through to mock
    except Exception:
        pass

    return MOCK_PRESCRIPTION_TRENDS


# ---------------------------------------------------------------------------
# /api/snowflake/weekly-trends
# Used by: Analytics.tsx (landing page Chart.js Bar + Doughnut)
#
# Expected Snowflake tables:
#   STAGING.DAILY_PRESCRIPTION_STATS  — same as above
#   STAGING.RISK_STRATIFICATION       — columns: RISK_LEVEL, PATIENT_COUNT
#   STAGING.PLATFORM_KPI              — columns: KPI_NAME, KPI_VALUE
# ---------------------------------------------------------------------------

@app.get(
    "/api/snowflake/weekly-trends",
    summary="Full weekly analytics payload (Analytics.tsx chart.js charts)",
)
def weekly_trends():
    """
    Returns the composite analytics payload expected by Analytics.tsx:
        {
          barData:      { labels, datasets }   — Chart.js Bar chart
          doughnutData: { labels, datasets }   — Chart.js Doughnut chart
          stats:        [ { label, value } ]   — animated counter cards
        }

    Falls back to the Sprint 1 mock data when Snowflake tables are unavailable.
    """
    try:
        with get_snowflake() as conn:
            # ── Bar chart: daily Rx volume vs alerts for last 7 days ─────────
            bar_rows = _query(
                conn,
                """
                SELECT
                    TO_CHAR(RECORD_DATE, 'Dy')    AS day_label,
                    PRESCRIPTION_COUNT,
                    ALERT_COUNT
                FROM STAGING.DAILY_PRESCRIPTION_STATS
                WHERE RECORD_DATE >= DATEADD(day, -7, CURRENT_DATE())
                ORDER BY RECORD_DATE ASC
                LIMIT 7
                """,
            )

            # ── Doughnut chart: risk stratification breakdown ──────────────
            donut_rows = _query(
                conn,
                """
                SELECT RISK_LEVEL, PATIENT_COUNT
                FROM STAGING.RISK_STRATIFICATION
                ORDER BY
                    CASE RISK_LEVEL
                        WHEN 'Safe'     THEN 1
                        WHEN 'Warning'  THEN 2
                        WHEN 'Danger'   THEN 3
                        WHEN 'Critical' THEN 4
                        ELSE 5
                    END
                """,
            )

            # ── KPI stat cards ────────────────────────────────────────────
            kpi_rows = _query(
                conn,
                """
                SELECT KPI_NAME, KPI_VALUE
                FROM STAGING.PLATFORM_KPI
                WHERE KPI_NAME IN (
                    'PRESCRIPTIONS_ANALYZED',
                    'ERRORS_PREVENTED',
                    'SAFETY_SCORE_X10',
                    'ACTIVE_CLINICIANS'
                )
                """,
            )

            # Only return live data if we got meaningful results from all 3 tables
            if bar_rows and donut_rows and kpi_rows:
                labels      = [r["day_label"] for r in bar_rows]
                rx_data     = [r["prescription_count"] for r in bar_rows]
                alert_data  = [r["alert_count"] for r in bar_rows]

                donut_labels = [r["risk_level"] for r in donut_rows]
                donut_values = [r["patient_count"] for r in donut_rows]

                kpi_map = {r["kpi_name"]: r["kpi_value"] for r in kpi_rows}

                return {
                    "barData": {
                        "labels": labels,
                        "datasets": [
                            {
                                "label": "Prescriptions Scanned",
                                "data": rx_data,
                                "backgroundColor": "#14b8a6",
                                "borderRadius": 4,
                            },
                            {
                                "label": "Alerts Triggered",
                                "data": alert_data,
                                "backgroundColor": "#f59e0b",
                                "borderRadius": 4,
                            },
                        ],
                    },
                    "doughnutData": {
                        "labels": donut_labels,
                        "datasets": [
                            {
                                "data": donut_values,
                                "backgroundColor": [
                                    "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"
                                ],
                                "borderWidth": 0,
                                "cutout": "70%",
                            }
                        ],
                    },
                    "stats": [
                        {
                            "label": "Prescriptions Analyzed",
                            "value": kpi_map.get("PRESCRIPTIONS_ANALYZED", 0),
                        },
                        {
                            "label": "Errors Prevented",
                            "value": kpi_map.get("ERRORS_PREVENTED", 0),
                        },
                        {
                            "label": "Overall Safety Score",
                            "value": kpi_map.get("SAFETY_SCORE_X10", 0),
                        },
                        {
                            "label": "Active Clinicians",
                            "value": kpi_map.get("ACTIVE_CLINICIANS", 0),
                        },
                    ],
                }

    except HTTPException:
        pass  # Snowflake not connected — fall through to mock
    except Exception:
        pass

    return MOCK_WEEKLY_TRENDS


# ---------------------------------------------------------------------------
# Entry point (local dev)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
