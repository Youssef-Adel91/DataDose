# Data Dose — Smart Clinical Decision Support System (CDSS)

![Data Dose Cover](https://via.placeholder.com/1200x400?text=Data+Dose+CDSS+-+AI+Powered+Care)

Data Dose is a production-ready **Clinical Decision Support System (CDSS)** specifically engineered for physicians and pharmacists. It combines an ultra-modern Next.js frontend with a powerful Python FastAPI + Neo4j Graph Database backend. The core objective of Data Dose is to analyze complex polypharmacy prescriptions in real-time, instantly traverse thousands of medical interactions, and visually prevent adverse drug events (ADEs).

## 🚀 Key Features

*   **N-Degree Polypharmacy Scanner:** Deterministic runtime analysis evaluating high-risk drug-drug interactions (DDIs) across `O(N^2)` combinations in milliseconds.
*   **Reactive Visual Prescription Map:** A seamlessly unified React Flow SVG canvas that dynamically draws Neo4j connections (nodes and interactive edges) based on live scanner results. Colored risk mapping explicitly identifies `Fatal` (⬛) and `Severe` (🔴) interactions.
*   **Smart Alternative Finder:** Powerful constraint-based traversal over the Neo4j Knowledge Graph to recommend safe alternatives that treat the intended disease without triggering known patient allergies or conflicting with existing medications.
*   **Reverse Symptom Tracer:** Traces unexplainable clinical symptoms back to the active ingredients in the patient's current treatment plan, mapped via the `CAUSES_REACTION` edges.
*   **Role-Based Clinical Dashboards:** Beautiful, interactive, glassmorphism-enhanced dashboards tailored respectively for the Physician Point-of-Care and the Pharmacist Dispensing Workflow.

## 🛠️ Architecture & Tech Stack

Data Dose utilizes a strict microservice architecture splitting the UI from the heavy logical traversal:

### Frontend (Next.js)
*   **Framework:** Next.js 15.3.1 (App Router)
*   **Styling:** Tailwind CSS v4 + Framer Motion for premium micro-animations
*   **State Management:** Unified Lifted React State coordinating isolated scanner tools with visualizing components
*   **Proxying:** Server-side route handlers (`/api/scan`, `/api/graph`) intercept UI payloads, correctly format and pass them to the backend, and safely bypass CORS.

### Backend (Python FastAPI Engine)
*   **Framework:** FastAPI running on Uvicorn
*   **Database:** Live **Neo4j Aura Knowledge Graph** (Connected securely via `neo4j+ssc://`)
*   **Ingestion Setup:** Fully indexed graph containing over 3,656 interconnected active drug ingredients, conditions, structured symptom nodes, and severities.
*   **Cypher Rigidity:** All queries strictly implement `toLower()` handling to enforce case-insensitivity against the strictly-typed graph nodes, securing against unrendered inputs.

## 📦 Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Activate virtual environment (Windows)
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with your Neo4j Aura credentials:
```env
NEO4J_URI="neo4j+ssc://<your-db-id>.databases.neo4j.io"
NEO4J_USER="<your-username>"
NEO4J_PASSWORD="<your-password>"
```

Start the FastAPI server (Runs on port 8000):
```bash
python -m uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd DataDose_website-main
npm install
```

Start the Next.js Client (Runs on port 3000):
```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard/pharmacist` or `http://localhost:3000/dashboard/physician` to begin utilizing the Clinical Decision Support System.

## 📊 Knowledge Graph Schema

The Neo4j database actively evaluates structural paths such as:
1. `(Drug)-[INTERACTS_WITH {severity: 'Fatal', effect: '...', mechanism: '...'}]-(Drug)`
2. `(Drug)-[TREATS]->(Condition)`
3. `(Drug)-[CAUSES_REACTION]->(Symptom)`

## 🛡️ License & Compliance

Data Dose is built for demonstration, educational, and enterprise-architecture presentation purposes. Always consult certified medical practitioners and FDA-cleared databases before applying graph suggestions in real-world clinical environments.
