// [B4] Veiculo — detalhe editorial mobile-first: FIPE, chips, sparkline SVG puro.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Heart } from 'lucide-react';
import { api, brl, brl2, type HistoricoPonto, type VeiculoDetalhe } from '@/lib/api';
import { Section } from '@/lib/ui';

const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function mesCurto(mes: string): string {
  const [ano, m] = mes.split('-');
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return mes;
  return `${MESES_PT[idx]} ${ano.slice(2)}`;
}

function Sparkline({ historico }: { historico: HistoricoPonto[] }) {
  if (historico.length < 2) return null;

  const W = 560;
  const H = 140;
  const PAD_X = 8;
  const PAD_Y = 18;

  const precos = historico.map((h) => h.preco);
  const min = Math.min(...precos);
  const max = Math.max(...precos);
  const span = max - min || 1;

  const pts = historico.map((h, i) => {
    const x = PAD_X + (i / (historico.length - 1)) * (W - PAD_X * 2);
    const y = H - PAD_Y - ((h.preco - min) / span) * (H - PAD_Y * 2);
    return { x, y, preco: h.preco, mes: h.mes };
  });

  const pontos = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const primeiro = pts[0];
  const ultimo = pts[pts.length - 1];
  const pMin = pts.find((p) => p.preco === min)!;
  const pMax = pts.find((p) => p.preco === max)!;
  const variacao = ((ultimo.preco - primeiro.preco) / primeiro.preco) * 100;
  const sobe = variacao >= 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Histórico de preços</p>
        <p className="font-display text-sm font-medium text-foreground" aria-label="Variação desde o primeiro mês">
          {sobe ? '↑' : '↓'} {Math.abs(variacao).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Evolução do preço de ${mesCurto(primeiro.mes)} a ${mesCurto(ultimo.mes)}`}
        preserveAspectRatio="none"
      >
        <polyline
          points={pontos}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-primary"
        />
        {pts.map((p) => (
          <circle key={p.mes} cx={p.x} cy={p.y} r="2.5" className="fill-primary" />
        ))}
        <text
          x={Math.min(Math.max(pMin.x, 24), W - 24)}
          y={Math.min(pMin.y + 14, H - 4)}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          {brl(min)}
        </text>
        <text
          x={Math.min(Math.max(pMax.x, 24), W - 24)}
          y={Math.max(pMax.y - 6, 12)}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          {brl(max)}
        </text>
      </svg>
      <div className="mt-1 flex justify-between text-xs uppercase tracking-[0.15em] text-muted-foreground">
        <span>{mesCurto(primeiro.mes)}</span>
        <span>{mesCurto(ultimo.mes)}</span>
      </div>
    </div>
  );
}

export default function Veiculo() {
  const { id } = useParams<{ id: string }>();
  const [dados, setDados] = useState<VeiculoDetalhe | null>(null);
  const [erro, setErro] = useState(false);
  // Preço do litro p/ custo estimado por km (default R$ 6,20 — gasolina comum, editável)
  const [precoLitro, setPrecoLitro] = useState('6,20');

  useEffect(() => {
    let alive = true;
    setDados(null);
    setErro(false);
    api.veiculoDetalhe(id ?? '')
      .then((r) => alive && setDados(r))
      .catch(() => alive && setErro(true));
    return () => {
      alive = false;
    };
  }, [id]);

  const [sessao, setSessao] = useState<{ logado: boolean; favorito: boolean }>({ logado: false, favorito: false });

  useEffect(() => {
    let vivo = true;
    api
      .me()
      .then(({ user }) => {
        if (!vivo || !user) return;
        return api.favoritos().then((f) => {
          if (vivo) setSessao({ logado: true, favorito: f.favoritos.some((v) => String(v.id) === String(id)) });
        });
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [id]);

  const alternarFavorito = async () => {
    const vid = Number(id);
    try {
      if (sessao.favorito) {
        await api.desfavoritar(vid);
        setSessao((s) => ({ ...s, favorito: false }));
      } else {
        await api.favoritar(vid);
        setSessao((s) => ({ ...s, favorito: true }));
      }
    } catch {
      /* mantém estado atual */
    }
  };

  useEffect(() => {
    document.title = dados ? `${dados.veiculo.nome} — Volante` : 'Veículo — Volante';
  }, [dados]);

  if (erro) {
    return (
      <main>
        <Section className="py-16 text-center">
          <h1 className="font-display text-2xl font-medium text-foreground">Veículo não encontrado</h1>
          <p className="mt-3 text-base text-muted-foreground">
            O veículo que você procura saiu do catálogo ou nunca existiu.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-11 items-center rounded-sm bg-ink px-6 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            Voltar à home
          </Link>
        </Section>
      </main>
    );
  }

  if (!dados) {
    return (
      <main>
        <Section className="py-16">
          <p className="text-base text-muted-foreground" role="status">
            Carregando…
          </p>
        </Section>
      </main>
    );
  }

  const { veiculo, historico } = dados;
  const compararUrl = `/comparar?v=${encodeURIComponent(veiculo.nome)}`;

  return (
    <main>
      <Section className="py-10 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Trilha de navegação" className="text-sm text-muted-foreground">
          <Link to="/busca" className="underline-offset-4 hover:underline">
            Busca
          </Link>
          <span aria-hidden className="mx-2">
            ›
          </span>
          <span>{veiculo.marca}</span>
        </nav>

        {/* Nome + chips */}
        <h1 className="mt-4 font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
          {veiculo.nome}
        </h1>
        <ul className="mt-4 flex flex-wrap gap-2">
          {[veiculo.marca, veiculo.categoria, veiculo.ano != null ? String(veiculo.ano) : null, veiculo.combustivel]
            .filter(Boolean)
            .map((chip) => (
              <li
                key={chip}
                className="min-h-11 rounded-full border border-ink/10 bg-card px-4 py-2.5 text-sm font-medium text-foreground"
              >
                {chip}
              </li>
            ))}
        </ul>

        {/* Preço FIPE */}
        <div className="plate mt-8 rounded-sm border border-ink/10 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preço FIPE · tabela set/2026</p>
          <p className="mt-2 font-display text-4xl font-semibold text-primary md:text-5xl">
            {veiculo.preco != null ? brl(veiculo.preco) : '—'}
          </p>
          {veiculo.preco == null && (
            <p className="mt-1 text-xs text-muted-foreground">preço FIPE em breve</p>
          )}
          {veiculo.codigo_fipe && (
            <p className="mt-2 text-sm uppercase tracking-[0.12em] text-muted-foreground">
              FIPE {veiculo.codigo_fipe}
            </p>
          )}
        </div>

        {/* Histórico (sparkline) — escondido quando vazio */}
        {historico.length >= 2 && (
          <div className="plate mt-6 rounded-sm border border-ink/10 p-6 text-foreground">
            <Sparkline historico={historico} />
          </div>
        )}

        {/* Custo estimado por km — só quando há consumo real em km/L */}
        {veiculo.consumo_cidade != null && veiculo.consumo_cidade > 0 && (
          <div className="plate mt-6 rounded-sm border border-ink/10 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Custo estimado por km
              </p>
              <div>
                <label
                  htmlFor="veiculo-preco-litro"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Preço do litro (R$)
                </label>
                <input
                  id="veiculo-preco-litro"
                  type="text"
                  inputMode="decimal"
                  value={precoLitro}
                  onChange={(e) => setPrecoLitro(e.target.value)}
                  className="min-h-11 w-36 rounded-sm border border-ink/20 bg-card px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            {(() => {
              const preco = Number(precoLitro.replace(',', '.'));
              if (!Number.isFinite(preco) || preco <= 0) return null;
              const estrada =
                veiculo.consumo_estrada != null && veiculo.consumo_estrada > 0
                  ? preco / veiculo.consumo_estrada
                  : null;
              const autonomia =
                estrada != null && veiculo.tanque != null && veiculo.tanque > 0
                  ? veiculo.tanque * veiculo.consumo_estrada!
                  : null;
              return (
                <>
                  <p className="mt-4 font-display text-2xl font-semibold text-foreground">
                    {brl2(preco / veiculo.consumo_cidade)}/km{' '}
                    <span className="text-sm font-normal text-muted-foreground">cidade</span>
                    {estrada != null && (
                      <>
                        {' · '}
                        {brl2(estrada)}/km{' '}
                        <span className="text-sm font-normal text-muted-foreground">estrada</span>
                      </>
                    )}
                  </p>
                  {autonomia != null && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Autonomia estimada: ~{Math.round(autonomia).toLocaleString('pt-BR')} km estrada
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estimativa simples: preço do litro ÷ consumo informado. Não inclui IPVA, seguro
                    nem manutenção.
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to={compararUrl}
            className="inline-flex min-h-11 items-center rounded-sm bg-ink px-6 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            Comparar
          </Link>
          {sessao.logado ? (
            <button
              type="button"
              onClick={alternarFavorito}
              aria-pressed={sessao.favorito}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-6 text-sm font-medium transition-colors ${
                sessao.favorito
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-ink/20 bg-card text-foreground hover:border-ink/40'
              }`}
            >
              <Heart className="h-4 w-4" fill={sessao.favorito ? 'currentColor' : 'none'} />
              {sessao.favorito ? 'Nos favoritos' : 'Favoritar'}
            </button>
          ) : (
            <Link
              to="/users/sign_in"
              title="Entre para favoritar"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 bg-card px-6 text-sm font-medium text-foreground transition-colors hover:border-ink/40"
            >
              <Heart className="h-4 w-4" />
              Favoritar
            </Link>
          )}
          <Link
            to="/busca"
            className="inline-flex min-h-11 items-center rounded-full border border-ink/20 bg-card px-6 text-sm font-medium text-foreground transition-colors hover:border-ink/40"
          >
            Voltar à busca
          </Link>
        </div>
      </Section>
    </main>
  );
}
