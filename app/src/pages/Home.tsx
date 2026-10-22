import Hero from '@/sections/Hero'
import Categories from '@/sections/Categories'
import Payback from '@/sections/Payback'
import Tools from '@/sections/Tools'
import AiReco from '@/sections/AiReco'
import Financing from '@/sections/Financing'
import Rankings from '@/sections/Rankings'
import BlogCta from '@/sections/BlogCta'
import { usePageMeta } from '@/lib/usePageMeta'

export default function Home() {
  usePageMeta({
    title: 'Volante — decisão automotiva honesta',
    description:
      'Compare modelos, consulte preços FIPE, simule financiamento e receba uma recomendação honesta com dados oficiais FIPE e FENABRAVE.',
    canonical: '/',
  })

  return (
    <main>
      <Hero />
      <Categories />
      <Payback />
      <Tools />
      <AiReco />
      <Financing />
      <Rankings />
      <BlogCta />
    </main>
  )
}
