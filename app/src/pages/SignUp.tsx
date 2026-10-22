// [B?] Criar conta — nome/email/senha via api.signUp; benefícios honestos em chips.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { api } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';
import { usePageMeta } from '@/lib/usePageMeta';

const inputCls =
  'min-h-11 w-full rounded-sm border border-ink/20 bg-card px-3 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

const BENEFICIOS = ['20 recomendações por mês', 'Favoritos'];

export default function SignUp() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  usePageMeta({
    title: 'Criar conta — Volante',
    description: 'Crie sua conta grátis no Volante para salvar favoritos e receber recomendações.',
    canonical: pathname,
  });
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const validar = (): string | null => {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!email.trim()) return 'Informe seu email.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Email inválido.';
    if (senha.length < 8) return 'A senha precisa ter no mínimo 8 caracteres.';
    return null;
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validar();
    if (v) {
      setErro(v);
      return;
    }
    setErro(null);
    setEnviando(true);
    api
      .signUp({ nome: nome.trim(), email: email.trim(), senha })
      .then(() => {
        window.dispatchEvent(new CustomEvent('volante:sessao'));
        navigate('/');
      })
      .catch((err: Error) => setErro(err.message))
      .finally(() => setEnviando(false));
  };

  return (
    <main>
      <Section className="py-10 md:py-16">
        <Reveal>
          <div className="mx-auto max-w-md">
            <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
              Criar conta
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Leva menos de um minuto — e o que você salva fica salvo.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {BENEFICIOS.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-ink/15 bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>

            <form className="mt-8 flex flex-col gap-5" onSubmit={enviar} noValidate>
              {erro && (
                <p
                  role="alert"
                  className="rounded-sm border border-ink/15 bg-card px-4 py-3 text-sm text-foreground"
                >
                  {erro}
                </p>
              )}

              <div>
                <label htmlFor="signup-nome" className="mb-2 block text-sm font-medium text-foreground">
                  Nome
                </label>
                <input
                  id="signup-nome"
                  type="text"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="signup-senha" className="mb-2 block text-sm font-medium text-foreground">
                  Senha
                </label>
                <input
                  id="signup-senha"
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  aria-describedby="signup-senha-dica"
                  className={inputCls}
                />
                <p id="signup-senha-dica" className="mt-2 text-xs text-muted-foreground">
                  mínimo 8 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {enviando ? 'Criando…' : 'Criar conta'}
              </button>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Ao criar conta, você concorda com os{' '}
                <Link
                  to="/termos"
                  className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
                >
                  Termos
                </Link>{' '}
                e a{' '}
                <Link
                  to="/privacidade"
                  className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link
                to="/users/sign_in"
                className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
              >
                Entrar
              </Link>
            </p>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
