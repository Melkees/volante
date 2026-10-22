// Navbar editorial do Volante — barra porcelana com hairline.
// v3: dropdown Parceiros saiu do menu (as páginas de concessionárias/seguros/
// vistorias estão "em formação" e passavam insegurança); "Seja um Parceiro"
// continua no rodapé e no painel mobile.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Menu, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/Brand';
import { api, type User } from '@/lib/api';

const LINKS = [
  { label: 'Buscar', href: '/busca' },
  { label: 'Comparar', href: '/comparar' },
  { label: 'Decida', href: '/decida' },
  { label: 'Financiamento', href: '/financiamento' },
  { label: 'Calculadora', href: '/calculadora' },
  { label: 'Rankings', href: '/rankings' },
];

const linkCls =
  'whitespace-nowrap rounded-sm px-2.5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors duration-200 hover:text-foreground';

/** Primeiro nome para exibição compacta. */
function nomeCurto(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sessaoPronta, setSessaoPronta] = useState(false);

  // Sessão no mount + sempre que login/logout anuncia via evento 'volante:sessao'
  // (o login navega via SPA; sem isso a navbar ficaria com estado velho).
  useEffect(() => {
    let alive = true;
    const carregar = () => {
      api
        .me()
        .then((r) => {
          if (!alive) return;
          setUser(r.user);
          setSessaoPronta(true);
        })
        .catch(() => alive && setSessaoPronta(true));
    };
    carregar();
    window.addEventListener('volante:sessao', carregar);
    return () => {
      alive = false;
      window.removeEventListener('volante:sessao', carregar);
    };
  }, []);

  const sair = () => {
    api
      .signOut()
      .then(() => {
        setUser(null);
        window.dispatchEvent(new CustomEvent('volante:sessao'));
      })
      .catch(() => {});
    setOpen(false);
  };

  // Trava o scroll da página enquanto o painel mobile está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-[51] border-b border-ink/10 bg-background/92 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        <Link to="/" aria-label="Volante — página inicial" className="inline-flex shrink-0 items-center py-2.5">
          <Brand />
        </Link>

        {/* Links desktop */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link to={l.href} className={linkCls}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Abrir busca global"
            onClick={() => window.dispatchEvent(new CustomEvent('volante:open-search'))}
            className="hidden h-9 items-center gap-2 rounded-sm border border-ink/15 bg-card px-2.5 text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground sm:inline-flex"
          >
            <Search className="h-4 w-4" />
            <kbd className="rounded-xs border border-ink/15 bg-secondary px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
              /
            </kbd>
          </button>

          {/* Ações de sessão — skeleton sutil até a resposta de /api/me */}
          {!sessaoPronta ? (
            <div className="hidden items-center gap-2 md:flex" aria-hidden>
              <div className="h-9 w-20 animate-pulse rounded-sm bg-ink/5" />
              <div className="h-9 w-24 animate-pulse rounded-sm bg-ink/5" />
            </div>
          ) : user ? (
            <>
              <span className="hidden max-w-[10ch] truncate text-sm font-medium text-foreground md:inline">
                {nomeCurto(user.nome)}
              </span>
              <Button asChild variant="ghost" className="hidden rounded-sm text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex">
                <Link to="/favoritos">Favoritos</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={sair}
                className="hidden rounded-sm text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex"
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden rounded-sm text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex">
                <Link to="/users/sign_in">Entrar</Link>
              </Button>
              <Button asChild className="hidden rounded-sm bg-ink font-semibold text-ink-foreground shadow-none transition-colors duration-200 hover:bg-ink/85 md:inline-flex">
                <Link to="/users/sign_up">Criar conta</Link>
              </Button>
            </>
          )}

          {/* Hamburguer mobile */}
          <button
            type="button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-ink/15 bg-card text-foreground transition-colors duration-200 hover:border-primary/50 lg:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>

      {/* Scrim mobile — escurece o resto da página (header fica acima, sem escurecer); clique fora fecha */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-x-0 bottom-0 top-16 z-50 bg-ink/40 lg:hidden"
        />
      )}

      {/* Painel mobile — porcelana sólida */}
      {open && (
        <div className="relative z-50 mx-auto max-w-7xl border-b border-ink/10 bg-background px-4 pb-4 shadow-[0_20px_48px_-24px_rgba(30,28,26,0.4)] lg:hidden md:px-8">
          {/* Busca no topo do painel */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent('volante:open-search'));
            }}
            className="mb-2 flex h-12 w-full items-center gap-3 rounded-sm border border-ink/15 bg-card px-4 text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground"
          >
            <Search className="h-4.5 w-4.5 shrink-0" />
            <span className="flex-1 text-left">Buscar no Volante</span>
          </button>
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-ink/5 px-3 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/parceiros"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Seja um Parceiro
              </Link>
            </li>
          </ul>
          <div className="mt-3 flex gap-2 border-t border-ink/10 pt-3">
            {sessaoPronta && user ? (
              <>
                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="truncate px-1 text-sm font-medium text-foreground">
                    {nomeCurto(user.nome)}
                  </span>
                  <Button asChild variant="ghost" className="mt-2 rounded-sm text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <Link to="/favoritos" onClick={() => setOpen(false)}>Favoritos</Link>
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={sair}
                  className="flex-1 rounded-sm border-ink/20 bg-transparent text-sm hover:bg-secondary"
                >
                  Sair
                </Button>
              </>
            ) : sessaoPronta ? (
              <>
                <Button asChild variant="outline" className="flex-1 rounded-sm border-ink/20 bg-transparent text-sm hover:bg-secondary">
                  <Link to="/users/sign_in" onClick={() => setOpen(false)}>Entrar</Link>
                </Button>
                <Button asChild className="flex-1 rounded-sm bg-ink font-semibold text-ink-foreground shadow-none hover:bg-ink/85">
                  <Link to="/users/sign_up" onClick={() => setOpen(false)}>Criar conta</Link>
                </Button>
              </>
            ) : (
              <div className="flex w-full gap-2" aria-hidden>
                <div className="h-11 flex-1 animate-pulse rounded-sm bg-ink/5" />
                <div className="h-11 flex-1 animate-pulse rounded-sm bg-ink/5" />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
