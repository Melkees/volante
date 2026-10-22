// Hero editorial do Volante — capa de revista: display serif, prato fotográfico com
// moldura deslocada e faixa de stats com contador seguro (dados da API).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api, type StatRow } from '@/lib/api';
import { Reveal } from '@/lib/ui';
import Numero from '@/components/Numero';
import { Button } from '@/components/ui/button';

/** "4.860+" → { n: 4860, suffix: "+" } · "97%" → { n: 97, suffix: "%" } */
function parseStat(value: string) {
  const m = value.match(/^([\d.,]+)\s*(\+|%)?/);
  const n = m ? Number(m[1].replace(/\./g, '').replace(',', '.')) : 0;
  return { n: Number.isFinite(n) ? n : 0, suffix: m?.[2] ?? '' };
}

function StatItem({ stat, delay }: { stat: StatRow; delay: number }) {
  const { n, suffix } = parseStat(stat.value);
  return (
    <Reveal delay={delay} className="px-2 py-5 text-center md:text-left sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <p className="font-display text-3xl font-medium text-foreground md:text-4xl">
        <Numero valor={n} sufixo={suffix} sufixoClassName="text-primary" />
      </p>
      <p className="mt-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {stat.label}
      </p>
    </Reveal>
  );
}

export default function Hero() {
  const [heroStats, setHeroStats] = useState<StatRow[]>([]);

  useEffect(() => {
    let alive = true;
    api.stats().then((s) => alive && setHeroStats(s.hero)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-28 md:px-8 md:pt-36 lg:grid-cols-12 lg:gap-10 lg:pb-24">
        {/* Coluna tipográfica */}
        <div className="lg:col-span-6">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-ink/15 bg-card/80 px-4 py-1.5 text-xs font-medium tracking-wide text-foreground/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-600 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              FIPE · FENABRAVE · atualizado mensalmente
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-7 font-display text-[2.6rem] font-medium leading-[1.06] tracking-[-0.015em] text-foreground sm:text-6xl xl:text-[4.1rem]">
              A decisão do seu próximo carro,
              <br />
              <em className="font-medium italic text-primary">com clareza total.</em>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Compare modelos, consulte preços FIPE e fichas técnicas, simule financiamento e deixe o
              Volante apontar o carro certo para o seu perfil.
            </p>
          </Reveal>

          <Reveal delay={0.3} className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row md:justify-start">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-sm bg-ink px-7 sm:w-auto text-base font-semibold text-ink-foreground shadow-none transition-colors duration-200 hover:bg-ink/85"
            >
              <Link to="/busca">
                Explorar o catálogo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 w-full rounded-sm border border-ink/20 sm:w-auto bg-transparent px-7 text-base font-medium text-foreground transition-colors duration-200 hover:border-ink/40 hover:bg-secondary"
            >
              <Link to="/decida">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                Deixa o Volante decidir
              </Link>
            </Button>
          </Reveal>

          {/* Faixa de stats — dados reais da API */}
          {heroStats.length > 0 && (
            <Reveal delay={0.45} className="mt-12">
              <div className="grid grid-cols-1 divide-y divide-ink/15 border-y border-ink/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {heroStats.slice(0, 3).map((s, i) => (
                  <StatItem key={s.key} stat={s} delay={0.55 + i * 0.1} />
                ))}
              </div>
            </Reveal>
          )}
        </div>

        {/* Prato fotográfico — moldura deslocada, legenda de revista */}
        <Reveal delay={0.25} className="lg:col-span-6 lg:pl-6">
          <figure className="relative mb-3 mr-3 mt-2 sm:mb-4 sm:mr-4 lg:mt-0">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 border border-ink/20 sm:translate-x-4 sm:translate-y-4"
            />
            <img
              src="/assets/hero-cronos.webp"
              srcSet="/assets/hero-cronos.webp 964w, /assets/hero-cronos-480.webp 480w"
              sizes="(min-width: 1024px) 600px, calc(100vw - 2rem)"
              alt="Fiat Cronos em estrada de serra ao entardecer"
              width={964}
              height={722}
              fetchPriority="high"
              className="relative aspect-[4/3] w-full rounded-sm border border-ink/10 object-cover shadow-[0_24px_60px_-32px_rgba(30,28,26,0.35)]"
            />
            <figcaption className="mt-3 flex items-center justify-between text-[0.62rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span>Volante · Serra</span>
              <span>Edição Outubro 2026</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
