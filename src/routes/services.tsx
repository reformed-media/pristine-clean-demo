import { createFileRoute, Link } from "@tanstack/react-router";
import { CTABand } from "@/components/site/CTABand";
import { FadeIn } from "@/components/site/FadeIn";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — Pristine Clean LI" },
      { name: "description", content: "Auto, marine, and home detailing on Long Island. Transparent pricing and add-ons." },
      { property: "og:title", content: "Services & Pricing — Pristine Clean LI" },
      { property: "og:description", content: "Auto, marine, and home detailing on Long Island. Transparent pricing." },
    ],
  }),
  component: ServicesPage,
});

function PriceCard({ name, price, desc, featured }: { name: string; price: string; desc: string; featured?: boolean }) {
  return (
    <div className={`bg-surface border rounded-sm p-8 h-full ${featured ? "border-primary" : "border-border"}`}>
      {featured && <div className="text-eyebrow mb-3">Most popular</div>}
      <h3 className="text-xl font-bold">{name}</h3>
      <div className="mt-4 text-display text-4xl text-primary">{price}</div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function ServicesPage() {
  return (
    <>
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden border-b border-border">
        {/* TODO: swap for real Pristine Clean photo */}
        <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2400&q=80" alt="Detailing tools laid out" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative container-x pb-12">
          <h1 className="text-display uppercase text-5xl md:text-7xl">Services &amp; Pricing.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">Transparent pricing. Real work. Add-ons available.</p>
        </div>
      </section>

      {/* AUTO */}
      <section id="auto" className="container-x py-24 scroll-mt-20">
        <FadeIn>
          <div className="text-eyebrow">Auto</div>
          <h2 className="mt-3 text-display uppercase text-4xl md:text-5xl">Auto Detailing.</h2>
          <p className="mt-6 text-muted-foreground max-w-2xl">
            Daily drivers to weekend exotics. Nick details every car the same way: by hand, on site, no shortcuts.
          </p>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FadeIn delay={0}><PriceCard name="Exterior Only" price="$120" desc="Hand wash, wheels and tires, bug and tar removal, tire dressing, glass exterior, spray wax finish." /></FadeIn>
          <FadeIn delay={0.05}><PriceCard name="Interior Only" price="$150" desc="Full vacuum, steam clean, leather and plastic conditioning, glass interior, door jambs, center console and cup holder detail." /></FadeIn>
          <FadeIn delay={0.1}><PriceCard name="Full Detail" price="$225" desc="Everything in exterior and interior. About 3 hours on site. The signature service." featured /></FadeIn>
        </div>

        <h3 className="mt-16 text-eyebrow">Add-ons</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: "Paint Sealant", p: "$350", d: "6-month hydrophobic protection. Adds serious gloss." },
            { n: "Engine Bay", p: "$75", d: "Degrease and dress under the hood." },
            { n: "Headlight Restoration", p: "$90", d: "Cut through cloudy lenses. Restored clarity." },
          ].map((a) => (
            <div key={a.n} className="bg-surface border border-border rounded-sm p-6 flex items-center justify-between">
              <div>
                <div className="font-bold">{a.n}</div>
                <div className="mt-1 text-xs text-muted-foreground">{a.d}</div>
              </div>
              <div className="text-primary font-bold">{a.p}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARINE */}
      <section id="marine" className="bg-surface border-y border-border scroll-mt-20">
        <div className="container-x py-24">
          <FadeIn>
            <div className="text-eyebrow">Marine</div>
            <h2 className="mt-3 text-display uppercase text-4xl md:text-5xl">Boats &amp; Jetskis.</h2>
            <p className="mt-6 text-muted-foreground max-w-2xl">
              Pre-season, mid-season, and end-of-season detailing for Long Island boat owners.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-10 bg-background border border-border rounded-sm p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold">Boat &amp; Jetski Detailing</h3>
                <p className="mt-2 text-display text-3xl text-primary">From $400</p>
                <p className="mt-4 text-muted-foreground">
                  Quote based on size. Hull wash, oxidation removal, deck cleaning, interior vinyl care, chrome and stainless polish, and a protective wax. Available dockside or in your driveway.
                </p>
              </div>
              <Link to="/contact" className="inline-flex items-center justify-center h-12 px-6 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 transition">
                Request a Marine Quote
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HOME */}
      <section id="home" className="container-x py-24 scroll-mt-20">
        <FadeIn>
          <div className="text-eyebrow">Home</div>
          <h2 className="mt-3 text-display uppercase text-4xl md:text-5xl">Pressure Washing &amp; Home Exterior.</h2>
          <p className="mt-6 text-muted-foreground max-w-2xl">
            A secondary offering for existing clients who want their property cleaned by someone they already trust.
          </p>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FadeIn><PriceCard name="Pressure Washing" price="From $250" desc="Driveways, patios, siding, decks. Quote based on square footage." /></FadeIn>
          <FadeIn delay={0.05}><PriceCard name="Fence & Window Cleaning" price="From $150" desc="Residential fence washing and exterior window work." /></FadeIn>
        </div>
      </section>

      <CTABand />
    </>
  );
}
