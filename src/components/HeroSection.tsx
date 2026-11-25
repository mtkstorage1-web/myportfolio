import type { MouseEvent } from 'react';
import { motion, useReducedMotion, useSpring } from 'motion/react';
import { HERO_STATS, PROFILE } from '../data/portfolioData';

const EASE = [0.22, 1, 0.36, 1] as const;
const POINTER_SPRING = { stiffness: 120, damping: 20 };

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const pointerX = useSpring(0, POINTER_SPRING);
  const pointerY = useSpring(0, POINTER_SPRING);

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 18);
    pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 18);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[calc(6rem+env(safe-area-inset-top))] pb-12 sm:pt-[calc(9rem+env(safe-area-inset-top))] sm:pb-24"
    >
      {/* Subtle architectural grid */}
      <div
        aria-hidden="true"
        className="bg-draft-grid pointer-events-none absolute inset-0 opacity-80 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Minimalist Editorial Column */}
          <div className="lg:col-span-7">
            {/* Eyebrow Metadata Strip */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#E5E5E4] bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:gap-2.5 sm:px-3.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0A0A0A] animate-pulse-soft" />
              <span className="font-mono text-[10px] tracking-[0.08em] text-[#404040] uppercase sm:text-[11px] sm:tracking-[0.14em]">
                UIT Yangon · Year II
              </span>
              <span aria-hidden="true" className="text-[#D4D4D2]">/</span>
              <span className="font-mono text-[10px] tracking-[0.08em] text-[#737373] uppercase sm:text-[11px] sm:tracking-[0.14em]">
                486 Marks · CAE NPT
              </span>
            </motion.div>

            {/* Masked Kinetic Typography Headline */}
            <div className="mt-5 overflow-hidden sm:mt-7">
              <motion.h1
                initial={reduceMotion ? false : { y: '105%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.72, delay: 0.06, ease: EASE }}
                className="font-display text-[clamp(2.5rem,12vw,3rem)] font-bold tracking-[-0.04em] text-[#0A0A0A] sm:text-7xl lg:text-[4.8rem] lg:leading-[0.98]"
              >
                {PROFILE.name}
              </motion.h1>
            </div>

            <div className="mt-3 overflow-hidden sm:mt-4">
              <motion.div
                initial={reduceMotion ? false : { y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.16, ease: EASE }}
                className="flex flex-wrap items-center gap-x-3 gap-y-1"
              >
                <span className="inline-flex items-center gap-2 font-display text-xl font-medium tracking-[-0.02em] text-[#0A0A0A] sm:text-2xl">
                  {PROFILE.title}
                </span>
                <span className="h-px w-8 bg-[#0A0A0A]/25" />
                <span className="font-mono text-xs tracking-[0.12em] text-[#666666] uppercase sm:text-[13px]">
                  {PROFILE.subtitle}
                </span>
              </motion.div>
            </div>

            {/* Clean Manifesto Copy */}
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24, ease: EASE }}
              className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#525252] sm:mt-6 sm:text-base"
            >
              {PROFILE.tagline} Built cleanly for real machines — spanning{' '}
              <span className="font-medium text-[#0A0A0A]">Godot 4.7</span> worlds, native{' '}
              <span className="font-medium text-[#0A0A0A]">Swift</span> apps,{' '}
              <span className="font-medium text-[#0A0A0A]">C++</span> systems, and physical{' '}
              <span className="font-medium text-[#0A0A0A]">Arduino</span> hardware.
            </motion.p>

            {/* Minimal Kinetic Actions */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.32, ease: EASE }}
              className="mt-6 flex flex-wrap gap-2 sm:mt-9 sm:gap-3"
            >
              <a
                href="#slides"
                className="group inline-flex min-h-[46px] grow items-center justify-center gap-2 rounded-full bg-[#0A0A0A] px-3 py-2.5 font-mono text-[11px] font-medium tracking-[0.06em] whitespace-nowrap text-[#FAFAFA] uppercase transition-colors hover:bg-[#262626] sm:grow-0 sm:gap-3 sm:px-6 sm:py-3.5 sm:text-xs sm:tracking-[0.14em]"
              >
                <span>View Project Slides</span>
                <span className="relative flex items-center overflow-hidden">
                  <svg
                    viewBox="0 0 28 12"
                    className="h-3 w-5 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1 sm:w-7"
                    fill="none"
                    aria-hidden="true"
                  >
                    <line
                      x1="1"
                      y1="6"
                      x2="24"
                      y2="6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M19.5 2L25 6L19.5 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </a>

              <a
                href="#contact"
                className="inline-flex min-h-[46px] grow items-center justify-center rounded-full border border-[#D4D4D2] bg-white px-3 py-2.5 font-mono text-[11px] font-medium tracking-[0.06em] whitespace-nowrap text-[#0A0A0A] uppercase transition-colors hover:border-[#0A0A0A] sm:grow-0 sm:px-6 sm:py-3.5 sm:text-xs sm:tracking-[0.14em]"
              >
                Get in Touch
              </a>
            </motion.div>
          </div>

          {/* Right Minimalist Graphic-Motion Geometric Stage */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="mx-auto w-full max-w-[260px] sm:max-w-[340px] lg:col-span-5 lg:max-w-[400px]"
          >
            <div
              onMouseMove={reduceMotion ? undefined : handleMove}
              onMouseLeave={resetPointer}
              className="relative grid aspect-square grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border border-[#E5E5E4] bg-white p-4 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.22)] sm:p-6"
            >
              {/* Architectural Corner Crosshairs */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 font-mono text-[10px] text-[#A3A3A3]">
                <span className="absolute top-1 left-3 sm:top-2 sm:left-4">+</span>
                <span className="absolute top-1 right-3 sm:top-2 sm:right-4">+</span>
                <span className="absolute bottom-1 left-3 sm:bottom-2 sm:left-4">+</span>
                <span className="absolute right-3 bottom-1 sm:right-4 sm:bottom-2">+</span>
              </div>

              {/* Top Graphic Label */}
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-[#737373] uppercase">
                <span>REEL // 2025—26</span>
                <span>07 SLIDES</span>
              </div>

              {/* Animated Motion-Graphics Vector Kinetic Sculpture */}
              <motion.div
                style={reduceMotion ? undefined : { x: pointerX, y: pointerY }}
                className="relative flex min-h-0 items-center justify-center"
              >
                <svg
                  viewBox="0 0 300 300"
                  className="h-full w-full max-h-[290px]"
                  aria-label="Minimalist kinetic motion graphic"
                >
                  {/* Outer Drafting Circle */}
                  <g className="origin-center animate-slow-spin">
                    <circle
                      cx="150"
                      cy="150"
                      r="116"
                      fill="none"
                      stroke="#E5E5E4"
                      strokeWidth="1"
                    />
                    <circle
                      cx="150"
                      cy="150"
                      r="116"
                      fill="none"
                      stroke="#0A0A0A"
                      strokeWidth="1.4"
                      strokeDasharray="34 220"
                      strokeLinecap="round"
                    />
                    <circle cx="150" cy="34" r="3.5" fill="#0A0A0A" />
                    <circle cx="266" cy="150" r="2.5" fill="#2563EB" />
                  </g>

                  {/* Counter-rotating Inner Arc */}
                  <g className="origin-center animate-slow-spin-reverse">
                    <circle
                      cx="150"
                      cy="150"
                      r="84"
                      fill="none"
                      stroke="#D4D4D2"
                      strokeWidth="1"
                      strokeDasharray="3 7"
                    />
                    <circle
                      cx="150"
                      cy="150"
                      r="84"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.6"
                      strokeDasharray="24 190"
                      strokeLinecap="round"
                    />
                    <rect
                      x="146"
                      y="62"
                      width="8"
                      height="8"
                      rx="2"
                      fill="#0A0A0A"
                    />
                  </g>

                  {/* Horizontal & Vertical Precision Axes */}
                  <motion.line
                    x1="46"
                    y1="150"
                    x2="254"
                    y2="150"
                    stroke="#E5E5E4"
                    strokeWidth="1"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                  />
                  <motion.line
                    x1="150"
                    y1="46"
                    x2="150"
                    y2="254"
                    stroke="#E5E5E4"
                    strokeWidth="1"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
                  />

                  {/* Animated Kinetic Chevron Flow < — > */}
                  <motion.g
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                  >
                    <motion.path
                      d="M114 142 L106 150 L114 158"
                      fill="none"
                      stroke="#0A0A0A"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={reduceMotion ? undefined : { x: [0, -3, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.path
                      d="M186 142 L194 150 L186 158"
                      fill="none"
                      stroke="#0A0A0A"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={reduceMotion ? undefined : { x: [0, 3, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.g>

                  {/* Core Monogram Pill */}
                  <motion.circle
                    cx="150"
                    cy="150"
                    r="34"
                    fill="#0A0A0A"
                    initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
                  />
                  <text
                    x="150"
                    y="154"
                    textAnchor="middle"
                    fill="#FAFAFA"
                    fontSize="13"
                    fontWeight="600"
                    fontFamily="Space Grotesk, sans-serif"
                    letterSpacing="2"
                  >
                    MTK
                  </text>
                </svg>
              </motion.div>

              {/* Bottom Coordinates Footer */}
              <div className="flex items-center justify-between border-t border-[#F0F0EF] pt-3 font-mono text-[10px] tracking-[0.14em] text-[#737373] uppercase">
                <span>YANGON, MM</span>
                <span>{PROFILE.coordinates}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Clean Minimalist 3-Column Index Strip */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.38, ease: EASE }}
          className="mt-8 grid grid-cols-3 divide-x divide-[#E5E5E4] border-y border-[#E5E5E4] sm:mt-12 lg:mt-16"
        >
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="px-2.5 py-3 first:pl-0 last:pr-0 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-2">
                <span className="font-display text-2xl leading-none font-bold tracking-[-0.03em] text-[#0A0A0A] sm:text-3xl">
                  {stat.value}
                </span>
                <span className="font-mono text-[10px] tracking-[0.05em] text-[#666666] uppercase sm:tracking-[0.12em]">
                  {stat.label}
                </span>
              </div>
              <div className="mt-1 text-[11px] leading-snug text-[#666666] sm:text-xs">{stat.detail}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
