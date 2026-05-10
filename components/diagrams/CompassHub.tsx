export function CompassHubDiagram() {
  return (
    <figure className="mx-auto w-full max-w-3xl px-2" aria-label="作战指挥中心示意图">
      <svg viewBox="0 0 520 280" className="h-auto w-full text-ink" role="img">
        <defs>
          <filter id="hand" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" />
          </filter>
        </defs>
        <g
          stroke="#3D2817"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          filter="url(#hand)"
          opacity={0.85}
        >
          <path d="M260 118 L120 52" />
          <path d="M260 118 L260 38" />
          <path d="M260 118 L400 52" />
          <path d="M260 142 L120 228" />
          <path d="M260 142 L260 248" />
          <path d="M260 142 L400 228" />
        </g>
        {[
          { cx: 120, cy: 44, en: "Prism", zh: "自我画像官" },
          { cx: 260, cy: 28, en: "Scope", zh: "行业匹配官" },
          { cx: 400, cy: 44, en: "Scalpel", zh: "简历医生" },
          { cx: 120, cy: 236, en: "Arena", zh: "模拟面试官" },
          { cx: 260, cy: 252, en: "Balance", zh: "Offer决策官" },
          { cx: 400, cy: 236, en: "Lumen", zh: "情绪陪跑官" },
        ].map((n) => (
          <g key={n.en}>
            <circle cx={n.cx} cy={n.cy} r="28" fill="#FFFBF5" stroke="#3D2817" strokeWidth="2.2" />
            <text
              x={n.cx}
              y={n.cy + 1}
              textAnchor="middle"
              fill="#3D2817"
              fontSize="10.5"
              fontWeight="600"
              style={{ fontFamily: "Noto Serif SC, serif" }}
            >
              {n.en}
            </text>
            <text
              x={n.cx}
              y={n.cy + 14}
              textAnchor="middle"
              fill="#3D2817"
              fontSize="6.5"
              fontWeight="600"
              style={{ fontFamily: "Noto Serif SC, serif" }}
            >
              {n.zh}
            </text>
          </g>
        ))}
        <circle cx="260" cy="130" r="46" fill="#FFFBF5" stroke="#3D2817" strokeWidth="2.8" />
        <text x="260" y="122" textAnchor="middle" fontSize="36">
          🧭
        </text>
        <text
          x="260"
          y="154"
          textAnchor="middle"
          fill="#3D2817"
          fontSize="11"
          fontWeight="700"
          style={{ fontFamily: "Noto Serif SC, serif" }}
        >
          Compass
        </text>
      </svg>
      <figcaption className="sr-only">
        中央为 Compass 总指挥，六条线分别连接 Prism 自我画像官、Scope 行业匹配官、Scalpel 简历医生、Arena 模拟面试官、Balance Offer决策官、Lumen 情绪陪跑官。
      </figcaption>
    </figure>
  );
}
