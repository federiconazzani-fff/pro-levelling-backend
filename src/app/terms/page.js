import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "8px", color: "#dcf536", textTransform: "uppercase", letterSpacing: "-0.02em" }}>Termini e Condizioni</h1>
        <p style={{ color: "var(--gray-dim)", marginBottom: "40px", fontSize: "0.9rem", fontWeight: "600" }}>Ultimo aggiornamento: Giugno 2026</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "0.95rem", lineHeight: "1.7", color: "#e0e0e0" }}>
          
          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>1. Accettazione dei Termini</h2>
            <p>
              Scaricando, accedendo o utilizzando l'applicazione Pro Levelling (o "Elite.PRO"), accetti di essere vincolato dai presenti Termini e Condizioni. 
              Se non sei d'accordo con una qualsiasi parte di questi termini, ti preghiamo di non utilizzare il nostro servizio. L'utilizzo dell'app costituisce un accordo legale tra te e Pro Levelling.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>2. Descrizione del Servizio</h2>
            <p>
              Pro Levelling fornisce strumenti avanzati di intelligenza artificiale per l'analisi delle performance calcistiche, monitoraggio GPS, generazione di allenamenti personalizzati e analisi biomeccanica. 
              Il servizio è inteso come supporto all'allenamento e non sostituisce il giudizio o l'assistenza di allenatori professionisti certificati.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>3. Prova Gratuita e Pagamenti (Modello Una Tantum)</h2>
            <p>
              <strong>Prova Gratuita:</strong> L'applicazione offre un periodo di prova gratuita di 7 giorni che si attiva automaticamente al completamento della registrazione. Durante questo periodo, avrai accesso completo a tutte le funzionalità dell'app.
            </p>
            <p style={{ marginTop: "12px" }}>
              <strong>Pagamenti:</strong> Al termine dei 7 giorni, l'accesso all'app verrà bloccato. Per continuare a utilizzare i servizi, dovrai acquistare un pacchetto di accesso (es. 1 Mese, 2 Mesi o 3 Mesi). 
              Tutti i pagamenti elaborati tramite la piattaforma Stripe sono <strong>"Una Tantum"</strong> (non ricorrenti). Non ci saranno rinnovi o addebiti automatici alla scadenza del periodo acquistato. 
              Per continuare a utilizzare l'app dopo la scadenza, sarà necessario effettuare un nuovo pagamento manuale.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>4. Politica di Rimborso</h2>
            <p>
              Considerando la natura digitale del servizio e la disponibilità di una prova gratuita di 7 giorni che permette di valutare pienamente il prodotto prima dell'acquisto, <strong>non offriamo rimborsi</strong> per i pagamenti una tantum già effettuati, salvo nei casi previsti dalla legge a tutela del consumatore.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>5. Esclusione di Responsabilità Medica e Infortuni</h2>
            <p>
              Pro Levelling non fornisce consulenza medica. Gli allenamenti proposti dall'intelligenza artificiale (SSG, Body Workout, ecc.) sono suggerimenti generici basati sui dati inseriti.
              L'utente si assume la totale responsabilità per eventuali infortuni, danni o problemi di salute derivanti dall'esecuzione degli esercizi suggeriti. 
              Ti invitiamo a consultare un medico prima di intraprendere qualsiasi nuovo regime di allenamento.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>6. Contenuti Generati dall'Utente (Video)</h2>
            <p>
              Utilizzando la funzione di analisi AI e caricando video, dichiari di avere i diritti per caricare tali contenuti e di non violare la privacy di terzi. 
              Pro Levelling analizza i video localmente o sui propri server esclusivamente allo scopo di fornire i dati biomeccanici richiesti e non rivende i video caricati a terze parti.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px", color: "#fff", textTransform: "uppercase" }}>7. Modifiche ai Termini</h2>
            <p>
              Ci riserviamo il diritto di modificare i presenti Termini e Condizioni in qualsiasi momento. Le modifiche sostanziali verranno comunicate tramite un avviso nell'app. 
              Continuando a utilizzare l'app dopo le modifiche, accetti i nuovi termini.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
