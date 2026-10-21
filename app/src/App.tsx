import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { MotionConfig } from 'framer-motion'
import Navbar from '@/components/Navbar'
import CommandSearch from '@/components/CommandSearch'
import CookieBar from '@/components/CookieBar'
import Footer from '@/components/Footer'
import Home from '@/pages/Home'
import Busca from '@/pages/Busca'
import NotFound from '@/pages/NotFound'
import Sobre from '@/pages/Sobre'
import Privacidade from '@/pages/Privacidade'
import Termos from '@/pages/Termos'
import FinanciamentoPage from '@/pages/Financiamento'
import CalculadoraPage from '@/pages/Calculadora'
import RankingsPage from '@/pages/Rankings'
import Comparar from '@/pages/Comparar'
import Decida from '@/pages/Decida'
import Veiculo from '@/pages/Veiculo'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import Favoritos from '@/pages/Favoritos'
import Parceiros from '@/pages/Parceiros'
import ParceiroTipo from '@/pages/ParceiroTipo'

/** Volta ao topo em cada troca de rota (ScrollRestoration do v7 exige data router). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
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
        </div>
        <Footer />
        <CookieBar />
      </div>
    </MotionConfig>
  );
}
