import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SEO } from "@/components/site/SEO";

export default function Dashboard() {
  const navigate = useNavigate();
  const { client, signOut } = useAuth();
  const [active, setActive] = useState("dashboard");

  const greeting = client?.first_name
    ? `Welcome back, ${client.first_name}.`
    : "Welcome back.";

  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "bookings", label: "My Bookings" },
    { id: "vehicles", label: "My Vehicles" },
    { id: "payment", label: "Payment" },
    { id: "settings", label: "Settings" },
  ];

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

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
            <button
              onClick={handleLogout}
              className="mt-4 text-left px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground border-t border-border"
            >
              Log Out
            </button>
          </nav>
        </aside>

        <div className="space-y-6">
          <div>
            <h1 className="text-display uppercase text-4xl md:text-5xl">
              {greeting}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Here's what's on the calendar.
            </p>
          </div>

          {/* Upcoming */}
          <Card title="Upcoming Booking">
            <p className="text-sm text-muted-foreground">
              No upcoming bookings.{" "}
              <Link to="/book" className="text-primary hover:brightness-110">
                Book your next service
              </Link>
            </p>
          </Card>

          {/* History */}
          <Card title="Service History">
            <p className="text-sm text-muted-foreground">
              No service history yet. Your completed bookings will appear here.
            </p>
          </Card>

          {/* Vehicles */}
          <Card title="Saved Vehicles">
            <p className="text-sm text-muted-foreground">
              No saved vehicles. Vehicles will appear here once you book your
              first service.
            </p>
          </Card>

          {/* Quick rebook */}
          <Card title="Quick Rebook">
            <div className="flex flex-wrap gap-3">
              {[
                "Full Detail",
                "Interior Only",
                "Exterior Only",
                "Engine Bay Add-on",
              ].map((s) => (
                <Link
                  key={s}
                  to="/book"
                  className="h-10 px-5 inline-flex items-center rounded-sm bg-surface border border-border hover:border-primary text-sm"
                >
                  {s}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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
