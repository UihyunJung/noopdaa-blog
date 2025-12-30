"use client";

import { useState, useEffect } from "react";
import { Card } from "@noopdaa/ui";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

interface DeviceChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ["#8b5cf6", "#22c55e", "#f59e0b", "#6b7280"];

export function DeviceChart({ data }: DeviceChartProps) {
  const [mounted, setMounted] = useState(false);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">디바이스</h2>

      {data.length > 0 && total > 0 ? (
        <div className="flex items-center gap-4">
          {mounted ? (
            <PieChart width={120} height={120}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "방문"]}
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, #fff)",
                  border: "1px solid var(--tooltip-border, #e5e7eb)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          ) : (
            <div className="h-[120px] w-[120px]" />
          )}

          <div className="flex-1 space-y-2">
            {data.map((item, index) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center text-gray-500 dark:text-gray-400">
          데이터가 없습니다
        </div>
      )}
    </Card>
  );
}
