"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PremiumGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    setIsAllowed(true); // Total free app
  }, [pathname, router]);

  if (!isAllowed) {
    // Durante il check o se bloccato, nascondiamo l'app
    return (
      <div style={{ height: "100vh", width: "100vw", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #333", borderTopColor: "#dcf536", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
