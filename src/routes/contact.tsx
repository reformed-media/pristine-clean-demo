import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FadeIn } from "@/components/site/FadeIn";
import { ServiceMap } from "@/components/site/ServiceMap";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Pristine Clean LI" },
      { name: "description", content: "Call, text, or message Pristine Clean LI on Long Island." },
      { property: "og:title", content: "Contact Pristine Clean LI" },
      { property: "og:description", content: "Call, text, or message us." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <section className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden border-b border-border">
        {/* TODO: swap for real Pristine Clean photo */}
        <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=2400&q=80" alt="Dark luxury car at night" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative container-x pb-12">
          <h1 className="text-display uppercase text-5xl md:text-7xl">Get in touch.</h1>
          <p className="mt-4 text-muted-foreground">Call, text, or send a message.</p>
        </div>
      </section>

      <section className="container-x py-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <FadeIn>
          <div className="text-eyebrow">Direct</div>
          <h2 className="mt-3 text-display uppercase text-3xl md:text-4xl">Reach Nick.</h2>
          <ul className="mt-8 space-y-5">
            <li>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Phone</div>
              <a href="tel:+16312645303" className="text-xl text-foreground hover:text-primary">+1 (631) 264-5303</a>
            </li>
            <li>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Email</div>
              <a href="mailto:nick@pristineclean.com" className="text-xl text-foreground hover:text-primary">nick@pristineclean.com</a>
            </li>
            <li>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Service Area</div>
              <div className="text-foreground">Long Island, NY (Nassau &amp; Suffolk)</div>
            </li>
            <li>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Instagram</div>
              <a href="https://instagram.com/pristine._.clean" target="_blank" rel="noreferrer" className="text-foreground hover:text-primary">@pristine._.clean</a>
            </li>
            <li>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">TikTok</div>
              <a href="https://tiktok.com/@pristineclean" target="_blank" rel="noreferrer" className="text-foreground hover:text-primary">@pristineclean</a>
            </li>
            <li>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Hours</div>
              <div className="text-foreground">By appointment</div>
            </li>
          </ul>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* TODO: wire form to email or CRM post-signature */}
          <div className="bg-surface border border-border rounded-sm p-8">
            {sent ? (
              <div className="py-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl">✓</div>
                <h3 className="mt-6 text-2xl font-bold">Got it.</h3>
                <p className="mt-2 text-muted-foreground">Nick will text you back within a few hours.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-5"
              >
                <h3 className="text-xl font-bold">Send a message</h3>
                <Field label="Name"><input required className="form-input" /></Field>
                <Field label="Email"><input required type="email" className="form-input" /></Field>
                <Field label="Phone"><input type="tel" className="form-input" /></Field>
                <Field label="What do you need detailed?">
                  <select className="form-input" defaultValue="">
                    <option value="" disabled>Select one</option>
                    <option>Car</option>
                    <option>Boat</option>
                    <option>Home</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Message">
                  <textarea rows={5} className="form-input" />
                </Field>
                <button type="submit" className="w-full h-12 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 transition">
                  Send
                </button>
              </form>
            )}
          </div>
        </FadeIn>
      </section>

      <section className="bg-surface border-y border-border">
        <div className="container-x py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-display uppercase text-3xl md:text-5xl">Service area.</h2>
            <p className="mt-4 text-muted-foreground max-w-md">Nassau and Suffolk County. Outside the radius? Text us anyway, sometimes we make exceptions.</p>
          </div>
          <ServiceMap />
        </div>
      </section>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
      <style>{`.form-input{width:100%;height:44px;background:var(--background);border:1px solid var(--border);border-radius:4px;padding:0 12px;color:var(--foreground);font-size:14px;outline:none;transition:border-color .15s}
        .form-input:focus{border-color:var(--primary)}
        textarea.form-input{height:auto;padding:12px;line-height:1.5}`}</style>
    </label>
  );
}
