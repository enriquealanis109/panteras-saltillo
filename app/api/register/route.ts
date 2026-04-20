import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parentName, childName, age, phone, category } = body;

    if (!parentName || !childName || !age || !phone) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Send to n8n webhook
    if (N8N_WEBHOOK_URL) {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName,
          childName,
          age,
          phone,
          category,
          timestamp: new Date().toISOString(),
          source: "landing_page",
        }),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
