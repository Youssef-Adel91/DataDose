import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the POST request to the FastAPI backend
    const response = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: body.message,
        history: body.history || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Backend Error:", errorData);
      return NextResponse.json(
        { response: "GraphRAG Backend Error: " + errorData, is_deterministic: false, raw_data: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { response: "Failed to connect to DataDose Knowledge Graph", is_deterministic: false, raw_data: [] },
      { status: 500 }
    );
  }
}
