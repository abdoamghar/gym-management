"use client";

type BarChartProps = {
  labels: string[];
  values: number[];
  color?: string;
  /** Optional suffix appended to the numeric value (e.g. " MAD"). Avoid passing a function — must be serializable. */
  unit?: string;
  children?: React.ReactNode;
};

export function BarChart({
  labels,
  values,
  color = "var(--accent)",
  unit = "",
  children,
}: BarChartProps) {
  if (!labels.length || !values.length) return null;
  const max = Math.max(...values, 1);
  const chartH = 160;

  return (
    <div className="card p-4">
      {children && (
        <h3 className="font-display text-sm font-semibold mb-3 text-[var(--ink)]">
          {children}
        </h3>
      )}
      <svg
        viewBox={`0 0 ${labels.length * 60} ${chartH + 40}`}
        style={{ width: "100%", height: "auto", maxHeight: 220 }}
        role="img"
        aria-label="Bar chart"
      >
        {values.map((v, i) => {
          const barH = (v / max) * chartH;
          const x = i * 60 + 10;
          const y = chartH - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={40}
                height={barH}
                rx={4}
                fill={color}
                style={{ transition: "height 0.3s ease" }}
              />
              <text
                x={x + 20}
                y={y - 6}
                textAnchor="middle"
                fontSize={11}
                fill="var(--muted)"
              >
                {Math.round(v)}{unit}
              </text>
              <text
                x={x + 20}
                y={chartH + 18}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted)"
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}