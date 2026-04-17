"use client";

import { Play, Pause, X } from "lucide-react";

interface ControlButtonsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  errorMessage: string | null;
}

export default function ControlButtons({
  isPlaying,
  isPaused,
  onPause,
  onResume,
  onStop,
  errorMessage,
}: ControlButtonsProps) {
  if (!isPlaying) return null;

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex justify-center gap-4">
        <button
          onClick={isPaused ? onResume : onPause}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#fafafa] transition-opacity"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {isPaused ? "再開" : "一時停止"}
        </button>
        <button
          onClick={onStop}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#fafafa] transition-opacity"
        >
          <X className="h-4 w-4" />
          終了
        </button>
      </div>
      {errorMessage && <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded">{errorMessage}</div>}
    </div>
  );
}