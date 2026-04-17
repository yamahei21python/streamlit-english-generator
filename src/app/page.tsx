"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionDisplay from "@/components/SessionDisplay";
import TextInputSection from "@/components/TextInputSection";
import SettingsSection from "@/components/SettingsSection";
import ControlButtons from "@/components/ControlButtons";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "@/hooks/useSession";
import { useVideoExport } from "@/hooks/useVideoExport";
import type { SentencePair } from "@/lib/types";
import type { VideoSentenceSegment } from "@/lib/video/video-generator";
import {
  DEFAULT_JP_TEXT,
  DEFAULT_EN_TEXT,
  DEFAULT_JP_REPS,
  DEFAULT_EN_REPS,
  VOICE_JP_DEFAULT,
  VOICE_EN_DEFAULT,
} from "@/lib/constants";

export default function Home() {
  const [jpText, setJpText] = useState(DEFAULT_JP_TEXT);
  const [enText, setEnText] = useState(DEFAULT_EN_TEXT);
  const [jpReps, setJpReps] = useState(DEFAULT_JP_REPS);
  const [enReps, setEnReps] = useState(DEFAULT_EN_REPS);
  const [voiceJp, setVoiceJp] = useState(VOICE_JP_DEFAULT);
  const [voiceEn, setVoiceEn] = useState(VOICE_EN_DEFAULT);
  const [hasMounted, setHasMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { translate, isTranslating } = useTranslation();
  const { exportMP4, isExporting, progress } = useVideoExport();

  const sentencePairs = useMemo((): SentencePair[] => {
    const jps = jpText.split("\n");
    const ens = enText.split("\n");
    const maxLen = Math.max(jps.length, ens.length);
    const pairs: SentencePair[] = [];
    for (let i = 0; i < maxLen; i++) {
      const jp = (jps[i] || "").trim();
      const en = (ens[i] || "").trim();
      if (jp && en) {
        pairs.push({ jp, en });
      }
    }
    return pairs;
  }, [jpText, enText]);

  const {
    isPlaying,
    isPaused,
    currentIndex,
    currentRep,
    completedIndex,
    completedRep,
    phase,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    audioRef,
  } = useSession({
    sentencePairs,
    jpReps,
    enReps,
    voiceJp,
    voiceEn,
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleTranslate = async () => {
    const translated = await translate(jpText);
    if (translated) {
      setEnText(translated);
    }
  };

  const handleExport = async () => {
    if (sentencePairs.length === 0) return;

    const segments: VideoSentenceSegment[] = [];
    for (let i = 0; i < sentencePairs.length; i++) {
      const pair = sentencePairs[i];

      // Phase 1: Japanese (current pair)
      segments.push({
        type: 'jp',
        jp: pair.jp,
        en: pair.en,
        audioUrl: `/api/tts?text=${encodeURIComponent(pair.jp)}&voice=${voiceJp}`
      });

      // Silence (wait time) - Match the 2.4s thinking time in runSession
      segments.push({ type: 'silence', jp: pair.jp, en: pair.en, duration: 2400 });

      // Phase 2: English (n repeats)
      for (let r = 0; r < enReps; r++) {
        segments.push({
          type: 'en',
          jp: pair.jp,
          en: pair.en,
          audioUrl: `/api/tts?text=${encodeURIComponent(pair.en)}&voice=${voiceEn}`
        });
        if (r < enReps - 1) {
          segments.push({ type: 'silence', jp: pair.jp, en: pair.en, duration: 1000 });
        }
      }

      // Gap between sentences
      if (i < sentencePairs.length - 1) {
        segments.push({ type: 'silence', jp: pair.jp, en: pair.en, duration: 1500 });
      }
    }

    await exportMP4(segments);
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] selection:bg-[#79ffe1] selection:text-black">
      <Header position="sticky" />

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-10 pt-8 pb-8">
        <SessionDisplay
          isPlaying={isPlaying}
          sentencePairs={sentencePairs}
          currentIndex={currentIndex}
          currentRep={currentRep}
          completedIndex={completedIndex}
          completedRep={completedRep}
          phase={phase}
          jpReps={jpReps}
          enReps={enReps}
        />

        <TextInputSection
          jpText={jpText}
          enText={enText}
          onJpTextChange={setJpText}
          onEnTextChange={setEnText}
          onTranslate={handleTranslate}
          onStartSession={startSession}
          onExport={handleExport}
          isTranslating={isTranslating}
          isPlaying={isPlaying}
          isExporting={isExporting}
          sentencePairs={sentencePairs}
          exportProgress={progress}
        />

        <SettingsSection
          jpReps={jpReps}
          enReps={enReps}
          voiceJp={voiceJp}
          voiceEn={voiceEn}
          onJpRepsChange={setJpReps}
          onEnRepsChange={setEnReps}
          onVoiceJpChange={setVoiceJp}
          onVoiceEnChange={setVoiceEn}
          disabled={isPlaying}
        />

        <ControlButtons
          isPlaying={isPlaying}
          isPaused={isPaused}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={stopSession}
          errorMessage={errorMessage}
        />
      </main>

      <Footer />
      <audio ref={audioRef} hidden />
    </div>
  );
}