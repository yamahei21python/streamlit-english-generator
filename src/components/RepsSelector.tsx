"use client";

interface RepsSelectorProps {
  label: string;
  value: number;
  options: readonly number[];
  onChange: (value: number) => void;
}

export default function RepsSelector({ label, value, options, onChange }: RepsSelectorProps) {
  return (
    <div className="flex items-center rounded-md bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      <div className="px-3 py-1.5 text-xs font-bold text-[#666666]">{label}</div>
      {options.map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1.5 text-xs tabular-nums ${value === n ? "bg-[#262626] text-white" : "hover:bg-[#fafafa]"}`}
        >
          {n}x
        </button>
      ))}
    </div>
  );
}