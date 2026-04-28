import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import {
  type AdminBooking,
  ADMIN_BOOKING_SELECT,
  vehicleLabel,
} from "@/admin/types";
import { BookingDrawer } from "@/admin/BookingDrawer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUR_START = 8;
const HOUR_END = 18;
const HOUR_COUNT = HOUR_END - HOUR_START;
const HOUR_PX = 64;
const TOTAL_HEIGHT = HOUR_COUNT * HOUR_PX;

const STATUS_BLOCK_CLASS: Record<string, string> = {
  requested:
    "bg-border/50 border border-border text-muted-foreground",
  confirmed:
    "bg-primary/20 border border-primary/40 text-primary",
  in_progress:
    "bg-amber-500/20 border border-amber-500/40 text-amber-300",
  complete:
    "bg-green-900/30 border border-green-900/50 text-green-400",
  cancelled:
    "bg-red-900/20 border border-red-900/30 text-red-500 opacity-50",
};

const HOURS = Array.from({ length: HOUR_COUNT }, (_, i) => i + HOUR_START);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hourLabel(h: number) {
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function bookingTop(booking: AdminBooking): number {
  const dt = new Date(booking.scheduled_at);
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const offset = (hour - HOUR_START + minute / 60) * HOUR_PX;
  return Math.max(0, Math.min(offset, TOTAL_HEIGHT - 40));
}

function bookingHeight(booking: AdminBooking): number {
  const duration = booking.estimated_duration_minutes ?? 90;
  return Math.max(40, (duration / 60) * HOUR_PX);
}

function getWeekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ---------------------------------------------------------------------------
// Booking block
// ---------------------------------------------------------------------------

function BookingBlock({
  booking,
  onClick,
}: {
  booking: AdminBooking;
  onClick: () => void;
}) {
  const top = bookingTop(booking);
  const height = bookingHeight(booking);
  const cls = STATUS_BLOCK_CLASS[booking.status] ?? STATUS_BLOCK_CLASS.requested;
  const services = booking.booking_services.map((bs) => bs.service.name);
  const label =
    services.length === 0
      ? "Booking"
      : services.length === 1
        ? services[0]
        : `${services[0]} +${services.length - 1}`;

  return (
    <div
      onClick={onClick}
      className={`absolute left-0.5 right-0.5 rounded-sm px-1.5 py-1 cursor-pointer hover:brightness-110 overflow-hidden ${cls}`}
      style={{ top, height }}
    >
      <div className="text-xs font-medium truncate leading-tight">{label}</div>
      <div className="text-xs opacity-75 truncate">
        {booking.client.first_name} {booking.client.last_name[0]}.
      </div>
      {height >= 56 && booking.vehicle && (
        <div className="text-xs opacity-60 truncate">
          {vehicleLabel(booking.vehicle)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalendarView() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const weekDays = getWeekDays(anchor);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const loadWeek = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("bookings")
      .select(ADMIN_BOOKING_SELECT)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true });

    setBookings((data as AdminBooking[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWeek(weekStart, weekEnd);
  }, [weekStart, weekEnd, loadWeek]);

  function prevWeek() {
    setAnchor((a) => subWeeks(a, 1));
  }
  function nextWeek() {
    setAnchor((a) => addWeeks(a, 1));
  }
  function goToday() {
    setAnchor(new Date());
  }

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="h-8 w-8 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="h-8 px-3 rounded-sm border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextWeek}
            className="h-8 w-8 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
          >
            ›
          </button>
        </div>
        <h2 className="text-sm font-semibold text-foreground">{weekLabel}</h2>
        {loading && (
          <span className="text-xs text-muted-foreground ml-auto">
            Loading...
          </span>
        )}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-[700px]">
          {/* Time gutter */}
          <div className="w-14 shrink-0 border-r border-border">
            {/* Day header spacer */}
            <div className="h-10 border-b border-border" />
            {/* Hour labels */}
            <div
              className="relative"
              style={{ height: TOTAL_HEIGHT }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[10px] text-muted-foreground"
                  style={{ top: (h - HOUR_START) * HOUR_PX - 6 }}
                >
                  {hourLabel(h)}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayBookings = bookings.filter((b) =>
              isSameDay(new Date(b.scheduled_at), day),
            );
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className="flex-1 border-r border-border last:border-r-0"
              >
                {/* Day header */}
                <div
                  className={`h-10 border-b border-border flex flex-col items-center justify-center ${
                    isCurrentDay ? "bg-primary/10" : ""
                  }`}
                >
                  <div
                    className={`text-[10px] uppercase tracking-widest ${
                      isCurrentDay
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`text-sm font-bold leading-tight ${
                      isCurrentDay ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                {/* Time slots */}
                <div
                  className="relative"
                  style={{ height: TOTAL_HEIGHT }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/50"
                      style={{ top: (h - HOUR_START) * HOUR_PX }}
                    />
                  ))}

                  {/* Bookings */}
                  {dayBookings.map((booking) => (
                    <BookingBlock
                      key={booking.id}
                      booking={booking}
                      onClick={() => setSelectedId(booking.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking drawer — wired from calendar */}
      <BookingDrawer
        bookingId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdate={() => loadWeek(weekStart, weekEnd)}
      />
    </div>
  );
}
