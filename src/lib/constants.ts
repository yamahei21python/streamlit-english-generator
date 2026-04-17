export const VOICES_JP = [
  { id: "ja-JP-NanamiNeural", name: "Nanami (Female)" },
  { id: "ja-JP-KeitaNeural", name: "Keita (Male)" },
  { id: "ja-JP-MayuNeural", name: "Mayu (Female)" },
] as const;

export const VOICES_EN = [
  { id: "en-US-GuyNeural", name: "Guy (Male)" },
  { id: "en-US-AriaNeural", name: "Aria (Female)" },
  { id: "en-GB-SoniaNeural", name: "Sonia (UK Female)" },
] as const;

export const VOICE_JP_DEFAULT = "ja-JP-NanamiNeural";
export const VOICE_EN_DEFAULT = "en-US-GuyNeural";

export const JP_REPS_OPTIONS = [1, 2] as const;
export const EN_REPS_OPTIONS = [1, 3, 5] as const;

export const DEFAULT_JP_TEXT = "ここで働いてどれくらいになりますか？\n明日の会議は何時からですか？";
export const DEFAULT_EN_TEXT = "How long have you been working here?\nWhat time is the meeting tomorrow?";

export const DEFAULT_JP_REPS = 1;
export const DEFAULT_EN_REPS = 3;