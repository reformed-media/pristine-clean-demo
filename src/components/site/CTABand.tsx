import { Link } from "@tanstack/react-router";

export function CTABand({
  headline = "Ready to book?",
  sub = "Takes under 2 minutes.",
  cta = "Book a Detail",
  to = "/book",
}: {
  headline?: string;
  sub?: string;
  cta?: string;
  to?: string;
}) {
  return (
    <section className="bg-surface border-y border-border">
      <div className="container-x py-24 text-center">
        <h2 className="text-display text-4xl md:text-6xl uppercase">{headline}</h2>
        <p className="mt-4 text-muted-foreground">{sub}</p>
        <div className="mt-8">
          <Link
            to={to}
            className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 transition"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
