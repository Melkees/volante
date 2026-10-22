// [ParceiroTipo] Página de um tipo de parceria — recebe props (rota instanciada em outra frente).
import { useLocation } from 'react-router';
import { Building2, ShieldCheck, SearchCheck, type LucideIcon } from 'lucide-react';
import { Section } from '@/lib/ui';
import LeadForm, { type LeadTipo } from '@/components/LeadForm';
import { usePageMeta } from '@/lib/usePageMeta';

const ICONES: Record<LeadTipo, LucideIcon> = {
  concessionarias: Building2,
  seguros: ShieldCheck,
  vistorias: SearchCheck,
  parceiro: Building2,
};

const INCLUI: Record<LeadTipo, string[]> = {
  concessionarias: [
    'Presença no hub de parceiros do Volante, com descrição do seu negócio.',
    'Canal direto para quem busca compra, revisão ou peças na sua região.',
    'Registro de interesses recebido pela equipe do Volante.',
  ],
  seguros: [
    'Presença no hub de parceiros do Volante, com descrição das coberturas.',
    'Canal para quem pesquisa seguro junto com a compra do carro.',
    'Registro de interesses recebido pela equipe do Volante.',
  ],
  vistorias: [
    'Presença no hub de parceiros do Volante, com descrição do serviço.',
    'Canal para quem quer laudo cautelar antes de fechar negócio.',
    'Registro de interesses recebido pela equipe do Volante.',
  ],
  parceiro: [
    'Conversa inicial para entender o seu negócio e o encaixe com o Volante.',
    'Avaliação de critério — a rede cresce devagar e com propósito.',
    'Retorno pelo e-mail informado, em até 2 dias úteis.',
  ],
};

export default function ParceiroTipo({
  tipo,
  titulo,
  descricao,
}: {
  tipo: LeadTipo;
  titulo: string;
  descricao: string;
}) {
  const { pathname } = useLocation();
  usePageMeta({
    title: `${titulo} — Volante`,
    description: descricao,
    canonical: pathname,
  });

  const Icone = ICONES[tipo] ?? Building2;

  return (
    <main>
      <Section className="py-10 md:py-16">
        <header className="flex items-start gap-4">
          <span className="plate flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-ink/10">
            <Icone className="h-6 w-6 text-primary" aria-hidden />
          </span>
          <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
            {titulo}
          </h1>
        </header>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">{descricao}</p>

        <div className="mt-10 max-w-2xl">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            O que a parceria inclui
          </h2>
          <ul className="mt-4 space-y-3">
            {INCLUI[tipo].map((item) => (
              <li key={item} className="flex gap-3 text-sm text-foreground">
                <span aria-hidden className="mt-2 h-1 w-4 shrink-0 bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 border-t border-ink/10 pt-10">
          <h2 className="font-display text-2xl font-medium text-foreground md:text-3xl">
            Deixe seu contato
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Registro de interesse — a equipe do Volante avalia e responde por e-mail.
          </p>
          <div className="mt-6 max-w-2xl">
            <LeadForm tipo={tipo} />
          </div>
        </div>
      </Section>
    </main>
  );
}
