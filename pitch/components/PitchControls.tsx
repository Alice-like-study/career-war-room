"use client";

import { FormEvent, useEffect, useState } from "react";

export const PITCH_SLIDE_LABELS = [
  "封面",
  "痛点与解法",
  "架构总览",
  "Agent 详情",
  "场景演示",
  "作战仪表盘",
  "创始人故事",
  "结语",
  "真产品演示",
] as const;

export const PITCH_TOTAL = PITCH_SLIDE_LABELS.length;

interface PitchChromeProps {
  current: number;
  total: number;
  onGoTo: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

/**
 * PPT 极简浮层：左右边缘隐形点击区 + 右下角半透明页码 + 自动淡出的「下一页」提示。
 * 不喧宾夺主，节奏完全由演讲者用键盘控制。
 */
export function PitchChrome({
  current,
  total,
  onGoTo,
  onPrev,
  onNext,
  onToggleFullscreen,
  isFullscreen,
}: PitchChromeProps) {
  const isFirst = current === 0;
  const isLast = current === total - 1;
  const [jumpValue, setJumpValue] = useState(String(current + 1));

  useEffect(() => {
    setJumpValue(String(current + 1));
  }, [current]);

  const submitJump = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const page = Number.parseInt(jumpValue, 10);
    if (Number.isNaN(page)) {
      setJumpValue(String(current + 1));
      return;
    }
    const clamped = Math.min(total, Math.max(1, page));
    onGoTo(clamped - 1);
  };

  return (
    <>
      {/* 左右边缘隐形点击区，方便鼠标翻页，但不显示任何控件 */}
      <button
        type="button"
        aria-label="上一页"
        disabled={isFirst}
        onClick={onPrev}
        className="absolute left-0 top-0 z-20 h-full w-[8vw] cursor-w-resize bg-transparent disabled:pointer-events-none"
      />
      <button
        type="button"
        aria-label="下一页"
        disabled={isLast}
        onClick={onNext}
        className="absolute right-0 top-0 z-20 h-full w-[8vw] cursor-e-resize bg-transparent disabled:pointer-events-none"
      />

      <div className="absolute bottom-5 right-6 z-30 flex items-center gap-2">
        <form
          className="flex items-center gap-1 rounded-md border border-ink/15 bg-paper/80 px-2 py-1 backdrop-blur"
          onSubmit={submitJump}
        >
          <label htmlFor="pitch-jump" className="sr-only">
            跳转页码
          </label>
          <input
            id="pitch-jump"
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            className="w-14 border-none bg-transparent text-center font-mono-term text-xs text-ink/80 outline-none"
          />
          <button
            type="submit"
            className="rounded px-1.5 py-0.5 text-xs font-semibold text-ink/65 transition hover:bg-ink/8 hover:text-ink"
          >
            跳转
          </button>
        </form>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="rounded-md border border-ink/15 bg-paper/80 px-2 py-1 text-xs font-semibold text-ink/70 backdrop-blur transition hover:bg-paper hover:text-ink"
          aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
        >
          {isFullscreen ? "退出全屏" : "全屏"}
        </button>

        {/* 右下角页码：半透明、mono、不抢戏 */}
        <div className="select-none font-mono-term text-sm tracking-wider text-ink/35">
          {current + 1} <span className="text-ink/20">/</span> {total}
        </div>
      </div>

      {/* 自动淡出的下一页提示（首页 / 末页不显示），浮在页码上方。
          key=current 让每次翻页重新触发 3s 淡出 */}
      {!isFirst && !isLast ? (
        <div
          key={current}
          className="animate-pitch-hint pointer-events-none absolute bottom-12 right-6 z-30 select-none font-mono-term text-xs tracking-wide text-ink/40"
        >
          → 下一页
        </div>
      ) : null}

      {/* 底部分页点：点击即可跳转任意页 */}
      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
        {Array.from({ length: total }, (_, index) => {
          const active = index === current;
          return (
            <button
              key={`dot-${index}`}
              type="button"
              aria-label={`跳转到第 ${index + 1} 页`}
              onClick={() => onGoTo(index)}
              className={`h-2.5 w-2.5 rounded-full border transition ${
                active
                  ? "border-ink/80 bg-ink/70"
                  : "border-ink/30 bg-paper/80 hover:border-ink/60 hover:bg-ink/35"
              }`}
            />
          );
        })}
      </div>
    </>
  );
}
