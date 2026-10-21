// Blocos compartilhados do Volante — mantêm as seções visualmente coesas.
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Revelação padrão: fade + sobe ao entrar no viewport. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Contador animado — anima até `target` quando o elemento entra na tela. */
export function useCountUp(target: number, duration = 1600) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return { ref, value };
}

/** Cabeçalho de seção padrão: eyebrow + título display + subtítulo. */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  sub,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  sub?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal className={cn('mb-10 md:mb-14', align === 'center' ? 'text-center' : 'text-left')}>
      {eyebrow && (
        <span className="mb-4 inline-block text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
        {title} {highlight && <em className="font-medium italic text-primary">{highlight}</em>}
      </h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{sub}</p>}
    </Reveal>
  );
}

/** Container central padrão da página. */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('py-16 md:py-24', className)}>
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">{children}</div>
    </section>
  );
}
