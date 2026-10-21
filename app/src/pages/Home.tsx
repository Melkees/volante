import Hero from '@/sections/Hero'
import Categories from '@/sections/Categories'
import Payback from '@/sections/Payback'
import Tools from '@/sections/Tools'
import AiReco from '@/sections/AiReco'
import Financing from '@/sections/Financing'
import Rankings from '@/sections/Rankings'
import BlogCta from '@/sections/BlogCta'

export default function Home() {
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
