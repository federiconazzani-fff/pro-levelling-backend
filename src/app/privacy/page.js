import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff" }}>
      
      <header style={{ padding: "24px 20px", display: "flex", alignItems: "center", borderBottom: "1px solid #333", position: "sticky", top: 0, background: "rgba(17,17,17,0.9)", backdropFilter: "blur(10px)", zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", color: "#fff", textDecoration: "none" }}>
          <div style={{ padding: "8px", background: "#222", borderRadius: "12px" }}>
            <ArrowLeft size={20} />
          </div>
          <span style={{ fontSize: "1rem", fontWeight: "800", textTransform: "uppercase" }}>Indietro</span>
        </Link>
      </header>

      <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "8px", color: "#dcf536", textTransform: "uppercase", letterSpacing: "-0.02em" }}>Informativa sulla Privacy</h1>
        <p style={{ color: "var(--gray-dim)", marginBottom: "40px", fontSize: "0.9rem", fontWeight: "600" }}>Ultimo aggiornamento: Giugno 2026</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "0.95rem", lineHeight: "1.7", color: "#e0e0e0" }}>
          
          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>1. Informazioni Generali</h2>
            <p>
              La tua privacy è fondamentale per noi. Questa Informativa sulla Privacy spiega come Pro Levelling (o "Elite.PRO") raccoglie, utilizza, archivia e protegge i tuoi dati personali 
              quando utilizzi la nostra applicazione mobile o web.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>2. Dati che Raccogliamo</h2>
            <p>
              Per fornire i nostri servizi di analisi e tracciamento, potremmo raccogliere i seguenti dati:
            </p>
            <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Dati di Registrazione:</strong> Informazioni fornite durante l'onboarding come nome, email, età, peso, altezza e ruolo in campo.</li>
              <li><strong>Dati Multimediali (Video e Foto):</strong> I video che carichi sull'app per essere analizzati dall'intelligenza artificiale per l'estrazione delle statistiche biomeccaniche.</li>
              <li><strong>Dati di Posizione (GPS):</strong> Tracciamento GPS e movimento quando utilizzi le funzioni di monitoraggio della corsa e del campo, al fine di misurare velocità, distanza e heatmap.</li>
              <li><strong>Dati di Navigazione:</strong> Statistiche anonime di utilizzo dell'app per migliorare le prestazioni del software.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>3. Come Utilizziamo i Tuoi Dati</h2>
            <p>
              I tuoi dati sono utilizzati <strong>esclusivamente</strong> per fornirti i servizi richiesti:
            </p>
            <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Analizzare i tuoi video per restituirti metriche tecniche e fisiche.</li>
              <li>Elaborare i dati GPS per tracciare le tue performance atletiche sul campo.</li>
              <li>Personalizzare i tuoi piani di allenamento in base ai dati inseriti.</li>
              <li>Gestire l'account, elaborare i pagamenti (tramite Stripe) e verificare l'accesso (es. i 7 giorni di prova).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>4. Condivisione dei Dati e Terze Parti</h2>
            <p>
              <strong>Noi non vendiamo mai i tuoi dati personali o i tuoi video a terzi.</strong> <br/>
              Potremmo condividere alcuni dati strettamente necessari con fornitori di servizi verificati che ci aiutano a far funzionare l'app, come:
            </p>
            <ul style={{ marginTop: "8px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Stripe:</strong> Per elaborare i pagamenti in modo sicuro. Noi non memorizziamo i dati della tua carta di credito.</li>
              <li><strong>Google Firebase / Cloud Provider:</strong> Per memorizzare in sicurezza il tuo profilo, i tuoi risultati e gestire l'autenticazione.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>5. Conservazione e Cancellazione</h2>
            <p>
              I dati vengono conservati solo per il tempo necessario a fornirti il servizio. I video caricati per l'analisi vengono processati e conservati solo se scegli di salvarli nella tua libreria. 
              In qualsiasi momento puoi richiederci o utilizzare l'apposita funzione in-app per eliminare definitivamente il tuo account e tutti i dati associati.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>6. Sicurezza</h2>
            <p>
              Adottiamo misure tecniche e organizzative avanzate per proteggere i tuoi dati personali e multimediali da accessi non autorizzati, perdite o alterazioni.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>7. Contatti</h2>
            <p>
              Se hai domande su questa Informativa sulla Privacy o vuoi esercitare i tuoi diritti sui dati (GDPR), contattaci in qualsiasi momento.
              {/* TODO: Inserire email di contatto qui */}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
