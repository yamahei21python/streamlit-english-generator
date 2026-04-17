"use client";

interface LabeledTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  rows?: number;
}

export default function LabeledTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 10,
}: LabeledTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="h-44 w-full rounded-lg border border-black/[0.08] bg-white p-4 text-[15px] outline-none leading-relaxed disabled:opacity-50"
    />
  );
}