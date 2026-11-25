import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { AnimatePresence, motion, useInView, useIsPresent } from 'motion/react';
import type { PanInfo, Variants } from 'motion/react';
import { ArrowUpRight, Keyboard, WifiOff, X } from 'lucide-react';
import { PROJECTS } from '../data/portfolioData';
import type { ProjectCategory, ProjectItem, ProjectScreenshot } from '../data/portfolioData';
import { ProjectMotionStage } from './ProjectMotionStage';
import { SlideArrowButton } from './SlideArrows';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SWIPE_THRESHOLD = 70;

const FILTERS: Array<{ id: ProjectCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'game', label: 'Games' },
  { id: 'app', label: 'Apps' },
  { id: 'web', label: 'Web' },
  { id: 'tool', label: 'Tools' },
  { id: 'hardware', label: 'Hardware' },
];

type InfoTab = 'overview' | 'highlights';
const INFO_TABS: readonly InfoTab[] = ['overview', 'highlights'];
const DRAG_CLICK_SUPPRESS_MS = 250;
/** Horizontal travel (px) after which a pointer gesture counts as a drag, not a click. */
const DRAG_INTENT_PX = 10;
function isFocusable(el: HTMLElement | null): el is HTMLElement {
  if (!el || el === document.body || !el.isConnected) return false;
  if (!el.matches(FOCUSABLE_SELECTOR)) return false;
  return el.getClientRects().length > 0;
}

interface LightboxState {
  shots: ProjectScreenshot[];
  index: number;
  dir: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

const shortTitle = (project: ProjectItem) =>
  project.id === 'arduino-lock' ? 'Biometric Lock' : project.title;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/** Widgets that consume Left/Right themselves (tablists, schematic, steppers). */
const OWN_ARROWS_SELECTOR = '[role="tablist"], [role="tab"], [role="slider"], [data-arrow-keys]';

function ownsArrowKeys(target: EventTarget | null) {
  const el = target instanceof Element ? target : document.activeElement;
  return el instanceof Element && el.closest(OWN_ARROWS_SELECTOR) !== null;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ----------------------------- Slide variants ----------------------------- */

const slideVariants: Variants = {
  enter: { opacity: 1 },
  center: { opacity: 1, transition: { staggerChildren: 0.06 } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -40,
    transition: { duration: 0.32, ease: EASE },
  }),
};

const stageVariants: Variants = {
  enter: (dir: number) => ({
    clipPath: dir > 0 ? 'inset(0% 0% 0% 100% round 24px)' : 'inset(0% 100% 0% 0% round 24px)',
    x: dir * 36,
    scale: 0.97,
  }),
  center: {
    clipPath: 'inset(0% 0% 0% 0% round 24px)',
    x: 0,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  },
};

const infoVariants: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
};

const infoItem: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 18 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
};

const titleMask: Variants = {
  enter: { y: '105%' },
  center: { y: '0%', transition: { duration: 0.7, ease: EASE } },
};

const watermarkVariants: Variants = {
  enter: (dir: number) => ({ x: dir * -80, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 1, ease: EASE } },
};

/* ------------------------------ Sub-components ---------------------------- */

function RollingCounter({ value, total, dir }: { value: number; total: number; dir: number }) {
  return (
    <div className="flex items-baseline gap-1.5 font-display tabular-nums" aria-live="polite" aria-atomic="true">
      <span className="sr-only">
        Slide {value} of {total}
      </span>
      <span aria-hidden="true" className="relative inline-block h-[1.9rem] w-[2.4ch] overflow-hidden text-[1.6rem] leading-[1.9rem] font-semibold tracking-[-0.03em] text-[#0A0A0A] sm:h-[2.2rem] sm:text-[1.9rem] sm:leading-[2.2rem]">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.span
            key={value}
            custom={dir}
            variants={{
              enter: (d: number) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0 }),
              center: { y: '0%', opacity: 1 },
              exit: (d: number) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EASE }}
            className="absolute inset-0"
          >
            {pad(value)}
          </motion.span>
        </AnimatePresence>
      </span>
      <span aria-hidden="true" className="font-mono text-[11px] tracking-[0.14em] text-[#666666]">
        / {pad(total)}
      </span>
    </div>
  );
}

