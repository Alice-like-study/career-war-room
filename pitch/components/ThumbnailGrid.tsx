interface ThumbnailGridProps {
  labels: string[];
  current: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function ThumbnailGrid({ labels, current, onSelect, onClose }: ThumbnailGridProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="grid max-h-[80vh] w-full max-w-4xl grid-cols-4 gap-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex aspect-video flex-col items-center justify-center rounded-lg border-2 px-3 py-4 transition ${
              i === current
                ? "border-cta bg-paper shadow-card"
                : "border-ink/25 bg-paper/90 hover:border-ink/50"
            }`}
          >
            <span className="font-mono-term text-2xl text-ink/50">{i + 1}</span>
            <span className="mt-2 text-sm font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-6 font-mono-term text-xs text-cream/50">
        Esc 关闭 · 点击页码跳转
      </p>
    </div>
  );
}
