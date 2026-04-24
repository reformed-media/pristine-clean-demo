import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SEO } from "@/components/site/SEO";

// TODO: wire to real auth and database (Supabase) post-signature
export default function Dashboard() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<null | "reschedule" | "cancel">(null);
  const [active, setActive] = useState("dashboard");

  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "bookings", label: "My Bookings" },
    { id: "vehicles", label: "My Vehicles" },
    { id: "payment", label: "Payment" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <>
      <SEO
        title="My Dashboard — Pristine Clean LI"
        description="Manage your Pristine Clean LI bookings, vehicles, and history."
      />
    <div className="container-x py-12 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 min-h-[80vh]">
      <aside className="bg-surface border border-border rounded-sm p-4 h-fit md:sticky md:top-24">
        <div className="text-eyebrow px-3 mb-3">Account</div>
        <nav className="flex flex-col">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => setActive(l.id)}
              className={`text-left px-3 py-2 rounded-sm text-sm transition ${active === l.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l.label}
            </button>
          ))}
          <button onClick={() => navigate("/")} className="mt-4 text-left px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground border-t border-border">Log Out</button>
        </nav>
      </aside>

      <div className="space-y-6">
        <div>
          <h1 className="text-display uppercase text-4xl md:text-5xl">Welcome back, Marcus.</h1>
          <p className="mt-2 text-muted-foreground">Here's what's on the calendar.</p>
        </div>

        {/* Upcoming */}
        <Card title="Upcoming Booking">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Service</div>
              <div className="text-foreground">Full Detail · $225</div>
              <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">When</div>
              <div className="text-foreground">Saturday, May 4 · 11:00 AM</div>
              <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Where</div>
              <div className="text-foreground">42 Stewart Ave, Garden City NY</div>
            </div>
            <div className="flex md:flex-col gap-3 md:justify-end md:items-end">
              <button onClick={() => setModal("reschedule")} className="h-10 px-5 rounded-sm border border-border hover:bg-background text-sm">Reschedule</button>
              <button onClick={() => setModal("cancel")} className="h-10 px-5 rounded-sm border border-border hover:bg-background text-sm text-muted-foreground">Cancel</button>
            </div>
          </div>
        </Card>

        {/* History */}
        <Card title="Service History">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-3 font-normal">Date</th>
                <th className="text-left py-3 font-normal">Service</th>
                <th className="text-left py-3 font-normal">Vehicle</th>
                <th className="text-right py-3 font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { d: "Mar 12, 2026", s: "Full Detail", v: "Porsche Cayenne", t: "$225" },
                { d: "Jan 8, 2026", s: "Interior Only", v: "BMW X5", t: "$150" },
                { d: "Nov 20, 2025", s: "Full Detail + Sealant", v: "Porsche Cayenne", t: "$575" },
              ].map((r) => (
                <tr key={r.d} className="border-b border-border last:border-0">
                  <td className="py-3">{r.d}</td>
                  <td className="py-3">{r.s}</td>
                  <td className="py-3 text-muted-foreground">{r.v}</td>
                  <td className="py-3 text-right text-primary">{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Vehicles */}
        <Card title="Saved Vehicles" action={<button className="text-sm text-primary hover:brightness-110">+ Add vehicle</button>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { y: "2023", m: "Porsche Cayenne", c: "Black" },
              { y: "2024", m: "BMW X5", c: "Alpine White" },
            ].map((v) => (
              <div key={v.m} className="border border-border rounded-sm p-4">
                <div className="font-bold">{v.y} {v.m}</div>
                <div className="text-xs text-muted-foreground mt-1">{v.c}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick rebook */}
        <Card title="Quick Rebook">
          <div className="flex flex-wrap gap-3">
            {["Full Detail", "Interior Only", "Exterior Only", "Engine Bay Add-on"].map((s) => (
              <Link key={s} to="/book" className="h-10 px-5 inline-flex items-center rounded-sm bg-surface border border-border hover:border-primary text-sm">
                {s}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] bg-background/90 flex items-center justify-center p-6" onClick={() => setModal(null)}>
          <div className="bg-surface border border-border rounded-sm p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold">{modal === "reschedule" ? "Reschedule booking?" : "Cancel booking?"}</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              {modal === "reschedule" ? "Pick a new date and time on the next screen." : "This will release your slot. You can rebook anytime."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="h-10 px-5 rounded-sm border border-border text-sm">Never mind</button>
              <button onClick={() => setModal(null)} className="h-10 px-5 rounded-sm bg-primary text-primary-foreground text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-sm p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-eyebrow">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
