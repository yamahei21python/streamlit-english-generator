"use client";

import { useMounted } from "@/hooks/useMounted";

export default function Footer() {
  const hasMounted = useMounted();

  return (
    <footer className={`${hasMounted ? "h-14" : "h-16"} flex items-center justify-center border-t border-black/[0.06] bg-white text-sm text-[#999999]`}>
      <p>© {new Date().getFullYear()} FlashSpeak. Built for next-generation language learning.</p>
    </footer>
  );
}
