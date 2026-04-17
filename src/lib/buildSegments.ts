import type { SentencePair } from "./types";
import type { VideoSentenceSegment } from "./video/video-generator";
import { TIMING, VOICE_JP_DEFAULT, VOICE_EN_DEFAULT } from "./constants";

interface BuildSegmentsParams {
  sentencePairs: SentencePair[];
  voiceJp?: string;
  voiceEn?: string;
  enReps?: number;
}

export function buildVideoSegments({
  sentencePairs,
  voiceJp = VOICE_JP_DEFAULT,
  voiceEn = VOICE_EN_DEFAULT,
  enReps = 3,
}: BuildSegmentsParams): VideoSentenceSegment[] {
  const segments: VideoSentenceSegment[] = [];

  for (let i = 0; i < sentencePairs.length; i++) {
    const pair = sentencePairs[i];

    // Phase 1: Japanese
    segments.push({
      type: 'jp',
      jp: pair.jp,
      en: pair.en,
      audioUrl: `/api/tts?text=${encodeURIComponent(pair.jp)}&voice=${voiceJp}`
    });

    // Silence (think time)
    segments.push({ type: 'silence', jp: pair.jp, en: pair.en, duration: TIMING.silenceAfterJp });

    // Phase 2: English (n repeats)
    for (let r = 0; r < enReps; r++) {
      segments.push({
        type: 'en',
        jp: pair.jp,
        en: pair.en,
        audioUrl: `/api/tts?text=${encodeURIComponent(pair.en)}&voice=${voiceEn}`
      });
      if (r < enReps - 1) {
        segments.push({ type: 'silence', jp: pair.jp, en: pair.en, duration: TIMING.silenceBetweenEn });
      }
    }

    // Gap between sentences
    if (i < sentencePairs.length - 1) {
      segments.push({ type: 'silence', jp: pair.jp, en: pair.en, duration: TIMING.sentenceGap });
    }
  }

  return segments;
}