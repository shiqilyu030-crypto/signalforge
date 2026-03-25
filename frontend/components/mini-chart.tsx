type MiniChartProps = {
  color?: string;
  data: Array<number | null | undefined>;
  height?: number;
  secondaryColor?: string;
  secondaryData?: Array<number | null | undefined>;
  strokeWidth?: number;
};

export function MiniChart({
  color = "#7dd3fc",
  data,
  height = 220,
  secondaryColor = "#6ee7b7",
  secondaryData,
  strokeWidth = 3
}: MiniChartProps) {
  const clean = data.map((value) => (typeof value === "number" ? value : null));
  const cleanSecondary = secondaryData?.map((value) => (typeof value === "number" ? value : null)) ?? [];
  const values = [...clean, ...cleanSecondary].filter((value): value is number => value !== null);

  if (values.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.03] text-sm text-slate-400">
        Not enough data yet
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 1000;
  const padding = 24;
  const range = max - min || 1;

  function buildPath(series: Array<number | null>) {
    return series
      .map((value, index) => {
        const fallbackIndex = Math.max(0, Math.min(index - 1, values.length - 1));
        const safeValue = value ?? series[fallbackIndex] ?? values[0];
        const x = padding + (index / Math.max(series.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - ((safeValue - min) / range) * (height - padding * 2);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  const path = buildPath(clean);
  const secondaryPath = cleanSecondary.length > 1 ? buildPath(cleanSecondary) : null;
  const gradientId = `gradient-${color.replace("#", "")}`;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="transparent" />
        {Array.from({ length: 5 }).map((_, index) => {
          const y = padding + index * ((height - padding * 2) / 4);
          return (
            <line
              key={y}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(255,255,255,0.07)"
              strokeDasharray="6 10"
            />
          );
        })}
        <path
          d={`${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill={`url(#${gradientId})`}
        />
        <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        {secondaryPath ? (
          <path
            d={secondaryPath}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={Math.max(2, strokeWidth - 0.5)}
            strokeLinecap="round"
            strokeDasharray="8 10"
          />
        ) : null}
      </svg>
    </div>
  );
}
