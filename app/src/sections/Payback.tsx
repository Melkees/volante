// [S5] Calculadora de payback elétrico — sliders + resultados AO VIVO.
// B4: os chips escolhem o carro de REFERÊNCIA da comparação (destacam na lista,
//     nunca filtram — todos os carros continuam visíveis).
// B5: economia e payback derivam de UM estado só (nada de número fixo do JSON).
// N18: estimativas longas (12/60 meses) sem centavos; custo mensal mantém 2 casas.
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Section, SectionHeading, Reveal } from '@/lib/ui';
import { api, brl, brl2, type PaybackHighlight } from '@/lib/api';
import { Slider } from '@/components/ui/slider';

type Carro = PaybackHighlight['params']['carros'][number];
type Tipo = Carro['tipo'];

interface Params {
  km_mes: number;
  gasolina: number;
  /** null quando nem o payload novo nem preco_combustiveis trazem preço de etanol */
  etanol: number | null;
  energia: number;
  carros: Carro[];
}

const LABEL_TIPO: Record<Tipo, string> = {
  gasolina: 'gasolina',
  etanol: 'etanol',
  hibrido: 'híbrido',
  eletrico: 'elétrico',
};

const num2 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

/** "R$ 4,20/L" → 4.2 — fallback do payload velho, que não traz params.etanol. */
function parsePreco(texto: string | undefined): number | null {
  if (!texto) return null;
  const n = Number(texto.replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** B5: custo mensal = km_mes / consumo × preço do insumo do carro. */
function custoMensal(p: Params, carro: Carro) {
  const unidades = p.km_mes / carro.consumo;
  const preco =
    carro.tipo === 'eletrico'
      ? p.energia
      : carro.tipo === 'etanol'
        ? (p.etanol ?? p.gasolina)
        : p.gasolina;
  return unidades * preco;
}

/** Reconhece o tipo a partir do texto do chip do payload. */
function chipParaTipo(chip: string): Tipo | null {
  const c = chip.toLowerCase();
  if (c.includes('elétr') || c.includes('eletr')) return 'eletrico';
  if (c.includes('híbr') || c.includes('hibr')) return 'hibrido';
  if (c.includes('etanol') || c.includes('álcool') || c.includes('alcool')) return 'etanol';
  if (c.includes('gasolina') || c.includes('combustão') || c.includes('combust')) return 'gasolina';
  return null;
}

const sliderCls =
  'py-2 [&_[data-slot=slider-thumb]]:size-7 md:[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-ink';

interface SliderDef {
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  vt: (v: number) => string;
  get: (p: Params) => number;
  set: (p: Params, v: number) => Params;
}

export default function Payback() {
  const [data, setData] = useState<PaybackHighlight | null>(null);
  const [params, setParams] = useState<Params | null>(null);
  // B4: chip ativo = carro de referência da comparação (o elétrico é o carro da calculadora).
  const [base, setBase] = useState<Tipo>('gasolina');
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.highlights()
      .then((h) => {
        setData(h.payback);
        const p = h.payback.params;
        setParams({
          km_mes: p.km_mes,
          gasolina: p.gasolina,
          etanol: p.etanol ?? parsePreco(h.payback.preco_combustiveis?.etanol),
          energia: p.energia,
          carros: p.carros,
        });
      })
      .catch(() => setErro(true));
  }, []);

  const carros = params?.carros ?? [];
  const ev = carros.find((c) => c.tipo === 'eletrico');
  // Chip ELÉTRICO: o Dolphin é o próprio carro da calculadora — a base da
  // comparação cai para o carro a gasolina, e a nota abaixo dos chips explica.
  const refCarro =
    base === 'eletrico'
      ? (carros.find((c) => c.tipo === 'gasolina') ?? carros.find((c) => c.tipo !== 'eletrico'))
      : (carros.find((c) => c.tipo === base) ??
        carros.find((c) => c.tipo === 'gasolina') ??
        carros[0]);

  // M4: a lista NUNCA filtra — a barra compara todos os carros entre si.
  const maxCusto =
    params && carros.length > 0 ? Math.max(...carros.map((c) => custoMensal(params, c))) : 0;
  const economiaMes =
    params && refCarro && ev ? custoMensal(params, refCarro) - custoMensal(params, ev) : 0;

  // B5: payback pelo preço FIPE — só quando o payload traz os preços.
  const diffPreco =
    ev?.preco != null && refCarro?.preco != null ? ev.preco - refCarro.preco : null;
  const mesesPayback =
    diffPreco != null && economiaMes > 0 ? Math.ceil(diffPreco / economiaMes) : null;
  const notaPayback =
    !refCarro || !ev
      ? null
      : economiaMes <= 0
        ? `com estes valores, o ${ev.nome} não gera economia frente ao ${refCarro.nome}`
        : diffPreco == null
          ? null
          : diffPreco <= 0
            ? `o ${ev.nome} já custa menos que o ${refCarro.nome} na tabela FIPE — a economia começa na compra`
            : `o ${ev.nome} se paga em ${(mesesPayback ?? 0).toLocaleString('pt-BR')} meses`;

  const sliders: SliderDef[] = [
    {
      label: 'Km por mês',
      min: 500,
      max: 5000,
      step: 100,
      fmt: (v) => `${v.toLocaleString('pt-BR')} km`,
      vt: (v) => `${v.toLocaleString('pt-BR')} quilômetros por mês`,
      get: (p) => p.km_mes,
      set: (p, v) => ({ ...p, km_mes: v }),
    },
    {
      label: 'Gasolina',
      min: 4,
      max: 8,
      step: 0.05,
      fmt: (v) => `R$ ${num2(v)}/L`,
      vt: (v) => `Gasolina a ${brl2(v)} por litro`,
      get: (p) => p.gasolina,
      set: (p, v) => ({ ...p, gasolina: v }),
    },
    // O slider de etanol só existe quando há preço de etanol (payload novo ou
    // parse do preco_combustiveis) — no payload velho ele some, como o chip.
    ...(params?.etanol != null
      ? [
          {
            label: 'Etanol',
            min: 2,
            max: 8,
            step: 0.05,
            fmt: (v: number) => `R$ ${num2(v)}/L`,
            vt: (v: number) => `Etanol a ${brl2(v)} por litro`,
            get: (p: Params) => p.etanol ?? 0, // slider só renderiza com etanol != null
            set: (p: Params, v: number): Params => ({ ...p, etanol: v }),
          },
        ]
      : []),
    {
      label: 'Energia',
      min: 0.5,
      max: 1.5,
      step: 0.01,
      fmt: (v) => `R$ ${num2(v)}/kWh`,
      vt: (v) => `Energia a ${brl2(v)} por quilowatt-hora`,
      get: (p) => p.energia,
      set: (p, v) => ({ ...p, energia: v }),
    },
  ];

  return (
    <Section id="payback">
      <SectionHeading
        eyebrow="CALCULADORA"
        title="Elétrico"
        highlight="compensa pra você?"
        sub="Descubra em 30 segundos se a troca vale a pena, considerando quanto você roda, o preço do combustível e a energia elétrica na sua região."
      />

      {erro && !params ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Dados indisponíveis no momento
        </p>
      ) : (
        // M4: items-stretch + h-full nos dois plates — nenhum card encolhe.
        <div className="grid items-stretch gap-6 lg:grid-cols-[380px_1fr]">
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
                  {sliders.map((s) => {
                    const valor = s.get(params);
                    return (
                      <div key={s.label}>
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="text-sm text-muted-foreground">{s.label}</span>
                          <span className="font-display text-lg font-semibold text-primary">
                            {s.fmt(valor)}
                          </span>
                        </div>
                        <Slider
                          className={sliderCls}
                          min={s.min}
                          max={s.max}
                          step={s.step}
                          value={[valor]}
                          onValueChange={([v]) => setParams((p) => (p ? s.set(p, v) : p))}
                          label={s.label}
                          valueText={s.vt(valor)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {data && (
                <div className="mt-8 mb-2">
                  <p className="mb-2.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Base da comparação
                  </p>
                  <div
                    className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2"
                    role="group"
                    aria-label="Base de comparação do payback"
                  >
                    {data.chips.map((chip) => {
                      const tipo = chipParaTipo(chip);
                      const semExemplo =
                        tipo == null || !params?.carros.some((c) => c.tipo === tipo);
                      const ativo = tipo != null && base === tipo;
                      return (
                        <button
                          key={chip}
                          type="button"
                          aria-pressed={ativo}
                          disabled={semExemplo}
                          title={semExemplo ? 'Sem exemplo para este combustível' : undefined}
                          onClick={() => tipo && setBase(tipo)}
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
                  {base === 'eletrico' && refCarro && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      O elétrico é o carro da calculadora — a comparação segue contra o{' '}
                      {refCarro.nome} ({LABEL_TIPO[refCarro.tipo]}). Escolha Gasolina, Etanol ou
                      Híbrido para trocar a base.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Reveal>

          {/* Resultados */}
          <Reveal delay={0.1}>
            <div className="plate h-full rounded-sm border border-ink/10 p-6 md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="font-display font-medium">Custo mensal de combustível</p>
                <span className="rounded-sm border border-ink/12 bg-secondary/60 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  {data?.badge ?? 'Exemplo ilustrativo'}
                </span>
              </div>

              {params && carros.length > 0 && (
                <div className="space-y-5">
                  {carros.map((c) => {
                    const custo = custoMensal(params, c);
                    const pct = maxCusto > 0 ? (custo / maxCusto) * 100 : 0;
                    const isEV = c.tipo === 'eletrico';
                    const isRef = c === refCarro;
                    return (
                      <div key={`${c.tipo}:${c.nome}`}>
                        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="text-sm font-medium">
                            {c.nome}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {LABEL_TIPO[c.tipo]}
                            </span>
                            {isRef && (
                              <span className="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-primary">
                                base da comparação
                              </span>
                            )}
                          </span>
                          <span className="font-display font-semibold">{brl2(custo)}/mês</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-secondary md:h-2.5">
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                              isEV ? 'bg-ink' : isRef ? 'bg-primary' : 'bg-ink/20'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {params && carros.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem exemplos de carros no momento.</p>
              )}

              {refCarro && ev && (
                <div className="mt-8 grid gap-4 border-t border-ink/10 pt-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Economia vs {LABEL_TIPO[refCarro.tipo]} em 12 meses
                    </p>
                    {/* N18: estimativa longa sem centavos */}
                    <p className="mt-1 font-display text-xl font-semibold text-primary">
                      {brl(economiaMes * 12)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      em 60 meses
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold text-primary">
                      {brl(economiaMes * 60)}
                    </p>
                  </div>
                </div>
              )}

              {/* B5: UM número de 5 anos só, calculado ao vivo; o payback usa os preços FIPE. */}
              {refCarro && ev && (
                <p className="mt-6 border-t border-ink/10 pt-4 text-xs text-muted-foreground">
                  Cálculo ao vivo: economia de 5 anos de{' '}
                  <span className="text-foreground">{brl(economiaMes * 60)}</span>
                  {notaPayback && (
                    <>
                      {' · '}
                      <span className="text-foreground">{notaPayback}</span>
                    </>
                  )}
                  .
                </p>
              )}
            </div>
          </Reveal>
        </div>
      )}
    </Section>
  );
}
