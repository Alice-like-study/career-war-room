"use client";

import { useEffect, useRef } from "react";
import { FOUNDER_STORY } from "@/pitch/lib/agents-data";

let founderEntrancePlayed = false;

interface SlideFounderStoryProps {
  isActive: boolean;
}

export function SlideFounderStory({ isActive }: SlideFounderStoryProps) {
  const shouldAnimateRef = useRef(!founderEntrancePlayed);
  const live = shouldAnimateRef.current;

  useEffect(() => {
    if (isActive && shouldAnimateRef.current) {
      founderEntrancePlayed = true;
    }
  }, [isActive]);

  const founderTitle = FOUNDER_STORY.quote.replace("，", "");
  const [firstLine = founderTitle, secondLine = ""] = founderTitle.split("是怕自己又一次走错方向");
  const paragraphs = FOUNDER_STORY.narrative.split("\n\n");

  return (
    <section
      className={`founder-story-slide flex h-full w-full flex-col items-center justify-center bg-[#e8dfd2] px-16 py-12 xl:px-24 ${live ? "founder-story--live" : "founder-story--done"}`}
    >
      <blockquote className="max-w-4xl text-center">
        <p className="founder-quote text-3xl font-semibold leading-relaxed text-ink xl:text-4xl xl:leading-relaxed">
          「{firstLine}
          <br />
          {secondLine ? `是怕自己又一次走错方向${secondLine}` : ""}
          」
        </p>
        <footer className="founder-attribution mt-6 font-mono-term text-sm text-ink/50">
          {FOUNDER_STORY.attribution}
        </footer>
      </blockquote>

      <div className="mt-14 flex max-w-3xl flex-col items-center">
        <div className="founder-divider h-px w-24 shrink-0 bg-ink/20" aria-hidden />
        <div className="mt-8 w-full space-y-5 text-center text-lg leading-[1.9] text-ink/80 xl:text-xl xl:leading-[2]">
          {paragraphs.map((para, index) => (
            <p key={para.slice(0, 24)} className={`founder-story-para founder-story-para-${index + 1}`}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
