"use client";

import { useCallback, useEffect, useState } from "react";
import { PitchChrome, PITCH_SLIDE_LABELS, PITCH_TOTAL } from "./PitchControls";
import { ThumbnailGrid } from "./ThumbnailGrid";
import { SlideHero } from "./slides/SlideHero";
import { SlidePainVsSolution } from "./slides/SlidePainVsSolution";
import { SlideArchitecture } from "./slides/SlideArchitecture";
import { SlideAgents } from "./slides/SlideAgents";
import { SlidePipelineScenes } from "./slides/SlidePipelineScenes";
import { SlideDashboard } from "./slides/SlideDashboard";
import { SlideDemoTransition } from "./slides/SlideDemoTransition";
import { SlideFounderStory } from "./slides/SlideFounderStory";
import { SlideClosing } from "./slides/SlideClosing";

export function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpBuffer, setJumpBuffer] = useState("");

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= PITCH_TOTAL) return;
    setCurrent(index);
    setShowThumbnails(false);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const clearJumpBuffer = useCallback(() => setJumpBuffer(""), []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
      return;
    }
    void document.exitFullscreen();
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!jumpBuffer) return;
    const timer = window.setTimeout(() => {
      clearJumpBuffer();
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [jumpBuffer, clearJumpBuffer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (showThumbnails) {
        if (e.key === "Escape") {
          setShowThumbnails(false);
          clearJumpBuffer();
        }
        else if (/^[1-8]$/.test(e.key)) goTo(Number(e.key) - 1);
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case " ":
          if (!e.repeat) {
            e.preventDefault();
            next();
            clearJumpBuffer();
          }
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          clearJumpBuffer();
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          clearJumpBuffer();
          break;
        case "End":
          e.preventDefault();
          goTo(PITCH_TOTAL - 1);
          clearJumpBuffer();
          break;
        case "Enter":
          if (jumpBuffer) {
            e.preventDefault();
            const page = Number.parseInt(jumpBuffer, 10);
            if (!Number.isNaN(page)) {
              const clamped = Math.min(PITCH_TOTAL, Math.max(1, page));
              goTo(clamped - 1);
            }
            clearJumpBuffer();
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          clearJumpBuffer();
          break;
        case "Escape":
          if (document.fullscreenElement) {
            e.preventDefault();
            void document.exitFullscreen();
            clearJumpBuffer();
          } else {
            e.preventDefault();
            setShowThumbnails(true);
            clearJumpBuffer();
          }
          break;
        default:
          if (/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setJumpBuffer((prevValue) => {
              const nextValue = `${prevValue}${e.key}`.slice(-3);
              const page = Number.parseInt(nextValue, 10);
              if (!Number.isNaN(page) && page >= 1 && page <= PITCH_TOTAL) {
                goTo(page - 1);
              }
              return nextValue;
            });
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, showThumbnails, clearJumpBuffer, jumpBuffer, toggleFullscreen]);

  const slides = [
    <SlideHero key="hero" />,
    <SlidePainVsSolution key="pain-vs-solution" />,
    <SlideArchitecture key="arch" />,
    <SlideAgents key="agents" />,
    <SlidePipelineScenes key="scenes" />,
    <SlideDashboard key="dash" isActive={current === 5 && !showThumbnails} />,
    <SlideFounderStory key="founder" isActive={current === 6 && !showThumbnails} />,
    <SlideClosing key="closing" isActive={current === 7 && !showThumbnails} />,
    <SlideDemoTransition key="demo" />,
  ];

  return (
    <div className="pitch-deck-root relative h-screen w-screen overflow-hidden bg-cream">
      {/* 动画仅作用于内层，避免 transform 影响浮层定位 */}
      <div key={current} className="animate-pitch-enter h-full w-full">
        {slides[current]}
      </div>

      <PitchChrome
        current={current}
        total={PITCH_TOTAL}
        onGoTo={goTo}
        onPrev={prev}
        onNext={next}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {showThumbnails ? (
        <ThumbnailGrid
          labels={[...PITCH_SLIDE_LABELS]}
          current={current}
          onSelect={goTo}
          onClose={() => setShowThumbnails(false)}
        />
      ) : null}
    </div>
  );
}
