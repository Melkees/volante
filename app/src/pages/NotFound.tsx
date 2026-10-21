// Página 404 — o servidor entrega status 404 servindo esta SPA.
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Não encontrado — Volante';
  }, []);

  return (
    <section className="min-h-[70vh] bg-background py-16 md:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        <div className="border-b border-ink/10 pb-10 md:pb-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
            Erro 404
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-foreground md:text-5xl">
            Página não encontrada
          </h1>
          <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted-foreground md:text-lg">
            O endereço que você abriu não existe ou mudou de lugar. Volte ao início para continuar
            explorando o catálogo, comparações e rankings.
          </p>
        </div>
        <div className="pt-10">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-ink px-6 text-sm font-semibold text-ink-foreground transition-colors hover:bg-ink/85"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  );
}
