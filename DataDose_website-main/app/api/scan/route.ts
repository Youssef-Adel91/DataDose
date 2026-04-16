import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { enforceDailyQuota } from '@/lib/quota';

// Prisma client initialized lazily inside POST to avoid static module crashes
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  // === ENVIRONMENT STARTUP LOGS ===
  console.log("--- Initializing /api/scan Request ---");
  const neoExists = !!process.env.NEO4J_URI;
  const groqExists = !!process.env.GROQ_API_KEY;
  const openaiExists = !!process.env.OPENAI_API_KEY;
  
  console.log(`[SERVICE TRACE] Neo4j Connection String Present: ${neoExists}`);
  console.log(`[SERVICE TRACE] GROQ_API_KEY Present: ${groqExists}`);
  console.log(`[SERVICE TRACE] OPENAI_API_KEY Present: ${openaiExists}`);
  console.log("------------------------------------------");

  try {
    const body = await req.json();

    // --- QUOTA MANAGEMENT LOGIC ---
    if (body.userEmail) {
      const quota = await enforceDailyQuota(body.userEmail, true);
      if (quota.exceeded) {
        return NextResponse.json(
          { error: "QUOTA_EXCEEDED", message: "You have reached your daily limit of 5 scans. Please wait 24 hours or upgrade to Pro." },
          { status: 403 }
        );
      }
    }
    // --- END QUOTA LOGIC ---

    let ehrContext: any = {};
    if (body.patientEmail) {
      const patient = await prisma.user.findUnique({
        where: { email: body.patientEmail },
        include: { PatientEHR: true },
      });
      if (patient?.PatientEHR) {
        ehrContext = {
          allergies: patient.PatientEHR.allergies,
          chronicConditions: patient.PatientEHR.chronicConditions,
        };
      }
    }

    const payload = {
      ...body,
      ehr: ehrContext,
      // Force backend models/graph traversal to include patient context checks.
      analysisInstruction:
        'Cross-reference proposed medications against patient allergies and chronic conditions, not only drug-drug interactions.',
    };
    
    console.log("==========================================");
    console.log("INTERCEPTED PAYLOAD EN ROUTE TO BACKEND:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("==========================================");

    let backendData: any[] = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const backendRes = await fetch(`${BACKEND_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!backendRes.ok) {
        const backendError = await backendRes.text();
        return NextResponse.json(
          {
            error: 'AI_GRAPH_ENGINE_ERROR',
            message: `AI Graph Engine error: ${backendError || `HTTP ${backendRes.status}`}`,
          },
          { status: 502 }
        );
      }
      backendData = await backendRes.json();
    } catch (backendError: any) {
      console.error('[SCAN_BACKEND_UNAVAILABLE]', backendError?.message || backendError);
      return NextResponse.json(
        {
          error: 'AI_GRAPH_ENGINE_OFFLINE',
          message: 'AI Graph Engine is offline. Please start the Python backend.',
        },
        { status: 503 }
      );
    }
    const reqDrugs = body.drugs || [];

    // Map interactions to Frontend expected format
    const mappedInteractions = backendData.map((item: any) => ({
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
    console.error("[SCAN_API_FATAL_ERROR]:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
