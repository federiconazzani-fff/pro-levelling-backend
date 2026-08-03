import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { videoUrl, category, callbackUrl } = data;

    if (!videoUrl || !category) {
      return NextResponse.json({ error: "Missing videoUrl or category" }, { status: 400 });
    }

    const isTechnical = category.toUpperCase() === "TECHNICAL" || category.toUpperCase() === "TECNICA";
    
    // Webhook paths forniti dall'utente:
    // Tecnica: /webhook/video-analisys
    // Atletica: /webhook/analizza-video
    const path = isTechnical ? "webhook/video-analisys" : "webhook/analizza-video";
    const baseUrl = process.env.N8N_BASE_URL || "https://primary-production-5044d.up.railway.app";
    let webhookUrl = `${baseUrl}/${path}`;

    if (isTechnical && process.env.N8N_WEBHOOK_URL_TECNICA) {
      webhookUrl = process.env.N8N_WEBHOOK_URL_TECNICA;
    } else if (!isTechnical && process.env.N8N_WEBHOOK_URL_ATLETICA) {
      webhookUrl = process.env.N8N_WEBHOOK_URL_ATLETICA;
    }

    let response;
    try {
      response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl,
          category: category.toUpperCase(),
          callbackUrl: callbackUrl
        })
      });
    } catch (fetchErr) {
      console.warn(`Fetch su ${webhookUrl} fallito, provo fallback su localhost:5678...`, fetchErr);
      const localUrl = `http://localhost:5678/${path}`;
      response = await fetch(localUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl,
          category: category.toUpperCase(),
          callbackUrl: callbackUrl
        })
      });
    }

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
