"use client";

import { useState, useEffect, useMemo } from "react";
import { FolderHeart, Search, Filter, Activity, BarChart3, Clock, Dumbbell, Users, Wind } from "lucide-react";
import VideoCard from "@/components/library/VideoCard";
import SingleDetailModal from "@/components/library/SingleDetailModal";
import SessionDetailModal from "@/components/library/SessionDetailModal";
import { haptic } from "@/utils/haptics";
import { deleteVideo } from "@/utils/mediaDb";
import { useRouter } from "next/navigation";

// MOCK LOCAL DATA
const MOCK_DATA = [
  { id: "v1", type: "single", title: "Volley Shot D", date: "30/10/2026", timeSlot: "Morning", macroArea: "TECHNICAL", subCategory: "Shooting", status: "NOT_ANALYZED" },
  { id: "s1", type: "session", title: "Curved Shots Session", date: "31/10/2026", timeSlot: "Afternoon", macroArea: "TECHNICAL", subCategory: "Shooting", status: "PARTIAL", reps: [
    { id: "s1-r1", status: "ANALYZED" },
    { id: "s1-r2", status: "NOT_ANALYZED" },
    { id: "s1-r3", status: "NOT_ANALYZED" }
  ]},
  { id: "v2", type: "single", title: "30m Speed", date: "01/11/2026", timeSlot: "Evening", macroArea: "ATHLETIC", subCategory: "Speed", status: "ANALYZED" },
  { id: "s2", type: "session", title: "Shuttle Run 10m x 5", date: "02/11/2026", timeSlot: "Morning", macroArea: "ATHLETIC", subCategory: "Dynamic Changes", status: "NOT_ANALYZED", reps: [
    { id: "s2-r1", status: "NOT_ANALYZED" },
    { id: "s2-r2", status: "NOT_ANALYZED" }
  ]},
  { id: "v3", type: "single", title: "Stop Control", date: "03/11/2026", timeSlot: "Morning", macroArea: "TECHNICAL", subCategory: "Ball Control", status: "ANALYZED" },
];

const MICRO_OPTIONS = {
  "TECHNICAL": ["Shooting", "Dribbling", "Ball Control", "First Touch (Aerial)", "First Touch (Ground)", "Passing", "Cross", "Freestyle"],
  "ATHLETIC": ["Speed", "Agility", "Dynamic Changes", "Coordination", "Pliometria"]
};

