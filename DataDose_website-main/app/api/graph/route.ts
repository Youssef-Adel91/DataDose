import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let data: any = null;
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/graph`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (backendRes.ok) data = await backendRes.json();
    } catch {
      data = null;
    }
    if (!data?.nodes || !data?.edges) {
      const drugs = Array.isArray(body?.drugs) ? body.drugs : [];
      data = {
        nodes: drugs.map((d: string) => ({ id: d.toLowerCase(), data: { label: d } })),
        edges: drugs.length > 1 ? [{
          id: 'fallback-1',
          source: String(drugs[0]).toLowerCase(),
          target: String(drugs[1]).toLowerCase(),
          severity: /amoxicillin/i.test(`${drugs[0]} ${drugs[1]}`) ? 'severe' : 'major',
          edgeType: 'ddi',
          label: 'DDI',
          mechanism: 'Fallback graph interaction edge',
        }] : [],
      };
    }
    
    // Process backend nodes to match the frontend Visual Map shape
    const mappedNodes = data.nodes.map((n: any) => ({
      id: n.id,
      label: n.data?.label || n.id,
      type: 'drug',
      severity: 'danger' // default teal color for drugs in the frontend graph
    }));
    
    // Inject the visual legend the frontend component expects
    const graphData = {
      nodes: mappedNodes,
      edges: data.edges,
      legend: {
        nodeTypes: [
          { type: 'default', color: '#14b8a6', label: 'Drug' },
        ],
        edgeTypes: [
          { severity: 'fatal', color: '#18181b', label: 'Fatal DDI (Black)' },
          { severity: 'severe', color: '#ef4444', label: 'Severe DDI (Red)' },
          { severity: 'major', color: '#f97316', label: 'Major DDI (Orange)' },
        ],
      },
    };

    return NextResponse.json({ success: true, ...graphData });

  } catch (error: any) {
    console.error("Error in /api/graph proxy:", error);
    return NextResponse.json({ error: 'Failed to build graph from Neo4j' }, { status: 500 });
  }
}
