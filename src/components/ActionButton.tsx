"use client";

import { Loader2 } from "lucide-react";

interface ActionButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  progress?: number;
  variant?: "primary" | "secondary";
}

export default function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  loading,
  progress,
  variant = "primary",
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-20 ${isPrimary ? "bg-[#262626]" : "bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] text-[#262626]"}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span className={loading ? "text-[10px]" : "text-xs"}>
        {loading && progress !== undefined ? `作成中... ${Math.round(progress * 100)}%` : label}
      </span>
      {loading && progress !== undefined && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-white/30" style={{ width: `${progress * 100}%` }} />
      )}
    </button>
  );
}