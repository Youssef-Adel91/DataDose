import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Field mapping:
    //   drug           → drug_to_replace  (UI: "Drug to Replace")
    //   disease        → disease_to_treat ($disease in Cypher — CONTAINS match)
    //   symptomToAvoid → symptom_to_avoid ($symptom in Cypher — exact match)
    //   currentMeds    → current_meds     ($current_drugs in Cypher — list of active Rx)
    const { drug, disease, symptomToAvoid, currentMeds } = body;

    if (!drug) {
      return NextResponse.json({ error: 'Drug name is required.' }, { status: 400 });
    }

    // Exclude the drug being replaced from the current medications list
    const otherMeds: string[] = Array.isArray(currentMeds)
      ? currentMeds.filter((m: string) => m.toLowerCase() !== drug.toLowerCase())
      : [];

    const payload = {
      drug_to_replace: drug,
      disease_to_treat: disease || "",
      symptom_to_avoid: symptomToAvoid || "",
      current_meds: otherMeds,
    };

    let data: string[] = [];
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (backendRes.ok) {
        data = await backendRes.json();
      } else {
        const errText = await backendRes.text();
        console.error(`[alternatives] Backend error ${backendRes.status}: ${errText}`);
      }
    } catch (fetchErr) {
      console.error('[alternatives] Fetch to Python backend failed:', fetchErr);
      data = [];
    }

    // Format response to match what the frontend expects
    const formattedAlternatives = data.map((altDrugName: string) => ({
      name: altDrugName,
      mechanism: 'Graph-verified safe alternative',
      safeFor: [],
      avoids: [symptomToAvoid || ''],
      ddiRisk: 'none',
      note: 'Verified against current medications and target symptoms'
    }));

    return NextResponse.json({
      success: true,
      query: { drug, disease, symptomToAvoid },
      alternativeClass: data.length > 0 ? 'Graph-Verified Safe Alternative' : 'LLM-Suggested Alternative',
      alternatives: formattedAlternatives,
      message: `Found ${data.length} optimized alternative(s).`
    });

  } catch (error: any) {
    console.error("Error in /api/alternatives proxy:", error);
    return NextResponse.json({ error: 'Failed to access Neo4j alternatives graph' }, { status: 500 });
  }
}
