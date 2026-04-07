"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface HeaderProps {
  showStartButton?: boolean;
  position?: "fixed" | "sticky";
}

export default function Header({ showStartButton = false, position = "fixed" }: HeaderProps) {
  return (
    <nav className={`${position} top-0 z-50 flex h-16 w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-6 backdrop-blur-md md:px-10`}>
      <Link href="/" className="flex items-center gap-2 text-lg font-black italic tracking-tighter transition-opacity hover:opacity-80">
        <div className="flex h-6 w-10 items-center justify-center rounded-full bg-[#171717]">
          <span className="text-[10px] font-black not-italic text-white">FS</span>
        </div>
        FlashSpeak
      </Link>
      
      <div className="flex items-center gap-4">
        {showStartButton && (
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-full bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            <span>はじめる</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
