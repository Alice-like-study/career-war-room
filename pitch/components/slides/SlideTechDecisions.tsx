"use client";

import { useState } from "react";
import { TECH_DECISIONS } from "@/pitch/lib/agents-data";

export function SlideTechDecisions() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="paper-texture flex h-full w-full flex-col items-center justify-center px-12 py-10 xl:px-20">
      <h2 className="mb-10 text-2xl font-bold text-ink xl:text-3xl">关键技术决策</h2>

      <div className="grid w-full max-w-6xl grid-cols-3 gap-6 xl:gap-8">
        {TECH_DECISIONS.map((d) => {
          const isOpen = expanded === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setExpanded(isOpen ? null : d.id)}
              className={`group flex flex-col rounded-xl border-2 bg-paper px-5 py-6 text-left shadow-warm transition-all duration-200 ${
                isOpen ? "border-cta shadow-card" : "border-ink/20 hover:border-ink/40"
              }`}
            >
              <h3 className="text-lg font-bold text-ink xl:text-xl">{d.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/80 xl:text-base">{d.summary}</p>
              <p className="mt-4 font-mono-term text-xs text-cta xl:text-sm">↳ {d.benefit}</p>
              {isOpen ? (
                <p className="mt-4 border-t border-ink/10 pt-4 text-xs leading-relaxed text-ink/65 xl:text-sm">
                  {d.detail}
                </p>
              ) : (
                <span className="mt-auto pt-4 text-xs text-ink/35">点击展开细节</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
