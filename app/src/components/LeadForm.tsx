// [LeadForm] Registro de interesse (nome/email/mensagem) → POST /api/leads.
// Honestidade: é registro de interesse — sem promessa de prazo ou contratação.
import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export type LeadTipo = 'concessionarias' | 'seguros' | 'vistorias' | 'parceiro';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadForm({ tipo }: { tipo: LeadTipo }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erros, setErros] = useState<{ nome?: string; email?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const validar = () => {
    const e: { nome?: string; email?: string } = {};
    if (nome.trim().length < 2) e.nome = 'Informe seu nome.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Informe um e-mail válido.';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setErroServidor(null);
    if (!validar()) return;
    setEnviando(true);
    api
      .lead({ nome: nome.trim(), email: email.trim(), tipo, mensagem: mensagem.trim() || undefined })
      .then(() => setSucesso(true))
      .catch((err: Error) => setErroServidor(err.message))
      .finally(() => setEnviando(false));
  };

  if (sucesso) {
    return (
      <div className="plate rounded-sm border border-ink/10 p-6" role="status">
        <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
        <p className="mt-3 font-display text-xl font-medium text-foreground">
          Recebemos seu contato — retornaremos em breve.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu registro de interesse ficou guardado com a gente.
        </p>
      </div>
    );
  }

  const campo =
    'min-h-11 w-full rounded-sm border border-ink/20 bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
  const label = 'mb-2 block text-sm font-medium text-foreground';

  return (
    <form onSubmit={submit} noValidate className="plate rounded-sm border border-ink/10 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`lead-nome-${tipo}`} className={label}>
            Nome
          </label>
          <input
            id={`lead-nome-${tipo}`}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            placeholder="Seu nome"
            aria-invalid={Boolean(erros.nome)}
            className={campo}
          />
          {erros.nome && (
            <p className="mt-1 text-sm text-muted-foreground" role="alert">
              {erros.nome}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`lead-email-${tipo}`} className={label}>
            E-mail
          </label>
          <input
            id={`lead-email-${tipo}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="voce@email.com"
            aria-invalid={Boolean(erros.email)}
            className={campo}
          />
          {erros.email && (
            <p className="mt-1 text-sm text-muted-foreground" role="alert">
              {erros.email}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`lead-mensagem-${tipo}`} className={label}>
          Mensagem <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id={`lead-mensagem-${tipo}`}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={3}
          placeholder="Conte um pouco do seu interesse"
          className={`${campo} min-h-24 resize-y`}
        />
      </div>
      {erroServidor && (
        <p className="mt-4 text-sm text-muted-foreground" role="alert">
          Não foi possível enviar: {erroServidor}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-6 min-h-11 w-full rounded-sm bg-ink px-6 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {enviando ? 'Enviando…' : 'Quero saber mais'}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Ao enviar, você concorda com a{' '}
        <Link
          to="/privacidade"
          className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
        >
          Política de Privacidade
        </Link>
        . Usamos seu e-mail só para responder este contato.
      </p>
    </form>
  );
}
