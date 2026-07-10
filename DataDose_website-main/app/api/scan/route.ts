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
    // Top-level allergy list — populated from EHR and forwarded to the
    // FastAPI DAI (Drug-Allergy Interaction) safety check phase.
    let patientAllergies: string[] = [];

    if (body.patientEmail) {
      const patient = await prisma.user.findUnique({
        where: { email: body.patientEmail },
        include: { PatientEHR: true },
      });
      if (patient?.PatientEHR) {
        patientAllergies = patient.PatientEHR.allergies ?? [];
        ehrContext = {
          allergies: patientAllergies,
          chronicConditions: patient.PatientEHR.chronicConditions,
        };
      }
    }

    const payload = {
      ...body,
      // DAI fix: allergies as a first-class field so FastAPI iterates them
      // in the CAUSES_REACTION allergy-safety loop (Phase 2 of /api/scan).
      allergies: patientAllergies,
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
        // Log the exact HTTP status and body so the root cause is visible
        // in the Next.js server terminal without needing Python backend logs.
        console.error('[SCAN_BACKEND_HTTP_ERROR] ──────────────────────────────────');
        console.error('  HTTP Status :', backendRes.status, backendRes.statusText);
        console.error('  Target URL  :', `${BACKEND_URL}/api/scan`);
        console.error('  Response    :', backendError);
        console.error('────────────────────────────────────────────────────────────');
        return NextResponse.json(
          {
            error: 'AI_GRAPH_ENGINE_ERROR',
            message: `Clinical analysis engine error: ${backendError || `HTTP ${backendRes.status}`}`,
            debug: `HTTP ${backendRes.status} ${backendRes.statusText} — ${backendError}`,
          },
          { status: 502 }
        );
      }
      backendData = await backendRes.json();
    } catch (backendError: any) {
      // ── Diagnostic logging: expose the real transport-level failure ──────────
      // Common root causes:
      //   • AbortError  → the 8-second fetch timeout fired (backend too slow)
      //   • TypeError: fetch failed → CORS preflight rejected OR backend is down
      //   • ECONNREFUSED / ENOTFOUND → backend process is not running
      const targetUrl = `${BACKEND_URL}/api/scan`;
      console.error('[SCAN_BACKEND_UNAVAILABLE] ─────────────────────────────────');
      console.error('  Target URL  :', targetUrl);
      console.error('  Error name  :', backendError?.name);
      console.error('  Error msg   :', backendError?.message);
      console.error('  Error cause :', backendError?.cause ?? '(none)');
      console.error('  Full error  :', backendError);
      console.error('────────────────────────────────────────────────────────────');

      const debugDetail =
        `[${backendError?.name ?? 'Error'}] ${backendError?.message ?? 'Unknown error'}` +
        (backendError?.cause ? ` | cause: ${backendError.cause}` : '');

      return NextResponse.json(
        {
          error: 'AI_GRAPH_ENGINE_OFFLINE',
          message: 'Clinical analysis engine is offline. Please contact IT support.',
          // debug field is safe — only visible in server-side API responses,
          // never rendered to end-users unless you explicitly display it.
          debug: debugDetail,
        },
        { status: 503 }
      );
    }
    const reqDrugs = body.drugs || [];

    // Map interactions to Frontend expected format
    // NOTE: ALLERGY severity is mapped to "allergy" — a new tier rendered
    //       as an urgent banner in PolypharmacyScan.tsx.
    const mappedInteractions = backendData.map((item: any) => ({
      pair: `${item.drug1} + ${item.drug2}`,
      drug1: item.drug1,
      drug2: item.drug2,
      severity: (item.severity || "major").toLowerCase(),
      mechanism: item.mechanism || "Interaction identified via clinical knowledge graph.",
      recommendation: item.effect || "Consider alternative therapies or strict monitoring.",
    }));

    const allergyAlerts = mappedInteractions.filter((i: any) => i.severity === 'allergy').length;
    const fatalSevere = mappedInteractions.filter((i: any) => i.severity === 'fatal' || i.severity === 'severe' || i.severity === 'allergy').length;
    const major = mappedInteractions.filter((i: any) => i.severity === 'major').length;
    
    let overallRisk = "LOW";
    // ALLERGY and FATAL/SEVERE are both immediately HIGH risk — the allergy
    // tier is already counted in fatalSevere (line above) but making it
    // explicit here ensures the assessment never contradicts the alert count.
    if (allergyAlerts > 0 || fatalSevere > 0) overallRisk = "HIGH";
    else if (major > 0) overallRisk = "MODERATE";

    const totalPairs = (reqDrugs.length * (reqDrugs.length - 1)) / 2;
    const safePairs = Math.max(0, totalPairs - mappedInteractions.length);

    const resultPayload = {
      drugs: reqDrugs,
      interactions: mappedInteractions,
      summary: {
        totalInteractions: mappedInteractions.length,
        fatalSevere,
        allergyAlerts,
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
