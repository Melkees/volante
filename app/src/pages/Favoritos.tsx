// [B?] Favoritos — exige sessão (api.me); lista com remover (desfavoritar).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { X } from 'lucide-react';
import { api, brl, type User, type Veiculo } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';
import { usePageMeta } from '@/lib/usePageMeta';

export default function Favoritos() {
  const [user, setUser] = useState<User | null>(null);
  const [pronto, setPronto] = useState(false);
  const [favoritos, setFavoritos] = useState<Veiculo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [removendo, setRemovendo] = useState<number | null>(null);

  usePageMeta({ title: 'Favoritos — Volante', canonical: '/favoritos' });

  const carregar = () => {
    setErro(false);
    let alive = true;
    api
      .me()
      .then((r) => {
        if (!alive) return;
        setUser(r.user);
        setPronto(true);
        if (r.user) {
          api
            .favoritos()
            .then((f) => alive && setFavoritos(f.favoritos))
            .catch(() => alive && setErro(true));
        }
      })
      .catch(() => {
        if (alive) {
          setPronto(true);
          setErro(true);
        }
      });
    return () => {
      alive = false;
    };
  };

  useEffect(() => carregar(), []);

  const remover = (id: number) => {
    setRemovendo(id);
    setErro(false);
    api
      .desfavoritar(id)
      .then(() => setFavoritos((prev) => (prev ? prev.filter((v) => v.id !== id) : prev)))
      .catch(() => setErro(true))
      .finally(() => setRemovendo(null));
  };

  return (
    <main>
      <Section className="py-10 md:py-16">
        <Reveal>
          <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
            Favoritos
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Os carros que você marcou para decidir depois.
          </p>
        </Reveal>

        {/* Aguardando sessão — nada a mostrar ainda */}
        {!pronto && <p className="mt-10 text-base text-muted-foreground">Carregando…</p>}

        {/* Sem sessão */}
        {pronto && !user && (
          <div className="mt-10 max-w-md rounded-sm border border-ink/10 bg-card p-6 text-center">
            <p className="font-display text-xl text-foreground">
              Entre para salvar seus carros favoritos
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua lista fica vinculada à sua conta.
            </p>
            <Link
              to="/users/sign_in"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-6 text-sm font-medium text-background hover:opacity-90"
            >
              Entrar
            </Link>
          </div>
        )}

        {erro && (
          <div className="mt-8 max-w-md">
            <p role="alert" className="rounded-sm border border-ink/15 bg-card px-4 py-3 text-sm text-foreground">
              Não foi possível carregar seus favoritos agora.
            </p>
            <button
              type="button"
              onClick={carregar}
              className="mt-4 inline-flex min-h-11 items-center rounded-sm bg-ink px-5 text-sm font-medium text-background hover:opacity-90"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {/* Com sessão */}
        {pronto && user && favoritos && favoritos.length === 0 && (
          <div className="mt-10">
            <p className="font-display text-xl text-foreground">Nenhum favorito ainda</p>
            <p className="mt-2 text-base text-muted-foreground">busque e salve</p>
            <Link
              to="/busca"
              className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-ink px-6 text-sm font-medium text-background hover:opacity-90"
            >
              Ir para a busca
            </Link>
          </div>
        )}

        {pronto && user && favoritos && favoritos.length > 0 && (
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoritos.map((v, i) => (
              <li key={v.id}>
                <Reveal delay={Math.min(i * 0.04, 0.3)}>
                  <div className="plate relative block h-full rounded-sm border border-ink/10 p-5">
                    <Link
                      to={`/veiculo/${v.id}`}
                      className="block"
                      aria-label={`Ver detalhes de ${v.nome}`}
                    >
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {v.marca}
                      </p>
                      <h2 className="mt-2 font-display text-xl font-medium text-foreground">{v.nome}</h2>
                      <p className="mt-3 font-display text-lg font-semibold text-primary">
                        {v.preco != null ? brl(v.preco) : '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[v.ano, v.combustivel].filter(Boolean).join(' · ')}
                      </p>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Remover ${v.nome} dos favoritos`}
                      disabled={removendo === v.id}
                      onClick={() => remover(v.id)}
                      className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
