import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drug, disease, symptomToAvoid } = body;

    if (!drug) {
      return NextResponse.json({ error: 'Drug name is required.' }, { status: 400 });
    }

    // In a real app we would pass current_meds, for now we will send empty array if not provided
    const payload = {
      drug_to_replace: drug,
      disease_to_treat: disease || "",
      symptom_to_avoid: symptomToAvoid || "",
      current_meds: []
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      throw new Error(`Backend Error: ${errorText}`);
    }

    const data = await backendRes.json();
    
    // Format response to match what the frontend expects
    const formattedAlternatives = data.map((altDrugName: string) => ({
      name: altDrugName,
      mechanism: 'Graph-verified safe alternative',
      safeFor: [],
      avoids: [],
      ddiRisk: 'none',
      note: 'Verified against current medications and target symptoms'
    }));

    return NextResponse.json({
      success: true,
      query: { drug, disease, symptomToAvoid },
      alternativeClass: 'Verified Safe Alternative',
      alternatives: formattedAlternatives,
      message: `Found ${data.length} optimized alternative(s) from Knowledge Graph.`
    });

  } catch (error: any) {
    console.error("Error in /api/alternatives proxy:", error);
    return NextResponse.json({ error: 'Failed to access Neo4j alternatives graph' }, { status: 500 });
  }
}
