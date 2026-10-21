// [B?] Entrar — email+senha via api.signIn; erro inline vindo do servidor.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '@/lib/api';
import { Section, Reveal } from '@/lib/ui';

const inputCls =
  'min-h-11 w-full rounded-sm border border-ink/20 bg-card px-3 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = 'Entrar — Volante';
  }, []);

  const validar = (): string | null => {
    if (!email.trim()) return 'Informe seu email.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Email inválido.';
    if (!senha) return 'Informe sua senha.';
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
      .signIn({ email: email.trim(), senha })
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
              Entrar
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Acesse seus favoritos e seus créditos de recomendação por IA.
            </p>

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
                <label htmlFor="signin-email" className="mb-2 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="signin-senha" className="mb-2 block text-sm font-medium text-foreground">
                  Senha
                </label>
                <input
                  id="signin-senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="inline-flex min-h-11 items-center justify-center rounded-sm bg-ink px-5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {enviando ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link
                to="/users/sign_up"
                className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
              >
                Criar conta
              </Link>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Ainda não é possível recuperar uma senha esquecida — se perder o acesso, crie outra conta.
            </p>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
