import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Validate file type client-side before sending
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are accepted (PNG, JPG, WEBP, PDF images)." },
        { status: 400 }
      );
    }

    // Forward multipart/form-data to the FastAPI Vision backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    let medications: string[] = [];
    let backendOnline = true;
    let rawError: string | null = null;

    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/ocr`, {
        method: "POST",
        body: backendFormData,
        signal: AbortSignal.timeout(25_000), // Vision LLM can be slow
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        // Backend returns { extracted_drugs: string[] }
        medications = Array.isArray(data?.extracted_drugs)
          ? (data.extracted_drugs as string[]).filter((d: string) => typeof d === "string" && d.trim().length > 0)
          : [];
      } else {
        rawError = await backendRes.text();
        console.error(`[ocr] Backend error ${backendRes.status}: ${rawError}`);
        backendOnline = false;
      }
    } catch (fetchErr: any) {
      console.error("[ocr] Fetch to Python backend failed:", fetchErr);
      backendOnline = false;
      rawError = fetchErr?.message ?? "Connection refused";
    }

    return NextResponse.json({
      success: true,
      medications,                // Normalised array — what OCRScanner.tsx reads
      extracted_drugs: medications, // Keep legacy alias for any other consumers
      count: medications.length,
      backendOnline,
      ...(rawError ? { warning: `Backend error: ${rawError}` } : {}),
    });

  } catch (error: any) {
    console.error("[ocr] Proxy error:", error);
    return NextResponse.json(
      { error: "OCR proxy encountered an unexpected error.", medications: [], extracted_drugs: [] },
      { status: 500 }
    );
  }
}
