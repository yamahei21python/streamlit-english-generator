"use client";

import { Languages, Play, Video, Loader2 } from "lucide-react";
import type { SentencePair } from "@/lib/types";

interface TextInputSectionProps {
  jpText: string;
  enText: string;
  onJpTextChange: (text: string) => void;
  onEnTextChange: (text: string) => void;
  onTranslate: () => void;
  onStartSession: () => void;
  onExport: () => void;
  isTranslating: boolean;
  isPlaying: boolean;
  isExporting: boolean;
  sentencePairs: SentencePair[];
  exportProgress: number;
}

export default function TextInputSection({
  jpText,
  enText,
  onJpTextChange,
  onEnTextChange,
  onTranslate,
  onStartSession,
  onExport,
  isTranslating,
  isPlaying,
  isExporting,
  sentencePairs,
  exportProgress,
}: TextInputSectionProps) {
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-[#666666] tabular-nums">文章を入力（1行1文）</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onTranslate}
            disabled={isTranslating || !jpText.trim() || isPlaying}
            className="flex items-center gap-2 rounded-md bg-[#262626] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-20"
          >
            {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
            <span>AI翻訳</span>
          </button>
          <button
            onClick={onStartSession}
            disabled={sentencePairs.length === 0 || isPlaying}
            className="flex items-center gap-2 rounded-md bg-[#262626] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-20"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>セッション開始</span>
          </button>
          <button
            onClick={onExport}
            disabled={sentencePairs.length === 0 || isPlaying || isExporting}
            className={`relative flex items-center gap-2 overflow-hidden rounded-md bg-[#262626] px-4 py-1.5 font-semibold text-white hover:opacity-90 disabled:opacity-20`}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            <span className="text-xs">
              {isExporting ? `作成中... ${Math.round(exportProgress * 100)}%` : "動画作成"}
            </span>
            {isExporting && <div className="absolute bottom-0 left-0 h-[2px] bg-white/30" style={{ width: `${exportProgress * 100}%` }} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          value={jpText}
          onChange={(e) => onJpTextChange(e.target.value)}
          disabled={isPlaying}
          placeholder="日本語を入力"
          className="h-44 w-full rounded-lg border border-black/[0.08] bg-white p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
        />
        <textarea
          value={enText}
          onChange={(e) => onEnTextChange(e.target.value)}
          disabled={isPlaying}
          placeholder="自動翻訳されます"
          className="h-44 w-full rounded-lg border border-black/[0.08] bg-white p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
        />
      </div>
    </div>
  );
}