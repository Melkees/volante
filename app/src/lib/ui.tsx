// Blocos compartilhados do Volante — mantêm as seções visualmente coesas.
import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Revelação padrão (N10v): por padrão renderiza SEM animação (nada de página
 * "vazia"); só se o bloco estiver abaixo da dobra no mount (medido no layout
 * effect, antes do paint) troca pelo fade curto (≤350ms) uma única vez.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [animar, setAnimar] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top >= window.innerHeight) {
      setAnimar(true); // abaixo da dobra: habilita a animação
    }
  }, []);

  if (!animar) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay, ease: [0.21, 0.6, 0.35, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Contadores animados vivem em components/Numero.tsx (valor final sempre no DOM).

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
