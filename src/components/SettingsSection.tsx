"use client";

import { VOICES_JP, VOICES_EN } from "@/lib/constants";

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
        <div className="flex items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
          <div className="px-3 py-1.5 text-xs font-bold text-[#666666]">JP</div>
          {[1, 2].map(n => (
            <button key={n} onClick={() => onJpRepsChange(n)} className={`px-3 py-1.5 text-xs tabular-nums ${jpReps === n ? "bg-[#262626] text-white" : "hover:bg-[#fafafa]"}`}>{n}x</button>
          ))}
        </div>
        <select value={voiceJp} onChange={(e) => onVoiceJpChange(e.target.value)} disabled={disabled} className="flex-1 rounded-md bg-white px-3 py-1.5 text-xs shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none disabled:opacity-50">
          {VOICES_JP.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
          <div className="px-3 py-1.5 text-xs font-bold text-[#666666]">EN</div>
          {[1, 3, 5].map(n => (
            <button key={n} onClick={() => onEnRepsChange(n)} className={`px-3 py-1.5 text-xs tabular-nums ${enReps === n ? "bg-[#262626] text-white" : "hover:bg-[#fafafa]"}`}>{n}x</button>
          ))}
        </div>
        <select value={voiceEn} onChange={(e) => onVoiceEnChange(e.target.value)} disabled={disabled} className="flex-1 rounded-md bg-white px-3 py-1.5 text-xs shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none disabled:opacity-50">
          {VOICES_EN.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
    </div>
  );
}