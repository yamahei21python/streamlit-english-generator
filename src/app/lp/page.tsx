"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Brain, Zap, Video, Download, Check, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className={`min-h-screen bg-white ${hasMounted ? "text-[#262626]" : "text-[#171717]"} selection:bg-[#79ffe1] selection:text-black`}>
      <Header showStartButton />

      <main className="flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative flex min-h-[70vh] w-full max-w-6xl flex-col items-center justify-center px-6 pt-32 text-center md:px-10">
          <div className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#0a72ef]/10 to-[#de1d8d]/10 blur-[100px]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="mb-6 text-5xl font-black tracking-tighter sm:text-7xl md:text-8xl">
              <span className="inline-block whitespace-nowrap">{hasMounted ? "見た瞬間に" : "見た瞬間に、"}</span>
              <br className="hidden md:block" />
              <span className="inline-block whitespace-nowrap">
                英語が<span className="bg-gradient-to-r from-[#0a72ef] via-[#de1d8d] to-[#ff5b4f] bg-clip-text text-transparent">{hasMounted ? "口から出る" : "口から出る。"}</span>
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-[#666666] md:text-xl leading-relaxed">
              FlashSpeakは、瞬間英作文とシャドーイングに特化<br />好みの設定で何度でも練習、動画作成が可能
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0a72ef] via-[#de1d8d] to-[#ff5b4f] px-8 text-base font-semibold text-white transition-all hover:scale-105 sm:w-auto shadow-xl shadow-[#0a72ef]/20"
              >
                <span>無料で練習をはじめる</span>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Storyboard Section */}
        <section ref={containerRef} className="relative w-full max-w-4xl px-6 pt-32 pb-16 md:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">使い方は、驚くほどシンプル。</h2>
            <p className="mt-4 text-[#666666]">4つのステップで、あなたの英語学習を革新します。</p>
          </div>

          <div className="flex flex-col gap-32 relative">
            {/* Vertical Connecting Line (Isolated to Client-only sub-component to fix SSR hook order crash) */}
            {hasMounted && <StoryboardVerticalLine containerRef={containerRef} />}

            {/* Step 1: Input & Translate */}
            <StoryboardStep
              step="01"
              title="日本語を入力してAI翻訳"
              description="英語にしたい文章を自由に入力。AIが複雑な文脈まで理解し、自然な響きの英文へ瞬時に翻訳します。"
              isFirst
            >
              <div className="rounded-2xl border border-[#0a72ef]/30 bg-white p-3 shadow-xl shadow-[#0a72ef]/5 flex flex-col justify-center h-[170px] gap-1.5">
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-gray-50 p-4">
                    <div className="mb-2 h-1.5 w-12 rounded-full bg-[#0a72ef]/20" />
                    <div className="text-xs text-gray-400">ここで働いてどれくらいになりますか？</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ChevronRight className="h-5 w-5 text-[#0a72ef]" />
                  </div>
                  <div className="flex-1 rounded-xl border-2 border-dashed border-[#0a72ef]/30 bg-[#0a72ef]/5 p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 rounded bg-[#0a72ef] px-1 py-0.5 text-[8px] font-bold text-white">AI</div>
                    <div className="mb-2 h-1.5 w-12 rounded-full bg-[#0a72ef]" />
                    <div className="text-[11px] font-black italic tracking-tight text-[#0a72ef] leading-tight flex flex-col">
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 2.0, delay: 0.3 }}
                      >
                        How long have you
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 2.0, delay: 1.0 }}
                      >
                        been working here?
                      </motion.span>
                    </div>
                  </div>
                </div>
              </div>
            </StoryboardStep>

            {/* Step 2: Voice selection */}
            <StoryboardStep
              step="02"
              title="自分好みの声を選択"
              description="英語のバリエーション豊かなAIボイスから選択可能。各キャラクターには個性があり、学習のモチベーションを高めます。"
              reverse
            >
              <div className="rounded-2xl border border-[#7447be]/30 bg-white p-2 shadow-xl shadow-[#7447be]/5 grid grid-cols-2 gap-1 h-[170px] content-center">
                {[
                  { name: "Nanami", region: "JP", gender: "Female", active: true },
                  { name: "Keita", region: "JP", gender: "Male", active: false },
                  { name: "Guy", region: "EN", gender: "Male", active: false },
                  { name: "Airi", region: "JP", gender: "Female", active: false }
                ].map((v) => (
                  <motion.div
                    key={v.name}
                    className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-all ${v.active ? 'border-[#7447be] bg-[#7447be]/5 shadow-sm shadow-[#7447be]/10' : 'border-black/[0.06] bg-white'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-black ${v.active ? 'text-[#7447be]' : 'text-black'}`}>{v.name}</span>
                        <span className="text-[11px] text-[#999999] whitespace-nowrap">{v.region === 'JP' ? '🇯🇵' : '🇺🇸'} {v.gender}</span>
                      </div>
                      {v.active && (
                        <div className="mt-1.5 flex h-4 items-end gap-0.5">
                          {[0.4, 0.8, 0.3, 1.0, 0.5].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: "4px" }}
                              whileInView={{ height: ["4px", `${h * 16}px`, `${h * 10 + 4}px`, `${h * 14}px`, `${h * 14}px`] }}
                              transition={{ duration: 3.0, delay: 0.5 + (i * 0.1), ease: "easeInOut" }}
                              viewport={{ once: true }}
                              className="w-[2px] rounded-full bg-[#7447be]"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${v.active ? 'bg-[#7447be]' : 'bg-black/10'}`} />
                  </motion.div>
                ))}
              </div>
            </StoryboardStep>

            {/* Step 3: Player */}
            <StoryboardStep
              step="03"
              title="プレイヤーで練習"
              description="覚えやすい最適なリズムで、日本語→シンキングタイム→英語の順に再生。口が覚えるまで何度でも繰り返せます。"
            >
              <div className="overflow-hidden rounded-xl border border-[#de1d8d]/30 bg-white shadow-xl shadow-[#de1d8d]/5 flex flex-col justify-center h-[170px]">
                <div className="p-4 text-center bg-gradient-to-b from-white to-[#fafafa]">
                  <div className="relative text-2xl font-black italic tracking-tighter mb-4 leading-tight flex flex-col items-center">
                    <div className="relative text-left">
                      <span className="text-black/10 whitespace-nowrap">How long have you been</span>
                      <motion.div
                        className="absolute top-0 left-0 text-[#de1d8d] overflow-hidden whitespace-nowrap"
                        initial={{ width: 0 }}
                        whileInView={{ width: "110%" }}
                        transition={{ duration: 1.8, delay: 0.5, ease: "linear" }}
                        viewport={{ once: true }}
                        aria-hidden="true"
                      >
                        How long have you been
                      </motion.div>
                    </div>

                    <div className="relative text-left">
                      <span className="text-black/10 whitespace-nowrap">working here?</span>
                      <motion.div
                        className="absolute top-0 left-0 text-[#de1d8d] overflow-hidden whitespace-nowrap"
                        initial={{ width: 0 }}
                        whileInView={{ width: "110%" }}
                        transition={{ duration: 1.2, delay: 2.3, ease: "linear" }}
                        viewport={{ once: true }}
                        aria-hidden="true"
                      >
                        working here?
                      </motion.div>
                    </div>
                  </div>

                  <div className="h-[11px]" />
                  <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#999999] mb-2">
                      <span>English Phase</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebebeb]">
                      <motion.div
                        className="h-full bg-[#de1d8d]"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 3.0, delay: 0.5, ease: "linear" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </StoryboardStep>

            {/* Step 4: Export */}
            <StoryboardStep
              step="04"
              title="動画を作成"
              description="練習した成果を、SNSやYouTubeに最適な練習用動画としてエクスポート。オフラインでの復習やシェアに最適です。"
              reverse
            >
              <div className="rounded-2xl border border-[#ff5b4f]/30 bg-white p-2 shadow-xl shadow-[#ff5b4f]/5 flex flex-col items-center justify-center h-[170px] relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: false }}
                  className="mb-2 flex flex-col items-center"
                >
                  <div className="relative mb-2 h-20 w-20 flex items-center justify-center">
                    <svg className="absolute h-full w-full -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/[0.04]" />
                      <motion.circle
                        cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent"
                        className="text-[#ff5b4f]"
                        strokeDasharray="226"
                        initial={{ strokeDashoffset: 226 }}
                        whileInView={{ strokeDashoffset: 0 }}
                        transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }}
                        viewport={{ once: true }}
                      />
                    </svg>

                    <motion.div
                      initial={{ opacity: 1 }}
                      whileInView={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: 3.0 }}
                      viewport={{ once: true }}
                      className="absolute"
                    >
                      <Download className="h-8 w-8 text-[#ff5b4f]/40" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 3.1 }}
                      viewport={{ once: true }}
                      className="absolute"
                    >
                      <div className="rounded-full bg-[#ff5b4f] p-2">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                    </motion.div>
                  </div>


                </motion.div>

                <div className="w-full max-w-[140px]">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.04]">
                    <motion.div
                      className="h-full bg-[#ff5b4f]"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }}
                      viewport={{ once: true }}
                    />
                  </div>
                </div>
              </div>
            </StoryboardStep>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex w-full flex-col items-center justify-center px-6 pt-16 pb-32 text-center md:px-10">
          <h2 className="mb-10 text-5xl font-black tracking-tighter md:text-7xl italic">Let&apos;s FlashSpeak!</h2>
          <Link
            href="/"
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0a72ef] via-[#de1d8d] to-[#ff5b4f] px-10 text-base font-semibold text-white transition-all hover:scale-105 shadow-xl shadow-[#0a72ef]/20"
          >
            <span>Try it for Free</span>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function StoryboardVerticalLine({ containerRef }: { containerRef: React.RefObject<any> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const springProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30
  });

  const clipPath = useTransform(
    springProgress,
    [0, 1],
    ["inset(0 0 100% 0)", "inset(0 0 0% 0)"]
  );

  return (
    <div className="absolute left-1/2 top-[48px] bottom-[-40px] w-[2px] -translate-x-1/2 bg-black/[0.06] hidden md:block">
      <motion.div
        style={{ clipPath }}
        className="absolute inset-0 bg-gradient-to-b from-[#0a72ef] via-[#7447be] via-[#de1d8d] to-[#ff5b4f]"
      />
    </div>
  );
}

function StoryboardStep({
  step,
  title,
  description,
  children,
  reverse = false,
  isFirst = false
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reverse?: boolean;
  isFirst?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col gap-12 md:flex-row ${reverse ? "md:flex-row-reverse" : ""} items-center`}
    >
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white uppercase">
              {step}
            </span>
            <h3 className="text-2xl font-black italic tracking-tight md:text-3xl">{title}</h3>
          </div>
          <p className="text-lg leading-relaxed text-[#666666] md:text-xl">
            {description}
          </p>
        </div>
      </div>
      <div className="flex-1 w-full max-w-lg">
        {children}
      </div>
    </motion.div>
  );
}