export default function LibraryPage() {
  const [macroTab, setMacroTab] = useState("TECHNICAL");
  const [subFilter, setSubFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const [libraryData, setLibraryData] = useState(MOCK_DATA);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('elite_pro_library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sanitized = parsed.map(item => {
          // Helper to extract string from potential object
          const sanitizeStr = (val) => {
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
              return Object.keys(val)[0] || "Unknown";
            }
            return val;
          };

          let safeSubCategory = sanitizeStr(item.subCategory);
          let safeTitle = sanitizeStr(item.title);
          let safeDate = sanitizeStr(item.date);
          let safeTimeSlot = sanitizeStr(item.timeSlot);
          let safeMacroArea = sanitizeStr(item.macroArea);
          let safeStatus = sanitizeStr(item.status);
          
          let safeSubCategories = item.subCategories;
          if (Array.isArray(safeSubCategories)) {
            safeSubCategories = safeSubCategories.map(c => sanitizeStr(c));
          } else if (typeof safeSubCategories === 'object' && safeSubCategories !== null) {
            safeSubCategories = [sanitizeStr(safeSubCategories)];
          }
          
          return {
            ...item,
            title: typeof safeTitle === 'string' ? safeTitle : "Imported Session",
            subCategory: typeof safeSubCategory === 'string' ? safeSubCategory : "General",
            subCategories: safeSubCategories,
            date: typeof safeDate === 'string' ? safeDate : "Recent",
            timeSlot: typeof safeTimeSlot === 'string' ? safeTimeSlot : "",
            macroArea: typeof safeMacroArea === 'string' ? safeMacroArea : "TECHNICAL",
            status: typeof safeStatus === 'string' ? safeStatus : "NOT_ANALYZED"
          };
        });
        setLibraryData([...sanitized, ...MOCK_DATA]);
      } catch (e) {
        console.error("Failed to load library data");
      }
    }
  }, []);

  // Dynamically compute available categories for the selected macro tab
  const availableCategories = useMemo(() => {
    const macroFiltered = libraryData.filter(item => item.macroArea === macroTab);
    const categories = new Set();
    macroFiltered.forEach(item => {
      if (item.subCategories && item.subCategories.length > 0) {
        categories.add([...item.subCategories].sort().join(" e "));
      } else if (item.subCategory) {
        categories.add(item.subCategory);
      }
    });
    return Array.from(categories).sort();
  }, [libraryData, macroTab]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return libraryData.filter((item) => {
      if (item.macroArea !== macroTab) return false;
      
      if (subFilter !== "All") {
        const itemCat = item.subCategories && item.subCategories.length > 0
          ? [...item.subCategories].sort().join(" e ")
          : item.subCategory;
        if (itemCat !== subFilter) return false;
      }

      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [libraryData, macroTab, subFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const currentMacro = libraryData.filter(i => i.macroArea === macroTab);
    return {
      total: currentMacro.length,
      analyzed: currentMacro.filter(i => i.status === "ANALYZED" || i.status === "PARTIAL").length
    };
  }, [libraryData, macroTab]);

  const handleCardClick = (item) => {
    haptic.medium();
    if (item.type === "single") {
      if (item.status === "ANALYZED") {
        router.push(`/analysis/detail?id=${item.id}`);
      } else {
        setSelectedSingle(item);
      }
    } else {
      setSelectedSession(item);
    }
  };

  const handleDelete = async (id) => {
    haptic.heavy();
    
    // Find the item to check for reps if it's a session
    const itemToDelete = libraryData.find(i => i.id === id);
    
    const updated = libraryData.filter(i => i.id !== id);
    setLibraryData(updated);

    const userOnly = updated.filter(i => !MOCK_DATA.find(m => m.id === i.id));
    localStorage.setItem('elite_pro_library', JSON.stringify(userOnly));
    
    // Cleanup IndexedDB
    try {
      await deleteVideo(id);
      if (itemToDelete?.reps) {
        await Promise.all(itemToDelete.reps.map(rep => deleteVideo(rep.id)));
      }
    } catch (e) {
      console.error("Failed to delete video from IndexedDB", e);
    }
    
    setSelectedSingle(null);
    setSelectedSession(null);
  };

  if (!mounted) return null;

  return (
    <div className="app-container page-wrapper" style={{ background: "var(--background)", minHeight: "100vh", paddingBottom: "100px" }}>
      
      {/* PREMIUM HEADER SECTION */}
      <header style={{ background: "#fff", zIndex: 100, position: "sticky", top: 0, borderBottom: "2px solid #111" }}>
        
        {/* Title & Stats Row */}
        <div style={{ padding: "24px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Inventory Storage</span>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", letterSpacing: "-0.04em", textTransform: "uppercase", fontFamily: "var(--font-heading)", lineHeight: 0.9 }}>
              VIDEO{' '}
              <span style={{ position: "relative", display: "inline-block" }}>
                 <span>LIBRARY</span>
                 <span style={{ 
                   position: "absolute", 
                   bottom: "-2px", 
                   left: 0, 
                   right: 0, 
                   height: "8px", 
                   background: macroTab === "TECHNICAL" ? "rgba(59, 130, 246, 0.15)" : (macroTab === "WORKOUT" ? "rgba(255, 75, 114, 0.15)" : "rgba(230, 57, 70, 0.15)"), 
                   zIndex: -1, 
                   transform: "skewX(-15deg)" 
                 }}></span>
              </span>
            </h2>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#111" }}>{stats.total}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>TOTAL CLIPS</div>
            </div>
            <div style={{ width: "2px", height: "30px", background: "var(--surface-light)" }}></div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--primary)" }}>{stats.analyzed}</div>
              <div style={{ fontSize: "0.6rem", fontWeight: "800", color: "var(--gray-dim)", textTransform: "uppercase" }}>ANALYZED</div>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div style={{ display: "flex", overflowX: "auto", width: "100%", maxWidth: "100vw", gap: "20px", paddingTop: "8px", paddingBottom: "16px", marginTop: "-8px", marginBottom: "-8px", WebkitOverflowScrolling: "touch", paddingLeft: "24px", paddingRight: "24px" }}>
           {["ATHLETIC", "TECHNICAL", "WORKOUT", "RECOVERY"].map(tab => {
             const isActive = macroTab === tab;
             const tabColor = 
               tab === "TECHNICAL" ? "#4F46E5" :
               tab === "WORKOUT"   ? "var(--color-body-workout)" :
               tab === "RECOVERY"  ? "#A3FF66" :
               "var(--primary)";
             const getIcon = () => {
               if (tab === "ATHLETIC")   return <Activity size={15} color={isActive ? tabColor : "currentColor"} />;
               if (tab === "TECHNICAL") return <BarChart3 size={15} color={isActive ? tabColor : "currentColor"} />;
               if (tab === "WORKOUT")   return <Dumbbell size={15} color={isActive ? tabColor : "currentColor"} />;
               return <Activity size={15} color={isActive ? tabColor : "currentColor"} />;
             };

             return (
               <button
                  key={tab}
                  onClick={() => { haptic.light(); setMacroTab(tab); setSubFilter("All"); }}
                  style={{
                    padding: "12px 0 16px", fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    color: isActive ? "#111" : "var(--gray-dim)",
                    borderBottom: isActive ? `4px solid ${tabColor}` : "4px solid transparent",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0
                  }}
               >
                 {getIcon()}
                 <span>{tab}</span>
               </button>
             );
           })}
        </div>
      </header>

      <main className="v-stack" style={{ gap: "24px", padding: "24px 20px" }}>
        
        {/* SEARCH & FILTERS BAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-dim)" }} />
            <input 
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "16px 16px 16px 48px", borderRadius: "12px", border: "1px solid var(--surface-light)",
                fontSize: "0.9rem", fontWeight: "700", background: "var(--surface)", outline: "none", transition: "border 0.3s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#111"}
              onBlur={(e) => e.target.style.borderColor = "var(--surface-light)"}
            />
          </div>

          {/* SUB-CATEGORY FILTERS (Horizontal Scroll) */}
          <div style={{ display: "flex", overflowX: "auto", width: "100%", maxWidth: "100vw", gap: "8px", paddingTop: "8px", paddingBottom: "16px", marginTop: "-8px", marginBottom: "-8px", WebkitOverflowScrolling: "touch" }}>
            <button
              onClick={() => { haptic.light(); setSubFilter("All"); }}
              className="pseudo-haptic"
              style={{
                padding: "10px 20px", borderRadius: "10px", fontWeight: "900", fontSize: "0.75rem", whiteSpace: "nowrap", 
                border: "2px solid #111",
                background: subFilter === "All" ? "#111" : "#fff",
                color: subFilter === "All" ? "#fff" : "#111",
                boxShadow: subFilter === "All" ? "4px 4px 0px #eee" : "none",
                transition: "all 0.2s",
                flexShrink: 0
              }}
            >
              ALL CATEGORIES
            </button>
            
            {availableCategories.map(opt => (
              <button
                key={opt}
                onClick={() => { haptic.light(); setSubFilter(opt); }}
                className="pseudo-haptic"
                style={{
                  padding: "10px 20px", borderRadius: "10px", fontWeight: "900", fontSize: "0.75rem", whiteSpace: "nowrap", 
                  border: subFilter === opt ? `2px solid ${macroTab === "TECHNICAL" ? "#4F46E5" : (macroTab === "WORKOUT" ? "var(--color-body-workout)" : "var(--primary)")}` : "2px solid var(--surface-light)",
                  background: subFilter === opt ? "var(--surface)" : "#fff",
                  color: subFilter === opt ? (macroTab === "TECHNICAL" ? "#4F46E5" : (macroTab === "WORKOUT" ? "var(--color-body-workout)" : "var(--primary)")) : "var(--gray-dim)",
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
              >
                {opt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* FEEDBACK ROW */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--gray-dim)" }}>
              {filteredData.length} RESULTS FOUND
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
               <Clock size={14} color="var(--gray-dim)" />
               <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--gray-dim)" }}>SORT: RECENT</span>
            </div>
        </div>

        {/* MAIN CONTENT AREA (Conditional Rendering) */}
        <div style={{ minHeight: "400px" }}>
          {filteredData.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "24px 16px" }}>
               {filteredData.map((item, idx) => (
                 <div key={`${item.id}-${idx}`} style={{ animation: `blockFadeIn 0.5s cubic-bezier(0.1, 0.9, 0.2, 1) ${idx * 0.05}s both` }}>
                   <VideoCard data={item} onClick={handleCardClick} />
                 </div>
               ))}
            </div>
          ) : (
            <div style={{ 
              padding: "80px 24px", textAlign: "center", color: "var(--gray-dim)", 
              display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
              background: "var(--surface)", borderRadius: "24px", border: "2px dashed var(--surface-light)"
            }}>
              <div style={{ position: "relative" }}>
                 <FolderHeart size={64} opacity={0.2} />
                 <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Filter size={24} style={{ transform: "translateY(8px)" }} />
                 </div>
              </div>
              <div className="v-stack" style={{ gap: "4px" }}>
                <p style={{ fontWeight: "900", fontSize: "1.1rem", color: "#111", textTransform: "uppercase" }}>Nothing found</p>
                <p style={{ fontSize: "0.8rem", fontWeight: "700", maxWidth: "200px", margin: "0 auto" }}>Try adjusting your filters or search query to find your training clips.</p>
              </div>
              <button 
                onClick={() => { haptic.medium(); setSubFilter("All"); setSearchQuery(""); }}
                style={{ background: "#111", color: "#fff", padding: "12px 24px", borderRadius: "12px", fontWeight: "900", fontSize: "0.8rem", textTransform: "uppercase" }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

      </main>

      {/* MODALS RENDERING */}
      <SingleDetailModal 
        open={selectedSingle !== null} 
        data={selectedSingle} 
        onClose={() => setSelectedSingle(null)} 
        onDelete={handleDelete}
      />
      <SessionDetailModal 
        open={selectedSession !== null} 
        data={selectedSession} 
        onClose={() => setSelectedSession(null)} 
        onDelete={handleDelete}
        onRepAnalyze={(sessionId, repId) => console.log("Analyze:", sessionId, repId)}
      />
    </div>
  );
}
