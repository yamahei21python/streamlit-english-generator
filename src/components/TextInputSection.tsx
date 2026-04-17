"use client";

import { Languages, Play, Video } from "lucide-react";
import type { SentencePair } from "@/lib/types";
import ActionButton from "./ActionButton";
import LabeledTextarea from "./LabeledTextarea";

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
          <ActionButton
            icon={<Languages className="h-4 w-4" />}
            label="AI翻訳"
            onClick={onTranslate}
            disabled={isTranslating || !jpText.trim() || isPlaying}
            loading={isTranslating}
          />
          <ActionButton
            icon={<Play className="h-4 w-4 fill-current" />}
            label="セッション開始"
            onClick={onStartSession}
            disabled={sentencePairs.length === 0 || isPlaying}
          />
          <ActionButton
            icon={<Video className="h-4 w-4" />}
            label="動画作成"
            onClick={onExport}
            disabled={sentencePairs.length === 0 || isPlaying || isExporting}
            loading={isExporting}
            progress={exportProgress}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledTextarea
          value={jpText}
          onChange={onJpTextChange}
          placeholder="日本語を入力"
          disabled={isPlaying}
        />
        <LabeledTextarea
          value={enText}
          onChange={onEnTextChange}
          placeholder="自動翻訳されます"
          disabled={isPlaying}
        />
      </div>
    </div>
  );
}