import { Link, NavLink } from "react-router-dom";

export function Header() {
  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/services", label: "Services", end: false },
    { to: "/gallery", label: "Gallery", end: false },
    { to: "/about", label: "About", end: false },
    { to: "/book", label: "Book", end: false },
    { to: "/contact", label: "Contact", end: false },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container-x flex items-center justify-between h-16">
        <Link to="/" className="font-extrabold italic tracking-tight text-lg">
          <span className="text-primary">PRISTINE</span>{" "}
          <span className="text-foreground">CLEAN LI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/book?tab=existing"
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
