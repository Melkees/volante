import { useEffect, useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import { Section, SectionHeading, Reveal, useCountUp } from '@/lib/ui';
import { api, type Rankings, type StatRow, type RankingEntry } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * "216.366" → 216366 (0 dec.) · "1.728.390" → 1728390 (0 dec.) · "+21.2%" → 21.2 (1 dec.).
 * Regra: '.' é milhar apenas se houver >1 segmento E o último tiver 3 dígitos;
 * caso contrário, '.' é decimal e a quantidade de casas originais é preservada.
 */
function parseStat(value: string): { num: number; prefix: string; suffix: string; decimals: number } {
  const prefix = value.startsWith('+') ? '+' : value.startsWith('-') ? '-' : '';
  const suffix = value.includes('%') ? '%' : '';
  let body = value.replace(/[+%\-]/g, '').trim();
  let decimals = 0;
  if (body.includes(',')) {
    const parts = body.split(',');
    decimals = parts[parts.length - 1].length;
    body = body.replace(/\./g, '').replace(',', '.');
  } else if (body.includes('.')) {
    const segs = body.split('.');
    if (segs.length > 1 && segs[segs.length - 1].length === 3) {
      body = segs.join(''); // separador de milhar
    } else {
      decimals = segs[segs.length - 1].length; // parte decimal original
    }
  }
  return { num: parseFloat(body) || 0, prefix, suffix, decimals };
}

function formatPtBr(n: number, decimals: number): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function StatCard({ row, delay }: { row: StatRow; delay: number }) {
  const { num, prefix, suffix, decimals } = parseStat(row.value);
  const { ref, value } = useCountUp(num);
  return (
    <Reveal delay={delay} className="h-full">
      <div className="plate card-hover h-full rounded-sm border border-ink/10 p-5 text-center md:p-6">
        <span ref={ref} className="font-display text-2xl font-medium text-foreground md:text-3xl">
          {prefix}
          {formatPtBr(value, decimals)}
          <span className="text-primary">{suffix}</span>
        </span>
        <p className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {row.label}
        </p>
      </div>
    </Reveal>
  );
}

/** Medalas em fundo branco (pódio 2º/3º e listas). */
const MEDAL = ['text-primary', 'text-slate-500', 'text-amber-700'];

function PodiumCard({
  entry,
  place,
  delay,
}: {
  entry: RankingEntry;
  place: 1 | 2 | 3;
  delay: number;
}) {
  const { ref, value } = useCountUp(entry.value);
  const first = place === 1;
  return (
    <Reveal
      delay={delay}
      className={cn(first ? 'md:order-2 md:-translate-y-4' : place === 2 ? 'md:order-1' : 'md:order-3')}
    >
      <div
        className={cn(
          'card-hover rounded-sm border p-6 text-center',
          first
            ? 'ink-band border-ink shadow-[0_24px_56px_-28px_rgba(30,28,26,0.5)] md:p-8'
            : 'plate border-ink/10',
        )}
      >
        <div className={cn('flex items-center justify-center gap-2', first && 'text-bronze-light')}>
          <Trophy className={cn('h-5 w-5', first ? 'text-bronze-light' : MEDAL[place - 1])} />
          <span
            className={cn(
              'text-[0.65rem] font-semibold tracking-[0.24em]',
              first ? 'text-bronze-light' : MEDAL[place - 1],
            )}
          >
            {place}º LUGAR
          </span>
        </div>
        <h3
          className={cn(
            'mt-3 font-display font-medium',
            first ? 'text-2xl text-ink-foreground md:text-3xl' : 'text-xl text-foreground',
          )}
        >
          {entry.name}
        </h3>
        <p className={cn('mt-1 font-display font-semibold', first ? 'text-xl text-bronze-light' : 'text-lg text-foreground/90')}>
          <span ref={ref}>{formatPtBr(value, 0)}</span>{' '}
          <span className={cn('text-sm', first ? 'text-ink-foreground/50' : 'text-muted-foreground')}>unid.</span>
        </p>
      </div>
    </Reveal>
  );
}

function CompactRow({ entry, index }: { entry: RankingEntry; index: number }) {
  const { ref, value } = useCountUp(entry.value);
  return (
    <Reveal delay={index * 0.08} className="w-full md:w-1/2">
      <div className="plate flex items-center justify-between rounded-sm border border-ink/10 px-4 py-3">
        <span className="flex items-center gap-3 text-sm text-foreground">
          <span className="font-display font-semibold text-muted-foreground">{entry.position}º</span>
          {entry.name}
        </span>
        <span className="font-display text-sm font-semibold text-foreground">
          <span ref={ref}>{formatPtBr(value, 0)}</span> <span className="text-muted-foreground">unid.</span>
        </span>
      </div>
    </Reveal>
  );
}

function BrandRow({ entry }: { entry: RankingEntry }) {
  const { ref, value } = useCountUp(entry.value);
  return (
    <li className="flex items-center justify-between border-b border-ink/10 py-2.5 last:border-0">
      <span className="flex items-center gap-3 text-sm text-foreground">
        <span className={cn('w-6 font-display text-sm font-semibold', MEDAL[entry.position - 1] ?? 'text-muted-foreground')}>
          {entry.position}º
        </span>
        {entry.name}
      </span>
      <span className="font-display text-sm font-semibold text-foreground">
        <span ref={ref}>{formatPtBr(value, 0)}</span>
      </span>
    </li>
  );
}

function MiniList({ entries, accent }: { entries: RankingEntry[]; accent: string }) {
  return (
    <ul className="space-y-1.5">
      {entries.slice(0, 3).map((e) => (
        <li key={e.name} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            <span className={cn('mr-2 font-display font-semibold', accent)}>{e.position}º</span>
            {e.name}
          </span>
          <span className="font-display font-semibold text-foreground">
            {formatPtBr(e.value, 0)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Rankings() {
  const [stats, setStats] = useState<StatRow[]>([]);
  const [data, setData] = useState<Rankings | null>(null);
  const [erro, setErro] = useState(false);
  const eletrificadosTotal = stats.find((s) => s.key === 'rank_eletrificados');
  const total = eletrificadosTotal ? parseStat(eletrificadosTotal.value).num : 0;
  const totalCup = useCountUp(total);

  useEffect(() => {
    api.stats().then((r) => setStats(r.rankings)).catch(() => setErro(true));
    api.rankings().then(setData).catch(() => setErro(true));
  }, []);

  const podium = (data?.veiculos ?? []).slice(0, 3);
  const order: (1 | 2 | 3)[] = [1, 2, 3];
  const rest = (data?.veiculos ?? []).slice(3, 5);

  return (
    <Section id="rankings">
      <SectionHeading
        eyebrow="FENABRAVE · SETEMBRO/2026"
        title="Ranking de"
        highlight="Vendas"
        sub="Os veículos e marcas mais emplacados do Brasil, com dados oficiais atualizados mensalmente."
      />

      {/* Stats */}
      {erro && stats.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Dados indisponíveis no momento
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((row, i) => (
            <StatCard key={row.key} row={row} delay={i * 0.08} />
          ))}
        </div>
      )}

      {/* Pódio */}
      {erro && !data ? (
        <p className="mt-14 text-center text-sm text-muted-foreground">
          Dados indisponíveis no momento
        </p>
      ) : (
        <div className="mt-14">
          <h3 className="mb-10 text-center font-display text-xl font-medium text-foreground">
            Top Veículos do mês
          </h3>
          <div className="grid items-end gap-4 md:grid-cols-3">
            {order.map((place, i) => {
              const entry = podium.find((e) => e.position === place);
              return entry ? (
                <PodiumCard key={entry.name} entry={entry} place={place} delay={i * 0.1} />
              ) : null;
            })}
          </div>
          {rest.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              {rest.map((e, i) => (
                <CompactRow key={e.name} entry={e} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marcas + Eletrificados */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <div className="plate card-hover h-full rounded-sm border border-ink/10 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-medium text-foreground">
              <Trophy className="h-5 w-5 text-primary" /> Top 5 Marcas
            </h3>
            <ul>
              {(data?.marcas ?? []).slice(0, 5).map((e) => (
                <BrandRow key={e.name} entry={e} />
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="plate card-hover h-full rounded-sm border border-ink/10 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-medium text-foreground">
              <Zap className="h-5 w-5 text-primary" /> Mercado de Eletrificados
            </h3>
            <div className="mb-5 border border-ink/10 bg-secondary/40 px-4 py-3 text-center">
              <span ref={totalCup.ref} className="font-display text-2xl font-semibold text-primary">
                {formatPtBr(totalCup.value, 0)}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">eletrificados emplacados no mês</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-700">Híbridos</h4>
                <MiniList entries={data?.eletrificados.hibridos ?? []} accent="text-emerald-700" />
              </div>
              <div>
                <h4 className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">Elétricos</h4>
                <MiniList entries={data?.eletrificados.eletricos ?? []} accent="text-primary" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-8 text-center">
        <a
          href="/rankings"
          className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-ink px-6 text-sm font-semibold text-ink-foreground transition-colors hover:bg-ink/85"
        >
          Ver ranking completo →
        </a>
      </Reveal>
    </Section>
  );
}
