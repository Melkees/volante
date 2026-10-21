// [S5] Calculadora de payback elétrico — sliders + resultados AO VIVO.
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Section, SectionHeading, Reveal } from '@/lib/ui';
import { api, brl2, type PaybackHighlight } from '@/lib/api';
import { Slider } from '@/components/ui/slider';

interface Params {
  km_mes: number;
  gasolina: number;
  energia: number;
  carros: PaybackHighlight['params']['carros'];
}

type Tipo = Params['carros'][number]['tipo'];
type Filtro = 'todos' | Tipo;

const num2 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function custoMensal(p: Params, carro: Params['carros'][number]) {
  const litros = p.km_mes / carro.consumo;
  const preco = carro.tipo === 'eletrico' ? p.energia : p.gasolina;
  return litros * preco;
}

/** Reconhece o tipo a partir do texto do chip do payload. */
function chipParaTipo(chip: string): Tipo | null {
  const c = chip.toLowerCase();
  if (c.includes('elétr') || c.includes('eletr')) return 'eletrico';
  if (c.includes('híbr') || c.includes('hibr')) return 'hibrido';
  if (c.includes('gasolina') || c.includes('combustão') || c.includes('combust')) return 'gasolina';
  return null;
}

const sliderCls =
  'py-2 [&_[data-slot=slider-thumb]]:size-7 md:[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-ink';

export default function Payback() {
  const [data, setData] = useState<PaybackHighlight | null>(null);
  const [params, setParams] = useState<Params | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    api.highlights().then((h) => {
      setData(h.payback);
      setParams({ ...h.payback.params });
    });
  }, []);

  const carrosFiltrados =
    params?.carros.filter((c) => filtro === 'todos' || c.tipo === filtro) ?? [];
  const maxCusto =
    carrosFiltrados.length > 0
      ? Math.max(...carrosFiltrados.map((c) => custoMensal(params!, c)))
      : 0;
  const polo =
    params?.carros.find((c) => c.tipo === 'gasolina') ?? params?.carros[0];
  const ev = params?.carros.find((c) => c.tipo === 'eletrico');
  const economiaMes =
    params && polo && ev ? custoMensal(params, polo) - custoMensal(params, ev) : 0;

  const sliders = [
    { label: 'Km por mês', min: 500, max: 5000, step: 100, key: 'km_mes' as const, fmt: (v: number) => `${v.toLocaleString('pt-BR')} km`, vt: (v: number) => `${v.toLocaleString('pt-BR')} quilômetros por mês` },
    { label: 'Gasolina', min: 4, max: 8, step: 0.05, key: 'gasolina' as const, fmt: (v: number) => `R$ ${num2(v)}/L`, vt: (v: number) => `Gasolina a ${brl2(v)} por litro` },
    { label: 'Energia', min: 0.5, max: 1.5, step: 0.01, key: 'energia' as const, fmt: (v: number) => `R$ ${num2(v)}/kWh`, vt: (v: number) => `Energia a ${brl2(v)} por quilowatt-hora` },
  ];

  return (
    <Section id="payback">
      <SectionHeading
        eyebrow="CALCULADORA"
        title="Elétrico"
        highlight="compensa pra você?"
        sub="Descubra em 30 segundos se a troca vale a pena, considerando quanto você roda, o preço do combustível e a energia elétrica na sua região."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controles */}
        <Reveal>
          <div className="plate h-full rounded-sm border border-ink/10 p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-ink/12 bg-secondary/60 text-primary">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-medium">Suas condições</p>
                <p className="text-sm text-muted-foreground">Arraste e veja ao vivo</p>
              </div>
            </div>

            {params && (
              <div className="space-y-7">
                {sliders.map((s) => (
                  <div key={s.key}>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                      <span className="font-display text-lg font-semibold text-primary">
                        {s.fmt(params[s.key])}
                      </span>
                    </div>
                    <Slider
                      className={sliderCls}
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={[params[s.key]]}
                      onValueChange={([v]) => setParams((p) => (p ? { ...p, [s.key]: v } : p))}
                      label={s.label}
                      valueText={s.vt(params[s.key])}
                    />
                  </div>
                ))}
              </div>
            )}

            {data && (
              <div className="mt-8 mb-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
                {data.chips.map((chip) => {
                  const tipo = chipParaTipo(chip);
                  const semExemplo = tipo != null && !params?.carros.some((c) => c.tipo === tipo);
                  const ativo = filtro !== 'todos' && tipo === filtro;
                  return (
                    <button
                      key={chip}
                      type="button"
                      aria-pressed={ativo}
                      disabled={semExemplo}
                      title={semExemplo ? 'Sem exemplo no catálogo' : undefined}
                      onClick={() => setFiltro((f) => (tipo && f === tipo ? 'todos' : tipo ?? 'todos'))}
                      className={`min-h-11 rounded-sm border px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        ativo
                          ? 'border-ink bg-ink text-ink-foreground'
                          : 'border-ink/12 bg-secondary/50 text-muted-foreground hover:border-ink/40'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* Resultados */}
        <Reveal delay={0.1}>
          <div className="plate rounded-sm border border-ink/10 p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display font-medium">Custo mensal de combustível</p>
              <span className="rounded-sm border border-ink/12 bg-secondary/60 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                {data?.badge ?? 'Exemplo ilustrativo'}
              </span>
            </div>

            {params && carrosFiltrados.length > 0 && (
              <div className="space-y-5">
                {carrosFiltrados.map((c) => {
                  const custo = custoMensal(params, c);
                  const pct = maxCusto > 0 ? (custo / maxCusto) * 100 : 0;
                  return (
                    <div key={c.nome}>
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-medium">
                          {c.nome}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {c.tipo === 'eletrico' ? 'elétrico' : c.tipo === 'hibrido' ? 'híbrido' : 'gasolina'}
                          </span>
                        </span>
                        <span className="font-display font-semibold">{brl2(custo)}/mês</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-secondary md:h-2.5">
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                            c.tipo === 'eletrico' ? 'bg-ink' : 'bg-ink/20'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {params && carrosFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem exemplo no catálogo para este filtro.</p>
            )}

            {polo && ev && (
              <div className="mt-8 grid gap-4 border-t border-ink/10 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Economia vs gasolina em 12 meses
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-primary">{brl2(economiaMes * 12)}</p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    em 60 meses
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold text-primary">{brl2(economiaMes * 60)}</p>
                </div>
              </div>
            )}

            {data && (
              <p className="mt-6 border-t border-ink/10 pt-4 text-xs text-muted-foreground">
                Cálculo ao vivo: economia de 5 anos de{' '}
                <span className="text-foreground">{brl2(economiaMes * 60)}</span> ·{' '}
                <span className="underline decoration-ink/20 underline-offset-2">
                  Referência do exemplo oficial (não varia com os sliders){' '}
                  <span className="text-foreground">{data.economia_5_anos}</span>
                  {data.equilibrio.map((e) => (
                    <span key={e.texto}>
                      {' '}
                      · {e.texto} <span className="text-primary">{e.meses} meses</span>
                    </span>
                  ))}
                </span>
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
