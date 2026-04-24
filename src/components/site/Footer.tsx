import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="container-x py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="font-extrabold italic tracking-tight text-lg mb-4">
            <span className="text-primary">PRISTINE</span>{" "}
            <span className="text-foreground">CLEAN LI</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Mobile detailing for Long Island's nicest cars, boats, and homes. Est. 2023.
          </p>
        </div>
        <div>
          <h4 className="text-eyebrow mb-4">Services</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services#auto" className="hover:text-foreground">Auto Detailing</Link></li>
            <li><Link to="/services#marine" className="hover:text-foreground">Marine Detailing</Link></li>
            <li><Link to="/services#home" className="hover:text-foreground">Home Services</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-eyebrow mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="tel:+16312645303" className="hover:text-foreground">(631) 264-5303</a></li>
            <li><a href="mailto:nick@pristineclean.com" className="hover:text-foreground">nick@pristineclean.com</a></li>
            <li>Nassau &amp; Suffolk County</li>
          </ul>
        </div>
        <div>
          <h4 className="text-eyebrow mb-4">Follow</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="https://instagram.com/pristine._.clean" target="_blank" rel="noreferrer" className="hover:text-foreground">Instagram @pristine._.clean</a></li>
            <li><a href="https://tiktok.com/@pristineclean" target="_blank" rel="noreferrer" className="hover:text-foreground">TikTok @pristineclean</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2026 Pristine Clean LI. Long Island, NY.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
