"use client";

import { useEffect, useRef } from "react";
import { CLOSING } from "@/pitch/lib/agents-data";

let closingEntrancePlayed = false;

interface SlideClosingProps {
  isActive: boolean;
}

export function SlideClosing({ isActive }: SlideClosingProps) {
  const shouldAnimateRef = useRef(!closingEntrancePlayed);
  const live = shouldAnimateRef.current;

  useEffect(() => {
    if (isActive && shouldAnimateRef.current) {
      closingEntrancePlayed = true;
    }
  }, [isActive]);

  const closingTitle = CLOSING.tagline.replace("，", "");
  const [firstLine = closingTitle, secondLine = ""] = closingTitle.split("但它们能让选择不再孤独");

  return (
    <section
      className={`closing-story-slide paper-texture flex h-full w-full flex-col items-center justify-center px-12 ${live ? "closing-story--live" : "closing-story--done"}`}
    >
      <p className="closing-tagline max-w-3xl text-center text-2xl font-semibold leading-relaxed text-ink xl:text-3xl">
        {firstLine}
        <br />
        {secondLine ? `但它们能让选择不再孤独${secondLine}` : ""}
      </p>

      <div className="closing-divider mt-16 h-px w-20 bg-ink/15" aria-hidden />

      <div className="mt-12 space-y-3 text-center">
        <p className="closing-author text-xl font-bold text-ink">{CLOSING.author}</p>
        <p className="closing-contact font-mono-term text-sm text-ink/55">{CLOSING.contact}</p>
        <div className="closing-links mt-6 flex flex-col gap-2 font-mono-term text-xs text-ink/45 xl:text-sm">
          <a href={CLOSING.product} className="hover:text-cta hover:underline" target="_blank" rel="noopener noreferrer">
            {CLOSING.product}
          </a>
          <a href={CLOSING.github} className="hover:text-cta hover:underline" target="_blank" rel="noopener noreferrer">
            {CLOSING.github}
          </a>
        </div>
      </div>

      <p className="closing-footer mt-16 font-mono-term text-xs text-ink/35">
        傅盛 AI 战队青少年黑客松 · 2026.5
      </p>
    </section>
  );
}
