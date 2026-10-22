import { Link } from 'react-router';
import { Brand } from '@/components/Brand';

const FERRAMENTAS = [
  { label: 'Buscar Veículos', href: '/busca' },
  { label: 'Comparar', href: '/comparar' },
  { label: 'Decida Meu Carro', href: '/decida' },
  { label: 'Calculadora de Custos', href: '/calculadora' },
  { label: 'Financiamento', href: '/financiamento' },
  { label: 'Rankings de Vendas', href: '/rankings' },
  { label: 'Blog', href: '/blog' },
];

const PARCEIROS = [
  { label: 'Concessionárias', href: '/parceiros/concessionarias' },
  { label: 'Seguros', href: '/parceiros/seguros' },
  { label: 'Vistorias', href: '/parceiros/vistorias' },
  { label: 'Seja um Parceiro', href: '/parceiros', accent: true },
];

const CONTA = [
  { label: 'Entrar', href: '/users/sign_in' },
  { label: 'Criar Conta', href: '/users/sign_up' },
];

function Column({ title, links }: { title: string; links: { label: string; href: string; accent?: boolean }[] }) {
  return (
    <nav aria-label={title}>
      {/* A4: título de coluna como <p> — não é heading sem pai h2/h1 na árvore */}
      <p className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-foreground/65">
        {title}
      </p>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.href}
              className={
                l.accent
                  ? 'inline-block py-2 text-sm font-medium text-bronze-light transition-colors hover:text-bronze-light/75'
                  : 'inline-block py-2 text-sm text-ink-foreground/70 transition-colors hover:text-ink-foreground'
              }
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="ink-band">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Brand size="lg" tagline onInk />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-foreground/60">
              Plataforma automotiva gratuita: compare modelos, simule custos e descubra o carro
              certo com o recomendador do Volante. Dados oficiais FIPE e FENABRAVE.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <Column title="Ferramentas" links={FERRAMENTAS} />
            <Column title="Parceiros" links={PARCEIROS} />
            <Column title="Sua Conta" links={CONTA} />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-foreground/10 pt-6 sm:flex-row">
          <p className="text-xs text-ink-foreground/60">
            © 2026 Volante · Dados oficiais: <strong className="font-semibold text-ink-foreground/70">Tabela FIPE</strong> ·{' '}
            Rankings: <strong className="font-semibold text-ink-foreground/70">FENABRAVE</strong>
          </p>
          <nav aria-label="Institucional" className="flex items-center gap-2 text-xs text-ink-foreground/60">
            <Link to="/sobre" className="transition-colors hover:text-ink-foreground">Sobre</Link>
            <span>·</span>
            <Link to="/privacidade" className="transition-colors hover:text-ink-foreground">Privacidade</Link>
            <span>·</span>
            <Link to="/termos" className="transition-colors hover:text-ink-foreground">Termos</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
