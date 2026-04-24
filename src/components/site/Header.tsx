import { Link } from "@tanstack/react-router";

export function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/gallery", label: "Gallery" },
    { to: "/about", label: "About" },
    { to: "/book", label: "Book" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container-x flex items-center justify-between h-16">
        <Link to="/" className="font-extrabold italic tracking-tight text-lg">
          <span className="text-primary">PRISTINE</span>{" "}
          <span className="text-foreground">CLEAN LI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-sm text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/book"
            search={{ tab: "existing" }}
            className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center justify-center h-9 px-4 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition"
          >
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
