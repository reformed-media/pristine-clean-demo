import { Link } from "react-router-dom";

export function CTABand({
  title = "Ready to book?",
  subtitle = "Get a quote in under 2 minutes.",
  cta = "Book a Detail",
  href = "/book",
}: {
  title?: string;
  subtitle?: string;
  cta?: string;
  href?: string;
}) {
  return (
    <section className="border-y border-border bg-surface">
      <div className="container-x py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <h2 className="text-display text-3xl md:text-5xl text-foreground leading-tight">{title}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl">{subtitle}</p>
        </div>
        <Link
          to={href}
          className="inline-flex items-center justify-center h-12 px-8 rounded-sm bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
