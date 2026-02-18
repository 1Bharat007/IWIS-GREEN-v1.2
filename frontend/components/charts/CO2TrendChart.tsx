"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CO2TrendChart({ co2 }: { co2: number }) {
  const data = Array.from({ length: 7 }).map((_, i) => ({
    day: `Day ${i + 1}`,
    value: Math.max(0, co2 - (6 - i) * 2),
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#059669"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
