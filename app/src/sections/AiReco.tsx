// [S7] Seção IA: 4 passos numerados em serif + card tarja-preta "Recomendação #1".
import { useEffect, useState } from 'react';
import { Check, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Section, SectionHeading, Reveal } from '@/lib/ui';
import { api, brl, type Highlights } from '@/lib/api';

const PASSOS = [
  {
    titulo: 'Perfil em 10 perguntas',
    desc: 'Orçamento, uso, perfil familiar, km por mês, combustível, câmbio e suas prioridades',
  },
  {
    titulo: 'IA analisa o catálogo com preços FIPE',
    desc: 'Especificações técnicas reais, consumo INMETRO e preço atualizado do mês',
  },
  {
    titulo: 'Opções rankeadas com análise honesta',
    desc: 'Por que cada um serve para você, pontos fortes, fracos e comparativo entre eles',
  },
  {
    titulo: 'Ficha técnica completa + comparativo direto',
    desc: 'Link direto para cada veículo e opção de comparar lado a lado as opções recomendadas',
  },
];

export default function AiReco() {
  const [h, setH] = useState<Highlights | null>(null);

  useEffect(() => {
    api.highlights().then(setH);
  }, []);

  const r = h?.recomendacao;

  return (
    <Section id="ia">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Passos */}
        <div>
          <SectionHeading
            align="left"
            eyebrow="INTELIGÊNCIA ARTIFICIAL"
            title="Não sabe qual carro comprar?"
            highlight="Deixa a IA decidir."
            sub="Responda 10 perguntas sobre seu perfil: orçamento, uso diário, família, combustível e prioridades. Nossa IA cruza tudo isso com preços FIPE reais e entrega opções rankeadas com análise honesta."
          />

          <div className="relative space-y-9 pl-2">
            {PASSOS.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 0.08}>
                <div className="relative flex gap-5">
                  {i < PASSOS.length - 1 && (
                    <span className="absolute left-[22px] top-14 h-[calc(100%-36px)] w-px bg-ink/12" />
                  )}
                  <span className="w-11 shrink-0 pt-0.5 font-display text-[1.7rem] font-medium leading-none text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium">{p.titulo}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <a
              href="/decida"
              className="mt-11 inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-ink px-6 py-3 font-semibold text-ink-foreground transition-colors duration-200 hover:bg-ink/85"
            >
              Gerar minha recomendação
              <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>
        </div>

        {/* Card destaque — tarja preta */}
        <Reveal delay={0.1} className="lg:pt-20">
          <div className="ink-band rounded-sm border border-ink p-6 shadow-[0_28px_64px_-36px_rgba(30,28,26,0.55)] md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.24em] text-ink-foreground/50">
                <Sparkles className="h-4 w-4 text-bronze-light" />
                RECOMENDAÇÃO N.º 1
              </span>
              <span className="flex items-center gap-2">
                <span className="rounded-sm border border-ink-foreground/15 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink-foreground/70">
                  Exemplo ilustrativo
                </span>
                <span className="rounded-sm border border-bronze-light/40 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-bronze-light">
                  No catálogo
                </span>
              </span>
            </div>

            <h3 className="font-display text-xl font-medium md:text-2xl">{r?.veiculo ?? '—'}</h3>
            <p className="mt-2 flex items-center gap-2">
              <span className="font-display text-2xl font-semibold text-bronze-light">
                {r ? brl(r.preco_valor) : '—'}
              </span>
              <span className="rounded-sm border border-ink-foreground/20 px-2 py-0.5 text-[0.62rem] font-medium tracking-[0.14em] text-ink-foreground/60">
                FIPE
              </span>
            </p>

            <div className="mt-7 border border-ink-foreground/10 bg-ink-foreground/[0.04] p-5">
              <p className="font-display font-medium">{r?.pergunta ?? 'Por que este veículo?'}</p>
              {r?.resposta && <p className="mt-2 text-sm leading-relaxed text-ink-foreground/75">{r.resposta}</p>}
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-ink-foreground/50">
                    PONTOS FORTES
                  </p>
                  <ul className="space-y-1.5">
                    {(r?.pontos_fortes ?? []).map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-ink-foreground/50">
                    ATENÇÃO
                  </p>
                  <ul className="space-y-1.5">
                    {(r?.atencao ?? []).map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bronze-light" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-ink-foreground/60">{r?.rodape ?? '+ 4 outras opções rankeadas pela IA'}</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
