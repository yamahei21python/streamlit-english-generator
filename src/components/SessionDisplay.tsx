"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { SentencePair } from "@/lib/types";
import type { SessionPhase } from "@/lib/types";
import ProgressBar from "./ProgressBar";

interface SessionDisplayProps {
  isPlaying: boolean;
  sentencePairs: SentencePair[];
  currentIndex: number;
  currentRep: number;
  completedIndex: number;
  completedRep: number;
  phase: SessionPhase;
  jpReps: number;
  enReps: number;
}

export default function SessionDisplay({
  isPlaying,
  sentencePairs,
  currentIndex,
  currentRep,
  completedIndex,
  completedRep,
  phase,
  jpReps,
  enReps,
}: SessionDisplayProps) {
  return (
    <div className="relative mb-8 w-full max-w-3xl overflow-hidden rounded-xl bg-white px-10 py-5 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-[#262626] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#262626]">

      <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key={`${currentIndex}-${phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center justify-center"
            >
              <div className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
                {phase === "jp" ? sentencePairs[currentIndex]?.jp : sentencePairs[currentIndex]?.en}
              </div>
            </motion.div>
          ) : (
            <div key="placeholder" className="text-2xl font-medium text-[#999999]">
              日本語入力、AI翻訳を行い、セッションを開始してください
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 w-full flex flex-col gap-4">
        <div className="mb-6">
          <ProgressBar
            label="Overall Progress"
            value={isPlaying ? currentIndex + 1 : completedIndex}
            max={sentencePairs.length}
          />
        </div>
        <ProgressBar
          label={isPlaying ? (phase === "jp" ? "Japanese" : "English") : "Japanese"}
          value={isPlaying ? currentRep : 0}
          max={isPlaying ? (phase === "jp" ? jpReps : enReps) : jpReps}
        />
      </div>
    </div>
  );
}