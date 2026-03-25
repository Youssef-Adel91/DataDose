import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symptom } = body;

    if (!symptom) {
      return NextResponse.json({ error: 'Symptom is required.' }, { status: 400 });
    }

    // Pass a wide range of common patient drugs as a demo patient profile
    const payload = {
      patient_drugs: ["Warfarin", "Aspirin", "Lisinopril", "Metformin", "Atorvastatin"],
      target_symptom: symptom
    };

    const backendRes = await fetch(`${BACKEND_URL}/api/tracer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      throw new Error(`Backend Error: ${errorText}`);
    }

    const data = await backendRes.json();
    
    // Map the backend TracerResult {drug, mechanism} to frontend expected format
    const mappedSuspects = data.map((item: any) => ({
      drug: item.drug,
      drugClass: 'Matched Drug',
      probability: 'high',
      mechanism: item.mechanism || "Identified via Reverse Mapping from Symptom",
      onset: "Unknown",
      action: "Review medication profile and consider safe substitution."
    }));

    return NextResponse.json({
      success: true,
      symptom,
      matchedSymptom: symptom,
      suspectCount: mappedSuspects.length,
      suspects: mappedSuspects,
      disclaimer: 'Live results fetched directly from Neo4j Knowledge Graph.',
      suggestedSymptoms: [],
    });

  } catch (error: any) {
    console.error("Error in /api/tracer proxy:", error);
    return NextResponse.json({ error: 'Failed to perform reverse symptom trace' }, { status: 500 });
  }
}
