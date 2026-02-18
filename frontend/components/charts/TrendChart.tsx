"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", co2: 4 },
  { month: "Feb", co2: 6 },
  { month: "Mar", co2: 3 },
  { month: "Apr", co2: 8 },
  { month: "May", co2: 5 },
];

export default function TrendChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="month" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="co2"
          stroke="#10b981"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
