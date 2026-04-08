"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, SkipForward, Settings2, Languages,
  Volume2, Save, Loader2, Check, RefreshCcw, X, Video
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { VideoSentenceSegment } from "@/lib/video/video-generator";

type SentencePair = {
  jp: string;
  en: string;
  audioUrl?: string;
};

type AppSettings = {
  inputText: string;
  jpReps: number;
  enReps: number;
  voiceJp: string;
  voiceEn: string;
};

const VOICES_JP = [
  { id: "ja-JP-NanamiNeural", name: "Nanami (Female)" },
  { id: "ja-JP-KeitaNeural", name: "Keita (Male)" },
  { id: "ja-JP-MayuNeural", name: "Mayu (Female)" },
];

const VOICES_EN = [
  { id: "en-US-GuyNeural", name: "Guy (Male)" },
  { id: "en-US-AriaNeural", name: "Aria (Female)" },
  { id: "en-GB-SoniaNeural", name: "Sonia (UK Female)" },
];

export default function Home() {
  const [jpText, setJpText] = useState("ここで働いてどれくらいになりますか？\n明日の会議は何時からですか？");
  const [enText, setEnText] = useState("How long have you been working here?\nWhat time is the meeting tomorrow?");
  const [isTranslating, setIsTranslating] = useState(false);
  const [sentencePairs, setSentencePairs] = useState<SentencePair[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [completedIndex, setCompletedIndex] = useState(0);
  const [completedRep, setCompletedRep] = useState(0);
  const [phase, setPhase] = useState<"jp" | "en">("jp");
  const [jpReps, setJpReps] = useState(1);
  const [enReps, setEnReps] = useState(3);
  const [voiceJp, setVoiceJp] = useState("ja-JP-NanamiNeural");
  const [voiceEn, setVoiceEn] = useState("en-US-GuyNeural");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
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
    setSentencePairs(pairs);
  }, [jpText, enText]);

  const handleTranslate = async () => {
    if (!jpText.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: jpText })
      });
      const data = await res.json();
      if (data.translatedText) {
        setEnText(data.translatedText);
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err: any) {
      setErrorMessage(`Translation failed: ${err.message}`);
    }
    setIsTranslating(false);
  };

  const handleExportMP4 = async () => {
    if (sentencePairs.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    setErrorMessage(null);

    try {
      const { VideoGenerator } = await import("@/lib/video/video-generator");
      const generator = new VideoGenerator({
        onProgress: (p: number) => setExportProgress(p)
      });

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

      const videoBlob = await generator.generate(segments);
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const yyyymmdd = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      a.download = `FlashSpeak_${yyyymmdd}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const playSentence = async (text: string, lang: "jp" | "en") => {
    const voice = lang === "jp" ? voiceJp : voiceEn;
    const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;

    if (audioRef.current) {
      try {
        audioRef.current.src = url;
        audioRef.current.load();
        await audioRef.current.play();

        return new Promise((resolve) => {
          audioRef.current!.onended = () => resolve(true);
          audioRef.current!.onerror = () => resolve(false);
        });
      } catch (err: any) {
        console.error(`[Audio] Playback failed:`, err);
        setErrorMessage(`Playback failed: ${err.message || "Unknown error"}`);
        setIsPaused(true);
      }
    }
  };

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const startSession = async () => {
    if (sentencePairs.length === 0) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setErrorMessage(null);
    setCurrentIndex(0);
    setCurrentRep(1);
    setCompletedIndex(0);
    setCompletedRep(0);
    setPhase("jp");
    runSession(0, "jp", 1);
  };

  const runSession = async (index: number, currentPhase: "jp" | "en", rep: number) => {
    if (!isPlayingRef.current) return;

    while (isPausedRef.current) {
      await wait(100);
      if (!isPlayingRef.current) return;
    }

    const pair = sentencePairs[index];
    if (!pair) {
      setIsPlaying(false);
      return;
    }

    const text = currentPhase === "jp" ? pair.jp : pair.en;
    const maxReps = currentPhase === "jp" ? jpReps : enReps;

    setCurrentIndex(index);
    setPhase(currentPhase);
    setCurrentRep(rep);

    if (rep === 1 && currentPhase === "jp") {
      await wait(2000);
      if (!isPlayingRef.current) return;
    }

    await playSentence(text, currentPhase);
    if (!isPlayingRef.current) return;

    setCompletedRep(rep);

    if (rep < maxReps) {
      await wait(800);
      runSession(index, currentPhase, rep + 1);
    } else if (currentPhase === "jp") {
      await wait(800);
      if (!isPlayingRef.current) return;
      setCompletedRep(0);
      runSession(index, "en", 1);
    } else {
      await wait(800);
      setCompletedIndex(index + 1);
      setCompletedRep(0);

      if (index + 1 < sentencePairs.length) {
        await wait(800);
        runSession(index + 1, "jp", 1);
      } else {
        await wait(1000);
        if (isPlayingRef.current) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          setCompletedIndex(0);
          setCompletedRep(0);
          setCurrentIndex(0);
          setCurrentRep(1);
        }
      }
    }
  };

  const stopSession = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCompletedIndex(0);
    setCompletedRep(0);
    setCurrentIndex(0);
    setCurrentRep(1);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] selection:bg-[#79ffe1] selection:text-black">
      <Header position="sticky" />

      {isLoading ? (
        <div className="flex h-[80vh] items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#666666]" />
        </div>
      ) : (
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-10 pt-8 pb-8">
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
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider tabular-nums text-[#999999] mb-1.5">
                  <span>Overall Progress</span>
                  <span>Sentence {isPlaying ? currentIndex + 1 : completedIndex} / {sentencePairs.length}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
                  <motion.div
                    className="h-full bg-[#262626]"
                    initial={{ width: 0 }}
                    animate={{ width: sentencePairs.length > 0 ? `${(completedIndex / sentencePairs.length) * 100}%` : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider tabular-nums text-[#999999] mb-1.5">
                  <span>{isPlaying ? (phase === "jp" ? "Japanese" : "English") : "Japanese"} Phase</span>
                  <span>Repeat {isPlaying ? currentRep : 0} / {isPlaying ? (phase === "jp" ? jpReps : enReps) : jpReps}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
                  <motion.div
                    className="h-full bg-[#262626]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedRep / Math.max(isPlaying ? (phase === "jp" ? jpReps : enReps) : 1, 1)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  disabled={!isPlaying}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#fafafa] disabled:opacity-40 transition-opacity"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? "再開" : "一時停止"}
                </button>
                <button
                  onClick={stopSession}
                  disabled={!isPlaying}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#fafafa] disabled:opacity-40 transition-opacity"
                >
                  <X className="h-4 w-4" />
                  終了
                </button>
              </div>
              {errorMessage && <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded">{errorMessage}</div>}
            </div>
          </div>

          <div className="w-full max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#666666] tabular-nums">文章を入力（1行1文）</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !jpText.trim() || isPlaying}
                  className="flex items-center gap-2 rounded-md bg-[#262626] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-20"
                >
                  {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                  <span>AI翻訳</span>
                </button>
                <button
                  onClick={startSession}
                  disabled={sentencePairs.length === 0 || isPlaying}
                  className="flex items-center gap-2 rounded-md bg-[#262626] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-20"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>セッション開始</span>
                </button>
                <button
                  onClick={handleExportMP4}
                  disabled={sentencePairs.length === 0 || isPlaying || isExporting}
                  className={`relative flex items-center gap-2 overflow-hidden rounded-md bg-[#262626] px-4 py-1.5 font-semibold text-white hover:opacity-90 disabled:opacity-20 ${hasMounted ? "justify-center w-[120px]" : ""}`}
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  <span className={isExporting ? "text-[10px]" : "text-xs"}>
                    {isExporting ? `作成中... ${Math.round(exportProgress * 100)}%` : "動画作成"}
                  </span>
                  {isExporting && <div className="absolute bottom-0 left-0 h-[2px] bg-white/30" style={{ width: `${exportProgress * 100}%` }} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                value={jpText}
                onChange={(e) => setJpText(e.target.value)}
                disabled={isPlaying}
                placeholder="日本語を入力"
                className="h-44 w-full rounded-lg border border-black/[0.08] bg-white p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
              />
              <textarea
                value={enText}
                onChange={(e) => setEnText(e.target.value)}
                disabled={isPlaying}
                placeholder="自動翻訳されます"
                className="h-44 w-full rounded-lg border border-black/[0.08] bg-white p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                  <div className="px-3 py-1.5 text-xs font-bold text-[#666666]">JP</div>
                  {[1, 2].map(n => (
                    <button key={n} onClick={() => setJpReps(n)} className={`px-3 py-1.5 text-xs tabular-nums ${jpReps === n ? "bg-[#262626] text-white" : "hover:bg-[#fafafa]"}`}>{n}x</button>
                  ))}
                </div>
                <select value={voiceJp} onChange={(e) => setVoiceJp(e.target.value)} className="flex-1 rounded-md bg-white px-3 py-1.5 text-xs shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none">
                  {VOICES_JP.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                  <div className="px-3 py-1.5 text-xs font-bold text-[#666666]">EN</div>
                  {[1, 3, 5].map(n => (
                    <button key={n} onClick={() => setEnReps(n)} className={`px-3 py-1.5 text-xs tabular-nums ${enReps === n ? "bg-[#262626] text-white" : "hover:bg-[#fafafa]"}`}>{n}x</button>
                  ))}
                </div>
                <select value={voiceEn} onChange={(e) => setVoiceEn(e.target.value)} className="flex-1 rounded-md bg-white px-3 py-1.5 text-xs shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none">
                  {VOICES_EN.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </main>
      )}

      <Footer />
      <audio ref={audioRef} hidden />
    </div>
  );
}
