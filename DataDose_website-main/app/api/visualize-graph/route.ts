import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// ── Types (mirrors backend response) ──────────────────────────────────────────

export interface RFNode {
  id: string;
  type: 'pill' | 'disease' | 'symptom';
  data: { label: string; category: string };
  position: { x: number; y: number };
}

export interface RFEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated: boolean;
  type: string;
  style: Record<string, unknown>;
  markerEnd?: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface VisualizeGraphResponse {
  nodes: RFNode[];
  edges: RFEdge[];
  meta: {
    drugCount: number;
    diseaseCount: number;
    symptomCount: number;
    edgeCount: number;
  };
  backendOnline: boolean;
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentMedications: string[] = Array.isArray(body?.currentMedications)
      ? body.currentMedications.filter(Boolean)
      : [];

    if (currentMedications.length === 0) {
      return NextResponse.json(
        { error: 'currentMedications must contain at least one drug.' },
        { status: 400 }
      );
    }

    let nodes: RFNode[] = [];
    let edges: RFEdge[] = [];
    let meta = { drugCount: 0, diseaseCount: 0, symptomCount: 0, edgeCount: 0 };
    let backendOnline = true;

    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/visualize-graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentMedications }),
        // Fail fast — if backend is down we go to fallback immediately
        signal: AbortSignal.timeout(8000),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        nodes = data.nodes ?? [];
        edges = data.edges ?? [];
        meta = data.meta ?? meta;
      } else {
        const errText = await backendRes.text();
        console.error(`[visualize-graph] Backend error ${backendRes.status}: ${errText}`);
        backendOnline = false;
      }
    } catch (fetchErr) {
      console.error('[visualize-graph] Fetch to Python backend failed:', fetchErr);
      backendOnline = false;
    }

    // ── Minimal fallback graph when backend is offline ─────────────────────
    if (!backendOnline || nodes.length === 0) {
      nodes = currentMedications.map((drug, i) => ({
        id: `drug_${drug}`,
        type: 'pill' as const,
        data: { label: drug, category: 'drug' },
        position: { x: 0, y: 0 },
      }));
      edges = [];
      meta.drugCount = currentMedications.length;
    }

    const response: VisualizeGraphResponse = { nodes, edges, meta, backendOnline };
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[visualize-graph] Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to build visual prescription graph.' },
      { status: 500 }
    );
  }
}
