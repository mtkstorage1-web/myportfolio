import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { CHRONICLE_MILESTONES, PROFILE } from '../data/portfolioData';

const EASE = [0.22, 1, 0.36, 1] as const;

export function ChronicleSection() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 80%', 'end 65%'],
  });
  const spineScale = useTransform(scrollYProgress, [0.03, 0.97], [0, 1]);

  return (
    <section
      id="journey"
      aria-labelledby="journey-heading"
      className="scroll-mt-20 border-t border-[#E5E5E4] py-14 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-12 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:col-span-5">
          <p className="font-mono text-[11px] tracking-[0.16em] text-[#666666]">02 // JOURNEY</p>
          <div className="mt-3 overflow-hidden">
            <motion.h2
              id="journey-heading"
              initial={reduceMotion ? false : { y: '105%' }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE }}
              className="font-display text-4xl font-bold tracking-[-0.04em] sm:text-5xl"
            >
              Origin &amp; Path
            </motion.h2>
          </div>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#525252] sm:text-base">
            {PROFILE.name} is a {PROFILE.title} and computer science student who ships
            complete offline-first software and hands-on hardware builds.
          </p>

          <div className="mt-6 rounded-2xl border border-[#E5E5E4] bg-white p-5 sm:mt-8 sm:p-8">
            <p className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">
              Academic Distinction
            </p>
            <p className="mt-3 font-display text-3xl font-bold tracking-[-0.03em]">
              {PROFILE.matricScore} Marks
            </p>
            <p className="mt-1 text-sm text-[#525252]">CAE Naypyidaw (NPT)</p>
            <p className="mt-4 border-t border-[#E5E5E4] pt-3 font-mono text-xs text-[#666666]">
              UIT Yangon · Year 2 Active
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-2 divide-x divide-[#E5E5E4] border-y border-[#E5E5E4]">
            <div className="py-3.5 pr-3">
              <dt className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">Campus</dt>
              <dd className="mt-1 text-sm font-medium">UIT Yangon</dd>
            </div>
            <div className="py-3.5 pl-4">
              <dt className="font-mono text-[10px] tracking-[0.14em] text-[#666666] uppercase">Base</dt>
              <dd className="mt-1 text-sm font-medium">{PROFILE.location}</dd>
            </div>
          </dl>
        </div>

        <div
          ref={timelineRef}
          className="relative lg:col-span-7"
        >
          <div aria-hidden="true" className="absolute top-8 bottom-0 left-1 w-px bg-[#E5E5E4]">
            <motion.div
              style={{ scaleY: reduceMotion ? 1 : spineScale }}
              className="h-full w-full origin-top bg-[#0A0A0A]"
            />
          </div>
          <ol aria-label="Journey milestones" className="grid gap-4 pl-5 sm:gap-5 sm:pl-9">
            {CHRONICLE_MILESTONES.map((milestone) => (
              <li key={milestone.era} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-7 -left-5 size-2.5 rounded-full border border-[#0A0A0A] bg-white sm:-left-9"
                />
                <article className="rounded-2xl border border-[#E5E5E4] bg-white p-5 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[11px] tracking-[0.12em] text-[#666666]">{milestone.era}</p>
                    {milestone.highlight && (
                      <span className="rounded-full bg-[#F3F3F2] px-2.5 py-1 font-mono text-[10px] text-[#525252]">
                        {milestone.highlight}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-xl leading-tight font-semibold tracking-[-0.025em] sm:text-2xl">
                    {milestone.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#525252]">{milestone.institution}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#666666]">{milestone.summary}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-[#E5E5E4] pt-3">
                    {milestone.tags.map((tag) => (
                      <li key={tag} className="rounded-md bg-[#F3F3F2] px-2 py-1 font-mono text-[10px] text-[#525252]">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
