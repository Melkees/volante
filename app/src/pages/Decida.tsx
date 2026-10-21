// [B?] Decida com IA — questionário em 4 passos + recomendação por heurística
// local sobre /api/veiculos. Não é IA de verdade: o selo e o rodapé deixam claro.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { api, brl, type Veiculo } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';
import { Slider } from '@/components/ui/slider';

const ORCAMENTO_MIN = 30_000;
const ORCAMENTO_MAX = 250_000;
const ORCAMENTO_STEP = 5_000;
const ANO_MIN = 2005;
const ANO_MAX = 2027; // 2027 = zero-km

const CATEGORIAS = ['Todas', 'Hatch', 'SUV', 'Sedan', 'Pickup'] as const;
const COMBUSTIVEIS = ['Todas', 'Gasolina', 'Flex', 'Elétrico', 'Híbrido', 'Diesel'] as const;

type Estado = 'quiz' | 'carregando' | 'resultado' | 'vazio' | 'erro' | 'sem-creditos';

const chipCls = (ativo: boolean) =>
  `min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
    ativo
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-ink/20 bg-card text-foreground hover:border-ink/40'
  }`;

const sliderCls =
  'py-2 [&_[data-slot=slider-thumb]]:size-7 md:[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-ink';

export default function Decida() {
  const [passo, setPasso] = useState(0); // 0..3 = perguntas, 4 = resumo
  const [orcamento, setOrcamento] = useState(80_000);
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>('Todas');
  const [combustivel, setCombustivel] = useState<(typeof COMBUSTIVEIS)[number]>('Todas');
  const [anoMinimo, setAnoMinimo] = useState(2015);

  const [estado, setEstado] = useState<Estado>('quiz');
  const [top, setTop] = useState<Veiculo[]>([]);
  const [total, setTotal] = useState(0);
  const [creditos, setCreditos] = useState<number | null>(null);
  const [erroIA, setErroIA] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Decida com IA — Volante';
  }, []);

  const gerar = () => {
    setEstado('carregando');
    setErroIA(null);
    let alive = true;
    // 1 crédito de IA antes de qualquer resultado (20 logado · 1 grátis anônimo).
    api
      .gerarIA()
      .then((r) => {
        if (!alive) return;
        setCreditos(r.creditos ?? null);
        return api
          .veiculos({
            categoria: categoria !== 'Todas' ? categoria : undefined,
            combustivel: combustivel !== 'Todas' ? combustivel : undefined,
            ano_min: anoMinimo,
            preco_max: orcamento,
            limit: 100,
          })
          .then((res) => {
            if (!alive) return;
            setTotal(res.total);
            const ordenados = [...res.veiculos]
              .filter((v) => v.preco != null && v.preco <= orcamento)
              .sort((a, b) => {
                // (a) aproveita melhor o orçamento sem estourar
                const difA = orcamento - (a.preco as number);
                const difB = orcamento - (b.preco as number);
                if (difA !== difB) return difA - difB;
                // (b) com categoria declarada na FIPE tem prioridade
                const catA = a.categoria ? 0 : 1;
                const catB = b.categoria ? 0 : 1;
                if (catA !== catB) return catA - catB;
                // (c) ano mais novo por último
                return (b.ano ?? 0) - (a.ano ?? 0);
              })
              .slice(0, 3);
            if (ordenados.length === 0) {
              setEstado('vazio');
            } else {
              setTop(ordenados);
              setEstado('resultado');
            }
          });
      })
      .catch((err: Error) => {
        if (!alive) return;
        setErroIA(err.message);
        setEstado('sem-creditos');
      });
    return () => {
      alive = false;
    };
  };

  const resumo = useMemo(
    () => [
      { rotulo: 'Orçamento máximo', valor: brl(orcamento) },
      { rotulo: 'Categoria', valor: categoria },
      { rotulo: 'Combustível', valor: combustivel },
      {
        rotulo: 'Ano mínimo',
        valor: anoMinimo >= ANO_MAX ? `${ANO_MAX} (zero-km)` : String(anoMinimo),
      },
    ],
    [orcamento, categoria, combustivel, anoMinimo],
  );

  const chipsMotivos = (v: Veiculo) => {
    const motivos: string[] = ['dentro do orçamento'];
    if (v.categoria) motivos.push(v.categoria);
    if (v.ano != null) motivos.push(v.ano >= ANO_MAX ? 'zero-km' : String(v.ano));
    if (v.combustivel) motivos.push(v.combustivel.toLowerCase());
    return motivos;
  };

  return (
    <main>
      <Section className="py-10 md:py-16">
        {/* Cabeçalho */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-card px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Heurística local — não é IA de verdade
          </span>
          <h1 className="mt-4 font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
            Decida com <em className="font-medium italic text-primary">IA</em>
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Quatro perguntas rápidas e um ranking honesto, montado na hora sobre a tabela FIPE de
            set/2026. Sem cadastro, sem servidor de IA — só heurística local.
          </p>
        </Reveal>

        {/* Passo a passo */}
        {estado === 'quiz' && (
          <Reveal delay={0.05}>
            <div className="mt-10 max-w-xl">
              {/* progresso */}
              <ol className="flex items-center gap-2" aria-label={`Passo ${passo + 1} de 4`}>
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    aria-current={i === passo ? 'step' : undefined}
                    className={`h-1 flex-1 rounded-full ${i <= passo ? 'bg-primary' : 'bg-ink/15'}`}
                  />
                ))}
              </ol>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Passo {passo + 1} de 4
              </p>

              {/* Pergunta 1 — orçamento */}
              {passo === 0 && (
                <div className="mt-6">
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Quanto você quer gastar, no máximo?
                  </h2>
                  <p className="mt-2 font-display text-4xl font-semibold text-primary">
                    {brl(orcamento)}
                  </p>
                  <div className="mt-6">
                    <Slider
                      className={sliderCls}
                      min={ORCAMENTO_MIN}
                      max={ORCAMENTO_MAX}
                      step={ORCAMENTO_STEP}
                      value={[orcamento]}
                      onValueChange={([v]) => setOrcamento(v)}
                      label="Orçamento máximo"
                      valueText={`Orçamento máximo de ${brl(orcamento)}`}
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{brl(ORCAMENTO_MIN)}</span>
                      <span>{brl(ORCAMENTO_MAX)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pergunta 2 — categoria */}
              {passo === 1 && (
                <div className="mt-6">
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Qual categoria você prefere?
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {CATEGORIAS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={categoria === c}
                        onClick={() => setCategoria(c)}
                        className={chipCls(categoria === c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    A maioria do catálogo FIPE não tem categoria — “Todas” busca tudo.
                  </p>
                </div>
              )}

              {/* Pergunta 3 — combustível */}
              {passo === 2 && (
                <div className="mt-6">
                  <h2 className="font-display text-xl font-medium text-foreground">
                    E o combustível?
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {COMBUSTIVEIS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={combustivel === c}
                        onClick={() => setCombustivel(c)}
                        className={chipCls(combustivel === c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pergunta 4 — ano mínimo */}
              {passo === 3 && (
                <div className="mt-6">
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Qual o ano mais antigo que você aceita?
                  </h2>
                  <p className="mt-2 font-display text-4xl font-semibold text-primary">
                    {anoMinimo >= ANO_MAX ? 'Zero-km' : anoMinimo}
                  </p>
                  <div className="mt-6">
                    <Slider
                      className={sliderCls}
                      min={ANO_MIN}
                      max={ANO_MAX}
                      step={1}
                      value={[anoMinimo]}
                      onValueChange={([v]) => setAnoMinimo(v)}
                      label="Ano mínimo"
                      valueText={
                        anoMinimo >= ANO_MAX
                          ? 'Aceita zero-quilômetro'
                          : `Ano mínimo de ${anoMinimo}`
                      }
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{ANO_MIN}</span>
                      <span>{ANO_MAX} · zero-km</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navegação */}
              <div className="mt-8 flex items-center gap-3">
                {passo > 0 && (
                  <button
                    type="button"
                    onClick={() => setPasso((p) => p - 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/20 bg-card px-4 text-sm font-medium text-foreground hover:border-ink/40"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
                  </button>
                )}
                {passo < 3 && (
                  <button
                    type="button"
                    onClick={() => setPasso((p) => p + 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-ink px-5 text-sm font-medium text-background hover:opacity-90"
                  >
                    Avançar <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>

              {/* Resumo antes de gerar */}
              {passo === 3 && (
                <div className="mt-8 rounded-sm border border-ink/10 bg-card p-5">
                  <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Resumo
                  </h3>
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {resumo.map((r) => (
                      <div key={r.rotulo} className="flex items-baseline justify-between gap-3">
                        <dt className="text-sm text-muted-foreground">{r.rotulo}</dt>
                        <dd className="text-sm font-medium text-foreground">{r.valor}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={gerar}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-ink px-5 text-sm font-medium text-background hover:opacity-90 sm:w-auto"
                  >
                    <Wand2 className="h-4 w-4" aria-hidden /> Ver recomendações
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* Carregando */}
        {estado === 'carregando' && (
          <p className="mt-10 text-base text-muted-foreground" role="status" aria-live="polite">
            Cruzando a tabela FIPE com suas respostas…
          </p>
        )}

        {/* Erro */}
        {estado === 'erro' && (
          <p className="mt-10 text-base text-muted-foreground">Dados indisponíveis.</p>
        )}

        {/* Créditos/grátis esgotados — erro do servidor em bloco plate com CTA */}
        {estado === 'sem-creditos' && (
          <div className="plate mt-10 max-w-xl rounded-sm border border-ink/10 bg-card p-6">
            <p role="alert" className="text-base text-foreground">
              {erroIA ?? 'Seus créditos de IA acabaram.'}
            </p>
            <Link
              to="/users/sign_up"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-6 text-sm font-medium text-background hover:opacity-90"
            >
              Criar conta
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Contas criam 20 recomendações de IA por mês.
            </p>
          </div>
        )}

        {/* Vazio */}
        {estado === 'vazio' && (
          <div className="mt-10 max-w-xl">
            <h2 className="font-display text-xl font-medium text-foreground">
              Nenhum veículo com esses filtros
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Aumente o orçamento ou o ano mínimo para ver recomendações.
            </p>
            <button
              type="button"
              onClick={() => {
                setTop([]);
                setEstado('quiz');
                setPasso(0);
              }}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-sm bg-ink px-5 text-sm font-medium text-background hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Ajustar respostas
            </button>
          </div>
        )}

        {/* Resultado */}
        {estado === 'resultado' && (
          <Reveal className="mt-10">
            <p
              className="border-b border-ink/20 pb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground"
              role="status"
            >
              Top 3 para {brl(orcamento)}
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {top.map((v, i) => (
                <li key={v.id}>
                  <Reveal delay={Math.min(i * 0.05, 0.25)}>
                    <article className="plate h-full rounded-sm border border-ink/10 p-5">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {v.marca}
                      </p>
                      <h2 className="mt-2 font-display text-xl font-medium text-foreground">
                        {v.nome}
                      </h2>
                      <p className="mt-3 font-display text-2xl font-semibold text-primary">
                        {v.preco != null ? brl(v.preco) : '—'}
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {chipsMotivos(v).map((m) => (
                          <li
                            key={m}
                            className="rounded-full border border-ink/15 bg-background px-3 py-1 text-xs text-muted-foreground"
                          >
                            {m}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-ink/10 pt-5">
              <p className="max-w-xl text-sm text-muted-foreground">
                Heurística local sobre a tabela FIPE de set/2026 — exemplo ilustrativo, não
                recomendação personalizada de verdade.
                {creditos != null && (
                  <span className="ml-2 inline-block rounded-full border border-ink/15 bg-background px-3 py-0.5 text-xs text-muted-foreground">
                    créditos de IA: {creditos}
                  </span>
                )}
              </p>
              <Link
                to={`/busca?q=${encodeURIComponent(v2q(top[0]))}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
              >
                Ver {total.toLocaleString('pt-BR')} no catálogo →
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                setTop([]);
                setEstado('quiz');
                setPasso(0);
              }}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm border border-ink/20 bg-card px-4 text-sm font-medium text-foreground hover:border-ink/40"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Refazer perguntas
            </button>
          </Reveal>
        )}
      </Section>
    </main>
  );
}

/** Termo de busca do catálogo a partir do primeiro recomendado (marca + nome). */
function v2q(v: Veiculo | undefined): string {
  if (!v) return '';
  return `${v.marca} ${v.nome}`.trim();
}
