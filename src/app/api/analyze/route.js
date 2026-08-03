import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { videoUrl, category, callbackUrl } = data;

    if (!videoUrl || !category) {
      return NextResponse.json({ error: "Missing videoUrl or category" }, { status: 400 });
    }

    const isTechnical = category.toUpperCase() === "TECHNICAL" || category.toUpperCase() === "TECNICA";
    const webhookUrl = isTechnical
      ? "https://primary-production-5044d.up.railway.app/webhook/TECNICA-ANALISYS"
      : "https://primary-production-5044d.up.railway.app/webhook/ATLETICA-ANALISYS";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        videoUrl: videoUrl,
        category: category.toUpperCase(),
        callbackUrl: callbackUrl
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("n8n Railway Webhook error:", errText);
      return NextResponse.json({ error: "Failed to trigger n8n Webhook" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Analysis triggered on n8n Railway Webhook" });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
