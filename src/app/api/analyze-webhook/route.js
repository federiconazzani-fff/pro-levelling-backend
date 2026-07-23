import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json({ error: "Missing analysis ID" }, { status: 400 });
    }

    const data = await request.json();

    // Salva il risultato su Firestore per notificare il frontend
    await setDoc(doc(db, "analyses", analysisId), data);

    return NextResponse.json({ success: true, message: "Analysis saved successfully" });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
