import { useState, useRef, useCallback, useEffect } from 'react';
import type { SentencePair } from '@/lib/types';
import type { SessionPhase } from '@/lib/types';

interface UseSessionProps {
  sentencePairs: SentencePair[];
  jpReps: number;
  enReps: number;
  voiceJp: string;
  voiceEn: string;
}

interface UseSessionReturn {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
  currentRep: number;
  completedIndex: number;
  completedRep: number;
  phase: SessionPhase;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  setError: (msg: string) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useSession({
  sentencePairs,
  jpReps,
  enReps,
  voiceJp,
  voiceEn,
}: UseSessionProps): UseSessionReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [completedIndex, setCompletedIndex] = useState(0);
  const [completedRep, setCompletedRep] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>('jp');
  const [, setErrorMessage] = useState<string | null>(null);

  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const playSentence = useCallback(async (text: string, lang: 'jp' | 'en'): Promise<boolean> => {
    const voice = lang === 'jp' ? voiceJp : voiceEn;
    const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;

    if (!audioRef.current) return false;

    try {
      audioRef.current.src = url;
      audioRef.current.load();
      await audioRef.current.play();

      return new Promise((resolve) => {
        audioRef.current!.onended = () => resolve(true);
        audioRef.current!.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }, [voiceJp, voiceEn]);

  const runSession = useCallback(async (index: number, currentPhase: SessionPhase, rep: number) => {
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

    const text = currentPhase === 'jp' ? pair.jp : pair.en;
    const maxReps = currentPhase === 'jp' ? jpReps : enReps;

    setCurrentIndex(index);
    setPhase(currentPhase);
    setCurrentRep(rep);

    if (rep === 1 && currentPhase === 'jp') {
      await wait(2000);
      if (!isPlayingRef.current) return;
    }

    await playSentence(text, currentPhase);
    if (!isPlayingRef.current) return;

    setCompletedRep(rep);

    if (rep < maxReps) {
      await wait(800);
      runSession(index, currentPhase, rep + 1);
    } else if (currentPhase === 'jp') {
      await wait(800);
      if (!isPlayingRef.current) return;
      setCompletedRep(0);
      runSession(index, 'en', 1);
    } else {
      await wait(800);
      setCompletedIndex(index + 1);
      setCompletedRep(0);

      if (index + 1 < sentencePairs.length) {
        await wait(800);
        runSession(index + 1, 'jp', 1);
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
  }, [sentencePairs, jpReps, enReps, playSentence]);

  const startSession = useCallback(() => {
    if (sentencePairs.length === 0) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentIndex(0);
    setCurrentRep(1);
    setCompletedIndex(0);
    setCompletedRep(0);
    setPhase('jp');
    runSession(0, 'jp', 1);
  }, [sentencePairs.length, runSession]);

  const pauseSession = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeSession = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopSession = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCompletedIndex(0);
    setCompletedRep(0);
    setCurrentIndex(0);
    setCurrentRep(1);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const setError = useCallback((msg: string) => {
    setErrorMessage(msg);
  }, []);

  return {
    isPlaying,
    isPaused,
    currentIndex,
    currentRep,
    completedIndex,
    completedRep,
    phase,
    startSession,
    pauseSession: pauseSession,
    resumeSession: resumeSession,
    stopSession,
    setError,
    audioRef,
  };
}