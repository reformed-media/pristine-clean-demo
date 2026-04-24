import { useMemo, useState } from "react";
import { CTABand } from "@/components/site/CTABand";
import { FadeIn } from "@/components/site/FadeIn";
import { SEO } from "@/components/site/SEO";

type Cat = "all" | "auto" | "marine" | "home";
const items: { cat: Exclude<Cat, "all">; before: string; after: string; label: string }[] = [
  { cat: "auto", before: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80", label: "Porsche exterior" },
  { cat: "auto", before: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1000&q=80", label: "BMW interior" },
  { cat: "auto", before: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80", label: "Mercedes paint" },
  { cat: "auto", before: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1000&q=80", label: "Black SUV" },
  { cat: "auto", before: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1000&q=80", label: "Leather seats" },
  { cat: "auto", before: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1000&q=80", label: "Sports car wheels" },
  { cat: "marine", before: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1000&q=80", label: "Boat hull" },
  { cat: "marine", before: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=1000&q=80", label: "Deck restoration" },
  { cat: "marine", before: "https://images.unsplash.com/photo-1552933529-e359b2477252?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1000&q=80", label: "Jetski polish" },
  { cat: "home", before: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1000&q=80", label: "Driveway wash" },
  { cat: "home", before: "https://images.unsplash.com/photo-1597047084897-51e81819a499?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80", label: "Fence cleaning" },
  { cat: "home", before: "https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=1000&q=80", after: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1000&q=80", label: "Siding wash" },
];

export default function GalleryPage() {
  const [cat, setCat] = useState<Cat>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const filtered = useMemo(() => items.filter((i) => cat === "all" || i.cat === cat), [cat]);

  const tabs: { key: Cat; label: string }[] = [
    { key: "all", label: "All" },
    { key: "auto", label: "Auto" },
    { key: "marine", label: "Marine" },
    { key: "home", label: "Home" },
  ];

  return (
    <>
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden border-b border-border">
        {/* TODO: swap for real Pristine Clean photo */}
        <img src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=2400&q=80" alt="Detailed car interior close-up" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative container-x pb-12">
          <h1 className="text-display uppercase text-5xl md:text-7xl">The Work.</h1>
          <p className="mt-4 text-muted-foreground">Before and after from recent jobs.</p>
        </div>
      </section>

      <section className="container-x py-12 sticky top-16 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setCat(t.key)}
              className={`px-5 h-10 rounded-sm text-sm transition ${cat === t.key ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground border border-border"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((it, i) => (
            <FadeIn key={`${it.label}-${i}`} delay={(i % 6) * 0.05}>
              {/* TODO: replace with real before/after photo pair */}
              <button onClick={() => setLightbox(i)} className="group block w-full text-left bg-surface border border-border rounded-sm overflow-hidden hover:border-primary/50 transition">
                <div className="grid grid-cols-2">
                  <div className="relative aspect-square overflow-hidden">
                    <img src={it.before} alt={`${it.label} before`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-2 left-2 text-[10px] uppercase tracking-widest bg-background/80 px-2 py-1">Before</span>
                  </div>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={it.after} alt={`${it.label} after`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-2 left-2 text-[10px] uppercase tracking-widest bg-primary/80 px-2 py-1">After</span>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-sm">{it.label}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">{it.cat}</span>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>
      </section>

      {lightbox !== null && filtered[lightbox] && (
        <div className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-foreground text-2xl" onClick={() => setLightbox(null)}>×</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl w-full">
            <img src={filtered[lightbox].before} alt="before" className="w-full h-auto rounded-sm" />
            <img src={filtered[lightbox].after} alt="after" className="w-full h-auto rounded-sm" />
          </div>
        </div>
      )}

      <CTABand title="Want your car in here?" subtitle="Book a detail." cta="Book Now" />
    </>
  );
}
