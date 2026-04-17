"use client";

import { VOICES_JP, VOICES_EN, JP_REPS_OPTIONS, EN_REPS_OPTIONS } from "@/lib/constants";
import RepsSelector from "./RepsSelector";
import VoiceSelect from "./VoiceSelect";

interface SettingsSectionProps {
  jpReps: number;
  enReps: number;
  voiceJp: string;
  voiceEn: string;
  onJpRepsChange: (reps: number) => void;
  onEnRepsChange: (reps: number) => void;
  onVoiceJpChange: (voice: string) => void;
  onVoiceEnChange: (voice: string) => void;
  disabled?: boolean;
}

export default function SettingsSection({
  jpReps,
  enReps,
  voiceJp,
  voiceEn,
  onJpRepsChange,
  onEnRepsChange,
  onVoiceJpChange,
  onVoiceEnChange,
  disabled,
}: SettingsSectionProps) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <RepsSelector label="JP" value={jpReps} options={JP_REPS_OPTIONS} onChange={onJpRepsChange} />
        <VoiceSelect value={voiceJp} onChange={onVoiceJpChange} options={VOICES_JP} disabled={disabled} />
      </div>
      <div className="flex items-center gap-3">
        <RepsSelector label="EN" value={enReps} options={EN_REPS_OPTIONS} onChange={onEnRepsChange} />
        <VoiceSelect value={voiceEn} onChange={onVoiceEnChange} options={VOICES_EN} disabled={disabled} />
      </div>
    </div>
  );
}