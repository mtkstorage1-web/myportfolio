import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, Github, Mail, MessageSquare } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { PROFILE } from '../data/portfolioData';

const EASE = [0.22, 1, 0.36, 1] as const;
const CHANNEL_ACTION =
  'inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E5E5E4] bg-white px-2.5 font-mono text-[11px] text-[#525252] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]';

function CopyButton({ label, value }: { label: string; value: string }) {
  const [feedback, setFeedback] = useState<'copied' | 'failed' | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (feedback === null) return;

    const timeout = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback('copied');
    } catch {
      setFeedback('failed');
    }
  }

  const copied = feedback === 'copied';
  const buttonText = copied ? 'Copied' : feedback === 'failed' ? 'Retry' : 'Copy';
  const Icon = copied ? Check : Copy;

  return (
    <>
      <button
        type="button"
        aria-label={`${feedback === 'failed' ? 'Retry copying' : buttonText} ${label}`}
        onClick={copyValue}
        className={`${CHANNEL_ACTION} w-[4.75rem] cursor-pointer overflow-hidden`}
      >
        <motion.span
          key={buttonText}
          initial={reduceMotion || feedback === null ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="inline-flex items-center gap-1.5"
        >
          <Icon aria-hidden="true" className="size-3.5" />
          {buttonText}
        </motion.span>
      </button>
      <span role="status" className="sr-only">
        {copied && `Copied ${label}.`}
        {feedback === 'failed' && `Could not copy ${label}.`}
      </span>
    </>
  );
}

export function ContactSection() {
  const reduceMotion = useReducedMotion();
  const emailLink = `mailto:${PROFILE.email}`;
  const channels = [
    { label: 'Direct Email', value: PROFILE.email, icon: Mail, href: emailLink, copyLabel: 'email address' },
    { label: 'GitHub', value: `github.com/${PROFILE.githubHandle}`, icon: Github, href: PROFILE.githubUrl },
    { label: 'Facebook', value: PROFILE.facebookName, icon: MessageSquare, copyLabel: 'Facebook name' },
  ];

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-16 border-t border-[#E5E5E4] pt-20 pb-14 sm:pt-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative grid items-center gap-8 rounded-[32px] border border-[#E5E5E4] bg-white p-7 sm:gap-10 sm:p-12 lg:grid-cols-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 font-mono text-[10px] text-[#9A9A9A]">
            <span className="absolute top-3 left-4">+</span>
            <span className="absolute top-3 right-4">+</span>
            <span className="absolute bottom-3 left-4">+</span>
            <span className="absolute right-4 bottom-3">+</span>
          </div>

          <div className="min-w-0 lg:col-span-6">
            <p className="font-mono text-[11px] tracking-[0.16em] text-[#666666]">04 // CONTACT</p>
            <div className="mt-3 overflow-hidden pb-1">
              <motion.h2
                id="contact-heading"
                initial={reduceMotion ? false : { y: '105%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                className="max-w-md font-display text-4xl leading-[1.05] font-bold tracking-[-0.04em] sm:text-5xl"
              >
                Let's build something clean.
              </motion.h2>
            </div>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#525252] sm:text-base">
              Have a game, offline-first app, web system, or university tech build in mind?
              I’d like to hear what you’re working on.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={emailLink}
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#0A0A0A] px-4 py-3 font-mono text-[11px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#262626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
              >
                Send Email
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                />
              </a>
              <a
                href={PROFILE.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E4] bg-white px-4 py-3 font-mono text-[11px] font-medium tracking-[0.1em] uppercase transition-colors hover:border-[#0A0A0A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
              >
                <Github aria-hidden="true" className="size-4" />
                GitHub
              </a>
            </div>
          </div>

          <ul className="min-w-0 divide-y divide-[#E5E5E4] rounded-2xl border border-[#E5E5E4] bg-[#FAFAFA] lg:col-span-6">
            {channels.map(({ label, value, icon: Icon, href, copyLabel }) => (
              <li key={label} className="flex items-center gap-2.5 px-3 py-3.5 sm:gap-3 sm:px-4">
                <span className="hidden size-9 shrink-0 place-items-center rounded-xl border border-[#E5E5E4] bg-white sm:grid">
                  <Icon aria-hidden="true" className="size-4" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] tracking-[0.12em] text-[#666666] uppercase">{label}</p>
                  <p className="mt-0.5 font-display text-sm leading-snug font-medium wrap-anywhere">
                    {href ? (
                      <a
                        href={href}
                        target={copyLabel ? undefined : '_blank'}
                        rel={copyLabel ? undefined : 'noreferrer'}
                        className="underline-offset-4 hover:underline"
                      >
                        {value}
                      </a>
                    ) : value}
                  </p>
                </div>
                {copyLabel ? (
                  <CopyButton label={copyLabel} value={value} />
                ) : (
                  <a
                    href={PROFILE.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open GitHub profile in a new tab"
                    className={CHANNEL_ACTION}
                  >
                    Open <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <footer className="mt-9 flex flex-col gap-2 border-t border-[#E5E5E4] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-sm font-medium">{PROFILE.name} · UIT Yangon</p>
          <p className="font-mono text-[10px] tracking-[0.12em] text-[#666666]">
            OFFLINE-FIRST · MINIMAL MOTION EDITION
          </p>
        </footer>
      </div>
    </section>
  );
}
