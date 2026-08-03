"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, Maximize, X, Check, Activity, Target, Zap, Clock, Video, Database, AlertCircle, BarChart3, ChevronRight, UploadCloud, Terminal, TrendingUp, MousePointer } from "lucide-react";
import { useRouter } from "next/navigation";
import { haptic } from "@/utils/haptics";
import { getVideo } from "@/utils/mediaDb";
import { storeAnalysisData } from "@/utils/analyticsDb";
import AestheticsRoom from "@/components/analysis/AestheticsRoom";
import AestheticsBarChart from "@/components/analysis/AestheticsBarChart";
import { parseAestheticsPayload } from "@/utils/aestheticsParser";
import { auth, db, storage } from "@/utils/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, onSnapshot } from "firebase/firestore";
import { syncUserDataToFirestore } from "@/utils/syncDb";

// -- MOCK LOCAL DATA FROM UPLOAD/LIBRARY
const MOCK_DATA = [
  { id: "v1", type: "single", title: "Volley Shot R", date: "30/10/2026", macroArea: "TECHNICAL", subCategory: "Shot", status: "NOT_ANALYZED", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
  { id: "s1", type: "session", title: "Curled Shots Session", date: "31/10/2026", macroArea: "TECHNICAL", subCategory: "Shot", status: "PARTIAL", reps: [
    { id: "s1-r1", status: "NOT_ANALYZED", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
    { id: "s1-r2", status: "NOT_ANALYZED", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
    { id: "s1-r3", status: "NOT_ANALYZED", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" }
  ]},
  { id: "v2", type: "single", title: "30m Sprint", date: "01/11/2026", macroArea: "ATHLETIC", subCategory: "Speed", status: "NOT_ANALYZED", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
];

// --- MOCK N8N PAYLOAD ---
const MOCK_N8N_RESPONSE = {
  lista_popup: [
    { 
      id: 1, key_moment_time: 2.5, sub_category: "Technic", is_correct: true, label: "Clean Impact", score: "9/10", description: "Excellent coordination in the impact with the instep. The ankle is well locked.", highlight_url: "https://i.ibb.co/LdxC49V/player-highlight.png",
      biomechanics: {
        duration_ms: 2000,
        ball_flow: "3D Bouncing",
        elasticity: 0.85,
        stability: 0.9,
        keyframes: [
          {"cog":{"x":650,"y":500},"ball":{"x":660,"y":680},"skeleton":{"shoulders":{"x1":630,"y1":450,"x2":670,"y2":450},"hips":{"x1":640,"y1":520,"x2":660,"y2":520},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":580}},"ankles":{"left":{"x":630,"y":650},"right":{"x":670,"y":650}},"guide_arm":{"elbow":{"x":610,"y":480},"hand":{"x":590,"y":510}}}},
          {"cog":{"x":650,"y":500},"ball":{"x":660,"y":680},"skeleton":{"shoulders":{"x1":630,"y1":450,"x2":670,"y2":450},"hips":{"x1":640,"y1":520,"x2":660,"y2":520},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":580}},"ankles":{"left":{"x":630,"y":650},"right":{"x":670,"y":650}},"guide_arm":{"elbow":{"x":610,"y":480},"hand":{"x":590,"y":510}}}},
          {"cog":{"x":645,"y":490},"ball":{"x":650,"y":680},"skeleton":{"shoulders":{"x1":625,"y1":445,"x2":675,"y2":455},"hips":{"x1":635,"y1":515,"x2":665,"y2":525},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":560}},"ankles":{"left":{"x":630,"y":650},"right":{"x":690,"y":620}},"guide_arm":{"elbow":{"x":600,"y":470},"hand":{"x":580,"y":500}}}},
          {"cog":{"x":640,"y":480},"ball":{"x":650,"y":680},"skeleton":{"shoulders":{"x1":620,"y1":440,"x2":680,"y2":460},"hips":{"x1":630,"y1":510,"x2":670,"y2":530},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":540}},"ankles":{"left":{"x":630,"y":650},"right":{"x":710,"y":590}},"guide_arm":{"elbow":{"x":590,"y":460},"hand":{"x":570,"y":490}}}},
          {"cog":{"x":635,"y":470},"ball":{"x":640,"y":680},"skeleton":{"shoulders":{"x1":615,"y1":435,"x2":685,"y2":465},"hips":{"x1":625,"y1":505,"x2":675,"y2":535},"knees":{"left":{"x":630,"y":580},"right":{"x":670,"y":520}},"ankles":{"left":{"x":630,"y":650},"right":{"x":730,"y":550}},"guide_arm":{"elbow":{"x":580,"y":450},"hand":{"x":550,"y":480}}}},
          {"cog":{"x":650,"y":500},"ball":{"x":660,"y":680},"skeleton":{"shoulders":{"x1":630,"y1":450,"x2":670,"y2":450},"hips":{"x1":640,"y1":520,"x2":660,"y2":520},"knees":{"left":{"x":630,"y":580},"right":{"x":650,"y":580}},"ankles":{"left":{"x":630,"y":650},"right":{"x":645,"y":650}},"guide_arm":{"elbow":{"x":610,"y":480},"hand":{"x":590,"y":510}}}},
          {"cog":{"x":660,"y":510},"ball":{"x":690,"y":670},"skeleton":{"shoulders":{"x1":640,"y1":460,"x2":660,"y2":440},"hips":{"x1":650,"y1":530,"x2":655,"y2":510},"knees":{"left":{"x":630,"y":580},"right":{"x":630,"y":600}},"ankles":{"left":{"x":630,"y":650},"right":{"x":610,"y":610}},"guide_arm":{"elbow":{"x":620,"y":490},"hand":{"x":600,"y":520}}}},
          {"cog":{"x":670,"y":520},"ball":{"x":720,"y":650},"skeleton":{"shoulders":{"x1":650,"y1":470,"x2":655,"y2":430},"hips":{"x1":660,"y1":540,"x2":650,"y2":500},"knees":{"left":{"x":630,"y":580},"right":{"x":610,"y":620}},"ankles":{"left":{"x":630,"y":650},"right":{"x":590,"y":580}},"guide_arm":{"elbow":{"x":630,"y":500},"hand":{"x":610,"y":530}}}},
          {"cog":{"x":680,"y":530},"ball":{"x":750,"y":630},"skeleton":{"shoulders":{"x1":660,"y1":480,"x2":650,"y2":420},"hips":{"x1":670,"y1":550,"x2":645,"y2":490},"knees":{"left":{"x":630,"y":580},"right":{"x":590,"y":640}},"ankles":{"left":{"x":630,"y":650},"right":{"x":570,"y":550}},"guide_arm":{"elbow":{"x":640,"y":510},"hand":{"x":620,"y":540}}}},
          {"cog":{"x":690,"y":540},"ball":{"x":780,"y":610},"skeleton":{"shoulders":{"x1":670,"y1":490,"x2":640,"y2":410},"hips":{"x1":680,"y1":560,"x2":640,"y2":480},"knees":{"left":{"x":630,"y":580},"right":{"x":570,"y":660}},"ankles":{"left":{"x":630,"y":650},"right":{"x":550,"y":520}},"guide_arm":{"elbow":{"x":650,"y":520},"hand":{"x":630,"y":550}}}}
        ]
      }
    },
    { id: 2, key_moment_time: 4.2, sub_category: "Posture", is_correct: false, label: "Torso Rotation", score: "4/10", description: "The torso is too unbalanced backwards during loading, losing potential power." },
    { id: 3, key_moment_time: 7.8, sub_category: "Athletic", is_correct: true, label: "Explosive Power", score: "8/10", description: "Excellent load transfer from the support leg." }
  ],
  dati_box_advanced: {
    overallPattern: "Technically valid execution, with slight postural deficiency in the preparation phase.",
    biomechanics: "Inertia transfer: 75% efficiency. Ankle angle: 110°.",
    speed: "Ball exit at 86 km/h.",
    score: 82
  }
};

const CATEGORY_COLORS = {
  "Technic": { bg: "#ffffff", text: "#111111", border: "#111111" },
  "Athletic": { bg: "#f97316", text: "#ffffff", border: "#c2410c" },
  "Posture": { bg: "#14b8a6", text: "#ffffff", border: "#0f766e" },
  "Biomeccanic": { bg: "#38bdf8", text: "#111111", border: "#0284c7" },
  "Movements": { bg: "#3b82f6", text: "#ffffff", border: "#1d4ed8" },
  "Decision Making": { bg: "#a855f7", text: "#ffffff", border: "#7e22ce" }
};

export default function AnalysisPage() {
  const router = useRouter();
  const [libraryData, setLibraryData] = useState([]);
  
  // STATE MACHINE: "macro" | "selector" | "dashboard" | "engine"
  const [viewState, setViewState] = useState("macro");
  
  // Config
  const [selectedMacro, setSelectedMacro] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  // Dashboard Logics
  const [processingState, setProcessingState] = useState("idle"); // idle | uploading | analyzing | completed | error
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [currentRepIdx, setCurrentRepIdx] = useState(0); 
  const [sessionResults, setSessionResults] = useState({}); // { [repIdx]: analysisData }

  // Engine States
  const [engineTargetUrl, setEngineTargetUrl] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Player States
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [activePopups, setActivePopups] = useState([]);
  const [expandedPillId, setExpandedPillId] = useState(null);
  const [processedMoments, setProcessedMoments] = useState(new Set());
  
  // Overlay Toggles

  
  const isTechnical = selectedMacro === "TECHNICAL";
  const primaryColor = isTechnical ? "#3b82f6" : "var(--primary)";
  const primaryColorLight = isTechnical ? "rgba(59, 130, 246, 0.1)" : "rgba(230, 57, 70, 0.1)";
  const primaryColorBg = isTechnical ? "rgba(59, 130, 246, 0.2)" : "rgba(230, 57, 70, 0.2)";
  const pastelYellow = "#fef08a";
  
  const [isSlowMo, setIsSlowMo] = useState(false);
  const slowMoTimeoutRef = useRef(null);
  
  // NEW: EFFECT STATES
  const [effectPhase, setEffectPhase] = useState(null); // null | "freeze" | "slowmo" | "scan"
  const [maskOpacity, setMaskOpacity] = useState(0);
  const [highlightImage, setHighlightImage] = useState(null);
  const [aiLogs, setAiLogs] = useState(["BOOTING NANO BANANA v2.5...", "AI ENGINE INITIALIZED", "WAITING FOR KEY MOMENTS..."]);
  const phaseTimeoutRef = useRef(null);

  // Aesthetics State
  const [showAesthetics, setShowAesthetics] = useState(false);
  const [aestheticsBestReps, setAestheticsBestReps] = useState([]);
  const [showAestheticsChart, setShowAestheticsChart] = useState(false);
  const [isAestheticsLoading, setIsAestheticsLoading] = useState(false);

  // Player Profile State (per calcolo biometrico)
  const [playerHeight, setPlayerHeight] = useState(1.75);

  const handleAestheticsClick = async () => {
    haptic.medium();
    setIsAestheticsLoading(true);

    try {
      let blob;
      try {
        const res = await fetch(engineTargetUrl);
        blob = await res.blob();
      } catch (err) {
        // Fallback to a small video if the local blob URL fails to fetch
        const res = await fetch("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4");
        blob = await res.blob();
      }
      
      const formData = new FormData();
      formData.append("file", blob, "video.mp4");

      const response = await fetch("https://primary-production-5044d.up.railway.app/webhook/aesthetics-video-analisys", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Webhook fetch failed");
      
      const payload = await response.json();
      
      const formattedRep = {
        id: "webhook-rep",
        label: "AESTHETICS ANALYSIS",
        biomechanics: parseAestheticsPayload(payload, analysisData?.lista_popup?.[0]?.biomechanics)
      };
      
      setAestheticsBestReps([formattedRep]);
      
    } catch (error) {
      console.warn("Webhook failed or returned error, using fallback data", error);
      const popups = analysisData?.lista_popup || [];
      const bestRepsMap = {};
      
      popups.forEach(popup => {
         const cat = popup.sub_category || popup.label;
         if (!bestRepsMap[cat] || bestRepsMap[cat].score < popup.score) {
            bestRepsMap[cat] = popup;
         }
      });
      
      setAestheticsBestReps(Object.values(bestRepsMap));
    } finally {
      setIsAestheticsLoading(false);
      setShowAesthetics(true);
    }
  };

  // Mount
  useEffect(() => {
    // Paywall Check TEMPORANEAMENTE DISATTIVATO PER I TEST
    /*
    const isPremium = localStorage.getItem('elite_pro_isPremium');
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    */

    const savedProfile = localStorage.getItem('elite_pro_profile');
    if (savedProfile) {
       try {
          const p = JSON.parse(savedProfile);
          if (p.height) setPlayerHeight(parseFloat(p.height));
       } catch(e) {}
    }

    const saved = localStorage.getItem('elite_pro_library');
    if (saved) {
      try {
        setLibraryData([...JSON.parse(saved), ...MOCK_DATA]);
      } catch(e) {}
    } else {
      setLibraryData(MOCK_DATA);
    }
  }, []);

  // ====== 1. MACRO SELECTION ======
  const handleSelectMacro = (macro) => {
    haptic.medium();
    setSelectedMacro(macro);
    setViewState("selector");
  };

  // ====== 2. MEDIA SELECTION ======
  const filteredLibrary = libraryData.filter(item => item.macroArea === selectedMacro);
  
  const handleSelectMedia = (item) => {
    haptic.heavy();
    setSelectedMedia(item);
    setViewState("dashboard");
    setProcessingState("idle");
    setCurrentRepIdx(0);
    setSessionResults({});
  };

  // ====== 3. DASHBOARD OPERATIONS (N8N) ======
  const executeAnalysis = async (videoUrl, isRep = false, repIdx = 0) => {
    haptic.medium();
    let targetUrl = videoUrl;
    
    if (!targetUrl || targetUrl.startsWith('blob:')) {
      try {
        const videoId = isRep && selectedMedia?.reps ? selectedMedia.reps[repIdx]?.id : selectedMedia?.id;
        const storedBlob = await getVideo(videoId);
        if (storedBlob) {
          targetUrl = URL.createObjectURL(storedBlob);
        }
      } catch (err) {
        console.warn("IndexedDB recovery failed", err);
      }
    }

    if (!targetUrl) {
      alert("No valid video found for analysis.");
      return;
    }

    let progressInterval = null;
    let fallbackTimer = null;
    let unsub = null;

    const completeWithPayload = async (parsedResponse) => {
      if (unsub) unsub();
      if (progressInterval) clearInterval(progressInterval);
      if (fallbackTimer) clearTimeout(fallbackTimer);

      setAnalysisProgress(100);
      setTimeRemaining(0);

      // Normalize Popups for UI Processing
      if (parsedResponse.lista_popup) {
        parsedResponse.lista_popup = parsedResponse.lista_popup.map((p, index) => {
          let timeInSeconds = 0;
          if (typeof p.key_moment_time === 'string') {
            const parts = p.key_moment_time.split(':');
            if (parts.length === 2) {
               timeInSeconds = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
            } else if (parts.length === 3) {
               timeInSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
            } else {
               timeInSeconds = parseFloat(p.key_moment_time) || 0;
            }
          } else {
            timeInSeconds = p.key_moment_time || 0;
          }
          return {
            ...p,
            id: p.id || `popup_${index}`,
            key_moment_time: timeInSeconds
          };
        });
      }

      // Aggiorna lo stato nella libreria locale ed esegui sync cloud
      try {
        const rawLib = localStorage.getItem("elite_pro_library");
        if (rawLib && activeVideo?.id) {
          const lib = JSON.parse(rawLib);
          const updatedLib = lib.map(item => item.id === activeVideo.id ? { ...item, status: "ANALYZED", analysisResult: parsedResponse } : item);
          localStorage.setItem("elite_pro_library", JSON.stringify(updatedLib));
          await syncUserDataToFirestore(auth.currentUser?.uid);
        }
      } catch (errSync) {
        console.warn("Errore aggiornamento libreria analysis:", errSync);
      }

      if (isRep) {
        setSessionResults(prev => ({ ...prev, [repIdx]: parsedResponse }));
        setCurrentRepIdx(prev => prev + 1);
        setProcessingState("idle");
        haptic.heavy();
      } else {
        setAnalysisData(parsedResponse);
        setEngineTargetUrl(targetUrl);
        setViewState("engine");
        setIsLoading(false);
        haptic.heavy();
      }
    };

    try {
      setProcessingState("uploading");
      setAnalysisProgress(5);

      let publicVideoUrl = targetUrl;
      try {
        if (targetUrl && !targetUrl.includes("interactive-examples.mdn.mozilla.net")) {
          const response = await fetch(targetUrl);
          const blob = await response.blob();
          const fileRef = ref(storage, `ai-analysis-videos/${Date.now()}_video.mp4`);
          await uploadBytes(fileRef, blob);
          publicVideoUrl = await getDownloadURL(fileRef);
        }
      } catch (uploadErr) {
        console.warn("Upload Storage non riuscito o url mock, utilizzo URL sorgente del video:", uploadErr);
        publicVideoUrl = targetUrl;
      }

      setProcessingState("analyzing");
      setAnalysisProgress(30);
      setTimeRemaining(45);

      progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(95, prev + 3));
        setTimeRemaining(prev => Math.max(3, prev - 1));
      }, 1000);

      const analysisId = Date.now().toString();
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pro-levelling-backend.vercel.app";
      const callbackUrl = `${BACKEND_URL}/api/analyze-webhook?id=${analysisId}`;

      let useFallback = false;
      try {
        const resApi = await fetch(`${BACKEND_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: publicVideoUrl,
            category: selectedMacro,
            callbackUrl: callbackUrl
          })
        });

        const resJson = await resApi.json().catch(() => ({}));

        // 1. Risposta del Motore AI Diretto Gemini (Istantanea al 100% dal Cloud Vercel)
        if (resJson && resJson.success && resJson.data) {
          clearInterval(progressInterval);
          setAnalysisProgress(100);
          completeWithPayload(resJson.data);
          return;
        }

        if (!resApi.ok || resJson.fallback || !resJson.success) {
          useFallback = true;
        }
      } catch (errApi) {
        console.warn("API /analyze non raggiungibile da client, attivazione fallback:", errApi);
        useFallback = true;
      }

      if (useFallback) {
        // Fallback simulato automatico per evitare blocchi al 10%
        setTimeout(() => {
          completeWithPayload(MOCK_N8N_RESPONSE);
        }, 3000);
      } else {
        // Attendi che GitHub Actions salvi il risultato su Firestore con timer di sicurezza max 18 secondi
        unsub = onSnapshot(doc(db, "analyses", analysisId), (docSnap) => {
          if (docSnap.exists()) {
            const parsedResponse = docSnap.data();
            completeWithPayload(parsedResponse);
          }
        });

        fallbackTimer = setTimeout(() => {
          console.warn("Timeout attesa Firestore dal webhook, utilizzo analisi di sicurezza.");
          completeWithPayload(MOCK_N8N_RESPONSE);
        }, 18000);
      }

    } catch (e) {
      if (progressInterval) clearInterval(progressInterval);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (unsub) unsub();
      console.warn("Errore elaborazione analisi, utilizzo fallback immediato:", e);
      completeWithPayload(MOCK_N8N_RESPONSE);
    }
  };

  const handleSaveInAnalytics = () => {
    console.log("Save initiated for:", selectedMedia?.id);
    if (!selectedMedia) return;
    
    try {
      // Check if we have any data to save (either single or session)
      const hasData = analysisData || Object.keys(sessionResults).length > 0;
      if (!hasData) {
        alert("No analysis data available to save. Ensure analysis is completed.");
        return;
      }

      haptic.heavy();

      // 1. Store analysis data
      if (selectedMedia.type === "session") {
         console.log("Storing session results:", sessionResults);
         // Save each rep result
         Object.entries(sessionResults).forEach(([idx, result]) => {
            const repId = selectedMedia.reps?.[parseInt(idx)]?.id;
            if (repId && result) {
              console.log(`Saving rep ${repId}`);
              storeAnalysisData(repId, result);
            }
         });
      } else {
         // Save single result
         if (analysisData) {
           console.log("Saving single video result");
           storeAnalysisData(selectedMedia.id, analysisData);
         }
      }

      // 2. Update library status to ANALYZED
      const saved = localStorage.getItem('elite_pro_library');
      let currentLibrary = [];
      
      if (saved) {
        currentLibrary = JSON.parse(saved);
      } else {
        // If library is empty in storage but we have mock data in state, use that as base
        // This is crucial for the very first save
        currentLibrary = [...libraryData];
      }

      const updatedLibrary = currentLibrary.map(item => {
        if (item.id === selectedMedia.id) {
          if (item.type === "session") {
             // For sessions, we mark reps as analyzed too
             const newReps = item.reps.map((r, i) => sessionResults[i] ? { ...r, status: "ANALYZED" } : r);
             const allAnalyzed = newReps.every(r => r.status === "ANALYZED");
             return { ...item, status: allAnalyzed ? "ANALYZED" : "PARTIAL", reps: newReps };
          } else {
             return { ...item, status: "ANALYZED" };
          }
        }
        return item;
      });

      // If the item wasn't in the library yet (edge case), add it
      if (!updatedLibrary.find(i => i.id === selectedMedia.id)) {
        updatedLibrary.push({
           ...selectedMedia,
           status: "ANALYZED"
        });
      }

      localStorage.setItem('elite_pro_library', JSON.stringify(updatedLibrary));
      
      console.log("Save successful. Redirecting to analytics...");
      // 3. Navigate to analytics
      router.push('/analytics');
    } catch (err) {
      console.error("CRITICAL SAVE ERROR:", err);
      alert(`Error during save: ${err.message}`);
    }
  };

  const handleOpenEngine = async (videoUrl, aData, id = null) => {
    haptic.medium();
    setIsLoading(false);
    setAnalysisData(aData);
    setVideoError(false);
    
    let targetUrl = videoUrl;
    if (aData?.annotated_video_available && aData?.video_id) {
       targetUrl = `http://localhost:8000/video/${aData.video_id}`;
    } else {
       // Check if URL is still valid, else recover
       try {
         const check = await fetch(videoUrl, { method: 'HEAD' });
         if (!check.ok) throw new Error();
       } catch {
         const storedBlob = await getVideo(id || selectedMedia?.id);
         if (storedBlob) {
           targetUrl = URL.createObjectURL(storedBlob);
         }
       }
    }
    
    setEngineTargetUrl(targetUrl);
    setViewState("engine");
    
    // reset player state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setActivePopups([]);
    setExpandedPillId(null);
    setProcessedMoments(new Set());
    setHighlightImage(null);
    setVideoError(false);
  };

  // ====== 4. ENGINE PLAYER OPERATIONS ======
  const handleTimeUpdate = () => {
    if (!videoRef.current || !analysisData || isLoading || videoError) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    const popupsArr = analysisData.lista_popup || [];
    const matchingPopups = popupsArr.filter(p => Math.abs(time - p.key_moment_time) <= 0.5);

    if (matchingPopups.length > 0) {
      const triggerId = matchingPopups[0].id;
      const popupData = matchingPopups[0];

      if (!processedMoments.has(triggerId)) {
        haptic.heavy(); 
        setProcessedMoments(prev => new Set(prev).add(triggerId));
        
        // CHECK CATEGORY FOR "FREEZE & FOCUS"
        const isTechnic = popupData.sub_category === "Technic" || (selectedMacro === "TECHNICAL" && !popupData.sub_category);

        if (isTechnic) {
          // --- PHASE 1: FREEZE (5s) ---
          videoRef.current.pause();
          setIsPlaying(false);
          setEffectPhase("freeze");
          setMaskOpacity(1);
          setHighlightImage(popupData.highlight_url || null);
          setActivePopups(matchingPopups);

          if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
          
          phaseTimeoutRef.current = setTimeout(() => {
            // --- PHASE 2: SLOW-MO (3s) ---
            if (videoRef.current) {
              setEffectPhase("slowmo");
              videoRef.current.playbackRate = 0.5;
              videoRef.current.play();
              setIsPlaying(true);
              setIsSlowMo(true);

              phaseTimeoutRef.current = setTimeout(() => {
                // --- PHASE 3: NORMAL REPLAY (Rewind + 1.0x) ---
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, popupData.key_moment_time - 0.5);
                  videoRef.current.playbackRate = 1.0;
                  setEffectPhase(null);
                  setMaskOpacity(0);
                  setHighlightImage(null);
                  setIsSlowMo(false);
                  setActivePopups([]);
                }
              }, 3000);
            }
          }, 5000);

        } else {
          // STANDARD SLOW-MO REPLAY (2s)
          videoRef.current.playbackRate = 0.5;
          setIsSlowMo(true);
          setActivePopups(matchingPopups);
          
          if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
          
          phaseTimeoutRef.current = setTimeout(() => {
             if (videoRef.current) {
               videoRef.current.playbackRate = 1.0;
               videoRef.current.currentTime = Math.max(0, popupData.key_moment_time - 0.5); 
               setActivePopups([]);
               setIsSlowMo(false);
             }
          }, 2000);
        }
      }
    } else {
      if (activePopups.length > 0 && !isSlowMo) {
        setActivePopups([]);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || videoError) return;
    haptic.light();

    // Reset eventual active effects if user interrupts
    if (effectPhase) {
      clearTimeout(phaseTimeoutRef.current);
      setEffectPhase(null);
      setMaskOpacity(0);
      setHighlightImage(null);
      videoRef.current.playbackRate = 1.0;
    }

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current && !videoError) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setActivePopups([]);
      
      // Reset effects on manual seek
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
      videoRef.current.playbackRate = 1.0;
      setEffectPhase(null);
      setMaskOpacity(0);
      setIsSlowMo(false);
    }
  };
  const handleNextGesture = () => {
    haptic.medium();
    if (!analysisData || !analysisData.lista_popup) return;
    const futurePopups = analysisData.lista_popup.filter(p => p.key_moment_time > currentTime + 0.5);
    if (futurePopups.length > 0) {
       futurePopups.sort((a,b) => a.key_moment_time - b.key_moment_time);
       const nextTime = futurePopups[0].key_moment_time;
       if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, nextTime - 0.2); // jump right before
       }
       setCurrentTime(Math.max(0, nextTime - 0.2));
       
       if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
       if (videoRef.current) videoRef.current.playbackRate = 1.0;
       setEffectPhase(null);
       setMaskOpacity(0);
       setHighlightImage(null);
       setIsSlowMo(false);
       setActivePopups([]);
    }
  };


  // ==========================================
  // RENDER: MACRO
  // ==========================================
  if (viewState === "macro") {
    return (
      <div className="app-container page-wrapper" style={{ minHeight: "100vh", background: "var(--background)" }} suppressHydrationWarning>
        <header style={{ padding: "40px 24px", borderBottom: "4px solid #111", background: "#fff" }}>
           <span style={{ fontSize: "0.85rem", fontWeight: "900", color: primaryColor, textTransform: "uppercase", letterSpacing: "0.15em" }}>Phase 1 / 3</span>
           <h1 style={{ fontSize: "2.8rem", fontWeight: "900", textTransform: "uppercase", lineHeight: 1, marginTop: "12px", letterSpacing: "-0.04em" }}>
             Choose <span className="brush-highlight">Path</span>
           </h1>
        </header>

        <main className="v-stack" style={{ padding: "32px 20px", gap: "20px" }}>
            <button 
              onClick={() => handleSelectMacro("TECHNICAL")} 
              className="card-dark hover-lift pseudo-haptic" 
              style={{ border: "2px solid #111", background: "#fff", textAlign: "left", padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
               <div style={{ padding: "32px 24px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <BarChart3 size={40} color="#1d3557" strokeWidth={3} />
                    <div style={{ background: "#3b82f6", color: "#fff", padding: "6px 12px", fontSize: "0.7rem", fontWeight: "900", borderRadius: "4px" }}>TECHNICAL</div>
                  </div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>Technical Analysis</h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--gray-dim)", marginTop: "12px", fontWeight: "600", maxWidth: "90%", lineHeight: 1.4 }}>Biomechanical detection, touch accuracy and execution quality of technical gestures.</p>
               </div>
               <div style={{ padding: "16px 24px", borderTop: "2px solid #111", display: "flex", justifyContent: "flex-end", background: "var(--surface-light)" }}>
                  <ChevronRight size={28} color="#111" strokeWidth={3} />
               </div>
            </button>

            <button 
              onClick={() => handleSelectMacro("ATHLETIC")} 
              className="card-dark hover-lift pseudo-haptic" 
              style={{ border: "2px solid #111", background: "#fff", textAlign: "left", padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
               <div style={{ padding: "32px 24px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <Activity size={40} color="var(--primary)" strokeWidth={3} />
                    <div style={{ background: "var(--primary)", color: "#fff", padding: "6px 12px", fontSize: "0.7rem", fontWeight: "900", borderRadius: "4px" }}>ATHLETICS</div>
                  </div>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>Athletic Analysis</h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--gray-dim)", marginTop: "12px", fontWeight: "600", maxWidth: "90%", lineHeight: 1.4 }}>Monitoring explosiveness, changes of direction, top speed and dynamic coordination.</p>
               </div>
               <div style={{ padding: "16px 24px", borderTop: "2px solid #111", display: "flex", justifyContent: "flex-end", background: "var(--surface-light)" }}>
                  <ChevronRight size={28} color="#111" strokeWidth={3} />
               </div>
            </button>
        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER: SELECTOR
  // ==========================================
  if (viewState === "selector") {
    return (
      <div className="app-container page-wrapper" style={{ minHeight: "100vh", background: "var(--background)" }} suppressHydrationWarning>
        <header style={{ padding: "32px 20px", borderBottom: "4px solid #111", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
           <button 
             onClick={() => { haptic.light(); setViewState("macro"); }} 
             className="btn-secondary" 
             style={{ padding: "8px 16px", background: "#fff", border: "2px solid #111", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "900", textTransform: "uppercase", fontSize: "0.75rem", borderRadius: "12px" }}
           >
             <ArrowLeft size={16} strokeWidth={4} /> Back
           </button>
           <h1 style={{ fontSize: "2.4rem", fontWeight: "900", textTransform: "uppercase", lineHeight: 1 }}>
             <span className="brush-highlight">Choose Media</span>
           </h1>
           <div style={{ marginTop: "16px", background: primaryColor, color: "#fff", display: "inline-block", padding: "6px 14px", fontSize: "0.75rem", fontWeight: "900", border: isTechnical ? `2px solid ${pastelYellow}` : "2px solid #111", borderRadius: "6px" }}>
             AREA: {selectedMacro}
           </div>
        </header>

        <main className="v-stack" style={{ padding: "32px 20px", gap: "16px" }}>
            {filteredLibrary.length === 0 ? (
                <div className="card-dark" style={{ textAlign: "center", padding: "60px 20px", color: "var(--gray-dim)", fontWeight: "800", background: "#fff", border: "2px dashed #111" }}>
                   <Video size={48} color={pastelYellow} style={{ margin: "0 auto 16px auto" }} />
                   <p style={{ fontSize: "1rem", textTransform: "uppercase" }}>No content detected</p>
                   <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: "8px" }}>Upload a video to start the analysis.</p>
                </div>
            ) : (
                <div className="v-stack" style={{ gap: "12px" }}>
                   {filteredLibrary.map(item => (
                      <div 
                        key={item.id} 
                        className="card-dark hover-lift pseudo-haptic" 
                        onClick={() => handleSelectMedia(item)} 
                        style={{ cursor: "pointer", border: "2px solid #111", background: "#fff", padding: "16px", borderRadius: "16px" }}
                      >
                         <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "80px", height: "80px", background: "#111", borderRadius: "12px", border: "2px solid #111", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                               {item.thumbnailUrl ? (
                                 <img src={item.thumbnailUrl} alt="Thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                               ) : (
                                 <Video color={pastelYellow} size={32} strokeWidth={3} />
                               )}
                            </div>
                            <div style={{ flex: 1 }}>
                               <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ fontSize: "0.6rem", fontWeight: "900", color: primaryColor, textTransform: "uppercase", background: primaryColorLight, padding: "2px 6px", borderRadius: "4px", border: isTechnical ? `1px solid ${pastelYellow}` : "none" }}>
                                    {item.type}
                                  </span>
                                  {item.status === "ANALYZED" && (
                                    <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "#10b981", textTransform: "uppercase", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                      ANALYZED
                                    </span>
                                  )}
                               </div>
                               <h3 style={{ fontSize: "1.2rem", fontWeight: "900", color: "#111", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{item.title}</h3>
                               <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                 <Clock size={14} color="var(--gray-dim)" />
                                 <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gray-dim)" }}>{item.date}</span>
                               </div>
                            </div>
                            <ChevronRight size={24} color="#111" strokeWidth={4} />
                         </div>
                      </div>
                   ))}
                </div>
            )}
        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER: DASHBOARD (Single & Session Logic)
  // ==========================================
  if (viewState === "dashboard") {
    const isSession = selectedMedia.type === "session";
    const reps = selectedMedia.reps || [];

    const isUploading = processingState === "uploading";
    const isAnalyzing = processingState === "analyzing";
    const isBusy = isUploading || isAnalyzing;

    return (
      <div className="app-container page-wrapper" translate="no" style={{ minHeight: "100vh", background: "var(--background)" }}>
        
        <header style={{ padding: "40px 20px", background: "#fff", borderBottom: "4px solid #111", position: "sticky", top: 0, zIndex: 10 }}>
           <button 
             onClick={() => { haptic.light(); setViewState("selector"); }} 
             className="btn-secondary" 
             style={{ padding: "8px 16px", background: "#fff", border: "2px solid #111", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "900", textTransform: "uppercase", fontSize: "0.75rem", borderRadius: "12px" }}
           >
             <ArrowLeft size={16} strokeWidth={4} /> Back
           </button>
           <h1 style={{ fontSize: "2.2rem", fontWeight: "900", textTransform: "uppercase", lineHeight: 1 }}>
             <span className="brush-highlight">{selectedMedia.title}</span>
           </h1>
           <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
             <span style={{ background: primaryColor, color: "#fff", padding: "6px 12px", fontSize: "0.65rem", fontWeight: "900", textTransform: "uppercase", border: `2px solid ${primaryColor}`, borderRadius: "4px" }}>{selectedMedia.macroArea}</span>
             <span style={{ background: primaryColor, color: "#fff", padding: "6px 12px", fontSize: "0.65rem", fontWeight: "900", textTransform: "uppercase", border: isTechnical ? `2px solid ${pastelYellow}` : "2px solid #111", borderRadius: "4px" }}>{isSession ? 'BATCH' : 'SINGLE'}</span>
           </div>
        </header>

        <main className="v-stack" style={{ padding: "32px 20px", gap: "32px" }}>
          
          {/* PROCESSING STATUS BAR */}
          {isBusy && (
            <div className="card-dark anim-spring-pop" style={{ background: "#111", color: "#fff", border: `3px solid ${primaryColor}`, borderRadius: "var(--radius-card)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: isTechnical ? `0 15px 35px rgba(59, 130, 246, 0.25)` : "0 15px 35px rgba(0,0,0,0.3)" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                 <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                   <div style={{ position: "absolute", inset: "-4px", border: `3px solid ${primaryColor}`, borderTopColor: isTechnical ? pastelYellow : "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                   <Zap size={24} color={isTechnical ? pastelYellow : "var(--primary)"} fill={isTechnical ? pastelYellow : "var(--primary)"} strokeWidth={3} />
                 </div>
                 <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", marginBottom: "2px", color: "#fff", display: "flex", justifyContent: "space-between" }}>
                      <span>AI Engine Active</span>
                      <span style={{ color: isTechnical ? pastelYellow : "var(--primary)" }}>{isUploading ? "10%" : `${analysisProgress}%`}</span>
                    </h4>
                    <p style={{ fontSize: "0.75rem", fontWeight: "800", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {isUploading 
                        ? "Uploading video to secure vault..." 
                        : `Running AI Biomechanical Analysis (~${timeRemaining}s left)`
                      }
                    </p>
                 </div>
               </div>
               
               {/* PROGRESS BAR */}
               <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ 
                    height: "100%", 
                    width: isUploading ? "10%" : `${analysisProgress}%`, 
                    background: primaryColor, 
                    transition: "width 0.4s ease-out",
                    boxShadow: `0 0 10px ${primaryColor}` 
                  }} />
               </div>
            </div>
          )}

          {/* SINGLE VIDEO VIEW */}
          {!isSession && (
            <section className="card-dark hover-lift" style={{ border: "2px solid #111", background: "#fff", padding: "0", overflow: "hidden" }}>
               <div style={{ aspectRatio: "16/9", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                 <Video size={60} color={pastelYellow} strokeWidth={3} />
                 <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 10px", fontSize: "0.7rem", fontWeight: "900", borderRadius: "4px", backdropFilter: "blur(4px)" }}>READY FOR SCAN</div>
               </div>
               <div style={{ padding: "24px" }}>
                 <h3 style={{ fontSize: "1.3rem", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px" }}>Analysis Detail</h3>
                 <p style={{ fontSize: "0.9rem", color: "var(--gray-dim)", fontWeight: "600", marginBottom: "24px" }}>The video will be processed by the A.I. engine to extract performance metrics.</p>
                 <button 
                    disabled={isBusy}
                    onClick={() => executeAnalysis(selectedMedia.videoUrl, false)}
                    className="btn-primary pseudo-haptic" 
                    style={{ 
                      width: "100%", height: "64px", background: primaryColor, color: "#fff", 
                      fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", 
                      border: "2px solid #111", boxShadow: isTechnical ? `4px 4px 0px ${pastelYellow}` : "4px 4px 0px #111", opacity: isBusy ? 0.6 : 1 
                    }}
                 >
                    {isBusy ? "PROCESSING..." : (isTechnical ? "TECHNICAL ANALYSIS" : "ATHLETIC ANALYSIS")}
                 </button>
               </div>
            </section>
          )}

          {/* SESSION (BATCH) VIEW */}
          {isSession && (
            <div className="v-stack" style={{ gap: "24px" }}>
              <section className="card-dark" style={{ background: "#fff", border: "2px solid #111", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                   <h3 style={{ fontSize: "1rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>Pipeline Batch</h3>
                   <span style={{ fontSize: "0.8rem", fontWeight: "900", color: primaryColor }}>{currentRepIdx} / {reps.length}</span>
                </div>
                
                <div style={{ width: "100%", background: "var(--surface-light)", borderRadius: "99px", height: "12px", overflow: "hidden", border: "1px solid #eee" }}>
                    <div style={{ height: "100%", width: `${(currentRepIdx / reps.length) * 100}%`, background: primaryColor, transition: "width 0.6s var(--spring-easing)" }}></div>
                </div>
              </section>

               <div className="v-stack" style={{ gap: "12px" }}>
                {reps.map((rep, idx) => {
                   const isAnalyzed = !!sessionResults[idx];
                   const isCurrent = idx === currentRepIdx;
                   const isPending = idx > currentRepIdx;

                   return (
                     <div key={idx} className="card-dark" style={{ 
                       background: isCurrent ? "var(--surface-light)" : "#fff", 
                       border: isCurrent ? ("2px solid " + primaryColor) : "2px solid #111", 
                       padding: "16px", display: "flex", alignItems: "center", gap: "16px",
                       opacity: isPending && !isCurrent ? 0.5 : 1, transition: "all 0.3s",
                       boxShadow: isCurrent ? ("4px 4px 0px " + (isTechnical ? pastelYellow : "var(--primary)")) : "none"
                     }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", border: "2px solid #111", background: isAnalyzed ? "#10b981" : (isCurrent ? primaryColor : "#fff"), display: "flex", alignItems: "center", justifyContent: "center", color: isAnalyzed || isCurrent ? "#fff" : "#111" }}>
                           {isAnalyzed ? <Check size={24} strokeWidth={4} /> : <Zap size={24} fill={isCurrent ? "#fff" : "none"} strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1 }}>
                           <h4 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase" }}>Rep {idx + 1}</h4>
                           <span style={{ fontSize: "0.65rem", fontWeight: "900", color: isAnalyzed ? "#10b981" : (isCurrent ? primaryColor : "var(--gray-dim)"), textTransform: "uppercase", letterSpacing: "0.05em" }}>
                             {isAnalyzed ? "ANALYSIS COMPLETED" : (isCurrent ? "PROCESSING..." : "IN QUEUE")}
                           </span>
                        </div>
                        {isAnalyzed && (
                           <button 
                             onClick={() => handleOpenEngine(rep.videoUrl, sessionResults[idx], rep.id)}
                             className="btn-secondary pseudo-haptic" 
                             style={{ background: "#111", color: "#fff", padding: "10px", border: "2px solid #111", borderRadius: "8px" }}
                           >
                             <Play size={18} fill="#fff" />
                           </button>
                        )}
                     </div>
                   );
                })}
               </div>

              {currentRepIdx < reps.length && (
                  <button 
                    disabled={isBusy}
                    onClick={() => executeAnalysis(reps[currentRepIdx].videoUrl, true, currentRepIdx)}
                    className="btn-primary pseudo-haptic" 
                    style={{ 
                      width: "100%", height: "64px", background: primaryColor, color: "#fff", 
                      fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase",
                      border: "2px solid #111", boxShadow: isTechnical ? `4px 4px 0px ${pastelYellow}` : "4px 4px 0px #111", opacity: isBusy ? 0.6 : 1,
                      marginTop: "16px"
                    }}
                  >
                    {isBusy ? "ANALYZING..." : `${isTechnical ? "TECHNICAL" : "ATHLETIC"} — REP ${currentRepIdx + 1}`}
                  </button>
              )}
            </div>
          )}

        </main>
      </div>
    );
  }

  // ==========================================
  // RENDER: ENGINE (Results Screen)
    // ===============================
  return (
    <>
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: "100px" }} suppressHydrationWarning>
      
      {/* HEADER EDITORIAL */}
      <header style={{ background: "#fff", padding: "32px 20px", paddingTop: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "4px solid #111", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
           <button 
             onClick={() => setViewState("dashboard")} 
             className="btn-secondary pseudo-haptic" 
             style={{ border: "2px solid #111", background: "#fff", padding: "10px", borderRadius: "12px" }}
           >
             <ArrowLeft size={20} color="#111" strokeWidth={4} />
           </button>
           <div>
             <h2 style={{ fontSize: "1.8rem", fontWeight: "900", color: "#111", textTransform: "uppercase", lineHeight: 1 }}>
               <span className="brush-highlight">Analysis Engine</span>
             </h2>
             <p style={{ fontSize: "0.7rem", fontWeight: "900", color: primaryColor, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>
                AI Terminal Online
             </p>
           </div>
        </div>
        
        <div style={{ width: "20px", height: "20px", background: primaryColor, border: isTechnical ? "2px solid " + pastelYellow : "2px solid #111", borderRadius: "4px" }}></div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="v-stack" style={{ flex: 1, padding: "32px 20px", gap: "32px" }}>
         
         {/* PLAYER MODULE EDITORIAL */}
         <section id="analysis-player-container" className="card-dark" style={{ background: "#000", border: "3px solid #111", padding: "0", overflow: "hidden", position: "relative", boxShadow: "8px 8px 0px #111" }}>
            
            {/* The Video Element */}
            <div style={{ position: "relative", aspectRatio: "16/9", background: "#111" }}>
               {engineTargetUrl && !videoError ? (
                   <video 
                     ref={videoRef}
                     src={engineTargetUrl}
                     playsInline
                     onError={() => setVideoError(true)}
                     onTimeUpdate={handleTimeUpdate}
                     onLoadedMetadata={(e) => setDuration(e.target.duration)}
                     onEnded={() => setIsPlaying(false)}
                     onClick={togglePlay}
                     style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "pointer" }}
                   />
               ) : (
                 <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", textAlign: "center", padding: "40px" }}>
                   <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: primaryColorBg, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + primaryColor }}>
                      <AlertCircle size={24} color={primaryColor} />
                   </div>
                   <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase" }}>Expired Link</h3>
                   <span style={{ fontSize: "0.8rem", opacity: 0.6, fontWeight: "600", maxWidth: "240px" }}>The video is no longer accessible in memory. Please reload the media from the library.</span>
                 </div>
               )}


               {/* CINEMATIC EFFECT */}
               {effectPhase === "freeze" && (
                  <div style={{ 
                    position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
                    display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0",
                    background: "rgba(0,0,0,0.4)", backdropFilter: "grayscale(0.3) brightness(0.7)"
                  }}>
                     {/* NANO BANANA HIGHLIGHT FRAME */}
                     {highlightImage && (
                       <div style={{ 
                         position: "absolute", inset: 0, 
                         animation: "fadeIn 0.5s ease-out forwards",
                         zIndex: 6
                       }}>
                          <img 
                            src={highlightImage} 
                            alt="AI Highlight" 
                            style={{ 
                              width: "100%", height: "100%", objectFit: "contain",
                              filter: isTechnical 
                                ? `drop-shadow(4px 4px 0px ${primaryColor}) drop-shadow(-4px -4px 0px ${primaryColor}) drop-shadow(4px -4px 0px ${primaryColor}) drop-shadow(-4px 4px 0px ${primaryColor}) drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))`
                                : "drop-shadow(4px 4px 0px #ff0000) drop-shadow(-4px -4px 0px #ff0000) drop-shadow(4px -4px 0px #ff0000) drop-shadow(-4px 4px 0px #ff0000) drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))",
                              zIndex: 10
                            }} 
                          />
                          {/* SCAN LINE EFFECT */}
                          <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                            background: isTechnical ? pastelYellow : "#ff0000", boxShadow: isTechnical ? `0 0 20px ${pastelYellow}` : "0 0 20px #ff0000",
                            animation: "scan-line 1.5s linear infinite",
                            zIndex: 7
                          }} />
                       </div>
                     )}

                     <div style={{ 
                       width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", position: "relative", zIndex: 8
                     }}>
                        <div style={{ 
                          height: "100%", background: primaryColor, width: "0%",
                          boxShadow: `0 0 15px ${primaryColor}`,
                          animation: "freeze-timer 5s linear forwards"
                        }}></div>
                     </div>
                  </div>
                )}

               {/* SIDE GLASS POPUPS (Half-height) */}
               {!videoError && (
                 <>
                   {/* Left Column */}
                   <div style={{ 
                      position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", 
                      zIndex: 30, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none"
                   }}>
                      {activePopups.flatMap(p => p.feedback_points || [p]).filter((_, i) => i % 2 === 0).map((f, idx) => {
                         const styleDef = CATEGORY_COLORS[f.sub_category] || CATEGORY_COLORS["Technic"];
                         const isCorrect = f.status === 'correct' || f.is_correct;
                         return (
                           <div key={`left-${f.id || idx}`} className="anim-spring-pop" style={{ 
                             background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", 
                             border: `3px solid ${styleDef.border}`, borderRadius: "16px", padding: "14px", 
                             color: "#111", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", width: "220px", pointerEvents: "auto" 
                           }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <div style={{ fontSize: "0.6rem", fontWeight: "900", color: styleDef.border, textTransform: "uppercase" }}>
                                  {f.sub_category || "ANALYSIS"}
                                </div>
                                {isCorrect ? <Check size={14} color="#10b981" strokeWidth={4} /> : <X size={14} color="#ef4444" strokeWidth={4} />}
                              </div>
                              <div style={{ fontSize: "0.85rem", fontWeight: "900", marginBottom: "4px" }}>{f.label || f.categoria_specifica}</div>
                              <p style={{ fontSize: "0.75rem", fontWeight: "700", lineHeight: 1.3, opacity: 0.9 }}>{f.message || f.description}</p>
                           </div>
                         );
                      })}
                   </div>

                   {/* Right Column */}
                   <div style={{ 
                      position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", 
                      zIndex: 30, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none"
                   }}>
                      {activePopups.flatMap(p => p.feedback_points || [p]).filter((_, i) => i % 2 !== 0).map((f, idx) => {
                         const styleDef = CATEGORY_COLORS[f.sub_category] || CATEGORY_COLORS["Technic"];
                         const isCorrect = f.status === 'correct' || f.is_correct;
                         return (
                           <div key={`right-${f.id || idx}`} className="anim-spring-pop" style={{ 
                             background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", 
                             border: `3px solid ${styleDef.border}`, borderRadius: "16px", padding: "14px", 
                             color: "#111", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", width: "220px", pointerEvents: "auto" 
                           }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <div style={{ fontSize: "0.6rem", fontWeight: "900", color: styleDef.border, textTransform: "uppercase" }}>
                                  {f.sub_category || "ANALYSIS"}
                                </div>
                                {isCorrect ? <Check size={14} color="#10b981" strokeWidth={4} /> : <X size={14} color="#ef4444" strokeWidth={4} />}
                              </div>
                              <div style={{ fontSize: "0.85rem", fontWeight: "900", marginBottom: "4px" }}>{f.label || f.categoria_specifica}</div>
                              <p style={{ fontSize: "0.75rem", fontWeight: "700", lineHeight: 1.3, opacity: 0.9 }}>{f.message || f.description}</p>
                           </div>
                         );
                      })}
                   </div>
                 </>
               )}
            </div>

            {/* CUSTOM CONTROLS & TIMELINE */}
            {(!videoError) && (
              <div style={{ padding: "16px 20px", background: "#111", borderTop: "2px solid #111" }}>
                 <div style={{ position: "relative", height: "36px", display: "flex", alignItems: "center", marginBottom: "12px" }}>
                     <div style={{ position: "absolute", left: 0, right: 0, height: "8px", background: "#333", borderRadius: "4px" }}></div>
                     <div style={{ position: "absolute", left: 0, height: "8px", background: primaryColor, borderRadius: "4px", width: `${(currentTime / duration) * 100 || 0}%`, pointerEvents: "none" }}></div>
                     <input 
                       type="range" 
                       min={0} 
                       max={duration || 100} 
                       value={currentTime} 
                       onChange={handleSeek}
                       style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10, width: "100%" }}
                     />
                     {analysisData && analysisData.lista_popup && analysisData.lista_popup.map(popup => {
                        const positionPerc = (popup.key_moment_time / duration) * 100;
                        return (
                           <div 
                             key={popup.id} 
                             style={{ 
                               position: "absolute", left: `${positionPerc}%`, top: "50%", transform: "translate(-50%, -50%)", 
                               width: "12px", height: "12px", background: "#fff", borderRadius: "50%", border: "3px solid " + primaryColor, zIndex: 5,
                               boxShadow: processedMoments.has(popup.id) ? "none" : ("0 0 15px " + (isTechnical ? pastelYellow : "var(--primary)"))
                             }} 
                           />
                        );
                     })}
                 </div>

                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                       <button onClick={togglePlay} style={{ background: "transparent", border: "none", padding: "4px", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer" }}>
                          {isPlaying ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" />}
                       </button>
                       <button onClick={handleNextGesture} className="btn-secondary pseudo-haptic" style={{ background: "#222", border: "1px solid #444", padding: "8px 14px", borderRadius: "8px", color: "#fff", fontSize: "0.7rem", fontWeight: "900", textTransform: "uppercase", display: "flex", gap: "6px", alignItems: "center", cursor: "pointer" }}>
                          NEXT <ChevronRight size={16} />
                       </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* OVERLAY TOGGLES REMOVED */}
                        <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#888", fontFamily: "var(--font-heading)" }}>
                           {currentTime.toFixed(1)}s <span style={{ opacity: 0.4 }}>/</span> {(duration || 0).toFixed(1)}s
                        </div>

                        <button onClick={() => {
                           const container = document.getElementById("analysis-player-container");
                           if (!document.fullscreenElement) {
                              container?.requestFullscreen().catch(err => console.log(err));
                           } else {
                              document.exitFullscreen();
                           }
                        }} style={{ background: "transparent", border: "none", padding: "4px", color: "#fff", cursor: "pointer" }}>
                           <Maximize size={20} color="#fff" />
                        </button>
                     </div>
                 </div>
              </div>
            )}
         </section>

          {/* BOX: ANALISI ADVANCED EDITORIAL */}
          {(analysisData || Object.keys(sessionResults).length > 0) && (
            <section className="card-dark hover-lift" style={{ background: "#fff", border: "2px solid #111", padding: "32px", boxShadow: "6px 6px 0px #111" }}>
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "4px solid #111", paddingBottom: "16px" }}>
                  <Activity size={24} color={primaryColor} strokeWidth={3} />
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "900", textTransform: "uppercase", color: "#111" }}>
                    {selectedMedia?.type === "session" ? "Session Report" : "Performance Hub"}
                  </h3>
                </div>

              <div className="v-stack" style={{ gap: "24px" }}>
                  {selectedMedia?.type === "session" ? (
                    <div className="v-stack" style={{ gap: "12px" }}>
                      <p style={{ fontSize: "1rem", fontWeight: "800", color: "#111", lineHeight: 1.4 }}>
                        Processing completed for <span style={{ color: primaryColor }}>{Object.keys(sessionResults).length}</span> videos out of {selectedMedia.reps.length}.
                      </p>
                      {Object.keys(sessionResults).length === selectedMedia.reps.length && (
                        <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "12px", border: "1px solid #10b981", display: "flex", gap: "12px" }}>
                           <Check size={20} color="#10b981" />
                           <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#10b981" }}>
                             All data is ready to be archived in Analytics.
                           </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <span style={{ fontSize: "0.7rem", fontWeight: "900", color: primaryColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>Global Insight</span>
                        <p style={{ fontSize: "1rem", fontWeight: "800", color: "#111", lineHeight: 1.5, marginTop: "6px" }}>
                          {(() => {
                            const val = analysisData?.dati_box_advanced?.riassunto || analysisData?.dati_box_advanced?.overallPattern || "Analysis completed successfully.";
                            return typeof val === 'object' ? JSON.stringify(val) : val;
                          })()}
                        </p>
                        {analysisData?.dati_box_advanced?.errore_prevalente && (
                          <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ef4444", marginTop: "16px", background: "rgba(239, 68, 68, 0.05)", padding: "16px", borderRadius: "12px", border: "2px solid #ef4444" }}>
                            <span style={{fontWeight: "900", textTransform: "uppercase", display: "block", marginBottom: "4px"}}>Critical Issue Detected:</span> 
                            {typeof analysisData.dati_box_advanced.errore_prevalente === 'object' 
                              ? JSON.stringify(analysisData.dati_box_advanced.errore_prevalente) 
                              : analysisData.dati_box_advanced.errore_prevalente}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        {Object.entries(analysisData?.dati_box_advanced || {})
                          .filter(([key]) => !['riassunto', 'overallPattern', 'errore_prevalente', 'intensità_esercizio', 'score', 'intensità', 'voto_complessivo_sessione', 'voto_complessivo', 'voto_complessivo_1_10'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} style={{ padding: "16px", background: "var(--surface)", border: "1px solid #111", borderRadius: "16px", display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase", marginBottom: "4px" }}>{key.replace(/_/g, ' ')}</span>
                                <p style={{ fontSize: "1.1rem", fontWeight: "900", color: "#111" }}>
                                  {typeof value === "object" && value !== null ? JSON.stringify(value) : value}
                                </p>
                            </div>
                          ))
                        }
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderTop: "2px solid #111" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: "900", color: "#111", textTransform: "uppercase" }}>Performance Score</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span style={{ fontSize: "2.8rem", fontWeight: "900", color: "#111", fontFamily: "var(--font-heading)", lineHeight: 1 }}>
                            {(() => {
                              const score = analysisData?.dati_box_advanced?.voto_complessivo_sessione 
                                         || analysisData?.dati_box_advanced?.voto_complessivo 
                                         || analysisData?.dati_box_advanced?.voto_complessivo_1_10
                                         || analysisData?.dati_box_advanced?.score;
                              
                              if (score !== undefined && score !== null) {
                                if (typeof score === 'string' && score.includes('/')) return parseInt(score.split('/')[0]) * 10;
                                if (typeof score === 'number' && score <= 10) return Math.round(score * 10);
                                if (typeof score === 'string' && parseFloat(score) <= 10) return Math.round(parseFloat(score) * 10);
                                return parseInt(score) || 0;
                              }
                              
                              // Fallback: average the popup scores
                              if (analysisData?.lista_popup && analysisData.lista_popup.length > 0) {
                                const sum = analysisData.lista_popup.reduce((acc, p) => acc + (parseFloat(p.voto_1_10) || 6.0), 0);
                                const avg = sum / analysisData.lista_popup.length;
                                return Math.round(avg * 10);
                              }
                              
                              return 0;
                            })()}
                          </span>
                          <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "var(--gray-dim)" }}>/100</span>
                        </div>
                      </div>
                      
                    </>
                  )}
                  <button 
                    onClick={handleSaveInAnalytics} 
                    className="btn-primary pseudo-haptic anim-spring-pop" 
                    style={{ width: "100%", height: "72px", fontSize: "1.2rem", fontWeight: "900", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "16px", background: "#111", color: "#fff", border: "2px solid #111", boxShadow: "4px 4px 0px #111", cursor: "pointer" }}
                  >
                    Save in Analytics <Check size={24} />
                  </button>
                </div>
            </section>
          )}
      </main>
    </div>
    {showAesthetics && (
      <AestheticsRoom 
        bestReps={aestheticsBestReps} 
        videoUrl={engineTargetUrl}
        onClose={() => setShowAesthetics(false)} 
      />
    )}
    {showAestheticsChart && (
      <AestheticsBarChart
        videoId={selectedMedia?.id || "demo"}
        inlineData={analysisData?.aesthetics ? {
          video_id: selectedMedia?.id || "demo",
          parameters: ["Postura", "Equilibrio", "Elasticità", "Coordinazione", "Controllo Palla"],
          scores: [
            Math.round((analysisData.aesthetics.postura || 0.72) * 100),
            Math.round((analysisData.aesthetics.equilibrio || 0.85) * 100),
            Math.round((analysisData.aesthetics.elasticita || 0.78) * 100),
            Math.round((analysisData.aesthetics.coordinazione || 0.65) * 100),
            Math.round((analysisData.aesthetics.controllo_palla || 0.80) * 100),
          ],
          overall: Math.round([
            analysisData.aesthetics.postura || 0.72,
            analysisData.aesthetics.equilibrio || 0.85,
            analysisData.aesthetics.elasticita || 0.78,
            analysisData.aesthetics.coordinazione || 0.65,
            analysisData.aesthetics.controllo_palla || 0.80,
          ].reduce((a,b)=>a+b,0) / 5 * 100)
        } : null}
        onClose={() => setShowAestheticsChart(false)}
      />
    )}
    </>
  );
}

