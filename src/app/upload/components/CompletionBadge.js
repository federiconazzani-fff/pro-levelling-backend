export default function CompletionBadge({ isComplete, color = "var(--primary)", showText = true }) {
  if (!isComplete) return null;

  return (
    <>
      <style>{`
        @keyframes drawCircle {
          0% { stroke-dasharray: 0, 100; stroke-dashoffset: 0; opacity: 0; }
          100% { stroke-dasharray: 100, 100; stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes drawCheck {
          0% { stroke-dasharray: 0, 100; stroke-dashoffset: 0; opacity: 0; }
          100% { stroke-dasharray: 100, 100; stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes fadeInText {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: showText ? "6px" : "0" }}>
        <svg width={showText ? "40" : "32"} height={showText ? "40" : "32"} viewBox="0 0 40 40">
          <circle 
            cx="20" cy="20" r="16" 
            fill="none" 
            stroke={color} 
            strokeWidth="3.5" 
            strokeLinecap="round"
            style={{ animation: "drawCircle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
            pathLength="100"
          />
          <path 
            d="M12 20 L18 26 L28 14" 
            fill="none" 
            stroke={color} 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ animation: "drawCheck 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards", opacity: 0 }}
            pathLength="100"
          />
        </svg>
        {showText && (
          <span style={{ 
            fontSize: "0.6rem", 
            fontWeight: "900", 
            textTransform: "uppercase", 
            letterSpacing: "0.1em", 
            color: color,
            animation: "fadeInText 0.4s ease 0.5s forwards",
            opacity: 0
          }}>
            Complete
          </span>
        )}
      </div>
    </>
  );
}
