import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export interface GraphRAGResponse {
  response: string;
  is_deterministic: boolean;
  graph_context: Array<Record<string, unknown>>;
  extracted_entities: string[];
  source: 'graph+llm' | 'llm_only';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentMedications = [], history = [] } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: 'message is required.' }, { status: 400 });
    }

    let data: GraphRAGResponse | null = null;
    let backendOnline = true;

    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/graphrag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: String(message).trim(),
          currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
          history: Array.isArray(history) ? history : [],
        }),
        signal: AbortSignal.timeout(20_000), // GraphRAG is heavier — allow 20s
      });

      if (backendRes.ok) {
        data = await backendRes.json();
      } else {
        const errText = await backendRes.text();
        console.error(`[graphrag] Backend error ${backendRes.status}: ${errText}`);
        backendOnline = false;
      }
    } catch (fetchErr) {
      console.error('[graphrag] Fetch to Python backend failed:', fetchErr);
      backendOnline = false;
    }

    // Graceful offline response — surfaced to user in the chat UI
    if (!backendOnline || !data) {
      const offlineResponse: GraphRAGResponse = {
        response:
          '⚠️ **DataDose Clinical AI is currently offline.**\n\nThe FastAPI + Neo4j backend server is not reachable. Please start the Python backend (`uvicorn main:app --reload`) and retry.\n\n*This is a connectivity error — no clinical data was accessed.*',
        is_deterministic: false,
        graph_context: [],
        extracted_entities: [],
        source: 'llm_only',
      };
      return NextResponse.json(offlineResponse);
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[graphrag] Proxy error:', error);
    return NextResponse.json(
      { error: 'GraphRAG proxy encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
