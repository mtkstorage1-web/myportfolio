import { useEffect, useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Maximize2 } from 'lucide-react';
import { HARDWARE_NODES } from '../data/portfolioData';
import type { ProjectItem, ProjectScreenshot } from '../data/portfolioData';
import { MiniArrowButton } from './SlideArrows';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type OpenLightbox = (
  shots: ProjectScreenshot[],
  startIndex: number,
  triggerEl?: HTMLElement | null,
) => void;
type ExpandHandler = (triggerEl: HTMLElement) => void;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** The screenshot the visitor is looking at right now: fetch first, decode off-thread. */
const PRIMARY_IMG = { loading: 'eager', fetchPriority: 'high', decoding: 'async' } as const;
/** Background / peek previews: never compete with the primary frame. */
const PEEK_IMG = { loading: 'lazy', fetchPriority: 'low', decoding: 'async' } as const;
/** Intrinsic size hints (the parents already lock aspect-ratio, so CLS stays 0). */
const LANDSCAPE_DIMS = { width: 1600, height: 900 } as const;
const PORTRAIT_DIMS = { width: 900, height: 1950 } as const;

/** Live `prefers-reduced-motion` that updates if the OS setting changes while mounted. */
function useLiveReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

interface StageProps {
  project: ProjectItem;
  onOpenLightbox?: OpenLightbox;
}

/* -------------------------------------------------------------------------- */
/*                               Shared primitives                            */
/* -------------------------------------------------------------------------- */

function useCarousel(length: number) {
  const safeLength = Math.max(length, 1);
  const [state, setState] = useState({ index: 0, dir: 1 });

  const go = (delta: number) =>
    setState((s) => ({
      index: (s.index + delta + safeLength) % safeLength,
      dir: delta >= 0 ? 1 : -1,
    }));

  const jump = (index: number) =>
    setState((s) => ({ index, dir: index >= s.index ? 1 : -1 }));

  return { index: state.index, dir: state.dir, go, jump };
}

function CornerTicks({ tone = '#C4C4C2' }: { tone?: string }) {
  const base = 'pointer-events-none absolute font-mono text-[11px] leading-none select-none';
  return (
    <>
      <span aria-hidden="true" style={{ color: tone }} className={`${base} top-2 left-2.5`}>
        +
      </span>
      <span aria-hidden="true" style={{ color: tone }} className={`${base} top-2 right-2.5`}>
        +
      </span>
      <span aria-hidden="true" style={{ color: tone }} className={`${base} bottom-2 left-2.5`}>
        +
      </span>
      <span aria-hidden="true" style={{ color: tone }} className={`${base} right-2.5 bottom-2`}>
        +
      </span>
    </>
  );
}

