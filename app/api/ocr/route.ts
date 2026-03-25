import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Forward multipart/form-data to our FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const backendRes = await fetch("http://127.0.0.1:8000/api/ocr", {
      method: "POST",
      body: backendFormData,
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error("Backend OCR Error:", errorText);
      return NextResponse.json(
        { extracted_drugs: [], error: "GraphRAG Backend Error" },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OCR Proxy Error:", error);
    return NextResponse.json(
      { extracted_drugs: [], error: "Failed to connect to DataDose Vision backend" },
      { status: 500 }
    );
  }
}
