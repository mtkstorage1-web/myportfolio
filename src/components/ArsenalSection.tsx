import { Code2, Cpu, Gamepad2, MonitorSmartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ARSENAL_DIVISIONS } from '../data/portfolioData';

const EASE = [0.22, 1, 0.36, 1] as const;
const DIVISION_ICONS: Partial<Record<string, LucideIcon>> = {
  games: Gamepad2,
  native: MonitorSmartphone,
  web: Code2,
  systems: Cpu,
};

export function ArsenalSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="stack"
      aria-labelledby="stack-heading"
      className="scroll-mt-20 border-t border-[#E5E5E4] py-14 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-[#666666]">03 // CAPABILITIES</p>
            <div className="mt-3 overflow-hidden">
              <motion.h2
                id="stack-heading"
                initial={reduceMotion ? false : { y: '105%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: EASE }}
                className="font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl"
              >
                Tech Stack
              </motion.h2>
            </div>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-[#525252] sm:text-base">
            Every tool here has been used in a shipped build. See how they fit together in the{' '}
            <a
              href="#slides"
              className="font-medium text-[#0A0A0A] underline decoration-[#9A9A9A] underline-offset-4 hover:decoration-current"
            >
              project slides
            </a>.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[28px] border border-[#E5E5E4] bg-[#E5E5E4] md:grid-cols-2">
          {ARSENAL_DIVISIONS.map((division) => {
            const Icon = DIVISION_ICONS[division.id] ?? Code2;

            return (
              <article key={division.id} className="flex flex-col bg-white p-5 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="inline-grid size-10 place-items-center rounded-xl border border-[#E5E5E4] bg-[#FAFAFA]">
                    <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#666666]">{division.code}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.03em]">{division.title}</h3>
                <p className="mt-2 mb-5 max-w-sm text-sm leading-relaxed text-[#666666]">{division.description}</p>
                <ul className="mt-auto divide-y divide-[#E5E5E4] border-t border-[#E5E5E4]">
                  {division.skills.map((skill) => (
                    <li key={skill.name} className="group flex items-baseline justify-between gap-3 py-3">
                      <span className="text-sm font-medium motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:translate-x-1">
                        {skill.name}
                      </span>
                      <span className="max-w-[45%] text-right font-mono text-[11px] leading-relaxed text-[#666666]">
                        {skill.context}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
