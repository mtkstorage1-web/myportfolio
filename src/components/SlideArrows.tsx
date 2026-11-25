import { useState } from 'react';
import { motion } from 'motion/react';

interface SlideArrowButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  accent?: string;
  disabled?: boolean;
  label?: string;
  pulseKey?: number;
}

/**
 * Motion-graphics directional arrow button (<-- / -->)
 * Elongates shaft, reveals a kinetic ghost echo trail on hover, and springs on click/keypress.
 */
export function SlideArrowButton({
  direction,
  onClick,
  accent = '#0A0A0A',
  disabled = false,
  label,
  pulseKey = 0,
}: SlideArrowButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isPrev = direction === 'prev';
  const sign = isPrev ? -1 : 1;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      // Only real mouse pointers drive the hover wipe — touch devices emit emulated
      // mouseenter events that would otherwise leave the button stuck in its dark state.
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      whileTap={disabled ? undefined : { scale: 0.92, x: sign * 3 }}
      aria-label={label ?? (isPrev ? 'Previous project slide' : 'Next project slide')}
      className="group relative inline-flex min-h-[44px] min-w-[54px] shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-2.5 overflow-hidden rounded-full border border-[#D4D4D2] bg-white px-3.5 text-[#0A0A0A] shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-[color,background-color,border-color,box-shadow] duration-300 [-webkit-tap-highlight-color:transparent] hover:border-[#0A0A0A] active:border-[#0A0A0A] active:bg-[#F0F0EE] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[48px] sm:px-5"
    >
      {/* Kinetic Hover Fill Wipe */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          x: hovered ? '0%' : isPrev ? '105%' : '-105%',
        }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 rounded-full bg-[#0A0A0A]"
      />

      {/* Trigger Pulse Ring on Keyboard / Click Navigation */}
      {pulseKey > 0 && (
        <motion.span
          key={pulseKey}
          aria-hidden="true"
          initial={{ scale: 0.85, opacity: 0.5 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ borderColor: accent }}
          className="pointer-events-none absolute inset-0 rounded-full border-2"
        />
      )}

      {/* Animated SVG Elongating Arrow (<-- or -->) */}
      <span
        className={`relative z-10 flex items-center gap-2 transition-colors duration-200 ${
          hovered ? 'text-[#FAFAFA]' : 'text-[#0A0A0A]'
        }`}
      >
        {isPrev ? (
          <>
            <svg viewBox="0 0 42 16" className="h-4 w-8 shrink-0 overflow-visible sm:w-9" fill="none" aria-hidden="true">
              {/* Echo ghost chevron trail */}
              <motion.path
                d="M15 3.5L9.5 8L15 12.5"
                stroke={hovered ? '#FAFAFA' : accent}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{
                  opacity: hovered ? [0, 0.55, 0] : 0,
                  x: hovered ? [6, -2, -6] : 0,
                }}
                transition={{ duration: 0.75, repeat: hovered ? Infinity : 0, ease: 'easeOut' }}
              />
              {/* Main elongating shaft */}
              <motion.line
                y1="8"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                animate={{
                  x1: hovered ? 4 : 9,
                  x2: hovered ? 38 : 34,
                }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              />
              {/* Main arrowhead */}
              <motion.path
                d="M10.5 3L4.5 8L10.5 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ x: hovered ? -1.5 : 3 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              />
            </svg>
            <span className="hidden font-mono text-[10.5px] tracking-[0.14em] uppercase sm:inline">
              Prev
            </span>
          </>
        ) : (
          <>
            <span className="hidden font-mono text-[10.5px] tracking-[0.14em] uppercase sm:inline">
              Next
            </span>
            <svg viewBox="0 0 42 16" className="h-4 w-8 shrink-0 overflow-visible sm:w-9" fill="none" aria-hidden="true">
              {/* Echo ghost chevron trail */}
              <motion.path
                d="M27 3.5L32.5 8L27 12.5"
                stroke={hovered ? '#FAFAFA' : accent}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{
                  opacity: hovered ? [0, 0.55, 0] : 0,
                  x: hovered ? [-6, 2, 6] : 0,
                }}
                transition={{ duration: 0.75, repeat: hovered ? Infinity : 0, ease: 'easeOut' }}
              />
              {/* Main elongating shaft */}
              <motion.line
                y1="8"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                animate={{
                  x1: hovered ? 4 : 8,
                  x2: hovered ? 38 : 33,
                }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              />
              {/* Main arrowhead */}
              <motion.path
                d="M31.5 3L37.5 8L31.5 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ x: hovered ? 1.5 : -3 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              />
            </svg>
          </>
        )}
      </span>
    </motion.button>
  );
}

interface MiniArrowButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  label: string;
}

/** Compact motion arrow for inner screenshot carousel frames */
export function MiniArrowButton({ direction, onClick, label }: MiniArrowButtonProps) {
  const isPrev = direction === 'prev';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: isPrev ? -2 : 2 }}
      whileTap={{ scale: 0.88 }}
      aria-label={label}
      className="grid h-10 w-10 shrink-0 cursor-pointer touch-manipulation select-none place-items-center rounded-full border border-[#E5E5E4] bg-white/95 text-[#0A0A0A] shadow-sm backdrop-blur transition-colors [-webkit-tap-highlight-color:transparent] hover:border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white active:border-[#0A0A0A] active:bg-[#0A0A0A] active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-1 sm:h-8 sm:w-8"
    >
      <svg viewBox="0 0 18 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        {isPrev ? (
          <>
            <line x1="15" y1="7" x2="3.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.5 3L3 7L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <line x1="3" y1="7" x2="14.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10.5 3L15 7L10.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
    </motion.button>
  );
}
