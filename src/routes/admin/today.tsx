import { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { BookingDrawer } from "@/admin/BookingDrawer";
import {
  type AdminBooking,
  ADMIN_BOOKING_SELECT,
  StatusBadge,
  formatCents,
  formatDate,
  formatTime,
  bookingTotal,
  vehicleLabel,
} from "@/admin/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface border border-border rounded-sm px-4 py-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

function JobCard({
  booking,
  onOpen,
  onStatusChange,
}: {
  booking: AdminBooking;
  onOpen: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const total = bookingTotal(booking);
  const serviceNames = booking.booking_services
    .map((bs) => bs.service.name)
    .join(", ");

  const nextActions: Record<string, { label: string; next: string }> = {
    requested: { label: "Confirm", next: "confirmed" },
    confirmed: { label: "Start Job", next: "in_progress" },
    in_progress: { label: "Mark Complete", next: "complete" },
  };
  const action = nextActions[booking.status];
  const showMarkPaid =
    booking.status === "complete" && booking.payment_status === "unpaid";

  return (
    <div
      onClick={onOpen}
      className="bg-surface border border-border rounded-sm p-4 cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm font-bold text-foreground shrink-0">
            {formatTime(booking.scheduled_at)}
          </div>
          <StatusBadge status={booking.status} />
          <div className="text-sm font-semibold text-foreground truncate">
            {booking.client.first_name} {booking.client.last_name}
          </div>
          {booking.client.phone && (
            <a
              href={`tel:${booking.client.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-primary shrink-0 hover:brightness-110"
            >
              {booking.client.phone}
            </a>
          )}
        </div>
        <div className="text-sm font-semibold text-foreground shrink-0">
          {formatCents(total)}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {booking.address && (
          <div className="text-xs text-muted-foreground">
            {booking.address.street}, {booking.address.city}
          </div>
        )}
        {booking.vehicle && (
          <div className="text-xs text-muted-foreground">
            {vehicleLabel(booking.vehicle)}
          </div>
        )}
        <div className="text-xs text-muted-foreground sm:col-span-2">
          {serviceNames}
        </div>
      </div>

      {(action || showMarkPaid) && (
        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {action && (
            <button
              onClick={() => onStatusChange(booking.id, action.next)}
              className="h-8 px-4 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:brightness-110 transition-all"
            >
              {action.label}
            </button>
          )}
          {showMarkPaid && (
            <button
              onClick={() =>
                onStatusChange(booking.id, "paid")
              }
              className="h-8 px-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-sm text-xs font-medium hover:bg-green-500/30 transition-colors"
            >
              Mark Paid
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PendingCard({
  booking,
  onOpen,
  onConfirm,
}: {
  booking: AdminBooking;
  onOpen: () => void;
  onConfirm: () => void;
}) {
  const serviceNames = booking.booking_services
    .map((bs) => bs.service.name)
    .join(", ");

  return (
    <div
      onClick={onOpen}
      className="bg-surface border border-border rounded-sm px-4 py-3 cursor-pointer hover:border-primary/40 transition-colors flex items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">
          {booking.client.first_name} {booking.client.last_name}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDate(booking.scheduled_at)} at{" "}
          {formatTime(booking.scheduled_at)} · {serviceNames}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onConfirm();
        }}
        className="shrink-0 h-8 px-4 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:brightness-110 transition-all"
      >
        Confirm
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TodayView() {
  const [jobs, setJobs] = useState<AdminBooking[]>([]);
  const [pending, setPending] = useState<AdminBooking[]>([]);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const { start, end } = todayBounds();
    const now = new Date().toISOString();

    const [
      { data: jobsData },
      { data: pendingData },
      { data: weekData },
      { count: pCount },
      { count: leadsCount },
    ] = await Promise.all([
      // Today's jobs (non-cancelled)
      supabase
        .from("bookings")
        .select(ADMIN_BOOKING_SELECT)
        .gte("scheduled_at", start)
        .lte("scheduled_at", end)
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true }),

      // Pending requests (future, status=requested)
      supabase
        .from("bookings")
        .select(ADMIN_BOOKING_SELECT)
        .eq("status", "requested")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true }),

      // This week revenue
      supabase
        .from("bookings")
        .select("final_price_cents")
        .eq("status", "complete")
        .gte(
          "scheduled_at",
          startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
        )
        .lte(
          "scheduled_at",
          endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
        ),

      // Total pending count
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "requested"),

      // New leads
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
    ]);

    setJobs((jobsData as AdminBooking[] | null) ?? []);

    // Pending = all requested future, minus any that are today (already in jobs)
    const todayPendingIds = new Set(
      ((jobsData as AdminBooking[] | null) ?? [])
        .filter((j) => j.status === "requested")
        .map((j) => j.id),
    );
    setPending(
      ((pendingData as AdminBooking[] | null) ?? []).filter(
        (b) => !todayPendingIds.has(b.id),
      ),
    );

    const rev = (weekData ?? []).reduce(
      (s, b) => s + (b.final_price_cents ?? 0),
      0,
    );
    setWeekRevenue(rev);
    setPendingCount(pCount ?? 0);
    setNewLeadsCount(leadsCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleStatusChange(id: string, statusOrAction: string) {
    if (statusOrAction === "paid") {
      await supabase
        .from("bookings")
        .update({ payment_status: "paid", payment_method: "cash" })
        .eq("id", id);
    } else {
      await supabase
        .from("bookings")
        .update({ status: statusOrAction })
        .eq("id", id);
    }
    loadAll();
  }

  const todayLabel = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {todayLabel}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Today's Jobs" value={loading ? "—" : jobs.length} />
        <StatCard
          label="This Week"
          value={loading ? "—" : formatCents(weekRevenue)}
        />
        <StatCard
          label="Pending Requests"
          value={loading ? "—" : pendingCount}
        />
        <StatCard label="New Leads" value={loading ? "—" : newLeadsCount} />
      </div>

      {/* Today's jobs */}
      <section className="mb-8">
        <div className="text-eyebrow mb-4">Jobs Today</div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No jobs today. Take the day off.
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                booking={job}
                onOpen={() => setSelectedId(job.id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pending requests */}
      {!loading && pending.length > 0 && (
        <section>
          <div className="text-eyebrow mb-4">Pending Requests</div>
          <div className="space-y-2">
            {pending.map((b) => (
              <PendingCard
                key={b.id}
                booking={b}
                onOpen={() => setSelectedId(b.id)}
                onConfirm={() => handleStatusChange(b.id, "confirmed")}
              />
            ))}
          </div>
        </section>
      )}

      <BookingDrawer
        bookingId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdate={loadAll}
      />
    </div>
  );
}
