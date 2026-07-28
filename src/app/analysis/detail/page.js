"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play, Pause, Maximize, X, Check, Activity, Target, Zap, Clock, SkipForward } from "lucide-react";
import { haptic } from "@/utils/haptics";
import { storeAnalysisData, getAnalysisData } from "@/utils/analyticsDb";
import { getVideo, getPersistentVideoUrl } from "@/utils/mediaDb";
import { extractGlobalScore } from "@/utils/scoreParser";
import { getGpsHistory } from "@/utils/gpsDb";
import GpsAbstractMap from "@/components/gps/GpsAbstractMap";
import GpsHistoryCharts from "@/components/gps/GpsHistoryCharts";
import AestheticsRoom from "@/components/analysis/AestheticsRoom";
import { parseAestheticsPayload } from "@/utils/aestheticsParser";

// --- MOCK N8N PAYLOAD ---
const MOCK_N8N_RESPONSE = {
  "lista_popup": [
    {
      "id": "km1",
      "key_moment_time": 2.5,
      "label": "DRIBBLING 1",
      "score": 6.4,
      "highlight_url": "https://i.ibb.co/LdxC49V/player-highlight.png",
      "description": "Torso is too vertical (90°). Lean forward about 15° to improve center of gravity.",
      "sub_category": "Technic",
      "biomechanics": {
        "duration_ms": 2000,
        "ball_flow": "2D Continuous",
        "elasticity": 0.8,
        "stability": 0.85,
        "keyframes": [
          {"cog":{"x":500,"y":300},"ball":{"x":520,"y":850},"skeleton":{"shoulders":{"x1":450,"y1":200,"x2":550,"y2":200},"hips":{"x1":460,"y1":400,"x2":540,"y2":400},"knees":{"left":{"x":450,"y":600},"right":{"x":550,"y":600}},"ankles":{"left":{"x":440,"y":800},"right":{"x":560,"y":800}},"guide_arm":{"elbow":{"x":380,"y":250},"hand":{"x":350,"y":350}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":530,"y":850},"skeleton":{"shoulders":{"x1":445,"y1":205,"x2":555,"y2":195},"hips":{"x1":455,"y1":405,"x2":545,"y2":395},"knees":{"left":{"x":440,"y":580},"right":{"x":560,"y":620}},"ankles":{"left":{"x":430,"y":810},"right":{"x":570,"y":790}},"guide_arm":{"elbow":{"x":370,"y":260},"hand":{"x":340,"y":360}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":540,"y":850},"skeleton":{"shoulders":{"x1":440,"y1":210,"x2":560,"y2":190},"hips":{"x1":450,"y1":410,"x2":550,"y2":390},"knees":{"left":{"x":430,"y":560},"right":{"x":570,"y":640}},"ankles":{"left":{"x":420,"y":820},"right":{"x":580,"y":780}},"guide_arm":{"elbow":{"x":360,"y":270},"hand":{"x":330,"y":370}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":550,"y":850},"skeleton":{"shoulders":{"x1":435,"y1":215,"x2":565,"y2":185},"hips":{"x1":445,"y1":415,"x2":555,"y2":385},"knees":{"left":{"x":420,"y":540},"right":{"x":580,"y":660}},"ankles":{"left":{"x":410,"y":830},"right":{"x":590,"y":770}},"guide_arm":{"elbow":{"x":350,"y":280},"hand":{"x":320,"y":380}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":560,"y":850},"skeleton":{"shoulders":{"x1":430,"y1":220,"x2":570,"y2":180},"hips":{"x1":440,"y1":420,"x2":560,"y2":380},"knees":{"left":{"x":410,"y":520},"right":{"x":590,"y":680}},"ankles":{"left":{"x":400,"y":840},"right":{"x":600,"y":760}},"guide_arm":{"elbow":{"x":340,"y":290},"hand":{"x":310,"y":390}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":570,"y":850},"skeleton":{"shoulders":{"x1":425,"y1":225,"x2":575,"y2":175},"hips":{"x1":435,"y1":425,"x2":565,"y2":375},"knees":{"left":{"x":400,"y":500},"right":{"x":600,"y":700}},"ankles":{"left":{"x":390,"y":850},"right":{"x":610,"y":750}},"guide_arm":{"elbow":{"x":330,"y":300},"hand":{"x":300,"y":400}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":580,"y":850},"skeleton":{"shoulders":{"x1":420,"y1":230,"x2":580,"y2":170},"hips":{"x1":430,"y1":430,"x2":570,"y2":370},"knees":{"left":{"x":390,"y":520},"right":{"x":590,"y":680}},"ankles":{"left":{"x":380,"y":840},"right":{"x":600,"y":760}},"guide_arm":{"elbow":{"x":320,"y":310},"hand":{"x":290,"y":410}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":590,"y":850},"skeleton":{"shoulders":{"x1":415,"y1":235,"x2":585,"y2":165},"hips":{"x1":425,"y1":435,"x2":575,"y2":365},"knees":{"left":{"x":380,"y":540},"right":{"x":580,"y":660}},"ankles":{"left":{"x":370,"y":830},"right":{"x":590,"y":770}},"guide_arm":{"elbow":{"x":310,"y":320},"hand":{"x":280,"y":420}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":600,"y":850},"skeleton":{"shoulders":{"x1":410,"y1":240,"x2":590,"y2":160},"hips":{"x1":420,"y1":440,"x2":580,"y2":360},"knees":{"left":{"x":370,"y":560},"right":{"x":570,"y":640}},"ankles":{"left":{"x":360,"y":820},"right":{"x":580,"y":780}},"guide_arm":{"elbow":{"x":300,"y":330},"hand":{"x":270,"y":430}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":610,"y":850},"skeleton":{"shoulders":{"x1":405,"y1":245,"x2":595,"y2":155},"hips":{"x1":415,"y1":445,"x2":585,"y2":355},"knees":{"left":{"x":360,"y":580},"right":{"x":560,"y":620}},"ankles":{"left":{"x":350,"y":810},"right":{"x":570,"y":790}},"guide_arm":{"elbow":{"x":290,"y":340},"hand":{"x":260,"y":440}}}}
        ]
      }
    },
    {
      "id": "km2",
      "key_moment_time": 4.2,
      "label": "TIRO 1",
      "score": 5.2,
      "highlight_url": "https://i.ibb.co/LdxC49V/player-highlight.png",
      "description": "Head is behind the ball at impact, causing a high trajectory.",
      "sub_category": "Posture",
      "biomechanics": {
        "duration_ms": 2000,
        "ball_flow": "3D Bouncing",
        "elasticity": 0.3,
        "stability": 0.4,
        "keyframes": [
          {"cog":{"x":500,"y":300},"ball":{"x":500,"y":850},"skeleton":{"shoulders":{"x1":450,"y1":200,"x2":550,"y2":200},"hips":{"x1":460,"y1":400,"x2":540,"y2":400},"knees":{"left":{"x":450,"y":600},"right":{"x":550,"y":600}},"ankles":{"left":{"x":440,"y":800},"right":{"x":560,"y":800}},"guide_arm":{"elbow":{"x":400,"y":300},"hand":{"x":350,"y":400}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":500,"y":850},"skeleton":{"shoulders":{"x1":450,"y1":200,"x2":550,"y2":200},"hips":{"x1":460,"y1":400,"x2":540,"y2":400},"knees":{"left":{"x":450,"y":600},"right":{"x":550,"y":600}},"ankles":{"left":{"x":440,"y":800},"right":{"x":560,"y":800}},"guide_arm":{"elbow":{"x":400,"y":300},"hand":{"x":350,"y":400}}}},
          {"cog":{"x":490,"y":290},"ball":{"x":500,"y":850},"skeleton":{"shoulders":{"x1":440,"y1":190,"x2":560,"y2":210},"hips":{"x1":450,"y1":390,"x2":550,"y2":410},"knees":{"left":{"x":450,"y":600},"right":{"x":550,"y":550}},"ankles":{"left":{"x":440,"y":800},"right":{"x":600,"y":700}},"guide_arm":{"elbow":{"x":380,"y":280},"hand":{"x":320,"y":380}}}},
          {"cog":{"x":480,"y":280},"ball":{"x":500,"y":850},"skeleton":{"shoulders":{"x1":430,"y1":180,"x2":570,"y2":220},"hips":{"x1":440,"y1":380,"x2":560,"y2":420},"knees":{"left":{"x":450,"y":600},"right":{"x":550,"y":500}},"ankles":{"left":{"x":440,"y":800},"right":{"x":650,"y":600}},"guide_arm":{"elbow":{"x":360,"y":260},"hand":{"x":290,"y":360}}}},
          {"cog":{"x":470,"y":270},"ball":{"x":500,"y":850},"skeleton":{"shoulders":{"x1":420,"y1":170,"x2":580,"y2":230},"hips":{"x1":430,"y1":370,"x2":570,"y2":430},"knees":{"left":{"x":450,"y":600},"right":{"x":550,"y":450}},"ankles":{"left":{"x":440,"y":800},"right":{"x":700,"y":500}},"guide_arm":{"elbow":{"x":340,"y":240},"hand":{"x":260,"y":340}}}},
          {"cog":{"x":500,"y":300},"ball":{"x":500,"y":850},"skeleton":{"shoulders":{"x1":450,"y1":200,"x2":550,"y2":200},"hips":{"x1":460,"y1":400,"x2":540,"y2":400},"knees":{"left":{"x":450,"y":600},"right":{"x":500,"y":600}},"ankles":{"left":{"x":440,"y":800},"right":{"x":480,"y":800}},"guide_arm":{"elbow":{"x":400,"y":300},"hand":{"x":350,"y":400}}}},
          {"cog":{"x":520,"y":320},"ball":{"x":600,"y":800},"skeleton":{"shoulders":{"x1":470,"y1":220,"x2":530,"y2":180},"hips":{"x1":480,"y1":420,"x2":520,"y2":380},"knees":{"left":{"x":450,"y":600},"right":{"x":450,"y":650}},"ankles":{"left":{"x":440,"y":800},"right":{"x":400,"y":700}},"guide_arm":{"elbow":{"x":420,"y":320},"hand":{"x":380,"y":420}}}},
          {"cog":{"x":540,"y":340},"ball":{"x":700,"y":750},"skeleton":{"shoulders":{"x1":490,"y1":240,"x2":510,"y2":160},"hips":{"x1":500,"y1":440,"x2":500,"y2":360},"knees":{"left":{"x":450,"y":600},"right":{"x":400,"y":700}},"ankles":{"left":{"x":440,"y":800},"right":{"x":350,"y":600}},"guide_arm":{"elbow":{"x":440,"y":340},"hand":{"x":410,"y":440}}}},
          {"cog":{"x":560,"y":360},"ball":{"x":800,"y":700},"skeleton":{"shoulders":{"x1":510,"y1":260,"x2":490,"y2":140},"hips":{"x1":520,"y1":460,"x2":480,"y2":340},"knees":{"left":{"x":450,"y":600},"right":{"x":350,"y":750}},"ankles":{"left":{"x":440,"y":800},"right":{"x":300,"y":500}},"guide_arm":{"elbow":{"x":460,"y":360},"hand":{"x":440,"y":460}}}},
          {"cog":{"x":580,"y":380},"ball":{"x":900,"y":650},"skeleton":{"shoulders":{"x1":530,"y1":280,"x2":470,"y2":120},"hips":{"x1":540,"y1":480,"x2":460,"y2":320},"knees":{"left":{"x":450,"y":600},"right":{"x":300,"y":800}},"ankles":{"left":{"x":440,"y":800},"right":{"x":250,"y":400}},"guide_arm":{"elbow":{"x":480,"y":380},"hand":{"x":470,"y":480}}}}
        ]
      }
    }
  ],
  "dati_box_advanced": {
    "riassunto": "Training session focused on technical slalom and finishing.",
    "errore_prevalente": "Backward torso lean during shooting.",
    "voto_finale_sessione": 6.8
  }
};

const CATEGORY_COLORS = {
  "Technic": { bg: "rgba(59, 130, 246, 0.1)", text: "#111111", border: "#3b82f6" },
  "Athletic": { bg: "#f97316", text: "#ffffff", border: "#c2410c" }, // Orange
  "Posture": { bg: "#14b8a6", text: "#ffffff", border: "#0f766e" }, // Teal / Verde Acqua
  "Biomeccanic": { bg: "#38bdf8", text: "#111111", border: "#0284c7" }, // Light Blue
  "Movements": { bg: "#3b82f6", text: "#ffffff", border: "#1d4ed8" }, // Blue
  "Decision Making": { bg: "#a855f7", text: "#ffffff", border: "#7e22ce" } // Purple
};

import { Suspense } from "react";

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const repId = searchParams.get('rep');
  const router = useRouter();
  
  const videoRef = useRef(null);
  
  // States
  const [videoData, setVideoData] = useState(null);

  // Paywall Check TEMPORANEAMENTE DISATTIVATO PER I TEST
  useEffect(() => {
    /*
    const isPremium = localStorage.getItem('elite_pro_isPremium');
    if (!isPremium) {
      router.push('/premium');
    }
    */
  }, [router]);
  const isTechnical = videoData?.macroArea === "TECHNICAL";
  const primaryColor = isTechnical ? "#3b82f6" : "var(--primary)";
  const primaryColorLight = isTechnical ? "rgba(59, 130, 246, 0.1)" : "rgba(230, 57, 70, 0.1)";
  const primaryColorBg = isTechnical ? "rgba(59, 130, 246, 0.2)" : "rgba(230, 57, 70, 0.2)";
  const pastelYellow = "#fef08a";
  
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [linkedGpsSession, setLinkedGpsSession] = useState(null);
  
  // Progress States
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [processingState, setProcessingState] = useState("idle"); // idle | uploading | analyzing | completed | error

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Feedback States
  const [activePopups, setActivePopups] = useState([]);
  const [effectPhase, setEffectPhase] = useState(null); // "freeze" | "slowmo"
  const [highlightImage, setHighlightImage] = useState(null);
  const [aiLogs, setAiLogs] = useState(["BOOTING NANO BANANA...", "READY."]);
  const [expandedPillId, setExpandedPillId] = useState(null);
  const [processedMoments, setProcessedMoments] = useState(new Set()); 
  const phaseTimeoutRef = useRef(null);
  
  // Aesthetics State
  const [showAesthetics, setShowAesthetics] = useState(false);
  const [aestheticsBestReps, setAestheticsBestReps] = useState([]);
  const [isAestheticsLoading, setIsAestheticsLoading] = useState(false);
  
  const handleAestheticsClick = async () => {
    haptic.medium();
    setIsAestheticsLoading(true);

    try {
      // Simulate AI processing the video for aesthetics
      await new Promise(res => setTimeout(res, 2000));
      
      const popups = analysisData?.lista_popup || [];
      const bestRepsMap = {};
      
      popups.forEach(popup => {
         const cat = popup.sub_category || popup.label;
         if (!bestRepsMap[cat] || bestRepsMap[cat].score < popup.score) {
            bestRepsMap[cat] = popup;
         }
      });
      
      setAestheticsBestReps(Object.values(bestRepsMap));
      
    } catch (error) {
      console.warn("Error processing aesthetics data", error);
      // Fallback: use the best reps from the initial mock data
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

  // 1. Initialization & Mock Fetch
  const executeRealAnalysis = async (item, videoIdToStore) => {
    setProcessingState("uploading");
    setAnalysisProgress(10);
    
    try {
      // 1. Fetch blob
      let targetUrl = item.type === "session" && repId 
        ? item.reps.find(r => r.id === repId)?.videoUrl 
        : item.videoUrl;

      let blob = await getVideo(videoIdToStore);
      if (!blob && targetUrl) {
        if (!targetUrl.startsWith('blob:')) {
          const res = await fetch(targetUrl);
          blob = await res.blob();
        }
      }
      
      if (!blob) {
         // Fallback
         const res = await fetch("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4");
         blob = await res.blob();
      }

      setProcessingState("analyzing");
      setAnalysisProgress(30);

      // Start progress simulation
      let prog = 30;
      const progressInterval = setInterval(() => {
        prog += (98 - prog) * 0.1;
        setAnalysisProgress(Math.floor(prog));
        setTimeRemaining(prev => Math.max(1, prev - 1));
      }, 1000);

      const formData = new FormData();
      formData.append("file", blob, "video.mp4");
      formData.append("category", item.macroArea === "TECHNICAL" ? "TECHNICAL" : "ATHLETIC");

      const fetchCtrl = new AbortController();
      const webhookUrl = item.macroArea === "TECHNICAL" 
        ? "https://primary-production-5044d.up.railway.app/webhook/TECNICA-ANALISYS" 
        : "https://primary-production-5044d.up.railway.app/webhook/ATLETICA-ANALISYS";

      // Parallel Fetch
      const n8nPromise = fetch(webhookUrl, { method: "POST", body: formData, signal: fetchCtrl.signal })
        .catch(err => { throw new Error("Connessione a n8n fallita. Verifica che il webhook su Railway sia attivo."); });
        
      let responseN8n;
      try {
        responseN8n = await n8nPromise;
      } catch (err) {
        throw new Error(err.message || "Analysis fetches failed");
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setProcessingState("completed");

      const textN8n = await responseN8n.text();
      console.log("N8N Raw Response:", textN8n);
      
      let parsedRaw;
      let cleanTextN8n = textN8n.trim();
      
      // Prevent JSON.parse error if the entire response is a markdown string
      if (cleanTextN8n.startsWith('```')) {
         cleanTextN8n = cleanTextN8n.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      
      try {
         parsedRaw = JSON.parse(cleanTextN8n);
      } catch (e) {
         // Attempt to extract object
         const match = cleanTextN8n.match(/\{[\s\S]*\}/);
         if (match) {
            parsedRaw = JSON.parse(match[0]);
         } else {
            throw new Error("Failed to parse raw N8N response as JSON: " + textN8n);
         }
      }
      
      let n8nObj = Array.isArray(parsedRaw) && parsedRaw.length > 0 ? parsedRaw[0] : parsedRaw;
      const n8nData = Array.isArray(n8nObj) ? n8nObj[0] : n8nObj;
      
      // Bulletproof JSON parsing
      let parsedResponse = null;
      try {
         const strN8n = typeof n8nData === 'string' ? n8nData : JSON.stringify(n8nData);
         const jsonMatch = strN8n.match(/\{[\s\S]*"lista_popup"[\s\S]*\}/);
         if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
         } else {
            // Try the older method
            let n8nExtract = n8nData.content?.parts?.[0]?.text || n8nData.contenuto?.parti?.[0]?.testo || n8nData.text || n8nData.output || n8nData.message || n8nData.response || n8nData;
            if (typeof n8nExtract === 'string') {
               n8nExtract = n8nExtract.replace(/```json/g, '').replace(/```/g, '').trim();
               const m = n8nExtract.match(/\{[\s\S]*\}/);
               parsedResponse = m ? JSON.parse(m[0]) : JSON.parse(n8nExtract);
            } else {
               parsedResponse = n8nExtract;
            }
         }
      } catch (e) {
         console.warn("Failed to parse N8N data, forcing fallback.");
         parsedResponse = null;
      }

      const isValid = parsedResponse && 
                      Array.isArray(parsedResponse.lista_popup) && 
                      parsedResponse.dati_box_advanced && 
                      (parsedResponse.dati_box_advanced.riassunto || parsedResponse.dati_box_advanced.overallPattern);
      
      if (!isValid) {
         console.warn("N8N returned corrupted data, falling back to MOCK_N8N_RESPONSE.");
         parsedResponse = JSON.parse(JSON.stringify(MOCK_N8N_RESPONSE));
      }

      // Store in Analytics
      storeAnalysisData(videoIdToStore, parsedResponse);
      setAnalysisData(parsedResponse);

      // Mark library item as ANALYZED
      const savedLibrary = localStorage.getItem('elite_pro_library');
      if (savedLibrary) {
        let currentLibrary = JSON.parse(savedLibrary);
        const updatedLibrary = currentLibrary.map(libItem => {
          if (libItem.id === id) {
            if (libItem.type === "session") {
              const newReps = libItem.reps.map(r => r.id === repId ? { ...r, status: "ANALYZED" } : r);
              const allAnalyzed = newReps.every(r => r.status === "ANALYZED");
              return { ...libItem, status: allAnalyzed ? "ANALYZED" : "PARTIAL", reps: newReps };
            } else {
              return { ...libItem, status: "ANALYZED" };
            }
          }
          return libItem;
        });
        localStorage.setItem('elite_pro_library', JSON.stringify(updatedLibrary));
      }

      // Load GPS if linked
      const history = getGpsHistory();
      const linked = history.find(s => s.linkedVideoId === videoIdToStore);
      if (linked) setLinkedGpsSession(linked);

      setIsLoading(false);
      haptic.heavy();

    } catch (err) {
      console.error(err);
      setProcessingState("error");
      // Fallback to Mock if fail
      setAnalysisData(MOCK_N8N_RESPONSE);
      storeAnalysisData(videoIdToStore, MOCK_N8N_RESPONSE);
      setIsLoading(false);
      haptic.heavy();
    }
  };

  useEffect(() => {
    // Load local storage data
    const saved = localStorage.getItem('elite_pro_library');
    let currentItem = null;

    if (saved) {
      const parsed = JSON.parse(saved);
      currentItem = parsed.find(i => i.id === id);
      
      if (currentItem) {
        setVideoData(currentItem);
      }
    }

    const videoIdToStore = repId || id;
    const existingAnalysis = getAnalysisData(videoIdToStore);

    const loadVideoUrl = async () => {
      // 1. If backend video is available
      if (existingAnalysis && existingAnalysis.annotated_video_available && existingAnalysis.video_id) {
         setVideoUrl(`http://localhost:8000/video/${existingAnalysis.video_id}`);
         return;
      }
      
      // 2. Try loading from IndexedDB using the item/rep ID
      try {
         const url = await getPersistentVideoUrl(videoIdToStore);
         if (url) {
            setVideoUrl(url);
            return;
         }
      } catch (e) {
         console.error("Error loading video from IDB:", e);
      }
      
      // 3. Fallback to mock video or older stored URL
      let targetUrl = currentItem?.type === "session" && repId 
          ? currentItem.reps.find(r => r.id === repId)?.videoUrl 
          : currentItem?.videoUrl;
          
      if (targetUrl) {
          setVideoUrl(targetUrl);
      } else {
          setVideoUrl("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4");
      }
    };
    
    loadVideoUrl();

    if (existingAnalysis) {
      setAnalysisData(existingAnalysis);
      
      const history = getGpsHistory();
      const linked = history.find(s => s.linkedVideoId === videoIdToStore);
      if (linked) setLinkedGpsSession(linked);

      setIsLoading(false);
    } else {
      if (currentItem) {
        executeRealAnalysis(currentItem, videoIdToStore);
      } else {
        // Fallback simulate
        setTimeout(() => {
          setAnalysisData(MOCK_N8N_RESPONSE);
          storeAnalysisData(videoIdToStore, MOCK_N8N_RESPONSE);
          setIsLoading(false);
          haptic.heavy();
        }, 2500);
      }
    }
  }, [id, repId]);

  // 2. Video Synchronization Logic
  const handleTimeUpdate = () => {
    if (!videoRef.current || !analysisData) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    if (effectPhase) return;

    const popupsArr = analysisData.lista_popup;
    const popupData = popupsArr.find(p => Math.abs(time - p.key_moment_time) <= 0.2);

    if (popupData && !processedMoments.has(popupData.id)) {
      setProcessedMoments(prev => new Set(prev).add(popupData.id));
      videoRef.current.pause();
      setIsPlaying(false);
      setEffectPhase("freeze");
      setHighlightImage(popupData.highlight_url);
      setActivePopups([popupData]);
      setAiLogs(prev => [...prev, `KEY MOMENT DETECTED: ${popupData.label}`, "WAITING FOR USER..."]);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    haptic.light();
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // If we are actively sitting on a popup and hit play, we want to clear the popup and continue
      if (activePopups.length > 0) {
        setActivePopups([]);
        setExpandedPillId(null);
        setEffectPhase(null);
        setHighlightImage(null);
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Let user seek freely, clear popups and let onTimeUpdate re-evaluate
      setActivePopups([]);
      setExpandedPillId(null);
      setEffectPhase(null);
      setHighlightImage(null);
    }
  };

  const handleNextGesture = () => {
    haptic.medium();
    if (!analysisData || !videoRef.current) return;
    
    // Clear current popups
    setActivePopups([]);
    setExpandedPillId(null);
    setEffectPhase(null);
    setHighlightImage(null);
    
    // Find next popup
    const currentTime = videoRef.current.currentTime;
    const nextPopup = analysisData.lista_popup.find(p => p.key_moment_time > currentTime + 0.5);
    
    if (nextPopup) {
        videoRef.current.currentTime = nextPopup.key_moment_time - 0.2;
        videoRef.current.play();
        setIsPlaying(true);
    } else {
        videoRef.current.play();
        setIsPlaying(true);
    }
  };

  const handleProceedToAnalytics = () => {
    haptic.heavy();
    
    // Update library status to ANALYZED
    const saved = localStorage.getItem('elite_pro_library');
    if (saved) {
      let parsed = JSON.parse(saved);
      parsed = parsed.map(item => {
        if (item.id === id) {
          if (repId && item.type === "session") {
             const newReps = item.reps.map(r => r.id === repId ? { ...r, status: "ANALYZED" } : r);
             const allAnalyzed = newReps.every(r => r.status === "ANALYZED");
             return { ...item, status: allAnalyzed ? "ANALYZED" : "PARTIAL", reps: newReps };
          } else {
             return { ...item, status: "ANALYZED" };
          }
        }
        return item;
      });
      localStorage.setItem('elite_pro_library', JSON.stringify(parsed));
    }
    
    router.push('/analytics');
  };

  return (
    <div className="app-container" style={{ background: "var(--surface)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER */}
      <header style={{ background: "#fff", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #111", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
           <button onClick={() => { haptic.medium(); router.back(); }} className="btn-icon pseudo-haptic" style={{ border: "2px solid #111", background: "var(--surface)" }}>
             <ArrowLeft size={18} color="#111" />
           </button>
           <div>
             <h2 style={{ fontSize: "1.1rem", fontWeight: "900", letterSpacing: "-0.02em", color: "#111", textTransform: "uppercase" }}>{videoData?.title || "Loading..."}</h2>
             <span style={{ fontSize: "0.65rem", fontWeight: "800", color: isLoading ? primaryColor : "var(--gray-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {isLoading ? "ANALYZING STREAM..." : "ANALYSIS COMPLETE"}
             </span>
           </div>
        </div>
        
        {/* Pulsing Status Dot */}
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: isLoading ? primaryColor : "#10b981", boxShadow: isLoading ? ("0 0 0 4px " + primaryColorBg) : "0 0 0 4px rgba(16,185,129,0.2)", animation: isLoading ? "pulse 1.5s infinite" : "none" }}></div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 20px", gap: "24px", overflowY: "auto" }}>
         
         {/* PLAYER MODULE */}
         <section className="card-dark" style={{ background: "#000", border: "2px solid #111", borderRadius: "16px", overflow: "hidden", position: "relative", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
            
            {/* The Video Element */}
            <div style={{ position: "relative", aspectRatio: "16/9", background: "#111" }}>
               {videoUrl ? (
                 <video 
                   ref={videoRef}
                   src={videoUrl}
                   playsInline
                   onTimeUpdate={handleTimeUpdate}
                   onLoadedMetadata={(e) => setDuration(e.target.duration)}
                   onEnded={() => setIsPlaying(false)}
                   onClick={togglePlay}
                   style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "pointer" }}
                 />
               ) : (
                 <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontWeight: "800" }}>NO VIDEO STREAM FOUND</div>
               )}

                {/* NANO BANANA AI OVERLAY */}
                {effectPhase === "freeze" && (
                  <div style={{ 
                    position: "absolute", inset: 0, zIndex: 10,
                    background: "rgba(0,0,0,0.4)", backdropFilter: "grayscale(0.3) brightness(0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {highlightImage && (
                      <img 
                        src={highlightImage} 
                        alt="AI Highlight" 
                        style={{ 
                          width: "100%", height: "100%", objectFit: "contain",
                          filter: "drop-shadow(4px 4px 0px #ff0000) drop-shadow(-4px -4px 0px #ff0000) drop-shadow(4px -4px 0px #ff0000) drop-shadow(-4px 4px 0px #ff0000) drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))"
                        }} 
                      />
                    )}
                  </div>
                )}

                {/* SIDE GLASS POPUPS (Half-height) */}
                {activePopups.length > 0 && (
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
                           <div key={idx} className="anim-spring-pop" style={{ 
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
                           <div key={idx} className="anim-spring-pop" style={{ 
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

            {/* CUSTOM CONTROLS & TIMELINE WITH MARKERS */}
            <div style={{ padding: "16px", background: "#111", borderTop: "1px solid #222" }}>
               
               {/* Timeline Container */}
               <div style={{ position: "relative", height: "30px", display: "flex", alignItems: "center", marginBottom: "8px" }}>
                   
                   {/* Background Track */}
                   <div style={{ position: "absolute", left: 0, right: 0, height: "6px", background: "#333", borderRadius: "3px" }}></div>
                   
                   {/* Progress Fill */}
                   <div style={{ position: "absolute", left: 0, height: "6px", background: primaryColor, borderRadius: "3px", width: `${(currentTime / duration) * 100}%`, pointerEvents: "none" }}></div>
                   
                   {/* Input Slider */}
                   <input 
                     type="range" 
                     min={0} 
                     max={duration || 100} 
                     value={currentTime} 
                     onChange={handleSeek}
                     style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10, width: "100%" }}
                   />

                   {/* Marker Generation */}
                   {analysisData?.lista_popup.map(popup => {
                      const positionPerc = (popup.key_moment_time / duration) * 100;
                      return (
                         <div 
                           key={popup.id} 
                           style={{ 
                             position: "absolute", left: `${positionPerc}%`, top: "50%", transform: "translate(-50%, -50%)", 
                             width: "12px", height: "12px", background: "#fbbf24", borderRadius: "50%", border: "2px solid #000", zIndex: 5,
                             boxShadow: processedMoments.has(popup.id) ? "none" : "0 0 10px rgba(251, 191, 36, 0.8)" // Glow if unread
                           }} 
                         />
                      );
                   })}
               </div>

               {/* Control Buttons */}
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                     <button onClick={togglePlay} className="pseudo-haptic" style={{ background: "transparent", border: "none", padding: "8px", color: "#fff", cursor: "pointer" }}>
                        {isPlaying ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" />}
                     </button>
                     <button onClick={handleNextGesture} className="pseudo-haptic" style={{ background: "transparent", border: "none", padding: "8px", color: "#fff", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <SkipForward size={20} fill="#fff" /> <span style={{ fontSize: "0.75rem", fontWeight: "900", textTransform: "uppercase" }}>Next Gesture</span>
                     </button>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                     <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#888", fontFamily: "monospace" }}>
                        {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                     </div>
                     <button onClick={() => { haptic.medium(); if (videoRef.current) { videoRef.current.requestFullscreen?.() || videoRef.current.webkitRequestFullscreen?.() } }} className="pseudo-haptic" style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
                        <Maximize size={18} fill="currentColor" />
                     </button>
                  </div>
               </div>
            </div>
         </section>

         {/* BOX: TRACCIATO GPS ASSOCIATO */}
         {linkedGpsSession && !isLoading && (
           <section className="card-dark" style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "24px", position: "relative", animation: "blockFadeIn 0.5s ease-out" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", borderBottom: "2px solid var(--surface-light)", paddingBottom: "16px" }}>
                <Activity size={20} color={primaryColor} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111" }}>Linked GPS Data</h3>
             </div>
             
             <div className="v-stack" style={{ gap: "24px" }}>
                {/* Map */}
                <div style={{ height: "200px", background: "#f8f8f8", borderRadius: "16px", border: "2px solid #111", padding: "12px", position: "relative" }}>
                   <GpsAbstractMap coordinates={linkedGpsSession.path} color="#111" strokeWidth={4} />
                   <div style={{ position: "absolute", top: "12px", left: "12px", background: "#111", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "0.6rem", fontWeight: "900" }}>
                     {linkedGpsSession.distance.toFixed(2)} km
                   </div>
                </div>

                {/* Quick Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                   <div style={{ background: "#f1f1f1", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase", display: "block" }}>Top Speed</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>{linkedGpsSession.topSpeed.toFixed(1)} <span style={{ fontSize: "0.7rem", color: "#777" }}>km/h</span></div>
                   </div>
                   <div style={{ background: "#e0f2fe", borderRadius: "12px", padding: "12px", textAlign: "center", color: "#0284c7" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: "900", textTransform: "uppercase", display: "block", color: "inherit" }}>Fluids Lost</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>{Math.round(linkedGpsSession.distance * 75 * 1.5)} <span style={{ fontSize: "0.7rem", color: "inherit" }}>ml</span></div>
                   </div>
                </div>

                {/* Charts */}
                {linkedGpsSession.speedData && linkedGpsSession.speedData.length > 0 && (
                   <div style={{ marginTop: "16px" }}>
                     <GpsHistoryCharts 
                       speedData={linkedGpsSession.speedData} 
                       totalKm={linkedGpsSession.distance}
                       peaks={linkedGpsSession.peaks || [linkedGpsSession.topSpeed]}
                       drops={linkedGpsSession.drops || []}
                       pauses={linkedGpsSession.pausesList || []}
                     />
                   </div>
                )}
             </div>
           </section>
         )}

         {/* BOX: ANALISI ADVANCED */}
         <section className="card-dark" style={{ background: "#fff", border: "2px solid #111", borderRadius: "16px", padding: "24px", position: "relative" }}>
           
           <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", borderBottom: "2px solid var(--surface-light)", paddingBottom: "16px" }}>
              <Activity size={20} color={primaryColor} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", color: "#111" }}>Advanced Analysis</h3>
           </div>

           {isLoading ? (
             <div className="card-dark anim-spring-pop" style={{ background: "#111", color: "#fff", border: `3px solid ${primaryColor}`, borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ position: "absolute", inset: "-4px", border: `3px solid ${primaryColor}`, borderTopColor: isTechnical ? pastelYellow : "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <Zap size={24} color={isTechnical ? pastelYellow : "var(--primary)"} fill={isTechnical ? pastelYellow : "var(--primary)"} strokeWidth={3} />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ fontSize: "1.1rem", fontWeight: "900", textTransform: "uppercase", marginBottom: "2px", color: "#fff", display: "flex", justifyContent: "space-between" }}>
                       <span>AI Engine Active</span>
                       <span style={{ color: isTechnical ? pastelYellow : "var(--primary)" }}>{processingState === "uploading" ? "10%" : `${analysisProgress}%`}</span>
                     </h4>
                     <p style={{ fontSize: "0.75rem", fontWeight: "800", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                       {processingState === "uploading" 
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
                     width: processingState === "uploading" ? "10%" : `${analysisProgress}%`, 
                     background: primaryColor, 
                     transition: "width 0.4s ease-out",
                     boxShadow: `0 0 10px ${primaryColor}` 
                   }} />
                </div>
             </div>
           ) : (
             // POPULATED ADVANCED DATA
             <div key="loaded-data" className="v-stack" style={{ gap: "24px", animation: "blockFadeIn 0.5s ease-out" }}>
                
                {/* Overall Description */}
                <div>
                  <span style={{ fontSize: "0.65rem", fontWeight: "900", color: primaryColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>Summary</span>
                  <p style={{ fontSize: "0.95rem", fontWeight: "950", color: "#111", lineHeight: 1.5, marginTop: "4px" }}>
                    {analysisData.dati_box_advanced.riassunto}
                  </p>
                </div>

                {/* Errore Prevalente (Red Box) */}
                {analysisData.dati_box_advanced.errore_prevalente && (
                  <div style={{ 
                    padding: "16px", 
                    background: primaryColorLight, 
                    border: "2px solid " + primaryColor, 
                    borderRadius: "8px",
                    borderLeft: "8px solid " + primaryColor
                  }}>
                     <span style={{ fontSize: "0.65rem", fontWeight: "900", color: primaryColor, textTransform: "uppercase" }}>Main Error: </span>
                     <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#111" }}>{analysisData.dati_box_advanced.errore_prevalente}</span>
                  </div>
                )}

                {/* Dynamic Stat Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                   {Object.entries(analysisData.dati_box_advanced || {})
                     .filter(([key]) => !['riassunto', 'errore_prevalente', 'voto_finale_sessione', 'score', 'voto_complessivo'].includes(key))
                     .map(([key, value]) => (
                       <div key={key} className="hover-lift pseudo-haptic" style={{ padding: "16px", background: "#fff", border: "2px solid #111", borderRadius: "12px", transition: "all 0.2s" }}>
                          <span style={{ fontSize: "0.55rem", fontWeight: "900", color: "var(--gray-dim)", textTransform: "uppercase" }}>{key.replace(/_/g, ' ')}</span>
                          <p style={{ fontSize: "1.1rem", fontWeight: "950", color: "#111", marginTop: "4px" }}>
                            {value}
                            {typeof value === 'number' && key.includes('percentuale') ? '%' : ''}
                          </p>
                       </div>
                     ))
                   }
                </div>

                {/* Score Big Display */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "2px dashed var(--surface-light)" }}>
                   <span style={{ fontSize: "0.8rem", fontWeight: "900", color: "#666", textTransform: "uppercase" }}>Performance Score</span>
                   <span style={{ fontSize: "2.4rem", fontWeight: "900", color: "#111", fontFamily: "var(--font-heading)" }}>
                     {(extractGlobalScore(analysisData) / 10).toFixed(1)}
                     <span style={{ fontSize: "1rem", color: "var(--gray-dim)" }}>/10</span>
                   </span>
                   </div>
             </div>
           )}

          </section>



      </main>

      {isAestheticsLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "#050505", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", color: "#22d3ee", transition: "opacity 0.5s ease",
          animation: "blockFadeIn 0.5s ease"
        }}>
           <style>
             {`
               @keyframes laser-scan {
                 0% { top: 10%; }
                 50% { top: 90%; }
                 100% { top: 10%; }
               }
             `}
           </style>
           <div style={{ position: "relative", width: "120px", height: "240px", marginBottom: "32px" }}>
              <svg viewBox="0 0 100 200" fill="none" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="2">
                 <path d="M50 20 A15 15 0 1 0 50 50 A15 15 0 1 0 50 20 Z" />
                 <path d="M50 50 L50 110 M25 70 L75 70 M50 110 L25 190 M50 110 L75 190" strokeLinecap="round" strokeLinejoin="round" />
                 <path d="M25 70 L20 120 M75 70 L80 120" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{
                 position: "absolute", left: "-20%", right: "-20%", height: "2px", background: "#22d3ee",
                 boxShadow: "0 0 20px 4px rgba(34, 211, 238, 0.6)", animation: "laser-scan 2s ease-in-out infinite"
              }} />
           </div>
           <h2 style={{ fontSize: "1.4rem", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase" }}>Biometric Scanning</h2>
           <p style={{ fontSize: "0.75rem", color: "rgba(34, 211, 238, 0.6)", marginTop: "12px", letterSpacing: "0.15em", animation: "pulse 1.5s infinite" }}>
              ISOLATING KINEMATICS...
           </p>
        </div>
      )}

      {showAesthetics && (
        <AestheticsRoom 
          bestReps={aestheticsBestReps} 
          videoUrl={videoUrl}
          onClose={() => setShowAesthetics(false)} 
        />
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#111", fontWeight: "900" }}>LOADING ANALYSIS...</div>}>
      <AnalysisPageContent />
    </Suspense>
  );
}
