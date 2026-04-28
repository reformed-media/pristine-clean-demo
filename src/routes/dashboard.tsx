import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SEO } from "@/components/site/SEO";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BookingRow = {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  payment_status: string;
  vehicle: {
    id: string;
    year: number | null;
    make: string;
    model: string;
    color: string | null;
  } | null;
  booking_services: {
    price_cents_at_booking: number;
    service: { name: string };
  }[];
};

type VehicleRow = {
  id: string;
  year: number | null;
  make: string;
  model: string;
  color: string | null;
  plate: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function bookingTotal(
  bs: { price_cents_at_booking: number }[],
): number {
  return bs.reduce((sum, r) => sum + r.price_cents_at_booking, 0);
}

function serviceNames(
  bs: { service: { name: string } }[],
): string {
  return bs.map((r) => r.service.name).join(", ");
}

function vehicleLabel(v: {
  year: number | null;
  make: string;
  model: string;
}): string {
  return `${v.year ? `${v.year} ` : ""}${v.make} ${v.model}`;
}

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  complete: "Complete",
  cancelled: "Cancelled",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { client, signOut } = useAuth();
  const [active, setActive] = useState("dashboard");

  // Success banner
  const justBooked = searchParams.get("booked") === "1";
  const [showBanner, setShowBanner] = useState(justBooked);

  useEffect(() => {
    if (justBooked) {
      // Clear query param without navigation
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [justBooked, setSearchParams]);

  // Data
  const [upcoming, setUpcoming] = useState<BookingRow | null>(null);
  const [history, setHistory] = useState<BookingRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!client) return;

    const load = async () => {
      const now = new Date().toISOString();

      // Upcoming booking
      const { data: upData } = await supabase
        .from("bookings")
        .select(
          "id, scheduled_at, status, notes, payment_status, vehicle:vehicles(id, year, make, model, color), booking_services(price_cents_at_booking, service:services(name))",
        )
        .eq("client_id", client.id)
        .in("status", ["requested", "confirmed", "in_progress"])
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      setUpcoming(upData as BookingRow | null);

      // Service history
      const { data: histData } = await supabase
        .from("bookings")
        .select(
          "id, scheduled_at, status, notes, payment_status, vehicle:vehicles(id, year, make, model, color), booking_services(price_cents_at_booking, service:services(name))",
        )
        .eq("client_id", client.id)
        .eq("status", "complete")
        .order("scheduled_at", { ascending: false })
        .limit(10);

      setHistory((histData as BookingRow[] | null) ?? []);

      // Vehicles
      const { data: vData } = await supabase
        .from("vehicles")
        .select("id, year, make, model, color, plate")
        .eq("client_id", client.id);

      setVehicles(vData ?? []);
      setDataLoading(false);
    };

    load();
  }, [client]);

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
          {showBanner && (
            <button
              onClick={() => setShowBanner(false)}
              className="w-full text-left bg-primary/10 border border-primary/30 rounded-sm px-4 py-3 text-sm text-foreground"
            >
              Booking received. Nick will text you to confirm.
            </button>
          )}

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
            {dataLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : upcoming ? (
              <UpcomingBooking booking={upcoming} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming bookings.{" "}
                <Link
                  to="/book"
                  className="text-primary hover:brightness-110"
                >
                  Book your next service
                </Link>
              </p>
            )}
          </Card>

          {/* History */}
          <Card title="Service History">
            {dataLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : history.length > 0 ? (
              <HistoryTable rows={history} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No service history yet. Your completed bookings will appear
                here.
              </p>
            )}
          </Card>

          {/* Vehicles */}
          <Card title="Saved Vehicles">
            {dataLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="border border-border rounded-sm p-4"
                  >
                    <div className="font-bold">{vehicleLabel(v)}</div>
                    {v.color && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {v.color}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved vehicles. Vehicles will appear here once you book
                your first service.
              </p>
            )}
          </Card>

          {/* Quick rebook */}
          <Card title="Quick Rebook">
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Full Detail", slug: "auto-full-detail" },
                { label: "Interior Only", slug: "auto-interior-only" },
                { label: "Exterior Only", slug: "auto-exterior-only" },
                { label: "Engine Bay Add-on", slug: "addon-engine-bay" },
              ].map((s) => (
                <Link
                  key={s.slug}
                  to={`/book?service=${s.slug}`}
                  className="h-10 px-5 inline-flex items-center rounded-sm bg-surface border border-border hover:border-primary text-sm"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Upcoming booking card
// ---------------------------------------------------------------------------

function UpcomingBooking({ booking }: { booking: BookingRow }) {
  const total = bookingTotal(booking.booking_services);
  const names = serviceNames(booking.booking_services);
  const statusLabel = STATUS_LABEL[booking.status] ?? booking.status;
  const isRequested = booking.status === "requested";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-sm ${
              isRequested
                ? "bg-muted/20 text-muted-foreground"
                : "bg-primary/15 text-primary"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          Service
        </div>
        <div className="text-foreground">
          {names} · {formatCents(total)}
        </div>
        <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          When
        </div>
        <div className="text-foreground">
          {formatDate(booking.scheduled_at)} ·{" "}
          {formatTime(booking.scheduled_at)}
        </div>
        {booking.vehicle && (
          <>
            <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
              Vehicle
            </div>
            <div className="text-foreground">
              {vehicleLabel(booking.vehicle)}
            </div>
          </>
        )}
      </div>
      <div className="flex md:flex-col gap-3 md:justify-end md:items-end">
        {isRequested && (
          <p className="text-xs text-muted-foreground">
            Waiting on Nick to confirm. He'll text you.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Need to reschedule? Text Nick at{" "}
          <a href="tel:+16312645303" className="text-foreground">
            (631) 264-5303
          </a>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service history table
// ---------------------------------------------------------------------------

function HistoryTable({ rows }: { rows: BookingRow[] }) {
  return (
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
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-border last:border-0">
            <td className="py-3">{formatDate(r.scheduled_at)}</td>
            <td className="py-3">{serviceNames(r.booking_services)}</td>
            <td className="py-3 text-muted-foreground">
              {r.vehicle ? vehicleLabel(r.vehicle) : "—"}
            </td>
            <td className="py-3 text-right text-primary">
              {formatCents(bookingTotal(r.booking_services))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

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
