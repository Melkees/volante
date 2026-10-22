// [B3] Busca — catálogo FIPE (~7.5k) via /api/veiculos server-side, mobile-first.
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import { api, brl, type Category, type Veiculo } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';
import { usePageMeta } from '@/lib/usePageMeta';

const PAGE = 24;
const DEBOUNCE_MS = 300;

const ANOS_MIN = [
  { value: '', label: 'Todos' },
  { value: '2027', label: '2027 (Zero-km)' },
  { value: '2025', label: '2025' },
  { value: '2020', label: '2020' },
  { value: '2015', label: '2015' },
  { value: '2010', label: '2010' },
];

const PRECOS_MAX = [
  { value: '', label: 'Todos' },
  { value: '40000', label: 'R$ 40k' },
  { value: '60000', label: 'R$ 60k' },
  { value: '80000', label: 'R$ 80k' },
  { value: '100000', label: 'R$ 100k' },
  { value: '150000', label: 'R$ 150k' },
  { value: '250000', label: 'R$ 250k' },
];

const COMBUSTIVEIS = ['Todas', 'Gasolina', 'Flex', 'Elétrico', 'Híbrido', 'Diesel'];

/** N10v: skeleton com o layout do card (imagem/meta/título/preço) — visual aria-hidden. */
function SkeletonGrid() {
  return (
    <div className="mt-8" aria-hidden="true">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="plate animate-pulse rounded-sm border border-ink/10 p-5">
            <div className="h-3 w-24 rounded-sm bg-ink/10" />
            <div className="mt-3 h-6 w-3/4 rounded-sm bg-ink/10" />
            <div className="mt-4 h-5 w-28 rounded-sm bg-ink/10" />
            <div className="mt-2 h-3 w-32 rounded-sm bg-ink/10" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Busca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qUrl = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const marcaUrl = searchParams.get('marca') ?? '';
  const anoMinUrl = searchParams.get('ano_min') ?? '';
  const precoMaxUrl = searchParams.get('preco_max') ?? '';
  const combustivelUrl = searchParams.get('combustivel') ?? '';

  const [termo, setTermo] = useState(qUrl);
  const [veiculos, setVeiculos] = useState<Veiculo[] | null>(null);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [marcas, setMarcas] = useState<{ marca: string; total: number }[]>([]);
  const [erro, setErro] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);

  usePageMeta({ title: 'Busca — Volante' });

  // Categorias e marcas (chips/filtro) — catálogo vem de /api/veiculos.
  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    api.marcas().then((r) => setMarcas(r.marcas)).catch(() => {});
  }, []);

  // ?q= da URL alimenta o input (e vice-versa via debounce abaixo).
  useEffect(() => setTermo(qUrl), [qUrl]);

  // Debounce do input → URL (?q=) — a busca de fato acontece server-side.
  useEffect(() => {
    const t = setTimeout(() => {
      const atual = searchParams.get('q') ?? '';
      const next = termo.trim();
      if (atual === next) return;
      const sp = new URLSearchParams(searchParams);
      if (next) sp.set('q', next); else sp.delete('q');
      setSearchParams(sp, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [termo, searchParams, setSearchParams]);

  const categoriaAtiva = categories.find((c) => c.slug === categorySlug) ?? null;

  const fetchPage = useCallback(
    (offset: number, append: boolean) => {
      if (append) setCarregandoMais(true); else setVeiculos(null);
      setErro(false);
      let alive = true;
      api.veiculos({
        q: qUrl || undefined,
        marca: marcaUrl || undefined,
        categoria: categoriaAtiva?.name,
        combustivel: combustivelUrl || undefined,
        ano_min: anoMinUrl ? Number(anoMinUrl) : undefined,
        preco_max: precoMaxUrl ? Number(precoMaxUrl) : undefined,
        limit: PAGE,
        offset,
      })
        .then((r) => {
          if (!alive) return;
          setTotal(r.total);
          setVeiculos((prev) => (append && prev ? [...prev, ...r.veiculos] : r.veiculos));
        })
        .catch(() => alive && setErro(true))
        .finally(() => alive && setCarregandoMais(false));
      return () => {
        alive = false;
      };
    },
    [qUrl, marcaUrl, categoriaAtiva, combustivelUrl, anoMinUrl, precoMaxUrl],
  );

  // Nova busca sempre que q/marca/categoria da URL mudam.
  useEffect(() => fetchPage(0, false), [fetchPage]);

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value); else sp.delete(key);
    setSearchParams(sp, { replace: true });
  };

  const filtrando = Boolean(qUrl || categorySlug || marcaUrl || anoMinUrl || precoMaxUrl || combustivelUrl);
  const temMais = veiculos != null && veiculos.length < total;

  return (
    <main>
      <Section className="py-10 md:py-16">
        {/* Cabeçalho + campo de busca */}
        <Reveal>
          <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
            Busca
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            {filtrando
              ? 'Resultados do catálogo para o que você procurou.'
              : 'Explore o catálogo do Volante — preços FIPE reais (tabela setembro/2026).'}
          </p>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              setParam('q', termo.trim());
            }}
          >
            <label htmlFor="busca-q" className="mb-2 block text-sm font-medium text-foreground">
              Buscar veículo
            </label>
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                id="busca-q"
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Ex.: Onix, Strada, Corolla…"
                className="min-h-11 w-full rounded-sm border border-ink/20 bg-card py-3 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </form>
        </Reveal>

        {/* Filtros: marca + chips de categoria — alvo de toque ≥44px */}
        <Reveal delay={0.05}>
          <div className="mt-6 flex flex-col gap-4">
            {marcas.length > 0 && (
              <div>
                <label htmlFor="busca-marca" className="mb-2 block text-sm font-medium text-foreground">
                  Marca
                </label>
                <select
                  id="busca-marca"
                  value={marcaUrl}
                  onChange={(e) => setParam('marca', e.target.value)}
                  className="min-h-11 w-full max-w-xs rounded-sm border border-ink/20 bg-card px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Todas as marcas</option>
                  {marcas.map((m) => (
                    <option key={m.marca} value={m.marca}>
                      {m.marca} ({m.total})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!categoriaAtiva}
                  onClick={() => setParam('category', '')}
                  className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                    !categoriaAtiva
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-ink/20 bg-card text-foreground hover:border-ink/40'
                  }`}
                >
                  Todas
                </button>
                {categories.map((c) => {
                  const ativo = categoriaAtiva?.slug === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => setParam('category', ativo ? '' : c.slug)}
                      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                        ativo
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-ink/20 bg-card text-foreground hover:border-ink/40'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Ano mínimo + Preço máximo + Combustível — segunda linha, wrap sem overflow */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
              <div>
                <label htmlFor="busca-ano" className="mb-2 block text-sm font-medium text-foreground">
                  Ano mínimo
                </label>
                <select
                  id="busca-ano"
                  aria-label="Ano mínimo"
                  value={anoMinUrl}
                  onChange={(e) => setParam('ano_min', e.target.value)}
                  className="min-h-11 w-full max-w-xs rounded-sm border border-ink/20 bg-card px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ANOS_MIN.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-sm font-medium text-foreground">Preço máximo</p>
                <div className="flex flex-wrap gap-2">
                  {PRECOS_MAX.map((p) => {
                    const ativo = precoMaxUrl === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setParam('preco_max', ativo ? '' : p.value)}
                        className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                          ativo
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-ink/20 bg-card text-foreground hover:border-ink/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-sm font-medium text-foreground">Combustível</p>
                <div className="flex flex-wrap gap-2">
                  {COMBUSTIVEIS.map((c) => {
                    const ativo = (combustivelUrl || 'Todas') === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setParam('combustivel', c === 'Todas' ? '' : c)}
                        className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                          ativo
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-ink/20 bg-card text-foreground hover:border-ink/40'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Contagem */}
        {veiculos && !erro && (
          <p className="mt-8 border-b border-ink/20 pb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground" role="status">
            {total === 1 ? '1 veículo encontrado' : `${total.toLocaleString('pt-BR')} veículos encontrados`}
          </p>
        )}

        {/* N10v: primeira carga/troca de filtro — skeleton em vez de tela solta */}
        {!erro && veiculos == null && (
          <>
            <SkeletonGrid />
            <span className="sr-only" role="status">
              Carregando resultados…
            </span>
          </>
        )}

        {/* Estados: erro, vazio, resultados */}
        {erro && (
          <p className="mt-10 text-base text-muted-foreground">Dados indisponíveis.</p>
        )}

        {!erro && veiculos && veiculos.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-foreground">Nenhum veículo encontrado</p>
            <p className="mt-2 text-sm text-muted-foreground">Tente outro termo ou limpe os filtros.</p>
          </div>
        )}

        {!erro && veiculos && veiculos.length > 0 && (
          <>
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {veiculos.map((v, i) => (
                <li key={v.id}>
                  <Reveal delay={Math.min((i % PAGE) * 0.04, 0.3)}>
                    <Link
                      to={`/veiculo/${v.id}`}
                      className="plate card-hover block h-full min-h-11 rounded-sm border border-ink/10 p-5 transition-colors hover:border-ink/40"
                      aria-label={`Ver detalhes de ${v.nome}`}
                    >
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {v.marca}
                        {v.categoria ? ` · ${v.categoria}` : v.ano != null ? ` · ${v.ano}` : ''}
                      </p>
                      <h2 className="mt-2 font-display text-xl font-medium text-foreground">{v.nome}</h2>
                      <p className="mt-3 font-display text-lg font-semibold text-primary">
                        {v.preco != null ? brl(v.preco) : '—'}
                      </p>
                      {v.preco == null ? (
                        <p className="mt-1 text-xs text-muted-foreground">preço FIPE em breve</p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[v.ano, v.combustivel, v.codigo_fipe].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>

            {temMais && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  disabled={carregandoMais}
                  onClick={() => fetchPage(veiculos.length, true)}
                  className="min-h-11 rounded-full border border-ink/20 bg-card px-6 text-sm font-medium text-foreground transition-colors hover:border-ink/40 disabled:opacity-50"
                >
                  {carregandoMais ? 'Carregando…' : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </Section>
    </main>
  );
}
