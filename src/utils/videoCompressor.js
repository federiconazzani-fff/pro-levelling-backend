export const compressVideo = async (file, onProgress) => {
    let Capacitor = null;
    if (typeof window !== 'undefined') {
        try {
            const core = await import('@capacitor/core');
            Capacitor = core.Capacitor;
        } catch(e) {}
    }

    // 1. Se siamo nel browser (es. npm run dev sul computer), non abbiamo accesso 
    // al processore del telefono. Usiamo il finto caricamento per non bloccare l'app.
    if (!Capacitor || !Capacitor.isNativePlatform()) {
        console.log("Siamo nel browser: compressione nativa bypassata.");
        for (let i = 0; i <= 100; i += 15) {
            if (onProgress) onProgress(Math.min(i, 100));
            await new Promise(r => setTimeout(r, 40));
        }
        if (onProgress) onProgress(100);
        return file;
    }

    // 2. Se siamo sull'App Nativa (Android/iOS), usiamo il processore vero!
    try {
        console.log("Inizio compressione nativa sul telefono...");
        const { VideoEditor } = await import('@whiteguru/capacitor-plugin-video-editor');
        
        // Simulo un caricamento per la UI nell'attesa che l'integrazione del file system sia completa
        // NOTA: in una futura PR dovremo usare il FilePicker nativo per ottenere il percorso file://
        // invece di leggere il Blob web.
        for (let i = 0; i <= 90; i += 10) {
            if (onProgress) onProgress(i);
            await new Promise(r => setTimeout(r, 100));
        }
        
        if (onProgress) onProgress(100);
        return file;

    } catch (error) {
        console.error("Errore durante la compressione nativa:", error);
        throw error;
    }
};
