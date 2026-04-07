"use client";

export default function Footer() {
  return (
    <footer className="h-16 flex items-center justify-center border-t border-black/[0.06] bg-white text-sm text-[#999999]">
      <p>© {new Date().getFullYear()} FlashSpeak. Built for next-generation language learning.</p>
    </footer>
  );
}
