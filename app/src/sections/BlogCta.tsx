import { Link } from 'react-router';
import { Newspaper, ArrowRight } from 'lucide-react';
import { Section, Reveal } from '@/lib/ui';

export default function BlogCta() {
  return (
    <Section id="blog" className="ink-band py-14 md:py-16">
      <Reveal>
        <Link
          to="/blog"
          className="group flex flex-col items-start gap-5 border border-ink-foreground/10 bg-ink-foreground/[0.03] p-6 transition-colors duration-200 hover:border-bronze-light/40 sm:flex-row sm:items-center md:p-8"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-ink-foreground/15 text-bronze-light">
            <Newspaper className="h-7 w-7" />
          </span>
          <span className="flex-1">
            <h3 className="font-display text-xl font-medium text-ink-foreground md:text-2xl">
              Blog do Volante
            </h3>
            <p className="mt-1 text-sm text-ink-foreground/60 md:text-base">
              Análises, comparativos e tendências do mercado automotivo
            </p>
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-bronze-light transition-transform duration-200 group-hover:translate-x-1">
            Acessar o blog <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </Reveal>
    </Section>
  );
}
