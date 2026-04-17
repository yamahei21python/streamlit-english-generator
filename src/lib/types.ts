export type SentencePair = {
  jp: string;
  en: string;
  audioUrl?: string;
};

export type AppSettings = {
  inputText: string;
  jpReps: number;
  enReps: number;
  voiceJp: string;
  voiceEn: string;
};

export type VideoSegmentType = 'jp' | 'en' | 'silence';

export type SessionPhase = 'jp' | 'en';