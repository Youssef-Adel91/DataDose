import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      throw new Error(`Backend Error: ${errorText}`);
    }

    const data = await backendRes.json();
    const reqDrugs = body.drugs || [];

    // Map interactions to Frontend expected format
    const mappedInteractions = data.map((item: any) => ({
      pair: `${item.drug1} + ${item.drug2}`,
      drug1: item.drug1,
      drug2: item.drug2,
      severity: (item.severity || "major").toLowerCase(),
      mechanism: item.mechanism || "Interaction identified structurally via Graph DB.",
      recommendation: item.effect || "Consider alternative therapies or strict monitoring.",
    }));

    const fatalSevere = mappedInteractions.filter((i: any) => i.severity === 'fatal' || i.severity === 'severe').length;
    const major = mappedInteractions.filter((i: any) => i.severity === 'major').length;
    
    let overallRisk = "LOW";
    if (fatalSevere > 0) overallRisk = "HIGH";
    else if (major > 0) overallRisk = "MODERATE";

    // Approximate total possible pairs vs safe pairs
    const totalPairs = (reqDrugs.length * (reqDrugs.length - 1)) / 2;
    const safePairs = Math.max(0, totalPairs - mappedInteractions.length);

    const resultPayload = {
      drugs: reqDrugs,
      interactions: mappedInteractions,
      summary: {
        totalInteractions: mappedInteractions.length,
        fatalSevere,
        major,
        safe: safePairs,
        overallRisk
      },
      graph: { nodes: [], edges: [] } // PolypharmacyScan UI expects this property to not be undefined
    };

    return NextResponse.json(resultPayload);
  } catch (error: any) {
    console.error("Error in /api/scan proxy:", error);
    return NextResponse.json(
      { error: "Failed to connect to DataDose AI Engine" },
      { status: 500 }
    );
  }
}
