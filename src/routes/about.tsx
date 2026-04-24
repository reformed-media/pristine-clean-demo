import { Link } from "react-router-dom";
import { CTABand } from "@/components/site/CTABand";
import { FadeIn } from "@/components/site/FadeIn";
import { SEO } from "@/components/site/SEO";

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About — Pristine Clean LI"
        description="Mobile detailing built on word of mouth. Founded 2023 on Long Island by Nick."
      />
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden border-b border-border">
        {/* TODO: swap for real Pristine Clean photo */}
        <img src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=2400&q=80" alt="Detailer hand polishing a car" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative container-x pb-12">
          <h1 className="text-display uppercase text-5xl md:text-7xl">About Pristine Clean LI.</h1>
          <p className="mt-4 text-muted-foreground">Mobile detailing built on word of mouth.</p>
        </div>
      </section>

      <section className="container-x py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <FadeIn>
          {/* TODO: replace with real photo of Nick */}
          <img
            src="https://images.unsplash.com/photo-1614026480418-bd11fde2f0fb?auto=format&fit=crop&w=1200&q=80"
            alt="Nick, founder of Pristine Clean LI"
            className="w-full aspect-[4/5] object-cover rounded-sm"
          />
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="text-eyebrow">Founder</div>
          <h2 className="mt-3 text-display uppercase text-4xl md:text-5xl">Nick.</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Nick started Pristine Clean in 2023 out of his driveway. One car at a time, one referral at a time. Two years in, the client list is over 250 and still growing the same way it started. People telling their friends.
            </p>
            <p>
              The whole operation is mobile. Nick brings water, power, and everything else. You don't move your car, you don't lose your Saturday. The work gets done where it's parked.
            </p>
            <p>
              Every detail is done by Nick himself. No contractors, no rotating crew. That's why the results are consistent and why clients keep coming back.
            </p>
            <p>Based on Long Island, working across Nassau and Suffolk.</p>
          </div>
        </FadeIn>
      </section>

      <section className="bg-surface border-y border-border">
        <div className="container-x py-24">
          <FadeIn>
            <h2 className="text-display uppercase text-4xl md:text-5xl">What makes it different.</h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { t: "Mobile only.", d: "We come to you. Driveway, office, marina, garage." },
              { t: "One detailer, one standard.", d: "Every job is done by Nick. No handoffs." },
              { t: "Built on referrals.", d: "Two years, 250+ clients, no paid ads." },
            ].map((b, i) => (
              <FadeIn key={b.t} delay={i * 0.08}>
                <div className="border-t border-border pt-6">
                  <h3 className="text-xl font-bold">{b.t}</h3>
                  <p className="mt-2 text-muted-foreground">{b.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTABand title="See pricing." subtitle="Transparent. No surprises." cta="View Services" href="/services" />
      <div className="hidden">
        <Link to="/book">book</Link>
      </div>
    </>
  );
}
