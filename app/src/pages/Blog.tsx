// [Blog] Listagem editorial — posts via /api/posts, cards plate hairline.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, type Post } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';

const fmtData = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Blog() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    document.title = 'Blog — Volante';
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .posts()
      .then((r) => alive && setPosts(r.posts))
      .catch(() => alive && setErro(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main>
      <Section className="py-10 md:py-16">
        <Reveal>
          <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
            Blog do Volante
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Guias, comparativos e a realidade de quem já trocou a gasolina pela tomada — antes de você decidir.
          </p>
        </Reveal>

        {/* Carregando: skeleton plate */}
        {posts == null && !erro && (
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <div className="plate h-48 animate-pulse rounded-sm border border-ink/10 p-5">
                  <div className="h-3 w-24 rounded-sm bg-ink/10" />
                  <div className="mt-4 h-5 w-3/4 rounded-sm bg-ink/10" />
                  <div className="mt-3 h-3 w-full rounded-sm bg-ink/10" />
                  <div className="mt-2 h-3 w-2/3 rounded-sm bg-ink/10" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Erro */}
        {erro && (
          <p className="mt-10 text-base text-muted-foreground">Dados indisponíveis.</p>
        )}

        {/* Vazio */}
        {!erro && posts && posts.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-xl text-foreground">Em breve os primeiros artigos</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Estamos escrevendo sobre o que importa antes da sua decisão.
            </p>
          </div>
        )}

        {/* Listagem */}
        {!erro && posts && posts.length > 0 && (
          <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <li key={p.slug}>
                <Reveal delay={Math.min(i * 0.04, 0.3)}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="plate card-hover block h-full min-h-11 rounded-sm border border-ink/10 p-5 transition-colors hover:border-ink/40"
                  >
                    {p.categoria && (
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-primary">
                        {p.categoria}
                      </p>
                    )}
                    <h2 className={`font-display text-xl font-medium leading-snug text-foreground ${p.categoria ? 'mt-2' : ''}`}>
                      {p.titulo}
                    </h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{p.resumo}</p>
                    <p className="mt-4 border-t border-ink/10 pt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {fmtData(p.data)}
                    </p>
                    <span className="mt-3 inline-block text-sm font-medium text-primary">Ler →</span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
