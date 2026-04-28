export type AdminBooking = {
  id: string;
  scheduled_at: string;
  status: "requested" | "confirmed" | "in_progress" | "complete" | "cancelled";
  notes: string | null;
  internal_notes: string | null;
  final_price_cents: number | null;
  payment_status: "unpaid" | "paid" | "refunded";
  payment_method: string | null;
  estimated_duration_minutes: number | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  };
  vehicle: {
    id: string;
    year: number | null;
    make: string;
    model: string;
    color: string | null;
  } | null;
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  booking_services: {
    id: string;
    price_cents_at_booking: number;
    service: { id: string; name: string };
  }[];
};

export const STATUS_CONFIG = {
  requested: {
    label: "requested",
    className:
      "bg-border/40 text-muted-foreground border border-border",
  },
  confirmed: {
    label: "confirmed",
    className: "bg-primary/15 text-primary border border-primary/30",
  },
  in_progress: {
    label: "in progress",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  complete: {
    label: "complete",
    className: "bg-green-500/15 text-green-400 border border-green-500/30",
  },
  cancelled: {
    label: "cancelled",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
  },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    label: status,
    className: "bg-border/40 text-muted-foreground border border-border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function bookingTotal(booking: AdminBooking): number {
  return booking.booking_services.reduce(
    (s, r) => s + r.price_cents_at_booking,
    0,
  );
}

export function vehicleLabel(v: {
  year: number | null;
  make: string;
  model: string;
}): string {
  return `${v.year ? `${v.year} ` : ""}${v.make} ${v.model}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export const ADMIN_BOOKING_SELECT = `
  id, scheduled_at, status, notes, internal_notes,
  final_price_cents, payment_status, payment_method, estimated_duration_minutes,
  client:clients(id, first_name, last_name, phone, email),
  vehicle:vehicles(id, year, make, model, color),
  address:client_addresses(id, street, city, state, zip),
  booking_services(id, price_cents_at_booking, service:services(id, name))
` as const;
