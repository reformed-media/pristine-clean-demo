import { Link } from "react-router-dom";
import { CTABand } from "@/components/site/CTABand";
import { FadeIn } from "@/components/site/FadeIn";
import { ServiceMap } from "@/components/site/ServiceMap";
import { SEO } from "@/components/site/SEO";

const HERO_IMG = "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80";

const services = [
  {
    title: "Auto Detailing",
    desc: "Full interior and exterior care for daily drivers, exotics, and show cars.",
    img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
    href: "/services",
    hash: "auto",
  },
  {
    title: "Marine Detailing",
    desc: "Boats and jetskis cleaned, polished, and ready for the season.",
    img: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=1200&q=80",
    href: "/services",
    hash: "marine",
  },
  {
    title: "Home Services",
    desc: "Pressure washing, fence cleaning, and window work for Long Island homes.",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    href: "/services",
    hash: "home",
  },
];

const testimonials = [
  { quote: "Nick did my Porsche Cayenne and I genuinely cannot tell it's the same car. Booked him for my wife's car the next week.", name: "Marcus R.", car: "Garden City" },
  { quote: "Best detail I've had on Long Island. He shows up on time, does the work in my driveway, and the results speak for themselves.", name: "Danielle K.", car: "Huntington" },
  { quote: "Had him do my boat before the season. Hull, interior, everything. Looked brand new pulling out of the slip.", name: "Tom V.", car: "Oyster Bay" },
];

export default function HomePage() {
  return (
    <>
      <SEO
        title="Pristine Clean LI — Mobile Auto & Marine Detailing on Long Island"
        description="Mobile detailing across Nassau and Suffolk. Auto, marine, and home services. Booked by appointment."
        image={HERO_IMG}
      />
      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        {/* TODO: swap for real Pristine Clean photo */}
        <img
          src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=2400&q=80"
          alt="Black luxury car with water beads on glossy paint"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative container-x pb-20 md:pb-32">
          <FadeIn>
            <h1 className="text-display uppercase text-5xl sm:text-7xl md:text-8xl max-w-5xl">
              Mobile detailing.<br />We come to you.
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Premium auto and marine care across Long Island. Booked by appointment.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/book" className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 transition">
                Book a Detail
              </Link>
              <Link to="/services" className="inline-flex items-center justify-center h-12 px-8 rounded-sm border border-border text-foreground hover:bg-surface transition">
                See Services
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Serving Nassau &amp; Suffolk County · <span className="italic">Est. 2023</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-surface border-b border-border">
        <div className="container-x grid grid-cols-2 md:grid-cols-4">
          {[
            { n: "250+", l: "Clients served" },
            { n: "5.0", l: "Average rating" },
            { n: "2023", l: "Established" },
            { n: "100%", l: "Mobile service" },
          ].map((s, i) => (
            <div key={s.n} className={`py-8 px-6 text-center ${i > 0 ? "md:border-l border-border" : ""} ${i % 2 === 1 ? "border-l border-border md:border-l" : ""}`}>
              <div className="text-display text-3xl md:text-4xl text-foreground">{s.n}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="container-x py-24 md:py-32">
        <FadeIn>
          <h2 className="text-display uppercase text-4xl md:text-6xl">What we detail.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">From daily drivers to weekend exotics, boats to jetskis.</p>
        </FadeIn>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.1}>
              <Link to={`${s.href}#${s.hash}`} className="group block bg-surface border border-border rounded-sm overflow-hidden hover:border-primary/50 transition">
                <div className="aspect-[4/3] overflow-hidden">
                  {/* TODO: swap for real Pristine Clean photo */}
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:brightness-110 transition" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  <span className="mt-4 inline-block text-sm text-primary">Learn more →</span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SIGNATURE PACKAGE */}
      <section className="bg-surface border-y border-border">
        <div className="container-x py-24 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <FadeIn>
            {/* TODO: swap for real Pristine Clean photo */}
            <img
              src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=80"
              alt="Detailer working on a luxury car interior"
              className="w-full aspect-[4/5] object-cover rounded-sm"
            />
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="text-eyebrow">Signature</div>
            <h2 className="mt-3 text-display uppercase text-4xl md:text-6xl">The Full Detail.</h2>
            <div className="mt-6 flex items-baseline gap-4">
              <span className="text-display text-5xl text-primary">$225</span>
              <span className="text-sm text-muted-foreground">about 3 hours on site</span>
            </div>
            <p className="mt-6 text-muted-foreground">
              Interior deep clean, exterior hand wash, wheels and tires, glass inside and out, tire dressing, and a spray sealant for protection.
            </p>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
              {[
                "Full interior vacuum",
                "Steam clean and shampoo",
                "Leather and plastic conditioning",
                "Hand wash exterior",
                "Wheels, tires, and arches",
                "Glass inside and out",
                "Tire dressing",
                "Spray sealant finish",
              ].map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="text-primary">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link to="/book" className="mt-8 inline-flex items-center justify-center h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 transition">
              Book the Full Detail
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x py-24 md:py-32">
        <FadeIn>
          <h2 className="text-display uppercase text-4xl md:text-6xl">How booking works.</h2>
        </FadeIn>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { n: "01", t: "Pick your service", d: "Choose from auto, marine, or home." },
            { n: "02", t: "Choose a time", d: "Pick a slot that works for you." },
            { n: "03", t: "We come to you", d: "Nick arrives with water, power, and everything needed." },
            { n: "04", t: "Cleaner than new", d: "You get your car back cleaner than new." },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.08}>
              <div className="border-t border-border pt-6">
                <div className="text-primary text-sm font-mono">{step.n}</div>
                <h3 className="mt-3 text-xl font-bold">{step.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface border-y border-border">
        <div className="container-x py-24 md:py-32">
          <FadeIn>
            <h2 className="text-display uppercase text-4xl md:text-6xl">What clients say.</h2>
          </FadeIn>
          {/* TODO: swap for real testimonials when available */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="h-full bg-background border border-border rounded-sm p-8">
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l2.6 5.9 6.4.6-4.8 4.4 1.4 6.3L10 15.1 4.4 18.2l1.4-6.3L1 7.5l6.4-.6L10 1z"/></svg>
                    ))}
                  </div>
                  <p className="mt-6 text-foreground leading-relaxed">"{t.quote}"</p>
                  <p className="mt-6 text-xs text-muted-foreground uppercase tracking-widest">{t.name} · {t.car}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE AREA */}
      <section className="container-x py-24 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <FadeIn>
          <h2 className="text-display uppercase text-4xl md:text-5xl">Where we work.</h2>
          <p className="mt-6 text-muted-foreground max-w-md">
            Based on Long Island, serving Nassau and Suffolk County. Mobile service within a reasonable radius. Call or text to confirm your area.
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <ServiceMap />
        </FadeIn>
      </section>

      <CTABand />
    </>
  );
}
