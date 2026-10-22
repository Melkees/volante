// [Parceiros] Hub da rede de parceiros — rede em formação, texto honesto.
import { useLocation } from 'react-router';
import { Link } from 'react-router';
import { Building2, ShieldCheck, SearchCheck } from 'lucide-react';
import { Section } from '@/lib/ui';
import LeadForm from '@/components/LeadForm';
import { usePageMeta } from '@/lib/usePageMeta';

const CARDS = [
  {
    tipo: 'concessionarias' as const,
    titulo: 'Concessionárias',
    icone: Building2,
    descricao: 'Revisão, peças e condições de compra direto com a rede.',
  },
  {
    tipo: 'seguros' as const,
    titulo: 'Seguros',
    icone: ShieldCheck,
    descricao: 'Cobertura para o seu carro, do simples ao completo.',
  },
  {
    tipo: 'vistorias' as const,
    titulo: 'Vistorias',
    icone: SearchCheck,
    descricao: 'Laudo cautelar antes de você fechar negócio.',
  },
];

export default function Parceiros() {
  const { pathname } = useLocation();
  usePageMeta({
    title: 'Parceiros — Volante',
    description:
      'Concessionárias, seguros e vistorias parceiros do Volante. Deixe seu contato e retornamos por e-mail.',
    canonical: pathname,
  });

  return (
    <main>
      <Section className="py-10 md:py-16">
        <h1 className="font-display text-3xl font-medium leading-[1.12] tracking-[-0.01em] text-foreground md:text-[2.75rem]">
          Parceiros Volante
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Uma rede em formação: oficinas, seguradoras e vistorias que podem ajudar na hora de comprar
          e manter seu carro. Sem curadoria fechada ainda — vamos crescendo com critério.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CARDS.map(({ tipo, titulo, icone: Icone, descricao }) => (
            <li key={tipo}>
              <Link
                to={`/parceiros/${tipo}`}
                className="plate block h-full min-h-11 rounded-sm border border-ink/10 p-6 transition-colors hover:border-ink/40"
              >
                <Icone className="h-6 w-6 text-primary" aria-hidden />
                <h2 className="mt-4 font-display text-xl font-medium text-foreground">{titulo}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{descricao}</p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 border-t border-ink/10 pt-10">
          <h2 className="font-display text-2xl font-medium text-foreground md:text-3xl">
            Seja um Parceiro
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Tem um negócio que combina com o Volante? Deixe seu contato — avaliamos cada pedido.
          </p>
          <div className="mt-6 max-w-2xl">
            <LeadForm tipo="parceiro" />
          </div>
        </div>
      </Section>
    </main>
  );
}
