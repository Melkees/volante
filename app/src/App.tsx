import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { MotionConfig } from 'framer-motion'
import Navbar from '@/components/Navbar'
import CommandSearch from '@/components/CommandSearch'
import CookieBar from '@/components/CookieBar'
import Footer from '@/components/Footer'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

// Code splitting por rota: home e 404 no chunk principal, resto sob demanda.
const Busca = lazy(() => import('@/pages/Busca'))
const Sobre = lazy(() => import('@/pages/Sobre'))
const Privacidade = lazy(() => import('@/pages/Privacidade'))
const Termos = lazy(() => import('@/pages/Termos'))
const FinanciamentoPage = lazy(() => import('@/pages/Financiamento'))
const CalculadoraPage = lazy(() => import('@/pages/Calculadora'))
const RankingsPage = lazy(() => import('@/pages/Rankings'))
const Comparar = lazy(() => import('@/pages/Comparar'))
const Decida = lazy(() => import('@/pages/Decida'))
const Veiculo = lazy(() => import('@/pages/Veiculo'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const SignIn = lazy(() => import('@/pages/SignIn'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const Favoritos = lazy(() => import('@/pages/Favoritos'))
const Parceiros = lazy(() => import('@/pages/Parceiros'))
const ParceiroTipo = lazy(() => import('@/pages/ParceiroTipo'))

/** Volta ao topo em cada troca de rota (ScrollRestoration do v7 exige data router). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Rota() {
  return (
    <div role="status" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <span className="sr-only">Carregando…</span>
      <div aria-hidden className="h-8 w-64 max-w-full animate-pulse rounded-sm bg-surface-2" />
      <div aria-hidden className="mt-4 h-4 w-96 max-w-full animate-pulse rounded-sm bg-surface-2" />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background font-sans text-foreground">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-foreground"
        >
          Pular para o conteúdo
        </a>
        <Navbar />
        <CommandSearch />
        <ScrollToTop />
        <div id="conteudo">
          <Suspense fallback={<Rota />}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/busca" element={<Busca />} />
          <Route path="/comparar" element={<Comparar />} />
          <Route path="/decida" element={<Decida />} />
          <Route path="/financiamento" element={<FinanciamentoPage />} />
          <Route path="/calculadora" element={<CalculadoraPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/veiculo/:id" element={<Veiculo />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/parceiros" element={<Parceiros />} />
          <Route path="/parceiros/concessionarias" element={<ParceiroTipo tipo="concessionarias" titulo="Concessionárias parceiras" descricao="Rede de concessionárias em formação para oferta direta aos leitores do Volante." />} />
          <Route path="/parceiros/seguros" element={<ParceiroTipo tipo="seguros" titulo="Seguros parceiros" descricao="Cotação e condições para seguradoras parceiras do Volante." />} />
          <Route path="/parceiros/vistorias" element={<ParceiroTipo tipo="vistorias" titulo="Vistorias parceiras" descricao="Centros de vistoria credenciados em formação." />} />
          <Route path="/users/sign_in" element={<SignIn />} />
          <Route path="/users/sign_up" element={<SignUp />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </div>
        <Footer />
        <CookieBar />
      </div>
    </MotionConfig>
  );
}
