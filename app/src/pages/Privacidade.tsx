// Página "Privacidade" — versão preliminar, LGPD-lite, honesta sobre o que (não) coletamos.
import { useEffect } from 'react';
import { Section } from '@/lib/ui';

export default function Privacidade() {
  useEffect(() => {
    document.title = 'Privacidade — Volante';
  }, []);

  return (
    <Section className="bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <div className="border-b border-ink/10 pb-10 md:pb-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
            Volante
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-foreground md:text-5xl">
            Privacidade
          </h1>
        </div>

        <div className="max-w-[65ch] space-y-6 pt-10 text-base leading-relaxed text-muted-foreground md:text-lg">
          <p>
            <strong className="font-semibold text-foreground">
              Esta é uma versão preliminar da nossa política de privacidade.
            </strong>{' '}
            Ela descreve, em linguagem direta, como o Volante trata informações hoje — e será
            revisada à medida que o projeto evoluir.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Não coletamos dados pessoais.</strong>{' '}
            Não há cadastro obrigatório para navegar, não usamos cookies de rastreamento e não
            vendemos nem compartilhamos informações com anunciantes. O que existe hoje é um único
            dado guardado localmente no seu navegador, via <em>localStorage</em>: a preferência de
            que o aviso sobre cookies não apareça de novo. Essa informação fica apenas no seu
            dispositivo e nunca é enviada para nossos servidores.
          </p>
          <p>
            As informações exibidas na plataforma — preços e rankings — são dados públicos de
            terceiros, como a Tabela FIPE e a FENABRAVE, reproduzidos com crédito à fonte. Se você
            criar uma conta quando esse recurso ficar disponível, esta política será atualizada
            antes, explicando exatamente o que será coletado e por quê.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Contato:</strong> um canal oficial de
            comunicação está sendo preparado e será publicado nesta página em breve.
          </p>
        </div>
      </div>
    </Section>
  );
}
