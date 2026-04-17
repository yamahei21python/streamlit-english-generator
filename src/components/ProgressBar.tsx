"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export default function ProgressBar({ label, value, max, color = "#262626" }: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider tabular-nums text-[#999999] mb-1.5">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}