import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, useScroll, useSpring } from 'motion/react';
import { PROFILE } from '../data/portfolioData';

const NAV_LINKS = [
  { href: '#slides', label: 'Slides' },
  { href: '#journey', label: 'Journey' },
  { href: '#stack', label: 'Stack' },
  { href: '#contact', label: 'Contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMobileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] motion-safe:transition-colors motion-safe:duration-300 ${
        scrolled
          ? 'border-b border-[#E5E5E4] bg-[#FAFAFA]/85 backdrop-blur-xl'
          : 'bg-[#FAFAFA]/60 backdrop-blur-sm'
      }`}
    >
      {/* Top kinetic progress hairline */}
      <motion.div
        style={{ scaleX }}
        className="h-[2px] w-full origin-left bg-[#0A0A0A]"
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 md:py-3.5">
        {/* Minimalist Geometric Monogram */}
        <a
          href="#top"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
        >
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[#0A0A0A] bg-[#0A0A0A] text-[#FAFAFA] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105">
            <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
              <circle
                cx="16"
                cy="16"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                className="origin-center motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:rotate-90"
              />
              <circle cx="16" cy="16" r="2.6" fill="currentColor" />
            </svg>
          </span>
          <div className="leading-none">
            <div className="font-display text-sm font-semibold tracking-[-0.02em] text-[#0A0A0A]">
              {PROFILE.name}
            </div>
            <div className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-[#525252] uppercase">
              {PROFILE.monogram} · {PROFILE.title}
            </div>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-[#525252] uppercase transition-colors hover:bg-[#0A0A0A]/[0.05] hover:text-[#0A0A0A]"
            >
              <span className="text-[9px] text-[#525252] transition-colors group-hover:text-[#0A0A0A]">
                0{idx + 1}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Quick Action + Mobile Toggle */}
        <div className="flex items-center gap-2">
          <a
            href="#slides"
            onClick={() => setMobileOpen(false)}
            className="group hidden items-center gap-2 rounded-full border border-[#E5E5E4] bg-white px-3.5 py-1.5 font-mono text-[11px] tracking-[0.1em] text-[#0A0A0A] uppercase transition-all hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white sm:inline-flex"
          >
            <span>Deck</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#737373] transition-colors group-hover:text-white/80">
              <span>←</span>
              <span>→</span>
            </span>
          </a>

          <button
            ref={toggleRef}
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[#E5E5E4] bg-white text-[#0A0A0A] transition-colors hover:border-[#0A0A0A] md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-navigation"
        hidden={!mobileOpen}
        className="border-t border-[#E5E5E4] bg-[#FAFAFA] px-4 py-3 md:hidden"
      >
        <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
          {NAV_LINKS.map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2.5 font-mono text-xs tracking-[0.14em] text-[#404040] uppercase transition-colors hover:bg-[#0A0A0A]/[0.05] hover:text-[#0A0A0A]"
            >
              <span>{item.label}</span>
              <span className="text-[10px] text-[#666666]">0{idx + 1}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
