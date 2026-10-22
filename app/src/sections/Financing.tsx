// [S8] Financiamento interativo — sliders + 4 modalidades calculadas AO VIVO.
// N9: consórcio com taxa de administração real (~18%), assinatura fora da
//     disputa de menor custo (não há posse do veículo) e selo no vencedor real.
import { useEffect, useMemo, useState } from 'react';
import { Car } from 'lucide-react';
import { Section, SectionHeading, Reveal } from '@/lib/ui';
import { api, brl, brl2, type FinanciamentoHighlight } from '@/lib/api';
import { Slider } from '@/components/ui/slider';

interface Modalidade {
  nome: string;
  parcela: number;
  meses: number;
  total: number;
  nota: string | null;
  fixa: boolean; // mensalidade fixa (assinatura)
}

/** PMT = PV·i / (1 − (1+i)⁻ⁿ) */
function pmt(pv: number, i: number, n: number) {
  return (pv * i) / (1 - Math.pow(1 + i, -n));
}

const sliderCls =
  'py-2 [&_[data-slot=slider-thumb]]:size-7 md:[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-ink';

export default function Financing() {
  const [data, setData] = useState<FinanciamentoHighlight | null>(null);
  const [valor, setValor] = useState<number | null>(null);
  const [entrada, setEntrada] = useState<number | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.highlights()
      .then((h) => {
        setData(h.financiamento);
        setValor(h.financiamento.params.valor_padrao);
        setEntrada(h.financiamento.params.entrada_pct);
      })
      .catch(() => setErro(true));
  }, []);

  const pv = valor != null && entrada != null ? valor * (1 - entrada / 100) : 0;

  const modalidades = useMemo<Modalidade[]>(() => {
    const p = data?.params;
    if (!p) return [];
    const cdc = pmt(pv, p.cdc.taxa_mes, p.cdc.meses);
    const leasing = pmt(pv, p.leasing.taxa_mes, p.leasing.meses);
    // N9: consórcio real tem taxa de administração sobre o valor financiado
    // (~18%); o payload velho não traz o campo — 18% é o correto de mercado.
    const taxaAdm = p.consorcio.taxa_adm ?? 0.18;
    const consorcioTotal = pv * (1 + taxaAdm);
    const consorcio = consorcioTotal / p.consorcio.meses;
    const assinatura = p.assinatura.mensalidade;
    const assinaturaMeses = p.assinatura.meses ?? 48;
    return [
      { nome: 'CDC', parcela: cdc, meses: p.cdc.meses, total: cdc * p.cdc.meses, nota: null, fixa: false },
      { nome: 'Leasing', parcela: leasing, meses: p.leasing.meses, total: leasing * p.leasing.meses, nota: null, fixa: false },
      {
        nome: 'Consórcio',
        parcela: consorcio,
        meses: p.consorcio.meses,
        total: consorcioTotal,
        nota: `inclui taxa de adm. ~${Math.round(taxaAdm * 100)}%`,
        fixa: false,
      },
      {
        nome: 'Assinatura',
        parcela: assinatura,
        meses: assinaturaMeses,
        total: assinatura * assinaturaMeses,
        nota: 'Sem entrada',
        fixa: true,
      },
    ];
  }, [data, pv]);

  // N9: "menor custo total" é disputado SÓ entre CDC, Leasing e Consórcio —
  // na assinatura você não fica com o carro, então ela não concorre.
  const disputa = modalidades.filter((m) => !m.fixa);
  const vencedor = disputa.length
    ? disputa.reduce((min, m) => (m.total < min.total ? m : min))
    : null;
  const maxTotal = modalidades.length ? Math.max(...modalidades.map((m) => m.total)) : 0;

  // Selo no vencedor real da disputa (muda conforme valor/entrada com a taxa adm).
  const selo = vencedor ? `${vencedor.nome}: menor custo total` : null;

  return (
    <Section id="financiamento" className="bg-surface-2">
      <SectionHeading
        eyebrow="FINANCIAMENTO"
        title="Simule as"
        highlight="4 modalidades"
        sub="CDC, Leasing, Consórcio e Assinatura numa simulação estimada (taxas de exemplo, não cotação de banco) — o menor custo total considera só os financiamentos, porque na assinatura você não fica com o carro."
      />

      {erro && !data ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Dados indisponíveis no momento
        </p>
      ) : (
      <div className="grid items-stretch gap-6 lg:grid-cols-[380px_1fr]">
        {/* Controles */}
        <Reveal>
          <div className="plate h-full rounded-sm border border-ink/10 p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-ink/12 bg-secondary/60 text-primary">
                <Car className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-medium">Simulação</p>
                <p className="text-sm text-muted-foreground">Ajuste e compare na hora</p>
              </div>
            </div>

            {valor != null && entrada != null && (
              <div className="space-y-7">
                <div>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm text-muted-foreground">Valor do carro</span>
                    <span className="font-display text-lg font-semibold text-primary">{brl(valor)}</span>
                  </div>
                  <Slider
                    className={sliderCls}
                    min={30000}
                    max={200000}
                    step={5000}
                    value={[valor]}
                    onValueChange={([v]) => setValor(v)}
                    label="Valor do carro"
                    valueText={`${brl(valor)} reais`}
                  />
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm text-muted-foreground">Entrada</span>
                    <span className="font-display text-lg font-semibold text-primary">{entrada}%</span>
                  </div>
                  <Slider
                    className={sliderCls}
                    min={0}
                    max={50}
                    step={5}
                    value={[entrada]}
                    onValueChange={([v]) => setEntrada(v)}
                    label="Entrada"
                    valueText={`Entrada de ${entrada}%`}
                  />
                </div>
              </div>
            )}

            <div className="mt-8 border border-ink/10 bg-secondary/40 p-4">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">Veículo financiado</p>
              <p className="mt-1 font-display text-xl font-semibold">{brl(pv)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Entrada: {brl(valor != null && entrada != null ? (valor * entrada) / 100 : 0)} · Financiado: {brl(pv)}
              </p>
            </div>

            <p className="mt-6 mb-1 inline-block rounded-sm border border-ink/12 bg-secondary/50 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {valor != null && entrada != null
                ? `${brl(valor)} · entrada ${entrada}%`
                : (data?.exemplo ?? 'Exemplo ilustrativo')}
              <span className="ml-2 normal-case tracking-normal">Exemplo ilustrativo</span>
            </p>
          </div>
        </Reveal>

        {/* Tabela ao vivo */}
        <Reveal delay={0.1}>
          <div className="plate h-full rounded-sm border border-ink/10 p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-display font-medium">Comparativo de modalidades</p>
              {selo && (
                <span className="rounded-sm bg-ink px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-foreground">
                  {selo}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {modalidades.map((m) => {
                const pct = maxTotal > 0 ? (m.total / maxTotal) * 100 : 0;
                const isVencedor = vencedor?.nome === m.nome;
                return (
                  <div
                    key={m.nome}
                    className={`rounded-sm border p-4 transition-colors duration-200 ${
                      isVencedor ? 'border-ink/40 bg-secondary/50' : 'border-ink/10 bg-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-display font-medium">
                        {m.nome}
                        {isVencedor && (
                          <span className="ml-2 rounded-sm bg-ink px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-foreground">
                            menor custo total
                          </span>
                        )}
                      </span>
                      <span className="font-display font-semibold">
                        {m.fixa ? '' : `${m.meses}x `}
                        {brl2(m.parcela)}
                        {m.fixa && <span className="text-sm text-muted-foreground">/mês</span>}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary md:h-2">
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                          isVencedor ? 'bg-ink' : 'bg-ink/20'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {m.fixa
                        ? `Total pago em ${m.meses} meses (sem posse do veículo): ${brl(m.total)}`
                        : `Total financiado: ${brl(m.total)}`}
                      {m.nota && <span> · {m.nota}</span>}
                      {m.fixa && (
                        <span className="block text-xs">Valor de referência (não varia com o carro)</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 mb-1 inline-block rounded-sm border border-ink/12 bg-secondary/50 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Exemplo ilustrativo
            </p>
          </div>
        </Reveal>
      </div>
      )}
    </Section>
  );
}