function ProgressTrack({ active, total, accent }: { active: number; total: number; accent: string }) {
  const pct = total > 1 ? (active / (total - 1)) * 100 : 100;
  return (
    <div className="flex w-full items-center gap-2" aria-hidden="true">
      <span className="font-mono text-[11px] text-[#666666]">&lt;</span>
      <div className="relative h-px flex-1 bg-[#E5E5E4]">
        <motion.div
          className="absolute inset-y-0 left-0 h-px"
          style={{ backgroundColor: accent }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
        <motion.span
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
          style={{ borderColor: accent }}
          animate={{ left: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
      </div>
      <span className="font-mono text-[11px] text-[#666666]">&gt;</span>
    </div>
  );
}

function Lightbox({
  state,
  onClose,
  onStep,
}: {
  state: LightboxState;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const shot = state.shots[state.index];
  const portrait = shot?.aspect === 'portrait';
  const multi = state.shots.length > 1;

  // While exiting (AnimatePresence still has it mounted) the trap must release
  // so focus restored to the opener is not pulled back in.
  const isPresent = useIsPresent();

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!isPresent) return;
    // Focus trap: keep Tab / Shift+Tab cycling inside the dialog.
    const onTrap = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && dialog.contains(current);
      if (e.shiftKey && (!inside || current === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || current === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onTrap);
    return () => document.removeEventListener('keydown', onTrap);
  }, [isPresent]);

  if (!shot) return null;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#FAFAFA]/95 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-8" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-[11px] tracking-[0.16em] text-[#666666] uppercase">
          Frame {pad(state.index + 1)} / {pad(state.shots.length)}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close screenshot viewer"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#D4D4D2] bg-white text-[#0A0A0A] transition-colors hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-20">
        <AnimatePresence initial={false} custom={state.dir} mode="popLayout">
          <motion.img
            key={shot.src}
            src={shot.src}
            alt={shot.caption}
            custom={state.dir}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0, scale: 0.98 }),
              center: { x: 0, opacity: 1, scale: 1 },
              exit: (d: number) => ({ x: d * -60, opacity: 0, scale: 0.98 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            className={`max-h-full rounded-[18px] border border-[#E5E5E4] bg-white object-contain shadow-[0_40px_80px_-40px_rgba(0,0,0,0.35)] ${
              portrait ? 'max-w-[min(420px,90vw)]' : 'max-w-[min(1200px,100%)]'
            }`}
          />
        </AnimatePresence>
      </div>

      <div
        className="flex flex-col items-center gap-4 px-4 py-5 sm:flex-row sm:justify-between sm:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="max-w-2xl text-center text-[13.5px] leading-relaxed text-[#404040] sm:text-left">{shot.caption}</p>
        {multi && (
          <div className="flex items-center gap-3">
            <SlideArrowButton direction="prev" onClick={() => onStep(-1)} label="Previous screenshot" />
            <SlideArrowButton direction="next" onClick={() => onStep(1)} label="Next screenshot" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------- Slide card ------------------------------- */

/**
 * One keyed slide. Owns its own Overview/Highlights tab state so an outgoing
 * slide (still mounted during its exit animation) can never mutate the
 * incoming slide's tab, and goes inert while exiting.
 */
function ProjectSlideCard({
  project,
  direction,
  onOpenLightbox,
}: {
  project: ProjectItem;
  direction: number;
  onOpenLightbox: (
    shots: ProjectScreenshot[],
    startIndex: number,
    triggerEl?: HTMLElement | null,
  ) => void;
}) {
  const isPresent = useIsPresent();
  const [tab, setTab] = useState<InfoTab>('overview');
  const idBase = `slide-info-${useId()}`;
  const tabDomId = (t: InfoTab) => `${idBase}-tab-${t}`;
  const panelDomId = `${idBase}-panel`;

  const onTabKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    let next: InfoTab | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const i = INFO_TABS.indexOf(tab);
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      next = INFO_TABS[(i + delta + INFO_TABS.length) % INFO_TABS.length];
    } else if (e.key === 'Home') next = INFO_TABS[0];
    else if (e.key === 'End') next = INFO_TABS[INFO_TABS.length - 1];
    if (!next) return;
    // preventDefault + stopPropagation keep the window-level slide pager out of it.
    e.preventDefault();
    e.stopPropagation();
    setTab(next);
    document.getElementById(tabDomId(next))?.focus();
  };

  return (
    <motion.article
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      inert={!isPresent}
      aria-roledescription="slide"
      aria-label={`${project.index} — ${project.title}`}
      className={`relative overflow-hidden rounded-[32px] border border-[#E5E5E4] bg-white p-3 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.25)] sm:p-4 lg:p-5 ${
        isPresent ? '' : 'pointer-events-none'
      }`}
    >
      {/* Ghost watermark */}
      <motion.span
        aria-hidden="true"
        custom={direction}
        variants={watermarkVariants}
        className="pointer-events-none absolute -right-4 -bottom-16 font-display text-[11rem] leading-none font-bold tracking-[-0.06em] text-[#0A0A0A]/[0.035] select-none sm:text-[16rem] lg:-bottom-20 lg:text-[20rem]"
      >
        {project.index}
      </motion.span>

      <div className="relative grid gap-5 lg:grid-cols-12 lg:gap-8">
        {/* Visual stage */}
        <motion.div custom={direction} variants={stageVariants} className="lg:col-span-7">
          <ProjectMotionStage project={project} onOpenLightbox={onOpenLightbox} />
        </motion.div>

        {/* Editorial info */}
        <motion.div
          variants={infoVariants}
          className="flex flex-col px-2 pt-1 pb-3 sm:px-3 lg:col-span-5 lg:py-4 lg:pr-4"
        >
          <motion.div custom={direction} variants={infoItem} className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase"
              style={{ backgroundColor: project.accentSoft, color: project.accent }}
            >
              {project.categoryLabel}
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">
              {project.status}
            </span>
            {project.offlineCapable && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E4] px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-[#0A0A0A] uppercase">
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                Offline-First
              </span>
            )}
          </motion.div>

          <div className="mt-5 overflow-hidden">
            <motion.h3
              variants={titleMask}
              className="font-display text-3xl font-bold tracking-[-0.035em] text-[#0A0A0A] sm:text-4xl"
            >
              {project.title}
            </motion.h3>
          </div>
          <motion.p
            custom={direction}
            variants={infoItem}
            className="mt-2 text-[14px] leading-snug text-[#666666]"
          >
            {project.subtitle}
            <span className="text-[#666666]"> · {project.year}</span>
          </motion.p>

          {/* Info tabs */}
          <motion.div custom={direction} variants={infoItem} className="mt-6">
            <div role="tablist" aria-label="Project details" className="flex gap-5 border-b border-[#E5E5E4]">
              {INFO_TABS.map((t) => {
                const selected = t === tab;
                return (
                  <button
                    key={t}
                    id={tabDomId(t)}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelDomId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(t)}
                    onKeyDown={onTabKey}
                    className={`relative cursor-pointer pb-2.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                      selected ? 'text-[#0A0A0A]' : 'text-[#666666] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {t}
                    {selected && (
                      <motion.span
                        layoutId={`${idBase}-indicator`}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-x-0 -bottom-px h-[2px]"
                        style={{ backgroundColor: project.accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div id={panelDomId} role="tabpanel" aria-labelledby={tabDomId(tab)}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="pt-5"
                >
                  {tab === 'overview' ? (
                    <>
                      <p className="text-[14.5px] leading-relaxed text-[#404040]">{project.summary}</p>
                      <dl className="mt-5 grid grid-cols-3 border-y border-[#E5E5E4]">
                        {project.metrics.map((m, i) => (
                          <div
                            key={m.label}
                            className={`py-3 pr-2 ${i > 0 ? 'border-l border-[#E5E5E4] pl-3' : ''}`}
                          >
                            <dt className="font-mono text-[9px] tracking-[0.14em] text-[#666666] uppercase">
                              {m.label}
                            </dt>
                            <dd className="mt-1 font-display text-[13px] leading-tight font-semibold tracking-[-0.01em] text-[#0A0A0A]">
                              {m.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {project.note && (
                        <div
                          className="mt-4 rounded-[14px] border-l-2 px-3.5 py-3"
                          style={{ borderLeftColor: project.accent, backgroundColor: project.accentSoft }}
                        >
                          <p
                            className="font-mono text-[9.5px] tracking-[0.16em] uppercase"
                            style={{ color: project.accent }}
                          >
                            {project.note.label}
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#404040]">{project.note.body}</p>
                        </div>
                      )}
                      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
                        {project.stack.map((s) => (
                          <li
                            key={s}
                            className="rounded-full border border-[#E5E5E4] bg-[#FAFAFA] px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-[#404040]"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-[14px] leading-relaxed text-[#404040]">{project.description}</p>
                      <ul className="mt-4 space-y-2.5">
                        {project.highlights.map((h, i) => (
                          <motion.li
                            key={h}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: 0.05 + i * 0.06, ease: EASE }}
                            className="flex gap-3 text-[13px] leading-relaxed text-[#404040]"
                          >
                            <span
                              className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: project.accent }}
                            />
                            {h}
                          </motion.li>
                        ))}
                      </ul>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {project.links && project.links.length > 0 && (
            <motion.div custom={direction} variants={infoItem} className="mt-6 flex flex-wrap gap-2 lg:mt-auto lg:pt-6">
              {project.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-[#FAFAFA] uppercase transition-colors hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2"
                >
                  {link.label}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.article>
  );
}

/* --------------------------------- Section -------------------------------- */

export function ProjectSlidesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.2 });

  const [filter, setFilter] = useState<ProjectCategory>('all');
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pulse, setPulse] = useState({ prev: 0, next: 0 });
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const justDraggedRef = useRef(false);
  const dragTimerRef = useRef<number | undefined>(undefined);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const projects = useMemo(
    () => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter],
  );
  const total = projects.length;
  const safeActive = Math.min(active, Math.max(total - 1, 0));
  const project = projects[safeActive];

  const paginate = useCallback(
    (delta: number) => {
      if (delta < 0) setPulse((p) => ({ ...p, prev: p.prev + 1 }));
      else setPulse((p) => ({ ...p, next: p.next + 1 }));
      if (total <= 1) return;
      setDirection(delta < 0 ? -1 : 1);
      setActive((i) => (i + delta + total) % total);
    },
    [total],
  );

  const jumpTo = (index: number) => {
    if (index === safeActive) return;
    setDirection(index > safeActive ? 1 : -1);
    setActive(index);
  };

  const changeFilter = (next: ProjectCategory) => {
    if (next === filter) return;
    setFilter(next);
    setDirection(1);
    setActive(0);
  };

  const onFilterKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    const i = FILTERS.findIndex((f) => f.id === filter);
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = FILTERS[(i + delta + FILTERS.length) % FILTERS.length];
    changeFilter(next.id);
    document.getElementById(`project-filter-${next.id}`)?.focus();
  };

  const openLightbox = useCallback(
    (shots: ProjectScreenshot[], startIndex: number, triggerEl?: HTMLElement | null) => {
      if (shots.length === 0) return;
      // Prefer the explicit opener: Safari doesn't focus buttons on pointer click.
      const active = document.activeElement;
      previousFocusRef.current = triggerEl ?? (active instanceof HTMLElement ? active : null);
      setLightbox({ shots, index: startIndex, dir: 1 });
    },
    [],
  );

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    const opener = previousFocusRef.current;
    previousFocusRef.current = null;
    if (isFocusable(opener)) {
      opener.focus();
      if (document.activeElement === opener) return;
    }
    // Opener was <body> (e.g. Safari doesn't focus buttons on click) or is gone:
    // fall back to the current slide's screenshot button, then any control in
    // the slide canvas, then any control in the section.
    const candidates = [
      ...(canvasRef.current?.querySelectorAll<HTMLElement>('[data-lightbox-opener]') ?? []),
      ...(canvasRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
      ...(sectionRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
    ];
    candidates.find(isFocusable)?.focus();
  }, []);

  const stepLightbox = useCallback((delta: number) => {
    setLightbox((lb) =>
      lb
        ? {
            ...lb,
            index: (lb.index + delta + lb.shots.length) % lb.shots.length,
            dir: delta < 0 ? -1 : 1,
          }
        : lb,
    );
  }, []);

  const lightboxOpen = lightbox !== null;

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (lightboxOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeLightbox();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepLightbox(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepLightbox(1);
        }
        return;
      }

      if (!inView) return;
      // Let focused tablists / schematic / steppers handle their own arrows.
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ownsArrowKeys(e.target)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        paginate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        paginate(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, inView, paginate, closeLightbox, stepLightbox]);

  useEffect(() => () => window.clearTimeout(dragTimerRef.current), []);

  const markJustDragged = () => {
    justDraggedRef.current = true;
    window.clearTimeout(dragTimerRef.current);
    dragTimerRef.current = window.setTimeout(() => {
      justDraggedRef.current = false;
    }, DRAG_CLICK_SUPPRESS_MS);
  };

  // Native pointer tracking: motion defers onPanEnd to the next animation frame,
  // which runs *after* the synchronous click on pointer-up. Flag drags here so
  // handleClickCapture can always swallow that click.
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    // A fresh press must never inherit suppression from a previous drag.
    window.clearTimeout(dragTimerRef.current);
    justDraggedRef.current = false;
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || justDraggedRef.current) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx > DRAG_INTENT_PX && dx > dy) {
      window.clearTimeout(dragTimerRef.current);
      justDraggedRef.current = true;
    }
  };

  const handlePointerEnd = () => {
    pointerStartRef.current = null;
    if (justDraggedRef.current) markJustDragged();
  };

  const handlePanEnd = (_event: PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) < Math.abs(offset.y)) return;
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
      paginate(1);
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
      paginate(-1);
    }
  };

  // Swallow the click that fires on pointer-up after a paging swipe so releasing
  // over a screenshot never opens the lightbox.
  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Keyboard activation (detail === 0) is never a drag release.
    if (e.detail === 0 || !justDraggedRef.current) return;
    justDraggedRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const accent = project?.accent ?? '#0A0A0A';

  return (
    <section
      id="slides"
      ref={sectionRef}
      aria-labelledby="slides-heading"
      className="relative scroll-mt-20 bg-[#FAFAFA] py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-[#666666] uppercase"
            >
              <span aria-hidden="true" className="text-[#BDBDBB]">+</span>
              01 // Selected Work
            </motion.p>
            <div className="mt-3 overflow-hidden">
              <motion.h2
                id="slides-heading"
                initial={{ y: '100%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE }}
                className="font-display text-4xl font-bold tracking-[-0.04em] text-[#0A0A0A] sm:text-6xl"
              >
                Project Slides
              </motion.h2>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#E5E5E4] bg-white px-3.5 py-1.5 font-mono text-[10.5px] tracking-[0.14em] text-[#666666] uppercase md:self-auto">
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
            ← / → keys or drag
          </div>
        </div>

        {/* Filter strip */}
        <div
          role="tablist"
          aria-label="Filter projects by category"
          className="mt-8 flex gap-1 overflow-x-auto rounded-full border border-[#E5E5E4] bg-white p-1 sm:inline-flex"
        >
          {FILTERS.map((f) => {
            const selected = f.id === filter;
            return (
              <button
                key={f.id}
                id={`project-filter-${f.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => changeFilter(f.id)}
                onKeyDown={onFilterKey}
                className={`relative shrink-0 cursor-pointer rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                  selected ? 'text-[#FAFAFA]' : 'text-[#666666] hover:text-[#0A0A0A]'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="activeProjectFilter"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#0A0A0A]"
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Arrow control bar */}
        <div className="mt-8 flex items-center gap-4 sm:gap-6">
          <SlideArrowButton
            direction="prev"
            onClick={() => paginate(-1)}
            accent={accent}
            pulseKey={pulse.prev}
            disabled={total <= 1}
          />
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
            <RollingCounter value={safeActive + 1} total={total} dir={direction} />
            <ProgressTrack active={safeActive} total={total} accent={accent} />
          </div>
          <SlideArrowButton
            direction="next"
            onClick={() => paginate(1)}
            accent={accent}
            pulseKey={pulse.next}
            disabled={total <= 1}
          />
        </div>

        {/* Slide canvas */}
        <motion.div
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPanEnd={handlePanEnd}
          onClickCapture={handleClickCapture}
          style={{ touchAction: 'pan-y' }}
          className="relative mt-6"
          aria-roledescription="carousel"
          aria-label="Project slides"
        >
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {project && (
              <ProjectSlideCard
                key={`${filter}-${project.id}`}
                project={project}
                direction={direction}
                onOpenLightbox={openLightbox}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filmstrip rail */}
        <nav aria-label="Jump to project slide" className="mt-6 overflow-x-auto">
          <ol className="flex min-w-max gap-1 border-t border-[#E5E5E4]">
            {projects.map((p, i) => {
              const current = i === safeActive;
              return (
                <li key={p.id} className="relative">
                  {current && (
                    <motion.span
                      layoutId="slideRailIndicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-x-0 -top-px h-[2px]"
                      style={{ backgroundColor: p.accent }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    aria-current={current ? 'true' : undefined}
                    className={`flex cursor-pointer items-baseline gap-2 px-3 pt-3.5 pb-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                      current ? 'text-[#0A0A0A]' : 'text-[#666666] hover:text-[#0A0A0A]'
                    }`}
                  >
                    <span className="font-mono text-[10px] tracking-[0.14em]" style={current ? { color: p.accent } : undefined}>
                      {p.index}
                    </span>
                    <span className="font-display text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap">
                      {shortTitle(p)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <AnimatePresence>
        {lightbox && <Lightbox state={lightbox} onClose={closeLightbox} onStep={stepLightbox} />}
      </AnimatePresence>
    </section>
  );
}