function StageFrame({
  project,
  label,
  toolbar,
  children,
}: {
  project: ProjectItem;
  label: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E5E5E4] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <CornerTicks />
      {/* Telemetry header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E4] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-[#666666] uppercase">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse-soft"
            style={{ backgroundColor: project.accent }}
          />
          <span className="text-[#0A0A0A]">PRV.{project.index}</span>
          <span className="text-[#D4D4D2]">//</span>
          <span>{label}</span>
        </div>
        {toolbar}
      </div>
      <div className="relative flex min-h-[320px] flex-1 flex-col sm:min-h-[380px]">{children}</div>
    </div>
  );
}

/** Stable DOM ids that tie a tab to its tabpanel. */
const tabId = (base: string, id: string) => `${base}-tab-${id}`;
const panelId = (base: string) => `${base}-panel`;

/**
 * Roving arrow-key handler for a horizontal tablist. Calls preventDefault so the
 * window-level slide navigation ignores the event, then selects + focuses the
 * neighbouring tab.
 */
function handleTabArrows<T extends string>(
  e: KeyboardEvent<HTMLElement>,
  ids: readonly T[],
  current: T,
  select: (next: T) => void,
  idFor: (id: T) => string,
) {
  const i = ids.indexOf(current);
  let next = -1;
  if (e.key === 'ArrowRight') next = (i + 1) % ids.length;
  else if (e.key === 'ArrowLeft') next = (i - 1 + ids.length) % ids.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = ids.length - 1;
  if (next < 0) return;
  e.preventDefault();
  e.stopPropagation();
  select(ids[next]);
  document.getElementById(idFor(ids[next]))?.focus();
}

function ModeToggle<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  accent,
  ariaLabel,
  idBase,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  layoutId: string;
  accent: string;
  ariaLabel: string;
  idBase: string;
}) {
  const ids = options.map((o) => o.id);
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-0.5 rounded-full border border-[#E5E5E4] bg-[#F3F3F2] p-0.5"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            id={tabId(idBase, opt.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId(idBase)}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => handleTabArrows(e, ids, value, onChange, (id) => tabId(idBase, id))}
            className={`relative inline-flex min-h-[38px] cursor-pointer touch-manipulation items-center rounded-full px-3 py-1 font-mono text-[9.5px] tracking-[0.14em] whitespace-nowrap uppercase transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] sm:min-h-[26px] sm:px-2.5 ${
              active ? 'text-white' : 'text-[#666666] hover:text-[#0A0A0A]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: accent }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FrameDots({
  count,
  active,
  accent,
  onSelect,
}: {
  count: number;
  active: number;
  accent: string;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Show frame ${i + 1}`}
          aria-current={i === active}
          className="grid h-8 min-w-[20px] cursor-pointer touch-manipulation place-items-center rounded-full px-1 [-webkit-tap-highlight-color:transparent] focus-visible:ring-inset sm:h-4 sm:min-w-0 sm:px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2"
        >
          <motion.span
            animate={{
              width: i === active ? 18 : 6,
              backgroundColor: i === active ? accent : '#D4D4D2',
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="block h-1.5 rounded-full"
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Focusable hit area that wraps an animated screenshot. Rendered as a real
 * <button> when the lightbox is available so keyboard users can reach it and
 * focus can be restored to it after the lightbox closes.
 */
function ShotHitArea({
  onExpand,
  caption,
  children,
}: {
  onExpand?: ExpandHandler;
  caption?: string;
  children: ReactNode;
}) {
  if (!onExpand) return <div className="absolute inset-0">{children}</div>;
  return (
    <button
      type="button"
      onClick={(e) => onExpand(e.currentTarget)}
      data-lightbox-opener=""
      aria-label={caption ? `Open screenshot full size: ${caption}` : 'Open screenshot full size'}
      className="group absolute inset-0 cursor-zoom-in rounded-[inherit] focus-visible:outline-none"
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] group-focus-visible:shadow-[inset_0_0_0_4px_#FFFFFF] group-focus-visible:ring-2 group-focus-visible:ring-inset group-focus-visible:ring-[#0A0A0A]"
      />
    </button>
  );
}

function ExpandButton({ onClick }: { onClick: ExpandHandler }) {
  return (
    <motion.button
      type="button"
      onClick={(e) => onClick(e.currentTarget)}
      whileTap={{ scale: 0.92 }}
      aria-label="Expand screenshot to fullscreen"
      className="inline-flex min-h-[36px] cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border border-[#E5E5E4] bg-white px-3 py-1 font-mono active:border-[#0A0A0A] sm:min-h-0 sm:px-2.5 text-[9.5px] tracking-[0.14em] text-[#0A0A0A] uppercase transition-colors hover:border-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
    >
      <Maximize2 className="h-3 w-3" aria-hidden="true" />
      Expand
    </motion.button>
  );
}

function CaptionBar({
  index,
  total,
  caption,
  accent,
  onSelect,
  onExpand,
}: {
  index: number;
  total: number;
  caption: string;
  accent: string;
  onSelect: (index: number) => void;
  onExpand?: ExpandHandler;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-[#E5E5E4] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:px-5 sm:py-3">
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className="shrink-0 pt-px font-mono text-[10px] tracking-[0.14em] text-[#0A0A0A] sm:pt-0">
          {String(index + 1).padStart(2, '0')}
          <span className="text-[#666666]"> / {String(total).padStart(2, '0')}</span>
        </span>
        <div className="relative min-w-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={caption}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="line-clamp-2 text-[12px] leading-snug text-[#666666] sm:truncate sm:text-[12.5px] sm:leading-normal"
              title={caption}
            >
              {caption}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3">
        <FrameDots count={total} active={index} accent={accent} onSelect={onSelect} />
        {onExpand && <ExpandButton onClick={onExpand} />}
      </div>
    </div>
  );
}

const shotVariants: Variants = {
  enter: (dir: number) => ({ x: `${dir * 14}%`, opacity: 0, scale: 1.03 }),
  center: { x: '0%', opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: `${dir * -14}%`, opacity: 0, scale: 0.98 }),
};

/* -------------------------------------------------------------------------- */
/*                                   APOGEX                                   */
/* -------------------------------------------------------------------------- */

function ApogexStage({ project, onOpenLightbox }: StageProps) {
  const shots = project.screenshots ?? [];
  const { index, dir, go, jump } = useCarousel(shots.length);
  const shot = shots[index];
  const expand: ExpandHandler | undefined = onOpenLightbox
    ? (triggerEl) => onOpenLightbox(shots, index, triggerEl)
    : undefined;

  return (
    <StageFrame project={project} label="Godot 4.7 · Live Capture">
      <div className="flex flex-1 items-center p-3 sm:p-5">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] bg-[#0A0A0A]">
          <ShotHitArea onExpand={expand} caption={shot?.caption}>
            <AnimatePresence initial={false} custom={dir}>
              {shot && (
                <motion.img
                  key={shot.src}
                  src={shot.src}
                  alt={shot.caption}
                  {...PRIMARY_IMG}
                  {...LANDSCAPE_DIMS}
                  draggable={false}
                  custom={dir}
                  variants={shotVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: EASE }}
                  className="absolute inset-0 h-full w-full object-cover select-none"
                />
              )}
            </AnimatePresence>
          </ShotHitArea>

          {/* Orbital reticle telemetry overlay */}
          <svg
            aria-hidden="true"
            viewBox="0 0 160 90"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {[
              'M6 16 V6 H16',
              'M144 6 H154 V16',
              'M6 74 V84 H16',
              'M144 84 H154 V74',
            ].map((d) => (
              <path key={d} d={d} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.6" />
            ))}
          </svg>
          <div className="pointer-events-none absolute top-2 right-2 h-9 w-9 sm:top-3 sm:right-3 sm:h-14 sm:w-14" aria-hidden="true">
            <svg viewBox="0 0 56 56" className="animate-slow-spin h-full w-full">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" strokeDasharray="2 4" />
              <circle cx="28" cy="6" r="2" fill={project.accent} />
            </svg>
            <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full">
              <circle cx="28" cy="28" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
              <line x1="28" y1="20" x2="28" y2="36" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
              <line x1="20" y1="28" x2="36" y2="28" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
            </svg>
          </div>
          <div className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/45 px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] whitespace-nowrap text-white/85 uppercase backdrop-blur sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]">
            CAM.{String(index + 1).padStart(2, '0')} · Forward+
          </div>

          {shots.length > 1 && (
            <>
              <div className="absolute top-1/2 left-2 -translate-y-1/2 sm:left-3">
                <MiniArrowButton direction="prev" onClick={() => go(-1)} label="Previous screenshot" />
              </div>
              <div className="absolute top-1/2 right-2 -translate-y-1/2 sm:right-3">
                <MiniArrowButton direction="next" onClick={() => go(1)} label="Next screenshot" />
              </div>
            </>
          )}
        </div>
      </div>
      {shot && (
        <CaptionBar
          index={index}
          total={shots.length}
          caption={shot.caption}
          accent={project.accent}
          onSelect={jump}
          onExpand={expand}
        />
      )}
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  FLOWSCOPE                                 */
/* -------------------------------------------------------------------------- */

function FlowScopeStage({ project, onOpenLightbox }: StageProps) {
  const shots = project.screenshots ?? [];
  const { index, dir, go, jump } = useCarousel(shots.length);
  const shot = shots[index];
  const total = shots.length;
  const prevShot = total > 1 ? shots[(index - 1 + total) % total] : undefined;
  const nextShot = total > 1 ? shots[(index + 1) % total] : undefined;
  const expand: ExpandHandler | undefined = onOpenLightbox
    ? (triggerEl) => onOpenLightbox(shots, index, triggerEl)
    : undefined;

  return (
    <StageFrame project={project} label="iOS · SwiftUI Captures">
      <div className="bg-draft-dots relative flex min-w-0 flex-1 items-center justify-center overflow-hidden px-3 py-6 sm:px-4">
        {/* Flanking peeks */}
        {prevShot && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous screenshot"
            className="absolute top-1/2 left-[6%] hidden aspect-[9/19.5] w-[110px] -translate-y-1/2 cursor-pointer overflow-hidden rounded-[18px] border border-[#E5E5E4] bg-white opacity-40 blur-[1px] transition-opacity hover:opacity-70 sm:block lg:left-[4%] xl:left-[8%]"
          >
            <img src={prevShot.src} alt="" {...PEEK_IMG} {...PORTRAIT_DIMS} draggable={false} className="h-full w-full object-cover" />
          </button>
        )}
        {nextShot && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next screenshot"
            className="absolute top-1/2 right-[6%] hidden aspect-[9/19.5] w-[110px] -translate-y-1/2 cursor-pointer overflow-hidden rounded-[18px] border border-[#E5E5E4] bg-white opacity-40 blur-[1px] transition-opacity hover:opacity-70 sm:block lg:right-[4%] xl:right-[8%]"
          >
            <img src={nextShot.src} alt="" {...PEEK_IMG} {...PORTRAIT_DIMS} draggable={false} className="h-full w-full object-cover" />
          </button>
        )}

        <div className="relative z-10 flex items-center gap-3 sm:gap-5">
          {total > 1 && <MiniArrowButton direction="prev" onClick={() => go(-1)} label="Previous screenshot" />}

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div
              className="relative aspect-[9/19.5] h-[290px] w-auto overflow-hidden rounded-[26px] border-[5px] border-[#0A0A0A] bg-[#0A0A0A] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] sm:h-[360px] sm:rounded-[28px]"
            >
              <ShotHitArea onExpand={expand} caption={shot?.caption}>
                <AnimatePresence initial={false} custom={dir}>
                  {shot && (
                    <motion.img
                      key={shot.src}
                      src={shot.src}
                      alt={shot.caption}
                      {...PRIMARY_IMG}
                      {...PORTRAIT_DIMS}
                      draggable={false}
                      custom={dir}
                      variants={shotVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.5, ease: EASE }}
                      className="absolute inset-0 h-full w-full object-cover select-none"
                    />
                  )}
                </AnimatePresence>
              </ShotHitArea>
              <span aria-hidden="true" className="pointer-events-none absolute top-1.5 left-1/2 h-3.5 w-12 -translate-x-1/2 rounded-full bg-[#0A0A0A]" />
            </div>
            <motion.span
              aria-hidden="true"
              animate={{ scaleX: [1, 0.86, 1], opacity: [0.28, 0.18, 0.28] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-5 left-1/2 h-2 w-28 -translate-x-1/2 rounded-full bg-[#0A0A0A] blur-md"
            />
          </motion.div>

          {total > 1 && <MiniArrowButton direction="next" onClick={() => go(1)} label="Next screenshot" />}
        </div>
      </div>
      {shot && (
        <CaptionBar
          index={index}
          total={total}
          caption={shot.caption}
          accent={project.accent}
          onSelect={jump}
          onExpand={expand}
        />
      )}
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                              KNOWLEDGE EXPLORER                            */
/* -------------------------------------------------------------------------- */

type AtlasMode = 'MAP' | 'GRID' | 'TREE';

const ATLAS_NODES = [
  { id: 'SHADERS', x: 92, y: 62, float: 4.2 },
  { id: 'ORBITAL', x: 316, y: 56, float: 5.1 },
  { id: 'NEURAL', x: 338, y: 176, float: 4.6 },
  { id: 'LOGIC', x: 206, y: 222, float: 5.6 },
  { id: 'CRYPTO', x: 70, y: 186, float: 4.9 },
];

const ATLAS_STARS = [
  [150, 34],
  [258, 26],
  [372, 112],
  [24, 120],
  [130, 236],
  [292, 236],
  [248, 98],
  [148, 154],
];

const ATLAS_LABS = [
  { name: 'Shader Pipeline', code: 'GPU' },
  { name: 'Orbital Mechanics', code: 'PHY' },
  { name: 'Neural Nets', code: 'ML' },
  { name: 'Wave Lab', code: 'SIG' },
  { name: 'Logic Circuits', code: 'EE' },
  { name: 'Sorting', code: 'ALG' },
];

const ATLAS_TREE = [
  { label: 'Visual', y: 56, leaves: ['Shaders', 'Waves'] },
  { label: 'Science', y: 130, leaves: ['Orbital', 'Neural'] },
  { label: 'Systems', y: 204, leaves: ['Logic', 'Crypto'] },
];

const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

function AtlasMap({ accent }: { accent: string }) {
  const prefersReducedMotion = useLiveReducedMotion();
  const cx = 200;
  const cy = 130;
  return (
    <svg viewBox="0 0 400 260" className="h-full max-h-[340px] w-full" role="img" aria-label="Constellation map of learning disciplines around the Atlas Core">
      {ATLAS_STARS.map(([x, y], i) => (
        <motion.circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={1.4}
          fill="#0A0A0A"
          {...(prefersReducedMotion
            ? { opacity: 0.3 }
            : {
                animate: { opacity: [0.15, 0.5, 0.15] },
                transition: { duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.3 },
              })}
        />
      ))}

      {/* Peripheral ring links */}
      {ATLAS_NODES.map((n, i) => {
        const next = ATLAS_NODES[(i + 1) % ATLAS_NODES.length];
        return (
          <motion.line
            key={`ring-${n.id}`}
            x1={n.x}
            y1={n.y}
            x2={next.x}
            y2={next.y}
            stroke="#D4D4D2"
            strokeWidth="0.8"
            strokeDasharray="2 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: EASE }}
          />
        );
      })}

      {/* Spokes */}
      {ATLAS_NODES.map((n, i) => (
        <motion.line
          key={`spoke-${n.id}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke={accent}
          strokeOpacity={0.55}
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
        />
      ))}

      {/* Pulsing core rings (static guide rings under reduced motion) */}
      {prefersReducedMotion
        ? [26, 36, 46].map((r) => (
            <circle
              key={`guide-${r}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={accent}
              strokeWidth="0.8"
              strokeOpacity={0.18}
            />
          ))
        : [0, 1, 2].map((i) => (
        <motion.circle
          key={`pulse-${i}`}
          cx={cx}
          cy={cy}
          fill="none"
          stroke={accent}
          strokeWidth="0.8"
          initial={{ r: 14, opacity: 0 }}
          animate={{ r: [14, 46], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i, ease: 'easeOut' }}
        />
          ))}
      <circle cx={cx} cy={cy} r={14} fill={accent} />
      <circle cx={cx} cy={cy} r={20} fill="none" stroke={accent} strokeOpacity={0.3} />
      <text x={cx} y={cy + 3} textAnchor="middle" className="fill-white font-mono text-[8.5px] font-bold tracking-[0.06em] sm:text-[7px] sm:tracking-[0.1em]">
        CORE
      </text>
      <text x={cx} y={cy + 34} textAnchor="middle" className="fill-[#0A0A0A] font-mono text-[9.5px] tracking-[0.14em] sm:text-[7.5px] sm:tracking-[0.18em]">
        ATLAS
      </text>

      {/* Discipline nodes */}
      {ATLAS_NODES.map((n, i) => {
        const labelBelow = n.y < cy;
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -4, 0] }}
            transition={{
              opacity: { duration: 0.4, delay: 0.5 + i * 0.12 },
              y: { duration: n.float, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <circle cx={n.x} cy={n.y} r={9} fill="white" stroke="#E5E5E4" />
            <circle cx={n.x} cy={n.y} r={4} fill="white" stroke={accent} strokeWidth="1.6" />
            <text
              x={n.x}
              y={labelBelow ? n.y - 15 : n.y + 21}
              textAnchor="middle"
              className="fill-[#0A0A0A] font-mono text-[10.5px] tracking-[0.08em] sm:text-[8px] sm:tracking-[0.16em]"
            >
              {n.id}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

function AtlasGrid({ accent, soft }: { accent: string; soft: string }) {
  return (
    <motion.div
      variants={gridContainer}
      initial="hidden"
      animate="show"
      className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
    >
      {ATLAS_LABS.map((lab, i) => (
        <motion.div
          key={lab.name}
          variants={gridItem}
          whileHover={{ y: -3 }}
          className="group relative min-w-0 overflow-hidden rounded-[14px] border border-[#E5E5E4] bg-white p-3 transition-colors hover:border-[#0A0A0A]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.16em] text-[#666666]">
              LAB.{String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[8.5px] tracking-[0.12em]"
              style={{ backgroundColor: soft, color: accent }}
            >
              {lab.code}
            </span>
          </div>
          <div className="mt-4 flex h-6 items-end gap-[3px] sm:mt-5" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((b) => (
              <motion.span
                key={b}
                className="block w-1.5 origin-bottom rounded-sm"
                style={{ backgroundColor: b % 2 === 0 ? accent : '#D4D4D2', height: '100%' }}
                animate={{ scaleY: [0.3, 0.6 + ((b + i) % 4) * 0.12, 0.3] }}
                transition={{ duration: 1.6 + b * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              />
            ))}
          </div>
          <p className="mt-2.5 font-display text-[12.5px] leading-tight font-medium tracking-[-0.01em] break-words text-[#0A0A0A] sm:text-[13px]">
            {lab.name}
          </p>
          <span className="mt-1 flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.14em] text-[#666666] uppercase">
            <span className="h-1 w-1 rounded-full animate-pulse-soft" style={{ backgroundColor: accent }} />
            Live
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AtlasTree({ accent }: { accent: string }) {
  const rootX = 46;
  const rootY = 130;
  const midX = 186;
  const leafX = 322;
  return (
    <svg viewBox="0 0 400 260" className="h-full max-h-[340px] w-full" role="img" aria-label="Hierarchical tree of knowledge disciplines">
      {ATLAS_TREE.map((branch, bi) => (
        <g key={branch.label}>
          <motion.path
            d={`M${rootX} ${rootY} C${(rootX + midX) / 2} ${rootY} ${(rootX + midX) / 2} ${branch.y} ${midX} ${branch.y}`}
            fill="none"
            stroke={accent}
            strokeOpacity={0.6}
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.1 + bi * 0.12, ease: EASE }}
          />
          {branch.leaves.map((leaf, li) => {
            const ly = branch.y + (li === 0 ? -22 : 22);
            return (
              <g key={leaf}>
                <motion.path
                  d={`M${midX} ${branch.y} C${(midX + leafX) / 2} ${branch.y} ${(midX + leafX) / 2} ${ly} ${leafX} ${ly}`}
                  fill="none"
                  stroke="#BDBDBB"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 + bi * 0.12 + li * 0.08, ease: EASE }}
                />
                <motion.g
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1 + bi * 0.12 + li * 0.08, ease: EASE }}
                >
                  <circle cx={leafX} cy={ly} r={3.5} fill="white" stroke="#0A0A0A" strokeWidth="1.2" />
                  <text x={leafX + 8} y={ly + 3.5} className="fill-[#666666] font-mono text-[10.5px] tracking-[0.04em] sm:text-[8px] sm:tracking-[0.12em]">
                    {leaf.toUpperCase()}
                  </text>
                </motion.g>
              </g>
            );
          })}
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.5 + bi * 0.12 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <rect x={midX - 30} y={branch.y - 10} width={60} height={20} rx={10} fill="white" stroke={accent} strokeWidth="1.2" />
            <text x={midX} y={branch.y + 3.5} textAnchor="middle" className="fill-[#0A0A0A] font-mono text-[9.5px] tracking-[0.04em] sm:text-[8px] sm:tracking-[0.14em]">
              {branch.label.toUpperCase()}
            </text>
          </motion.g>
        </g>
      ))}
      <motion.g
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <circle cx={rootX} cy={rootY} r={18} fill={accent} />
        <text x={rootX} y={rootY + 3} textAnchor="middle" className="fill-white font-mono text-[9px] font-bold tracking-[0.06em] sm:text-[7.5px] sm:tracking-[0.1em]">
          ROOT
        </text>
      </motion.g>
    </svg>
  );
}

function KnowledgeExplorerStage({ project }: StageProps) {
  const [mode, setMode] = useState<AtlasMode>('MAP');
  const idBase = `atlas-${useId()}`;
  return (
    <StageFrame
      project={project}
      label="Atlas · Live View"
      toolbar={
        <ModeToggle<AtlasMode>
          options={[
            { id: 'MAP', label: 'Map' },
            { id: 'GRID', label: 'Grid' },
            { id: 'TREE', label: 'Tree' },
          ]}
          value={mode}
          onChange={setMode}
          layoutId={`atlas-mode-${project.id}`}
          accent={project.accent}
          ariaLabel="Knowledge Explorer view mode"
          idBase={idBase}
        />
      }
    >
      <div
        id={panelId(idBase)}
        role="tabpanel"
        aria-labelledby={tabId(idBase, mode)}
        className="bg-draft-dots flex flex-1 items-center justify-center p-3 sm:p-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex h-full w-full items-center justify-center"
          >
            {mode === 'MAP' && <AtlasMap accent={project.accent} />}
            {mode === 'GRID' && <AtlasGrid accent={project.accent} soft={project.accentSoft} />}
            {mode === 'TREE' && <AtlasTree accent={project.accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between border-t border-[#E5E5E4] px-4 py-2.5 font-mono text-[9.5px] tracking-[0.14em] text-[#666666] uppercase sm:px-5">
        <span>11 Labs · Offline PWA</span>
        <span className="hidden sm:inline">⌘K Search</span>
      </div>
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 AGENT WIDGET                               */
/* -------------------------------------------------------------------------- */

type HudMode = 'expanded' | 'compact';

const QUOTAS = [
  { label: 'CLAUDE', pct: 72 },
  { label: 'CODEX', pct: 54 },
  { label: 'ANTIGRAVITY', pct: 38 },
];

function sparkPath(values: number[], w: number, h: number) {
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (values.length - 1)) * w).toFixed(1)} ${(h - v * h).toFixed(1)}`)
    .join(' ');
}

function useTick(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return tick;
}

function waveValues(tick: number, base: number, amp: number, phase: number) {
  return Array.from({ length: 20 }, (_, i) => {
    const t = i + tick;
    const v = base + amp * Math.sin(t * 0.75 + phase) + amp * 0.5 * Math.sin(t * 1.9 + phase * 2);
    return Math.min(0.95, Math.max(0.05, v));
  });
}

function AgentWidgetStage({ project }: StageProps) {
  const [mode, setMode] = useState<HudMode>('expanded');
  const idBase = `hud-${useId()}`;
  const tick = useTick(1100);
  const cpu = waveValues(tick, 0.42, 0.18, 0);
  const gpu = waveValues(tick, 0.32, 0.14, 1.3);

  return (
    <StageFrame
      project={project}
      label="macOS · NSPanel HUD"
      toolbar={
        <ModeToggle<HudMode>
          options={[
            { id: 'expanded', label: 'Expanded HUD' },
            { id: 'compact', label: 'Compact Pill' },
          ]}
          value={mode}
          onChange={setMode}
          layoutId={`hud-mode-${project.id}`}
          accent={project.accent}
          ariaLabel="Agent Widget display mode"
          idBase={idBase}
        />
      }
    >
      <div
        id={panelId(idBase)}
        role="tabpanel"
        aria-labelledby={tabId(idBase, mode)}
        className="bg-draft-dots relative flex flex-1 items-start justify-center overflow-hidden p-3.5 sm:items-center sm:p-8"
      >
        {/* Faux desktop menu bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-6 items-center justify-between border-b border-[#E5E5E4] bg-white/80 px-4 font-mono text-[9px] tracking-[0.12em] text-[#666666] backdrop-blur">
          <span className="truncate">Finder · File · Edit</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0A0A0A]" />
            AGENT
          </span>
        </div>

        <motion.div
          layout
          transition={{ layout: { type: 'spring', stiffness: 260, damping: 28 } }}
          style={{ borderRadius: mode === 'compact' ? 999 : 20 }}
          className={`relative mt-8 overflow-hidden bg-[#0A0A0A] text-white shadow-[0_30px_60px_-28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:mt-4 ${
            mode === 'compact' ? 'max-w-full px-3.5 py-2.5 sm:px-4' : 'w-full max-w-[340px] p-3.5 sm:p-4'
          }`}
        >
          {mode === 'compact' ? (
            <motion.div
              key="compact"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.06em] whitespace-nowrap sm:gap-3 sm:tracking-[0.08em]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse-soft" />
              <span>CPU 24%</span>
              <span className="text-white/30">·</span>
              <span>GPU 18%</span>
              <span className="text-white/30">·</span>
              <span>49°C</span>
              <span className="hidden rounded-md border border-white/20 px-1.5 py-0.5 text-[9px] text-white/70 sm:inline">
                ⌃⌥M
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="shrink-0 rounded-md border border-white/20 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] whitespace-nowrap text-white/75 sm:tracking-[0.1em]">
                  Ctrl+Opt+M
                </span>
              </div>

              <p className="mt-4 font-mono text-[9px] tracking-[0.18em] text-white/45 uppercase">Agent Quotas · 5h</p>
              <div className="mt-2 space-y-2.5">
                {QUOTAS.map((q, i) => (
                  <div key={q.label}>
                    <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] tracking-[0.08em] sm:tracking-[0.12em]">
                      <span className="min-w-0 truncate text-white/80">{q.label}</span>
                      <span className="text-white/55">{q.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${q.pct}%` }}
                        transition={{ duration: 1.1, delay: 0.2 + i * 0.15, ease: EASE }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-2.5">
                {[
                  { label: 'CPU', value: '24%', values: cpu },
                  { label: 'GPU', value: '18%', values: gpu },
                ].map((s) => (
                  <div key={s.label} className="min-w-0 rounded-[12px] border border-white/10 bg-white/[0.04] p-2 sm:p-2.5">
                    <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.14em]">
                      <span className="text-white/50">{s.label}</span>
                      <span>{s.value}</span>
                    </div>
                    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-1.5 h-7 w-full" aria-hidden="true">
                      <motion.path
                        initial={false}
                        animate={{ d: sparkPath(s.values, 100, 28) }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                        fill="none"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[9.5px] tracking-[0.08em] sm:mt-2.5 sm:gap-2.5 sm:tracking-[0.12em]">
                <div className="flex min-w-0 items-center justify-between gap-1 rounded-[10px] border border-white/10 px-2 py-2 sm:px-2.5">
                  <span className="text-white/50">DIE</span>
                  <span>49°C</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-1 rounded-[10px] border border-white/10 px-2 py-2 sm:px-2.5">
                  <span className="text-white/50">SSD</span>
                  <span>38°C</span>
                </div>
              </div>
              <p className="mt-3 font-mono text-[8.5px] tracking-[0.16em] text-white/35 uppercase">
                Apple Silicon · IOKit live
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  MINDBENCH                                 */
/* -------------------------------------------------------------------------- */

const BRAIN_TIERS = ['1× Normal', 'Titanium', 'Adamantium', 'Uru', '1T× Neutronite'];
const MINI_GAMES = ['Riddle Shop', 'Memory Test', 'Rapid-Fire Math', 'Code Breaker', 'Grid Memory', 'RPS', 'Casino'];
const TERMINAL_LINES = [
  { prompt: '$', text: 'g++ -O2 mindbench.cpp -o mindbench' },
  { prompt: '$', text: './mindbench' },
  { prompt: 'ok', text: 'save loaded · netrunner.dat' },
  { prompt: 'ok', text: '7 cognitive games · casino online' },
  { prompt: 'ok', text: '12 achievements · luxury shop synced' },
];

const termContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
};

const termLine: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

function MindBenchStage({ project }: StageProps) {
  const [tier, setTier] = useState(0);
  const progress = ((tier + 1) / BRAIN_TIERS.length) * 100;

  return (
    <StageFrame project={project} label="C++ · Terminal Session">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-3 sm:gap-4 sm:p-5">
        <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-[16px] bg-[#0A0A0A] p-3.5 font-mono text-[10px] leading-relaxed text-[#E5E5E4] sm:overflow-hidden sm:p-5 sm:text-[12px]">
          <CornerTicks tone="#3A3A3A" />
          <div className="mb-3 flex items-center justify-between gap-2 text-[9px] tracking-[0.12em] whitespace-nowrap text-[#A3A3A3] uppercase sm:tracking-[0.16em]">
            <span>tty0 · mindbench</span>
            <span style={{ color: project.accent }}>● Offline</span>
          </div>
          <motion.div variants={termContainer} initial="hidden" animate="show" className="space-y-1">
            {TERMINAL_LINES.map((line) => (
              <motion.p key={line.text} variants={termLine} className="break-words sm:truncate">
                <span className={line.prompt === '$' ? 'text-white/40' : ''} style={line.prompt === 'ok' ? { color: project.accent } : undefined}>
                  {line.prompt === '$' ? '$' : '[ok]'}
                </span>{' '}
                {line.text}
              </motion.p>
            ))}
            <motion.p variants={termLine} className="break-words sm:truncate">
              <span className="text-white/40">&gt;</span> brain.tier ={' '}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={tier}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="inline-block font-bold"
                  style={{ color: project.accent }}
                >
                  {BRAIN_TIERS[tier].toUpperCase()}
                </motion.span>
              </AnimatePresence>
              <motion.span
                aria-hidden="true"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 bg-[#E5E5E4]"
              />
            </motion.p>
          </motion.div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {MINI_GAMES.map((g, i) => (
              <motion.span
                key={g}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + i * 0.05, duration: 0.3, ease: EASE }}
                className="rounded-full border border-white/15 px-2 py-0.5 text-[8.5px] tracking-[0.08em] whitespace-nowrap text-white/70 uppercase sm:text-[9px] sm:tracking-[0.1em]"
              >
                {g}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Brain tier stepper */}
        <div>
          <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] tracking-[0.12em] text-[#666666] uppercase sm:tracking-[0.16em]">
            <span className="min-w-0">Brain Upgrade Path</span>
            <button
              type="button"
              onClick={() => setTier((t) => (t + 1) % BRAIN_TIERS.length)}
              className="inline-flex min-h-[36px] shrink-0 cursor-pointer touch-manipulation items-center rounded-full border border-[#E5E5E4] px-3 py-0.5 text-[#0A0A0A] transition-colors [-webkit-tap-highlight-color:transparent] hover:border-[#0A0A0A] active:border-[#0A0A0A] active:bg-[#F3F3F2] sm:min-h-0 sm:px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
            >
              Upgrade →
            </button>
          </div>
          <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-[#F3F3F2]">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              className="h-full rounded-full"
              style={{ backgroundColor: project.accent }}
            />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-1" role="group" aria-label="Brain tier" data-arrow-keys="">
            {BRAIN_TIERS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(i)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                  e.preventDefault();
                  e.stopPropagation();
                  const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + BRAIN_TIERS.length) % BRAIN_TIERS.length;
                  setTier(next);
                  const sibling = e.currentTarget.parentElement?.children[next];
                  if (sibling instanceof HTMLElement) sibling.focus();
                }}
                aria-pressed={i === tier}
                className={`inline-flex min-h-[40px] cursor-pointer touch-manipulation items-center justify-center rounded-md border border-[#EDEDEC] px-1 py-1 text-center font-mono text-[9.5px] leading-tight tracking-[0.04em] transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] sm:block sm:min-h-0 sm:truncate sm:border-transparent sm:tracking-[0.06em] ${
                  i <= tier ? 'text-[#0A0A0A]' : 'text-[#666666] hover:text-[#0A0A0A]'
                }`}
                style={i === tier ? { backgroundColor: project.accentSoft } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  GGPARTNER                                 */
/* -------------------------------------------------------------------------- */

const BRIDGE_PATH = 'M4 50 C40 50 50 20 90 20 S140 50 176 50';
/** Vertical S-curve used when the stage stacks Browser → bridge → iOS on phones. */
const BRIDGE_PATH_V = 'M35 4 C35 30 12 40 12 60 S35 90 35 116';

type Pt = readonly [number, number];

/**
 * Animated data bridge between the web card and the iOS frame. Under reduced
 * motion the travelling packets become static markers at each curve
 * segment's midpoint and the draw-on is skipped.
 */
function SignalBridge({
  path,
  viewBox,
  start,
  end,
  mids,
  accent,
  reduced,
  className,
}: {
  path: string;
  viewBox: string;
  start: Pt;
  end: Pt;
  mids: readonly [Pt, Pt];
  accent: string;
  reduced: boolean;
  className?: string;
}) {
  return (
    <svg viewBox={viewBox} className={className}>
      <path d={path} fill="none" stroke="#D4D4D2" strokeWidth="1.4" strokeDasharray="4 5" />
      <motion.path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth="1.6"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 1.1, delay: 0.4, ease: EASE }}
        strokeOpacity={0.35}
      />
      {reduced ? (
        <g key="static">
          <circle cx={mids[0][0]} cy={mids[0][1]} r="4" fill={accent} />
          <circle cx={mids[1][0]} cy={mids[1][1]} r="2.5" fill="#0A0A0A" />
        </g>
      ) : (
        <g key="animated">
          <circle r="4" fill={accent}>
            <animateMotion dur="2.2s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="2.5" fill="#0A0A0A">
            <animateMotion
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
              path={path}
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </g>
      )}
      <circle cx={start[0]} cy={start[1]} r="3" fill="white" stroke="#0A0A0A" strokeWidth="1.2" />
      <circle cx={end[0]} cy={end[1]} r="3" fill="white" stroke="#0A0A0A" strokeWidth="1.2" />
    </svg>
  );
}

function GGPartnerStage({ project }: StageProps) {
  const prefersReducedMotion = useLiveReducedMotion();
  return (
    <StageFrame project={project} label="Web → iOS Bridge">
      <div className="bg-draft-dots flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="flex w-full max-w-[560px] flex-col items-center sm:flex-row">
          {/* Browser card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full max-w-[300px] min-w-0 overflow-hidden rounded-[14px] sm:max-w-none sm:flex-1 border border-[#E5E5E4] bg-white shadow-[0_20px_40px_-28px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center gap-2 border-b border-[#E5E5E4] px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4D4D2]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4D4D2]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4D4D2]" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[#F3F3F2] px-2 py-0.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E] animate-pulse-soft" />
                <span className="truncate font-mono text-[8.5px] tracking-[0.04em] text-[#666666] sm:text-[9.5px]">
                  ggpartner.netlify.app
                </span>
              </div>
            </div>
            <div className="space-y-2 p-3">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
                className="h-10 origin-left rounded-[8px]"
                style={{ background: `linear-gradient(110deg, ${project.accent}, ${project.accent}AA)` }}
              />
              {[78, 92, 60].map((w, i) => (
                <motion.div
                  key={w}
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.1, ease: EASE }}
                  className="h-1.5 rounded-full bg-[#E5E5E4]"
                />
              ))}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[0, 1, 2].map((c) => (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + c * 0.08 }}
                    className="aspect-[4/3] rounded-[6px] bg-[#F3F3F2]"
                  />
                ))}
              </div>
              <p className="pt-1 font-mono text-[8.5px] tracking-[0.14em] text-[#666666] uppercase">Netlify · Live</p>
            </div>
          </motion.div>

          {/* Signal bridge — vertical on phones, horizontal from sm up */}
          <div className="h-[64px] w-[56px] shrink-0 sm:hidden" aria-hidden="true">
            <SignalBridge
              path={BRIDGE_PATH_V}
              viewBox="0 0 70 120"
              start={[35, 4]}
              end={[35, 116]}
              mids={[
                [23.5, 34.25],
                [23.5, 85.75],
              ]}
              accent={project.accent}
              reduced={prefersReducedMotion}
              className="h-full w-full overflow-visible"
            />
          </div>
          <div className="hidden w-[110px] shrink-0 sm:block" aria-hidden="true">
            <SignalBridge
              path={BRIDGE_PATH}
              viewBox="0 0 180 70"
              start={[4, 50]}
              end={[176, 50]}
              mids={[
                [45.5, 35],
                [134.5, 35],
              ]}
              accent={project.accent}
              reduced={prefersReducedMotion}
              className="w-full overflow-visible"
            />
          </div>

          {/* iOS frame */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              x: { duration: 0.6, delay: 0.2, ease: EASE },
              y: { duration: 4.6, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="flex shrink-0 flex-col items-center gap-2"
          >
            <div className="relative aspect-[9/19] w-[96px] overflow-hidden rounded-[20px] border-[4px] border-[#0A0A0A] bg-[#111111] shadow-[0_24px_44px_-24px_rgba(0,0,0,0.55)] sm:w-[116px]">
              <span className="absolute top-1 left-1/2 h-2.5 w-9 -translate-x-1/2 rounded-full bg-black" />
              <div className="mt-6 space-y-1.5 px-2">
                <div className="h-7 rounded-[6px]" style={{ backgroundColor: project.accent }} />
                <div className="h-1 w-4/5 rounded-full bg-white/20" />
                <div className="h-1 w-3/5 rounded-full bg-white/20" />
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <div className="aspect-square rounded-[4px] bg-white/10" />
                  <div className="aspect-square rounded-[4px] bg-white/10" />
                </div>
              </div>
              <div className="absolute inset-x-2 bottom-2 space-y-1">
                {['CAM/MIC OK', 'INLINE MEDIA', 'SWIPE NAV'].map((chip, i) => (
                  <motion.div
                    key={chip}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.12, duration: 0.3 }}
                    className="flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[6.5px] tracking-[0.08em] text-white/85 sm:text-[7px]"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#22C55E]" />
                    {chip}
                  </motion.div>
                ))}
              </div>
            </div>
            <span className="font-mono text-[8.5px] tracking-[0.12em] text-[#666666] uppercase">SwiftUI WKWebView</span>
          </motion.div>
        </div>
      </div>
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ARDUINO LOCK                                */
/* -------------------------------------------------------------------------- */

const MODULE_BOXES: Record<string, { x: number; y: number; w: number; h: number; code: string }> = {
  sensor: { x: 24, y: 40, w: 112, h: 58, code: 'FP-01' },
  uno: { x: 168, y: 76, w: 120, h: 92, code: 'MCU' },
  actuator: { x: 316, y: 40, w: 104, h: 58, code: 'ACT' },
};

const TRACES = [
  { id: 'd2', d: 'M136 60 H152 V104 H168', label: 'D2 TX', lx: 140, ly: 56, dot: [152, 82] },
  { id: 'd3', d: 'M136 78 H146 V120 H168', label: 'D3 RX', lx: 140, ly: 136, dot: [146, 99] },
  { id: 'd9', d: 'M288 112 H302 V70 H316', label: 'D9 TRIGGER', lx: 296, ly: 128, dot: [302, 91] },
  { id: 'led', d: 'M288 150 H352 V188', label: 'LED', lx: 316, ly: 146, dot: [352, 170] },
];

/** Keyboard order for arrow navigation across the schematic's clickable nodes. */
const SCHEMATIC_ORDER = ['sensor', 'uno', 'actuator', 'enclosure'] as const;

/** "Fingerprint Sensor" -> ["Fingerprint", "Sensor"]; "Arduino Uno R3" -> ["Arduino", "Uno R3"]. */
function splitLabel(label: string): string[] {
  const i = label.indexOf(' ');
  return i < 0 ? [label] : [label.slice(0, i), label.slice(i + 1)];
}

function ArduinoLockStage({ project }: StageProps) {
  const [selected, setSelected] = useState<string>(HARDWARE_NODES[1]?.id ?? 'uno');
  const node = HARDWARE_NODES.find((n) => n.id === selected) ?? HARDWARE_NODES[0];
  const accent = project.accent;
  const prefersReducedMotion = useLiveReducedMotion();
  const idBase = `hw-${useId()}`;
  const schemId = (id: string) => `${idBase}-schem-${id}`;
  const hwIds = HARDWARE_NODES.map((n) => n.id);

  const keySelect = (id: string) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelected(id);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Arrows move between schematic nodes; preventDefault keeps the outer
      // slide carousel from also paging.
      e.preventDefault();
      e.stopPropagation();
      const i = SCHEMATIC_ORDER.indexOf(id as (typeof SCHEMATIC_ORDER)[number]);
      const len = SCHEMATIC_ORDER.length;
      const next = SCHEMATIC_ORDER[(i + (e.key === 'ArrowRight' ? 1 : -1) + len) % len];
      setSelected(next);
      document.getElementById(schemId(next))?.focus();
    }
  };

  const isActive = (id: string) => selected === id;
  const enclosureActive = isActive('enclosure');

  return (
    <StageFrame project={project} label="Wiring Schematic · Rev A">
      <div className="flex flex-1 flex-col">
        <div className="flex min-w-0 flex-1 items-center justify-center bg-[#FAFAFA] p-2 sm:p-5">
          <svg
            viewBox="0 0 440 240"
            className="h-full max-h-[300px] w-full"
            role="group"
            aria-label="Interactive wiring schematic"
            data-arrow-keys=""
          >
            <defs>
              <pattern id={`schem-grid-${project.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M16 0 H0 V16" fill="none" stroke="rgba(10,10,10,0.05)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="440" height="240" fill={`url(#schem-grid-${project.id})`} />

            {/* Enclosure boundary (clickable) */}
            <g
              id={schemId('enclosure')}
              role="button"
              tabIndex={0}
              aria-label="Inspect Plastic Enclosure"
              aria-pressed={enclosureActive}
              onClick={() => setSelected('enclosure')}
              onKeyDown={keySelect('enclosure')}
              className="group cursor-pointer outline-none"
            >
              {/* Keyboard focus ring (SVG <g> outlines are unreliable cross-browser) */}
              <rect
                x="3"
                y="9"
                width="434"
                height="226"
                rx="18"
                fill="none"
                stroke="#0A0A0A"
                strokeWidth="2"
                className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
              />
              <rect
                x="8"
                y="14"
                width="424"
                height="216"
                rx="14"
                fill="none"
                stroke={enclosureActive ? accent : '#BDBDBB'}
                strokeWidth={enclosureActive ? 1.6 : 1}
                strokeDasharray="6 5"
              />
              <rect x="20" y="208" width="128" height="16" rx="8" fill={enclosureActive ? accent : '#0A0A0A'} />
              <text x="84" y="219.5" textAnchor="middle" className="fill-white font-mono text-[8.5px] tracking-[0.08em] sm:text-[7.5px] sm:tracking-[0.14em]">
                PLASTIC ENCLOSURE
              </text>
            </g>

            {/* Traces */}
            {TRACES.map((t, i) => (
              <g key={t.id}>
                <motion.path
                  d={t.d}
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth="1.3"
                  initial={prefersReducedMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2 + i * 0.12, ease: EASE }}
                />
                <text x={t.lx} y={t.ly} className="fill-[#666666] font-mono text-[7.5px] tracking-[0.04em] sm:text-[6.5px] sm:tracking-[0.1em]">
                  {t.label}
                </text>
                {t.id !== 'led' &&
                  (prefersReducedMotion ? (
                    <circle key="static" cx={t.dot[0]} cy={t.dot[1]} r="3" fill={accent} />
                  ) : (
                    <circle key="animated" r="3" fill={accent}>
                      <animateMotion dur={t.id === 'd9' ? '1.6s' : '2s'} begin={`${i * 0.4}s`} repeatCount="indefinite" path={t.d} />
                    </circle>
                  ))}
              </g>
            ))}

            {/* Feedback LEDs */}
            <g>
              <circle cx="344" cy="196" r="5" fill="#22C55E" className={prefersReducedMotion ? undefined : 'animate-pulse-soft'} />
              <circle cx="362" cy="196" r="5" fill="#EF4444" opacity="0.35" />
              <text x="372" y="199" className="fill-[#666666] font-mono text-[7px] tracking-[0.02em] sm:text-[6.5px] sm:tracking-[0.1em]">
                GRANT / DENY
              </text>
            </g>

            {/* Modules */}
            {Object.entries(MODULE_BOXES).map(([id, box]) => {
              const hw = HARDWARE_NODES.find((n) => n.id === id);
              const active = isActive(id);
              return (
                <g
                  key={id}
                  id={schemId(id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect ${hw?.label ?? id}`}
                  aria-pressed={active}
                  onClick={() => setSelected(id)}
                  onKeyDown={keySelect(id)}
                  className="group cursor-pointer outline-none"
                >
                  <rect
                    x={box.x - 4}
                    y={box.y - 4}
                    width={box.w + 8}
                    height={box.h + 8}
                    rx="13"
                    fill="none"
                    stroke="#0A0A0A"
                    strokeWidth="2"
                    className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
                  />
                  <motion.rect
                    x={box.x}
                    y={box.y}
                    width={box.w}
                    height={box.h}
                    rx="10"
                    animate={{
                      fill: active ? project.accentSoft : '#FFFFFF',
                      stroke: active ? accent : '#0A0A0A',
                      strokeWidth: active ? 1.8 : 1.1,
                    }}
                    transition={{ duration: 0.25 }}
                  />
                  <text x={box.x + 10} y={box.y + 16} className="fill-[#666666] font-mono text-[8px] tracking-[0.1em] sm:text-[6.5px] sm:tracking-[0.16em]">
                    {box.code}
                  </text>
                  {/* Desktop: one line. Phones (SVG scaled to ~65%): two larger lines. */}
                  <text x={box.x + 10} y={box.y + 32} className="hidden fill-[#0A0A0A] font-display text-[10px] font-semibold sm:inline">
                    {hw?.label ?? id}
                  </text>
                  <text x={box.x + 10} y={box.y + 31} className="fill-[#0A0A0A] font-display text-[12.5px] font-semibold sm:hidden">
                    {splitLabel(hw?.label ?? id).map((line, li) => (
                      <tspan key={line} x={box.x + 10} dy={li === 0 ? 0 : 13}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                  {id === 'uno' && (
                    <>
                      {Array.from({ length: 8 }, (_, p) => (
                        <rect key={p} x={box.x + 12 + p * 12} y={box.y + box.h - 14} width="6" height="6" rx="1" fill={active ? accent : '#D4D4D2'} />
                      ))}
                      <text x={box.x + 10} y={box.y + 48} className="hidden fill-[#666666] font-mono text-[6.5px] tracking-[0.1em] sm:inline">
                        ATmega328P · 5V
                      </text>
                      <text x={box.x + 10} y={box.y + 62} className="fill-[#666666] font-mono text-[7.5px] tracking-[0.04em] sm:hidden">
                        ATmega328P · 5V
                      </text>
                    </>
                  )}
                  {id === 'sensor' && (
                    <circle cx={box.x + box.w - 18} cy={box.y + box.h - 16} r="8" fill="none" stroke={active ? accent : '#0A0A0A'} strokeDasharray="2 2" />
                  )}
                  {id === 'actuator' && (
                    <rect x={box.x + box.w - 30} y={box.y + box.h - 20} width="18" height="10" rx="2" fill="none" stroke={active ? accent : '#0A0A0A'} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Module pills + inspector callout */}
        <div className="border-t border-[#E5E5E4] px-3 py-3 sm:px-5">
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="tablist" aria-label="Hardware modules">
            {HARDWARE_NODES.map((n) => {
              const active = n.id === selected;
              return (
                <button
                  key={n.id}
                  id={tabId(idBase, n.id)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={panelId(idBase)}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setSelected(n.id)}
                  onKeyDown={(e) => handleTabArrows(e, hwIds, selected, setSelected, (id) => tabId(idBase, id))}
                  className={`relative inline-flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full border px-2.5 py-1 text-center font-mono text-[9.5px] leading-tight tracking-[0.08em] uppercase transition-colors [-webkit-tap-highlight-color:transparent] sm:min-h-0 sm:tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] ${
                    active ? 'gap-1.5 bg-white text-[#0A0A0A]' : 'border-[#E5E5E4] text-[#666666] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                  }`}
                  style={active ? { borderColor: accent, boxShadow: `inset 0 0 0 1px ${accent}` } : undefined}
                >
                  {active && (
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                  )}
                  {n.label}
                </button>
              );
            })}
          </div>
          <div id={panelId(idBase)} role="tabpanel" aria-labelledby={tabId(idBase, selected)}>
            <AnimatePresence mode="wait" initial={false}>
              {node && (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.26, ease: EASE }}
                  className="mt-3 rounded-[12px] border-l-2 bg-[#F3F3F2] px-3 py-2.5"
                  style={{ borderLeftColor: accent }}
                  aria-live="polite"
                >
                  <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-display text-[13px] font-semibold text-[#0A0A0A]">{node.shortRole}</span>
                    <span className="min-w-0 font-mono text-[9.5px] leading-snug tracking-[0.04em] break-words sm:tracking-[0.06em]" style={{ color: accent }}>
                      {node.pinInfo}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#666666]">{node.detail}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </StageFrame>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   EXPORT                                   */
/* -------------------------------------------------------------------------- */

export function ProjectMotionStage({
  project,
  onOpenLightbox,
}: {
  project: ProjectItem;
  onOpenLightbox?: OpenLightbox;
}) {
  switch (project.previewKind) {
    case 'apogex':
      return <ApogexStage project={project} onOpenLightbox={onOpenLightbox} />;
    case 'flowscope':
      return <FlowScopeStage project={project} onOpenLightbox={onOpenLightbox} />;
    case 'knowledge-explorer':
      return <KnowledgeExplorerStage project={project} />;
    case 'agent-widget':
      return <AgentWidgetStage project={project} />;
    case 'mindbench':
      return <MindBenchStage project={project} />;
    case 'ggpartner':
      return <GGPartnerStage project={project} />;
    case 'arduino-lock':
      return <ArduinoLockStage project={project} />;
    default:
      return null;
  }
}
