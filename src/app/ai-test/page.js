"use client";

import React, { useEffect, useState } from 'react';
import AIVideoPlayer from '@/components/analysis/AIVideoPlayer';

export default function AITestPage() {
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    // Carichiamo il JSON dalla cartella public/ai/
    fetch('/ai/tracking_data.json')
      .then(res => res.json())
      .then(data => {
        setTrackingData(data);
      })
      .catch(err => console.error("Errore caricamento JSON AI:", err));
  }, []);

  return (
    <div style={{ padding: '40px', backgroundColor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: '10px', fontSize: '28px', fontWeight: 'bold' }}>Elite.PRO - Smart Video Player</h1>
      <p style={{ marginBottom: '40px', color: '#94a3b8', maxWidth: '800px', lineHeight: '1.6' }}>
        In questo esempio, il video in riproduzione è completamente **PULITO**. Tutti i grafici e le statistiche che vedi 
        sono generati dal frontend (Next.js) leggendo le coordinate del file `tracking_data.json`.
        <br/><br/>
        <strong>Interattività:</strong> Clicca su un giocatore per entrare in modalità "Focus". Gli altri diventeranno trasparenti e potrai concentrarti sulle sue metriche senza confusione!
      </p>

      {trackingData ? (
        <AIVideoPlayer 
          videoSrc="/ai/test.mp4" 
          trackingData={trackingData} 
        />
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <p>Caricamento Modelli AI e Dati Sensoriali in corso...</p>
        </div>
      )}
    </div>
  );
}
