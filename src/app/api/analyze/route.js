import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { videoUrl, category, callbackUrl } = data;

    if (!videoUrl || !category) {
      return NextResponse.json({ error: "Missing videoUrl or category" }, { status: 400 });
    }

    // Trigger GitHub Actions repository_dispatch
    const GITHUB_TOKEN = process.env.GITHUB_PAT;
    const GITHUB_REPO = process.env.GITHUB_REPO; // es. "username/pro.levelling"

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return NextResponse.json({ error: "GitHub configuration missing in .env" }, { status: 500 });
    }

    const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO}/dispatches`;

    const response = await fetch(githubApiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: "analyze_video",
        client_payload: {
          video_url: videoUrl,
          category: category.toLowerCase(),
          callback_url: callbackUrl // Webhook locale/remoto dove GitHub manderà il risultato
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("GitHub Actions error:", errText);
      return NextResponse.json({ error: "Failed to trigger GitHub Action" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Analysis triggered on GitHub Actions" });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
