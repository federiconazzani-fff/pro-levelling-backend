import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import TeamTrainingModal from "@/components/notifications/TeamTrainingModal";
import PremiumGuard from "@/components/auth/PremiumGuard";

const outfit = Outfit({
  variable: "--font-heading-main",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pro Levelling | Performance Training",
  description: "Professional training and video analysis platform for elite athletes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased">
        <div id="app-root">
          <PremiumGuard>
            {children}
            <BottomNav />
            <TeamTrainingModal />
          </PremiumGuard>
        </div>
      </body>
    </html>
  );
}

