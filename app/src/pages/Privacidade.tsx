// Página "Privacidade" — política real, em linha com o que o site coleta hoje (LGPD).
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Section } from '@/lib/ui';
import { usePageMeta } from '@/lib/usePageMeta';

function Bloco({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-ink/10 py-10 first:pt-10 md:py-12">
      <div className="flex items-baseline gap-3">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
          {numero}
        </span>
        <h2 className="font-display text-2xl font-medium tracking-[-0.01em] text-foreground md:text-3xl">
          {titulo}
        </h2>
      </div>
      <div className="mt-5 max-w-[65ch] space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
        {children}
      </div>
    </section>
  );
}

export default function Privacidade() {
  const { pathname } = useLocation();
  usePageMeta({
    title: 'Política de Privacidade — Volante',
    description:
      'Quais dados o Volante coleta, para quê, por quanto tempo e como exercer seus direitos. Sem venda de dados, sem rastreamento, sem anúncios.',
    canonical: pathname,
  });

  return (
    <Section className="bg-background">
      <div className="mx-auto w-full max-w-3xl">
        <div className="border-b border-ink/10 pb-10 md:pb-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-primary">
            Volante
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-foreground md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground md:text-lg">
            Esta política descreve, em linguagem direta, o que o Volante coleta, por quê e o que
            ele <em>nunca</em> faz com os seus dados. Vale para o site inteiro — inclusive para
            quem cria conta, salva favoritos ou deixa um contato.
          </p>
        </div>

        <Bloco numero="01" titulo="Quais dados coletamos">
          <p>
            <strong className="font-semibold text-foreground">Sua conta.</strong> Quando você se
            cadastra, guardamos nome, e-mail e senha. A senha não fica em texto puro: ela é
            guardada com hash e salt, o padrão de mercado — nem nós conseguimos ler.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Favoritos.</strong> Os veículos que
            você salva ficam associados à sua conta.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Contato de parceiros.</strong> Se
            você envia um formulário de interesse (concessionárias, seguros, vistorias ou
            parceria), guardamos nome, e-mail, o tipo de interesse e a mensagem.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Cookies técnicos.</strong> Dois
            apenas: um de sessão (<code>volante_sessao</code>, que mantém você logado por até 30
            dias) e um anônimo (<code>volante_anon</code>, que registra o uso grátis do
            recomendador por 365 dias). Nenhum cookie de rastreamento, de redes sociais ou de
            publicidade. No <em>localStorage</em>, guardamos só a preferência do aviso de cookies.
          </p>
        </Bloco>

        <Bloco numero="02" titulo="Para quê usamos cada dado">
          <p>
            <strong className="font-semibold text-foreground">Conta e senha:</strong> manter seu
            acesso e seus favoritos salvos entre dispositivos.
          </p>
          <p>
            <strong className="font-semibold text-foreground">E-mail:</strong> identificar sua
            conta e, quando houver, responder contato.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Formulários de parceiro:</strong>{' '}
            entender seu interesse e responder pelo e-mail informado.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Cookie anônimo:</strong> limitar
            abuso da recomendação grátis — é ele que garante seu uso sem cadastro.
          </p>
          <p>
            Os preços e rankings exibidos são dados públicos (Tabela FIPE, FENABRAVE) e não são
            dados pessoais.
          </p>
        </Bloco>

        <Bloco numero="03" titulo="Por que temos o direito de usar (base legal)">
          <p>
            Quando você cria conta, o tratamento dos seus dados se sustenta na{' '}
            <strong className="font-semibold text-foreground">execução de contrato</strong> (LGPD,
            art. 7º, V): sem guardar nome, e-mail e senha, não existe conta nem favorito.
          </p>
          <p>
            Para os formulários de contato e parceiros, usamos o seu{' '}
            <strong className="font-semibold text-foreground">consentimento</strong> — você
            preencheu e enviou porque quis — e, em alguns casos, o{' '}
            <strong className="font-semibold text-foreground">legítimo interesse</strong> de
            responder quem nos procurou. O cookie anônimo se apoia no legítimo interesse de
            proteger o serviço contra abuso.
          </p>
          <p>
            Você pode retirar o consentimento a qualquer momento, pelo canal de contato abaixo.
          </p>
        </Bloco>

        <Bloco numero="04" titulo="Por quanto tempo guardamos">
          <p>
            <strong className="font-semibold text-foreground">Sessão:</strong> o cookie de sessão
            dura até 30 dias, ou até você sair.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Contas e favoritos:</strong> enquanto
            sua conta existir — e são apagados quando você pede exclusão.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Leads de parceiros:</strong> até 12
            meses, tempo suficiente para responder e dar seguimento ao contato.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Cookie anônimo:</strong> 365 dias. A
            preferência do banner de cookies fica no seu navegador até você limpar os dados do
            site.
          </p>
        </Bloco>

        <Bloco numero="05" titulo="Seus direitos e como exercer">
          <p>
            Você pode pedir a <strong className="font-semibold text-foreground">confirmação</strong>{' '}
            de que tratamos seus dados, o{' '}
            <strong className="font-semibold text-foreground">acesso</strong> a eles, a{' '}
            <strong className="font-semibold text-foreground">correção</strong> de dados
            incompletos ou desatualizados e a{' '}
            <strong className="font-semibold text-foreground">exclusão</strong> da conta e dos
            dados associados.
          </p>
          <p>
            Para exercer qualquer um deles, abra uma issue no repositório público do projeto:{' '}
            <a
              href="https://github.com/Melkees/volante/issues"
              className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
            >
              github.com/Melkees/volante/issues
            </a>
            . Pedimos que não inclua senha nem dados sensíveis na issue — responderemos e
            resolveremos por lá. Um e-mail dedicado também será publicado nesta página em breve.
          </p>
        </Bloco>

        <Bloco numero="06" titulo="O que nós NÃO fazemos">
          <p>
            <strong className="font-semibold text-foreground">Não vendemos dados.</strong> Nem
            alugamos, nem trocamos, nem cedemos para marketing.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Não rastreamos.</strong> Sem pixels,
            sem analytics de terceiros, sem anúncios, sem cookies de redes sociais.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Não compartilhamos</strong> seus
            dados com terceiros — os parceiros só recebem o contato que você mesmo decidiu enviar
            pelo formulário. Os serviços de infraestrutura (hospedagem e banco de dados) processam
            dados apenas na operação do site.
          </p>
        </Bloco>

        <Bloco numero="07" titulo="Controlador e canal de contato">
          <p>
            O controlador dos dados é <strong className="font-semibold text-foreground">Lorran</strong>,
            responsável pelo Volante. O canal de contato de hoje é o repositório público:{' '}
            <a
              href="https://github.com/Melkees/volante/issues"
              className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
            >
              github.com/Melkees/volante/issues
            </a>
            . Um e-mail dedicado será publicado aqui quando estiver ativo.
          </p>
          <p>
            Dúvidas sobre esta política valem pelo mesmo canal. Ela pode ser atualizada — se a
            mudança for relevante, o aviso de cookies e esta página serão revisados juntos.
          </p>
          <p className="pt-2">
            <Link
              to="/termos"
              className="font-medium text-foreground underline decoration-ink/30 underline-offset-4 hover:decoration-primary"
            >
              Ver também os Termos de uso
            </Link>
            .
          </p>
        </Bloco>
      </div>
    </Section>
  );
}
