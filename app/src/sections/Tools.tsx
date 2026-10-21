// [S6] Grid de ferramentas — cards editoriais com ícone, badge e ação.
import { useEffect, useState } from 'react';
import {
  Search,
  Sparkles,
  Scale,
  Calculator,
  Banknote,
  Trophy,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Section, SectionHeading, Reveal } from '@/lib/ui';
import { api, type Tool } from '@/lib/api';

const ICONS: Record<string, LucideIcon> = {
  Search,
  Sparkles,
  Scale,
  Calculator,
  Banknote,
  Trophy,
};

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.tools().then(setTools).catch(() => setErro(true));
  }, []);

  return (
    <Section id="ferramentas" className="bg-surface-2">
      <SectionHeading
        eyebrow="FERRAMENTAS"
        title="Tudo o que você precisa"
        highlight="para decidir"
        sub="Acesso rápido a todas as ferramentas do Volante."
      />

      {erro && tools.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Dados indisponíveis no momento
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, i) => {
          const Icon = ICONS[tool.icon] ?? Sparkles;
          return (
            <Reveal key={tool.id} delay={i * 0.06}>
              <a
                href={tool.href}
                className="plate card-hover group block h-full rounded-sm border border-ink/10 p-6"
              >
                <div className="mb-5 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-ink/12 bg-secondary/60 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  {tool.badge && (
                    <span className="rounded-sm bg-ink px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-foreground">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-medium">{tool.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors group-hover:decoration-primary">
                  {tool.action_label}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </a>
            </Reveal>
            );
          })}
        </div>
      )}
    </Section>
  );
}
