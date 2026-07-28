1. Pensa prima di programmare
Non dare nulla per scontato. Non nascondere la confusione. Fai emergere i compromessi.

Spesso i LLM scelgono un'interpretazione in silenzio e la portano avanti. Questo principio impone un ragionamento esplicito:

Esplicita le ipotesi : se non sei sicuro, chiedi invece di fare supposizioni.
Presentare interpretazioni multiple : non scegliere in silenzio quando c'è ambiguità
Opponetevi quando necessario : se esiste un approccio più semplice, ditelo.
Fermati quando hai dei dubbi : specifica cosa non ti è chiaro e chiedi chiarimenti.
2. La semplicità prima di tutto
Codice minimo indispensabile per risolvere il problema. Niente di speculativo.

Contrastare la tendenza alla sovraingegnerizzazione:

Nessuna funzionalità aggiuntiva rispetto a quanto richiesto.
Nessuna astrazione per il codice monouso
Nessuna "flessibilità" o "configurabilità" non richiesta.
Nessuna gestione degli errori per scenari impossibili.
Se 200 righe potessero essere 50, riscrivilo
Il test: un ingegnere senior direbbe che è troppo complicato? Se sì, semplifica.

3. Cambiamenti chirurgici
Tocca solo ciò che è necessario. Pulisci solo il tuo disordine.

Quando si modifica il codice esistente:

Non "migliorare" il codice adiacente, i commenti o la formattazione.
Non modificare codice che non è rotto.
Mantieni lo stile esistente, anche se tu lo faresti diversamente.
Se notate del codice inutilizzato non correlato, segnalatelo, non cancellatelo.
Quando le modifiche apportate creano elementi orfani:

Rimuovi le importazioni/variabili/funzioni che le TUE modifiche hanno reso inutilizzate
Non rimuovere il codice morto preesistente a meno che non venga richiesto
Il test: ogni riga modificata deve essere direttamente riconducibile alla richiesta dell'utente.

4. Esecuzione orientata agli obiettivi
Definire i criteri di successo. Ripetere il ciclo fino alla verifica.

Trasforma i compiti imperativi in ​​obiettivi verificabili:

Invece di...	Trasformarsi in...
"Aggiungi convalida"	"Scrivi dei test per input non validi, poi fai in modo che vengano superati."
"Risolvere il bug"	"Scrivi un test che lo riproduca, poi fallo superare."
"Refactor X"	"Assicurarsi che i test vengano superati prima e dopo"
Per le attività che si articolano in più fasi, descrivi brevemente il piano d'azione:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Criteri di successo rigorosi consentono al modello LLM di funzionare in modo indipendente. Criteri deboli ("far funzionare il sistema") richiedono continui chiarimenti.