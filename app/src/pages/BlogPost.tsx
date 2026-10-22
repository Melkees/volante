// [Blog/:slug] Leitura de artigo — /api/posts/:slug, corpo HTML sanitizado em wrapper tipográfico.
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { api, type Post } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';
import { usePageMeta } from '@/lib/usePageMeta';
import { sanitizeHtml } from '@/lib/sanitize';

const fmtData = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState(false);

  // N10: HTML do post nunca vai cru para dangerouslySetInnerHTML.
  const conteudoSeguro = useMemo(() => (post ? sanitizeHtml(post.conteudo) : ''), [post]);

  usePageMeta({
    title: post ? `${post.titulo} — Volante` : 'Blog — Volante',
    description: post?.resumo,
    canonical: `/blog/${slug ?? ''}`,
  });

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setPost(null);
    setNaoEncontrado(false);
    setErro(false);
    api
      .post(slug)
      .then((p) => alive && setPost(p))
      .catch((e: unknown) => {
        if (!alive) return;
        const status = e instanceof Error && /→ 404$/.test(e.message);
        if (status) setNaoEncontrado(true); else setErro(true);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <main>
      <Section className="py-10 md:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Carregando */}
          {post == null && !naoEncontrado && !erro && (
            <div aria-busy="true" className="animate-pulse">
              <div className="h-4 w-24 rounded-sm bg-ink/10" />
              <div className="mt-5 h-9 w-3/4 rounded-sm bg-ink/10" />
              <div className="mt-3 h-3 w-32 rounded-sm bg-ink/10" />
              <div className="mt-10 space-y-3">
                <div className="h-3 w-full rounded-sm bg-ink/10" />
                <div className="h-3 w-5/6 rounded-sm bg-ink/10" />
                <div className="h-3 w-2/3 rounded-sm bg-ink/10" />
              </div>
            </div>
          )}

          {/* Não encontrado */}
          {naoEncontrado && (
            <div className="mt-10 text-center">
              <p className="font-display text-2xl text-foreground">Post não encontrado</p>
              <p className="mt-2 text-sm text-muted-foreground">
                O artigo que você procura pode ter mudado de endereço.
              </p>
              <Link
                to="/blog"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 bg-card px-6 text-sm font-medium text-foreground transition-colors hover:border-ink/40"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao blog
              </Link>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <p className="mt-10 text-base text-muted-foreground">Dados indisponíveis.</p>
          )}

          {/* Artigo */}
          {post && (
            <Reveal>
              <article>
                <header>
                  {post.categoria && (
                    <span className="inline-block rounded-full border border-ink/20 bg-card px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-primary">
                      {post.categoria}
                    </span>
                  )}
                  <h1 className="mt-4 font-display text-3xl font-medium leading-[1.15] tracking-[-0.01em] text-foreground md:text-[2.5rem]">
                    {post.titulo}
                  </h1>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {fmtData(post.data)}
                  </p>
                </header>

                <div
                  className="mt-8 max-w-[65ch] text-base text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-foreground [&_li]:mb-1 [&_li]:leading-relaxed [&_li]:text-foreground/85 [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-foreground/85 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: conteudoSeguro }}
                />
              </article>

              <footer className="mt-12 border-t border-ink/10 pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to="/blog"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar ao blog
                  </Link>
                  <Link
                    to="/decida"
                    className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Ainda em dúvida? Deixe o Volante decidir
                  </Link>
                </div>
              </footer>
            </Reveal>
          )}
        </div>
      </Section>
    </main>
  );
}
