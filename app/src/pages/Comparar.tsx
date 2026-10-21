// [Comparar] Comparação de 2 a 3 veículos do catálogo /api/veiculos — mobile-first, editorial claro.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';
import { api, brl, brl2, type Veiculo } from '@/lib/api';
import { Section } from '@/lib/ui';

const MAX_SLOTS = 3;
const DEBOUNCE_MS = 300;

// Seleção compartilhável via ?v=nome1|nome2 (nomes separados por "|").
const encodeSelecao = (vs: (Veiculo | null)[]) =>
  vs.filter(Boolean).map((v) => (v as Veiculo).nome).join('|');

export default function Comparar() {
  const [searchParams, setSearchParams] = useSearchParams();

  // slots: estado dos 3 espaços de seleção
  const [slots, setSlots] = useState<(Veiculo | null)[]>([null, null, null]);
  // termos de busca por slot
  const [termos, setTermos] = useState<string[]>(['', '', '']);
  // resultados do dropdown por slot
  const [resultados, setResultados] = useState<Veiculo[][]>([[], [], []]);
  const [aberto, setAberto] = useState<boolean[]>([false, false, false]);
  const [carregando, setCarregando] = useState<boolean[]>([false, false, false]);
  const [erro, setErro] = useState(false);
  const [hidratando, setHidratando] = useState(false);
  // Preço do litro p/ custo por km (default R$ 6,20 — gasolina comum, editável)
  const [precoLitro, setPrecoLitro] = useState('6,20');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Comparar — Volante';
  }, []);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAberto([false, false, false]);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const setSlot = useCallback(
    (i: number, v: Veiculo | null) => {
      setSlots((prev) => {
        const next = [...prev];
        next[i] = v;
        return next;
      });
      setTermos((prev) => {
        const next = [...prev];
        next[i] = '';
        return next;
      });
      setAberto((prev) => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    },
    [],
  );

  // Busca com debounce 300ms por slot
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    termos.forEach((termo, i) => {
      const q = termo.trim();
      if (!q) {
        setResultados((prev) => prev.map((r, j) => (j === i ? [] : r)));
        setCarregando((prev) => prev.map((c, j) => (j === i ? false : c)));
        return;
      }
      setCarregando((prev) => prev.map((c, j) => (j === i ? true : c)));
      timers.current.push(
        setTimeout(() => {
          let alive = true;
          api.veiculos({ q, limit: 8 })
            .then((res) => {
              if (!alive) return;
              setResultados((prev) => prev.map((r, j) => (j === i ? res.veiculos : r)));
              setCarregando((prev) => prev.map((c, j) => (j === i ? false : c)));
              setAberto((prev) => prev.map((a, j) => (j === i ? true : a)));
              setErro(false);
            })
            .catch(() => {
              if (!alive) return;
              setCarregando((prev) => prev.map((c, j) => (j === i ? false : c)));
              setErro(true);
            });
          alive = false;
        }, DEBOUNCE_MS),
      );
    });
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termos]);

  // Hidratação a partir de ?v=nome1|nome2 — resolve cada nome via busca (limit 1)
  useEffect(() => {
    const raw = searchParams.get('v');
    if (!raw) return;
    const nomes = raw.split('|').filter(Boolean).slice(0, MAX_SLOTS);
    if (nomes.length === 0) return;
    let alive = true;
    setHidratando(true);
    Promise.all(
      nomes.map((nome) =>
        api.veiculos({ q: nome, limit: 1 })
          .then((res) => res.veiculos[0] ?? null)
          .catch(() => null),
      ),
    ).then((vs) => {
      if (!alive) return;
      setSlots([vs[0] ?? null, vs[1] ?? null, vs[2] ?? null]);
      setHidratando(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém ?v= em sincronia com a seleção
  useEffect(() => {
    if (hidratando) return;
    const atual = searchParams.get('v') ?? '';
    const novo = encodeSelecao(slots);
    if (atual === novo) return;
    const next = new URLSearchParams(searchParams);
    if (novo) next.set('v', novo); else next.delete('v');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, hidratando]);

  const escolhidos = slots.filter(Boolean) as Veiculo[];
  const podeComparar = escolhidos.length >= 2;
  const menorPreco = podeComparar
    ? Math.min(...escolhidos.map((v) => v.preco ?? Number.POSITIVE_INFINITY))
    : null;

  // Custo por km: só com consumo real em km/L — elétrico/híbrido sem km/L fica "—" (honesto).
  const precoLitroNum = Number(precoLitro.replace(',', '.'));
  const precoValido = Number.isFinite(precoLitroNum) && precoLitroNum > 0;
  const custoPorKm = (v: Veiculo, campo: 'consumo_cidade' | 'consumo_estrada'): number | null => {
    const consumo = v[campo];
    if (consumo == null || consumo <= 0 || !precoValido) return null;
    return precoLitroNum / consumo;
  };
  const temConsumo = escolhidos.some((v) => v.consumo_cidade != null && v.consumo_cidade > 0);
  const custosCidade = escolhidos.map((v) => custoPorKm(v, 'consumo_cidade'));
  const menorCusto = temConsumo
    ? Math.min(...custosCidade.filter((c): c is number => c != null))
    : null;

  const limpar = () => {
    setSlots([null, null, null]);
    setTermos(['', '', '']);
    setResultados([[], [], []]);
    setAberto([false, false, false]);
  };

  const ficha = (v: Veiculo) => [
    { label: 'Marca', valor: v.marca },
    { label: 'Ano', valor: v.ano != null ? String(v.ano) : '—' },
    { label: 'Combustível', valor: v.combustivel ?? '—' },
    { label: 'Categoria', valor: v.categoria ?? '—' },
    { label: 'Código FIPE', valor: v.codigo_fipe ?? '—', small: true },
  ];

  return (
    <main>
      <Section className="py-10 md:py-16">
        {/* Cabeçalho */}
        <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
          Comparar veículos
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Escolha de 2 a 3 veículos do catálogo FIPE e veja preço, ano, combustível e categoria lado a lado.
        </p>

        {erro && (
          <p className="mt-6 text-sm text-muted-foreground" role="alert">
            Não foi possível falar com o catálogo. Tente novamente.
          </p>
        )}

        {/* Slots de seleção */}
        <div ref={rootRef} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((veiculo, i) => (
            <div key={i} className="plate relative rounded-sm border border-ink/10 p-4">
              <label
                htmlFor={`comparar-slot-${i}`}
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Veículo {i + 1}
              </label>

              {veiculo ? (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-medium leading-snug text-foreground">{veiculo.nome}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {veiculo.marca}
                      {veiculo.preco != null ? ` · ${brl(veiculo.preco)}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover ${veiculo.nome}`}
                    onClick={() => setSlot(i, null)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink/50 transition-colors hover:bg-ink/5 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                    <input
                      id={`comparar-slot-${i}`}
                      type="search"
                      value={termos[i]}
                      onChange={(e) =>
                        setTermos((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))
                      }
                      placeholder="Buscar modelo…"
                      autoComplete="off"
                      className="min-h-11 w-full rounded-sm border border-ink/20 bg-card py-3 pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {aberto[i] && (carregando[i] || resultados[i].length > 0) && (
                    <ul className="absolute inset-x-4 top-full z-20 mt-2 max-h-64 overflow-auto rounded-sm border border-ink/10 bg-card shadow-lg">
                      {carregando[i] && (
                        <li className="px-4 py-3 text-sm text-muted-foreground">Buscando…</li>
                      )}
                      {!carregando[i] &&
                        resultados[i].map((v) => (
                          <li key={v.id}>
                            <button
                              type="button"
                              onClick={() => setSlot(i, v)}
                              className="flex min-h-11 w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-ink/5"
                            >
                              <span className="text-sm font-medium text-foreground">{v.nome}</span>
                              <span className="text-xs text-muted-foreground">
                                {v.marca}
                                {v.preco != null ? ` · ${brl(v.preco)}` : ''}
                              </span>
                            </button>
                          </li>
                        ))}
                      {!carregando[i] && resultados[i].length === 0 && (
                        <li className="px-4 py-3 text-sm text-muted-foreground">Nenhum resultado.</li>
                      )}
                    </ul>
                  )}
                </>
              )}

              {!veiculo && !termos[i] && (
                <p className="mt-3 text-sm text-muted-foreground">Escolha um veículo</p>
              )}
            </div>
          ))}
        </div>

        {/* Controles */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={limpar}
            disabled={escolhidos.length === 0}
            className="min-h-11 rounded-sm bg-ink px-5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Limpar
          </button>
          <span className="text-sm text-muted-foreground">
            {escolhidos.length < 2
              ? `Selecione ${2 - escolhidos.length} mais para comparar`
              : `${escolhidos.length} veículos em comparação`}
          </span>
        </div>

        {/* Comparativo */}
        {podeComparar && (
          <>
            {/* Desktop: tabela */}
            <div className="mt-10 hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Comparativo de veículos selecionados</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-40 pb-4" />
                    {escolhidos.map((v) => (
                      <th key={v.id} scope="col" className="pb-4 pr-6 align-bottom">
                        <span className="block font-display text-xl font-medium leading-snug text-foreground">
                          {v.nome}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="border-t border-ink/10">
                  <tr className="border-b border-ink/10">
                    <th scope="row" className="py-4 pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Preço FIPE
                    </th>
                    {escolhidos.map((v) => {
                      const menor = v.preco != null && menorPreco != null && v.preco === menorPreco;
                      return (
                        <td key={v.id} className="py-4 pr-6 align-middle">
                          <span className="font-display text-2xl font-semibold text-primary">
                            {v.preco != null ? brl(v.preco) : '—'}
                          </span>
                          {menor && (
                            <span className="ml-2 inline-block rounded-sm bg-ink px-2 py-0.5 align-middle text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-foreground">
                              menor preço
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {(['Marca', 'Ano', 'Combustível', 'Categoria', 'Código FIPE'] as const).map((label) => (
                    <tr key={label} className="border-b border-ink/10">
                      <th scope="row" className="py-3 pr-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                      </th>
                      {escolhidos.map((v) => {
                        const linha = ficha(v).find((f) => f.label === label)!;
                        return (
                          <td
                            key={v.id}
                            className={`py-3 pr-6 text-foreground ${
                              linha.small ? 'text-xs uppercase tracking-[0.08em] text-muted-foreground' : 'text-sm'
                            }`}
                          >
                            {linha.valor}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards empilhados */}
            <ul className="mt-10 grid grid-cols-1 gap-4 sm:hidden">
              {escolhidos.map((v) => {
                const menor = v.preco != null && menorPreco != null && v.preco === menorPreco;
                return (
                  <li key={v.id} className="plate rounded-sm border border-ink/10 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-xl font-medium leading-snug text-foreground">{v.nome}</h2>
                      {menor && (
                        <span className="shrink-0 rounded-sm bg-ink px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-foreground">
                          menor preço
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-display text-2xl font-semibold text-primary">
                      {v.preco != null ? brl(v.preco) : '—'}
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4">
                      {ficha(v)
                        .filter((f) => !f.small)
                        .map((f) => (
                          <div key={f.label} className="flex items-baseline justify-between gap-4">
                            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              {f.label}
                            </dt>
                            <dd className="text-sm text-foreground">{f.valor}</dd>
                          </div>
                        ))}
                    </dl>
                    {v.codigo_fipe && (
                      <p className="mt-3 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                        FIPE {v.codigo_fipe}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Custo por km — aparece quando ao menos um selecionado tem consumo_cidade */}
            {temConsumo && (
              <div className="plate mt-6 rounded-sm border border-ink/10 p-5 sm:mt-6">
                <h3 className="font-display text-lg font-medium text-foreground">Custo por km</h3>
                <div className="mt-3 max-w-[12rem]">
                  <label
                    htmlFor="comparar-preco-litro"
                    className="mb-1 block text-sm font-medium text-foreground"
                  >
                    Preço do litro (R$)
                  </label>
                  <input
                    id="comparar-preco-litro"
                    type="text"
                    inputMode="decimal"
                    value={precoLitro}
                    onChange={(e) => setPrecoLitro(e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-ink/20 bg-card px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <ul className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                  {escolhidos.map((v, i) => {
                    const cidade = custosCidade[i];
                    const estrada = custoPorKm(v, 'consumo_estrada');
                    const economica = cidade != null && menorCusto != null && cidade === menorCusto;
                    return (
                      <li key={v.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-medium text-foreground">{v.nome}</span>
                        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          {economica && (
                            <span className="rounded-sm bg-ink px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-foreground">
                              mais econômico
                            </span>
                          )}
                          {cidade != null ? (
                            <span className="text-sm text-foreground">
                              cidade {brl2(cidade)}/km
                              {estrada != null && (
                                <span className="text-muted-foreground"> · estrada {brl2(estrada)}/km</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-foreground">
                              — <span className="text-xs text-muted-foreground">sem dado de consumo</span>
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Estado vazio */}
        {escolhidos.length === 0 && !hidratando && (
          <div className="mt-12 rounded-sm border border-dashed border-ink/20 p-8 text-center">
            <p className="font-display text-xl text-foreground">Comece escolhendo os veículos acima</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Busque pelo nome em pelo menos dois espaços — os preços vêm direto da tabela FIPE.
            </p>
          </div>
        )}
      </Section>
    </main>
  );
}
