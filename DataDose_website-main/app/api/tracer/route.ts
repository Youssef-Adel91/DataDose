import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export interface SuspectMedication {
  drug: string;
  symptom: string;
  severity: string | null;
  evidence: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symptomName, currentMedications } = body;

    if (!symptomName || !String(symptomName).trim()) {
      return NextResponse.json({ error: 'symptomName is required.' }, { status: 400 });
    }

    const requestPayload = {
      symptomName: String(symptomName).trim(),
      currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
    };

    let suspects: SuspectMedication[] = [];
    let backendOnline = true;

    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/trace-symptom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!backendRes.ok) {
        const errText = await backendRes.text();
        console.error(`[tracer] Backend error ${backendRes.status}: ${errText}`);
        backendOnline = false;
      } else {
        const backendPayload = await backendRes.json();
        // Backend returns { suspects: [...], fallback_insight: string | null }
        suspects = Array.isArray(backendPayload.suspects) ? backendPayload.suspects : [];

        // Re-inject the LLM fallback as a UI-compatible card when Neo4j returned 0 rows
        if (suspects.length === 0 && backendPayload.fallback_insight) {
          suspects.push({
            drug: 'LLM Clinical Insight',
            symptom: requestPayload.symptomName,
            evidence: backendPayload.fallback_insight,
            severity: 'info',
          });
        }
      }
    } catch (fetchErr) {
      console.error('[tracer] Fetch to Python backend failed:', fetchErr);
      backendOnline = false;
    }

    return NextResponse.json({
      success: true,
      symptomName: requestPayload.symptomName,
      suspects,
      suspectCount: suspects.length,
      backendOnline,
      disclaimer: backendOnline
        ? 'Results fetched live from Neo4j Knowledge Graph · Feature 4'
        : 'Backend offline — please start the Python FastAPI server.',
    });

  } catch (error: unknown) {
    console.error('[tracer] Proxy error:', error);
    return NextResponse.json({ error: 'Failed to perform reverse symptom trace.' }, { status: 500 });
  }
}
