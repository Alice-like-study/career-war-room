import { AgentsSection } from "@/components/sections/AgentsSection";
import { AudienceSection } from "@/components/sections/AudienceSection";
import { ClosingSection } from "@/components/sections/ClosingSection";
import { CompassSection } from "@/components/sections/CompassSection";
import { CompareSection } from "@/components/sections/CompareSection";
import { FounderSection } from "@/components/sections/FounderSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PipelineSection } from "@/components/sections/PipelineSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CompassSection />
      <AgentsSection />
      <PipelineSection />
      <CompareSection />
      <AudienceSection />
      <FounderSection />
      <ClosingSection />
    </main>
  );
}
