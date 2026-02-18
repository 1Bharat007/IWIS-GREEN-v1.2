"use client";

export default function ProgressRing({ value }: { value: number }) {
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(value, 100);
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#E5E7EB"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#059669"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="fill-slate-700 dark:fill-slate-200 text-lg font-semibold"
      >
        {progress}%
      </text>
    </svg>
  );
}
