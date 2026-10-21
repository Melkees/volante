// Página "Sobre" — texto honesto sobre o projeto.
import { useEffect } from 'react';
import { Section } from '@/lib/ui';

export default function Sobre() {
  useEffect(() => {
    document.title = 'Sobre — Volante';
  }, []);

  return (
    <Section className="bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <div className="border-b border-ink/10 pb-10 md:pb-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
            Volante
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-foreground md:text-5xl">
            Sobre o Volante
          </h1>
        </div>

        <div className="max-w-[65ch] space-y-6 pt-10 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            O Volante é uma plataforma gratuita para quem está decidindo um carro: compare modelos
            lado a lado, estime custos de manutenção e financiamento e veja os veículos mais
            emplacados do Brasil. A ideia é simples — reunir, num só lugar, as informações que
            costumam estar espalhadas.
          </p>
          <p>
            Nossos dados vêm de fontes públicas reconhecidas: preços da Tabela FIPE e rankings de
            emplacamentos da FENABRAVE. Não vendemos carros, não intermediamos negociação e não
            recebemos para destacar nenhum modelo — o que você vê é o dado da fonte, organizado
            para facilitar a decisão.
          </p>
          <p>
            O projeto está em construção: novas ferramentas, páginas e refinamentos entram em
            produção aos poucos. Algumas seções ainda mostram uma prévia do que está por vir.
            Se algo parecer estranho ou incompleto, é porque provavelmente estamos trabalhando
            nisso agora.
          </p>
        </div>
      </div>
    </Section>
  );
}
