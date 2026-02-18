"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { categoryData } from "@/lib/mockData";

export function CategoryPie() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            outerRadius={80}
fill="#2E7D32"
          />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
