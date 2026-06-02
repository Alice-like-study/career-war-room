import type { Metadata } from "next";
import "@/pitch/styles/pitch.css";

export const metadata: Metadata = {
  title: "Career War Room · Pitch Deck",
  description: "应届生求职作战部 — 5 分钟路演 PPT",
  robots: { index: false, follow: false },
};

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pitch-deck-root fixed inset-0 z-[200] h-[100dvh] w-screen overflow-hidden bg-cream font-serif">
      {children}
    </div>
  );
}
