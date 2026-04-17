"use client";

interface VoiceSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly { id: string; name: string }[];
  disabled?: boolean;
}

export default function VoiceSelect({
  value,
  onChange,
  options,
  disabled,
}: VoiceSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="flex-1 rounded-md bg-white px-3 py-1.5 text-xs shadow-[0_0_0_1px_rgba(0,0,0,0.08)] outline-none disabled:opacity-50"
    >
      {options.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}