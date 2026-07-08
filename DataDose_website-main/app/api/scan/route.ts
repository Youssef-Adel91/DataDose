import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { enforceDailyQuota } from '@/lib/quota';
import { requireAuth } from '@/lib/apiAuth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: Request) {
  // ── Authentication & Authorization ──
  const auth = await requireAuth(['PHYSICIAN', 'PHARMACIST']);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();

    // --- QUOTA MANAGEMENT LOGIC ---
    const quota = await enforceDailyQuota(auth.email, true);
    if (quota.exceeded) {
      return NextResponse.json(
        { error: "QUOTA_EXCEEDED", message: "You have reached your daily scan limit. Please try again tomorrow." },
        { status: 403 }
      );
    }

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
      analysisInstruction:
        'Cross-reference proposed medications against patient allergies and chronic conditions, not only drug-drug interactions.',
    };

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
            message: `Clinical analysis engine error: ${backendError || `HTTP ${backendRes.status}`}`,
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
          message: 'Clinical analysis engine is offline. Please contact IT support.',
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
      mechanism: item.mechanism || "Interaction identified via clinical knowledge graph.",
      recommendation: item.effect || "Consider alternative therapies or strict monitoring.",
    }));

    const fatalSevere = mappedInteractions.filter((i: any) => i.severity === 'fatal' || i.severity === 'severe').length;
    const major = mappedInteractions.filter((i: any) => i.severity === 'major').length;
    
    let overallRisk = "LOW";
    if (fatalSevere > 0) overallRisk = "HIGH";
    else if (major > 0) overallRisk = "MODERATE";

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
      graph: { nodes: [], edges: [] }
    };

    return NextResponse.json(resultPayload);
  } catch (error: any) {
    console.error("[SCAN_API_ERROR]:", error.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred during the scan.' },
      { status: 500 }
    );
  }
}
