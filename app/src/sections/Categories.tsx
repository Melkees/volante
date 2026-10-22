// "Explorar por Categoria" — pratos fotográficos editoriais com legenda, dados da API.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Car, CarFront, CarTaxiFront, Truck } from 'lucide-react';
import { api, type Category } from '@/lib/api';
import { Section, SectionHeading, Reveal } from '@/lib/ui';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  CarFront,
  CarTaxiFront,
  Truck,
};

function CategoryCard({ cat, delay }: { cat: Category; delay: number }) {
  const Icon = ICONS[cat.icon] ?? Car;
  return (
    <Reveal delay={delay}>
      <Link to={`/busca?category=${cat.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-sm border border-ink/10">
          <img
            src={cat.image}
            alt={cat.name}
            loading="lazy"
            decoding="async"
            width={600}
            height={400}
            className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
          {/* Selo "Ver todos" topo-direita */}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-card/95 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink shadow-sm">
            Ver todos
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
        {/* Legenda embaixo do prato — assinatura editorial */}
        <div className="mt-4 flex items-start justify-between gap-3 border-b border-ink/20 pb-4 transition-colors duration-300 group-hover:border-ink/60">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-medium text-foreground">{cat.name}</h3>
            <p className="mt-0.5 truncate text-sm text-foreground/75">{cat.examples}</p>
          </div>
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink/35 transition-colors duration-300 group-hover:text-primary" />
        </div>
      </Link>
    </Reveal>
  );
}

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let alive = true;
    api.categories()
      .then((c) => alive && setCats(c))
      .catch(() => alive && setErro(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Section id="categorias" className="bg-surface-2">
      <SectionHeading
        eyebrow="CATÁLOGO"
        title="Explorar por"
        highlight="Categoria"
        sub="Encontre o veículo certo para o seu estilo de vida"
      />
      {erro && cats.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Dados indisponíveis no momento
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {cats.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} delay={i * 0.08} />
          ))}
        </div>
      )}
    </Section>
  );
}
