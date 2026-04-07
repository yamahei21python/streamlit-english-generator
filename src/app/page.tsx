"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, RotateCcw, SkipForward, Settings2, Languages, 
  Volume2, Save, Loader2, Check, RefreshCcw, X, Video 
} from "lucide-react";
import { VideoGenerator, VideoSentenceSegment } from "@/lib/video/video-generator";

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
  const [jpText, setJpText] = useState("ここで働いてどれくらいになりますか？\nこれはペンです");
  const [enText, setEnText] = useState("How long have you been working here?\nThis is a pen.");
  const [isTranslating, setIsTranslating] = useState(false);
  const [sentencePairs, setSentencePairs] = useState<SentencePair[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"jp" | "en">("jp");
  const [jpReps, setJpReps] = useState(1);
  const [enReps, setEnReps] = useState(3);
  const [voiceJp, setVoiceJp] = useState("ja-JP-NanamiNeural");
  const [voiceEn, setVoiceEn] = useState("en-US-GuyNeural");
  const [currentRep, setCurrentRep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // MP4 Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Sync ref with state for async loop
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);



  // Parse input text into pairs
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
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEnText(data.translatedText);
    } catch (err: any) {
      setErrorMessage(`Translation failed: ${err.message}`);
    }
    setIsTranslating(false);
  };



  const handleExportMP4 = async () => {
    if (sentencePairs.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);

    try {
      const generator = new VideoGenerator({
        onProgress: (p) => setExportProgress(p)
      });

      const expandedPlaylist: VideoSentenceSegment[] = [];
      
      for (const pair of sentencePairs) {
        // 0. Intro Reading Time (2s Silence) to let user read the new text
        expandedPlaylist.push({
          type: 'jp',
          jp: pair.jp,
          en: pair.en,
          duration: 2000
        });

        // 1. Japanese Repeats
        for (let i = 0; i < jpReps; i++) {
          expandedPlaylist.push({
            type: 'jp',
            jp: pair.jp,
            en: pair.en,
            audioUrl: `/api/tts?text=${encodeURIComponent(pair.jp)}&voice=${voiceJp}`
          });
          
          // 800ms pause between repeats
          if (i < jpReps - 1) {
            expandedPlaylist.push({
              type: 'jp',
              jp: pair.jp,
              en: pair.en,
              duration: 800
            });
          }
        }

        // 2. Thinking Time (1.5s Silence)
        expandedPlaylist.push({
          type: 'jp',
          jp: pair.jp,
          en: pair.en,
          duration: 1500
        });

        // 3. English Repeats
        for (let i = 0; i < enReps; i++) {
          expandedPlaylist.push({
            type: 'en',
            jp: pair.jp,
            en: pair.en,
            audioUrl: `/api/tts?text=${encodeURIComponent(pair.en)}&voice=${voiceEn}`
          });
          
          // 800ms pause between repeats
          if (i < enReps - 1) {
            expandedPlaylist.push({
              type: 'en',
              jp: pair.jp,
              en: pair.en,
              duration: 800
            });
          }
        }
      }

      const mp4Blob = await generator.generate(expandedPlaylist);
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `practice-${new Date().getTime()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("MP4 Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }

  const playSentence = async (text: string, lang: "jp" | "en") => {
    const voice = lang === "jp" ? voiceJp : voiceEn;
    const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
    
    console.log(`[Audio] Attempting to play: ${text} (${voice})`);
    
    if (audioRef.current) {
      try {
        audioRef.current.src = url;
        audioRef.current.load(); // Ensure the new source is loaded
        
        await audioRef.current.play();
        console.log(`[Audio] Playback started successfully.`);
        
        return new Promise((resolve) => {
          audioRef.current!.onended = () => {
            console.log(`[Audio] Playback ended.`);
            resolve(true);
          };
          audioRef.current!.onerror = (e) => {
            console.error(`[Audio] Element error:`, e);
            resolve(false);
          };
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
    setPhase("jp");
    runSession(0, "jp", 1);
  };

  const runSession = async (index: number, currentPhase: "jp" | "en", rep: number) => {
    if (!isPlayingRef.current) return;
    
    // Pause handling
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

    // Intro Reading Time
    if (rep === 1 && currentPhase === "jp") {
      await wait(2000);
      if (!isPlayingRef.current) return;
    }

    await playSentence(text, currentPhase);
    
    if (!isPlayingRef.current) return;

    if (rep < maxReps) {
      await wait(800);
      runSession(index, currentPhase, rep + 1);
    } else if (currentPhase === "jp") {
      await wait(1500); // Thinking time
      runSession(index, "en", 1);
    } else {
      if (index + 1 < sentencePairs.length) {
        runSession(index + 1, "jp", 1);
      } else {
        await wait(1000); // Final pause before ending
        setIsPlaying(false);
      }
    }
  };

  const stopSession = () => {
    setIsPlaying(false);
    setIsPaused(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#666666]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#171717] selection:bg-[#79ffe1] selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-white/80 px-10 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tighter cursor-pointer" onClick={() => window.location.reload()}>
          <div className="h-6 w-6 rounded bg-[#171717]" />
          LANGUAGELAB
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-10 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-center"
        >
          <h1 className="mb-2 text-4xl font-semibold tracking-tighter">Practice Player</h1>
        </motion.div>

        {/* Player Card */}
        <div className="relative mb-8 w-full max-w-3xl overflow-hidden rounded-xl bg-white p-12 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-[#0a72ef] before:via-[#de1d8d] before:to-[#ff5b4f]">
          <div className="mb-8 flex justify-center">
            <span className="rounded-full bg-[#ebf5ff] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0068d6]">
              {isPlaying ? `Sentence ${currentIndex + 1} / ${sentencePairs.length}` : "Ready to Start"}
            </span>
          </div>

          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key={`${currentIndex}-${phase}-${currentRep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  <div className="mb-4 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
                    {phase === "jp" ? sentencePairs[currentIndex]?.jp : sentencePairs[currentIndex]?.en}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#666666]">
                    <Volume2 className="h-4 w-4" />
                    Repeating {currentRep} / {phase === "jp" ? jpReps : enReps}
                  </div>
                </motion.div>
              ) : (
                <div className="text-2xl font-medium text-[#999999]">
                  Input sentences and click Start
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="mt-12 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
              <motion.div 
                className="h-full bg-[#171717]" 
                animate={{ width: isPlaying ? `${((currentIndex) / sentencePairs.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
          
          {/* Active Controls */}
          {isPlaying && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#fafafa]"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button 
                  onClick={stopSession}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#fafafa]"
                >
                  <X className="h-4 w-4" />
                  Stop
                </button>
              </div>
              
              {errorMessage && (
                <div className="rounded-md bg-red-50 px-4 py-2 text-xs font-medium text-red-600 shadow-[0_0_0_1px_rgba(220,38,38,0.1)]">
                  {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control Deck */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#666666]">Input sentences (one per line)</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !jpText.trim() || isPlaying}
                  className="flex w-[160px] items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-20"
                >
                  {isTranslating ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Languages className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{isTranslating ? "Translating..." : "Auto Translate"}</span>
                </button>
                <button
                  onClick={startSession}
                  disabled={sentencePairs.length === 0 || isPlaying || isExporting}
                  className="flex w-[160px] items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-20"
                >
                  <Play className="h-4 w-4 shrink-0 fill-current" />
                  <span className="truncate">Start Session</span>
                </button>
                <button
                  onClick={handleExportMP4}
                  disabled={sentencePairs.length === 0 || isPlaying || isExporting}
                  className="relative flex w-[160px] items-center justify-center gap-2 overflow-hidden rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-20"
                >
                  {isExporting ? (
                    <div className="flex items-center gap-2">
                       <Loader2 className="h-4 w-4 animate-spin" />
                       <span>{Math.round(exportProgress * 100)}%</span>
                    </div>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span className="truncate">Export MP4</span>
                    </>
                  )}
                  {isExporting && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-[3px] bg-white/30"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress * 100}%` }}
                    />
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative rounded-lg bg-white p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_0_0_1px_#0a72ef,0_0_0_3px_rgba(10,114,239,0.1)]">
                <textarea
                  value={jpText}
                  onChange={(e) => setJpText(e.target.value)}
                  disabled={isPlaying}
                  placeholder="Japanese (one per line)&#10;例：ここで働いてどれくらいになりますか？"
                  className="h-44 w-full resize-none border-none bg-transparent p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
                />
              </div>
              <div className="group relative rounded-lg bg-white p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_0_0_1px_#0a72ef,0_0_0_3px_rgba(10,114,239,0.1)]">
                <textarea
                  value={enText}
                  onChange={(e) => setEnText(e.target.value)}
                  disabled={isPlaying}
                  placeholder="English (auto-translates)&#10;Ex: How long have you been working here?"
                  className="h-44 w-full resize-none border-none bg-transparent p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* JP Settings Layer */}
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                  <div className="px-3 py-1.5 text-xs font-bold text-[#666666] border-r border-black/[0.06]">JP</div>
                  {[1, 2].map(n => (
                    <button 
                      key={n}
                      onClick={() => setJpReps(n)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${jpReps === n ? "bg-[#171717] text-white" : "hover:bg-[#fafafa]"}`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
                <select 
                  value={voiceJp} 
                  onChange={(e) => setVoiceJp(e.target.value)}
                  className="flex-1 rounded-md border-none bg-white px-3 py-1.5 text-xs font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none"
                >
                  {VOICES_JP.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              {/* EN Settings Layer */}
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                  <div className="px-3 py-1.5 text-xs font-bold text-[#666666] border-r border-black/[0.06]">EN</div>
                  {[1, 3, 5].map(n => (
                    <button 
                      key={n}
                      onClick={() => setEnReps(n)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${enReps === n ? "bg-[#171717] text-white" : "hover:bg-[#fafafa]"}`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
                <select 
                  value={voiceEn} 
                  onChange={(e) => setVoiceEn(e.target.value)}
                  className="flex-1 rounded-md border-none bg-white px-3 py-1.5 text-xs font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none"
                >
                  {VOICES_EN.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
      </main>

      <footer className="mt-auto border-t border-black/[0.06] p-10 text-center text-xs text-[#666666]">
        &copy; 2026 LanguageLab. Data secured by Supabase PostgreSQL.
      </footer>

      <audio ref={audioRef} hidden />
    </div>
  );
}
