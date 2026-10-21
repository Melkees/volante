import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Car,
  CarFront,
  CarTaxiFront,
  Truck,
  Search,
  Sparkles,
  Scale,
  Calculator,
  Banknote,
  Trophy,
  Newspaper,
  Wrench,
  Component,
  type LucideIcon,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { api, brl, type Category, type Tool, type Veiculo } from '@/lib/api';

const ICONS: Record<string, LucideIcon> = {
  Car,
  CarFront,
  CarTaxiFront,
  Truck,
  Search,
  Sparkles,
  Scale,
  Calculator,
  Banknote,
  Trophy,
  Newspaper,
};

function toolIcon(name: string): LucideIcon {
  return ICONS[name] ?? Wrench;
}

export default function CommandSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const loaded = useRef(false);

  const load = useCallback(() => {
    if (loaded.current) return;
    loaded.current = true;
    api.categories().then(setCategories).catch(() => {});
    api.tools().then(setTools).catch(() => {});
  }, []);

  // Catálogo FIPE (~7.5k) — busca server-side com debounce; nunca baixa tudo.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const t = setTimeout(() => {
      api.veiculos({ q, limit: 8 })
        .then((r) => setVeiculos(r.veiculos))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    const openIt = () => {
      load();
      setOpen(true);
    };
    window.addEventListener('volante:open-search', openIt);
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        openIt();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('volante:open-search', openIt);
      window.removeEventListener('keydown', onKey);
    };
  }, [load]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Buscar no Volante"
      description="Categorias, ferramentas e veículos"
      className="border-ink/10 bg-popover/98 backdrop-blur-sm sm:max-w-xl"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Buscar carros, ferramentas, categorias…"
        className="text-base"
      />
      <CommandList className="min-h-72">
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {categories.length > 0 && (
          <CommandGroup heading="Categorias">
            {categories.map((c) => (
              <CommandItem
                key={c.slug}
                value={`${c.name} ${c.examples}`}
                onSelect={() => { setOpen(false); navigate(`/busca?category=${c.slug}`); }}
              >
                <Car className="text-primary" />
                <span>{c.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.examples}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {tools.length > 0 && (
          <CommandGroup heading="Ferramentas">
            {tools.map((t) => {
              const Icon = toolIcon(t.icon);
              return (
                <CommandItem key={t.id} value={`${t.title} ${t.description}`} onSelect={() => { setOpen(false); navigate(t.href); }}>
                  <Icon className="text-primary" />
                  <span>{t.title}</span>
                  <span className="ml-auto truncate pl-4 text-xs text-muted-foreground">{t.description}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {veiculos.length > 0 && (
          <CommandGroup heading="Veículos">
            {veiculos.map((v) => (
              <CommandItem
                key={v.id}
                value={`${v.nome} ${v.marca}`}
                onSelect={() => { setOpen(false); navigate(`/busca?q=${encodeURIComponent(`${v.marca} ${v.nome}`.trim())}`); }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border border-ink/20 font-display text-[0.65rem] font-semibold text-ink">
                  <Car className="h-3 w-3 text-primary" />
                </span>
                <span className="truncate">{v.nome}</span>
                <span className="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">
                  {v.preco != null ? brl(v.preco) : '—'}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="border-t border-ink/10 px-4 py-2.5 text-[0.7rem] text-muted-foreground">
        ↑↓ navegar · ↵ abrir · esc fechar
      </div>
    </CommandDialog>
  );
}
