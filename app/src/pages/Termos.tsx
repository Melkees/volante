// Página "Termos de uso" — versão preliminar, linguagem direta.
import { useEffect } from 'react';
import { Section } from '@/lib/ui';

export default function Termos() {
  useEffect(() => {
    document.title = 'Termos — Volante';
  }, []);

  return (
    <Section className="bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <div className="border-b border-ink/10 pb-10 md:pb-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
            Volante
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-foreground md:text-5xl">
            Termos de uso
          </h1>
        </div>

        <div className="max-w-[65ch] space-y-6 pt-10 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            <strong className="font-semibold text-foreground">
              Esta é uma versão preliminar dos nossos termos de uso
            </strong>{' '}
            e será substituída por uma versão completa à medida que o projeto amadurecer.
          </p>
          <p>
            O Volante é uma plataforma de uso gratuito. Você pode consultar o catálogo, comparar
            modelos, simular custos e acessar os rankings livremente, sem pagar nada por isso.
          </p>
          <p>
            As informações exibidas — preços da Tabela FIPE, rankings da FENABRAVE, especificações
            e estimativas — são fornecidas <strong className="font-semibold text-foreground">sem garantia</strong>{' '}
            de exatidão, completude ou atualização no momento da sua consulta. Elas servem de
            apoio à decisão, não como valor contratual: condições reais de compra, venda,
            financiamento e seguro variam conforme negociador, região e data.
          </p>
          <p>
            Antes de qualquer decisão, <strong className="font-semibold text-foreground">consulte sempre as fontes oficiais</strong>{' '}
            e os documentos do veículo. O Volante não intermedia negociações e não se
            responsabiliza por decisões tomadas com base nas informações aqui exibidas.
          </p>
        </div>
      </div>
    </Section>
  );
}
