import { supabase } from "./supabase";

export type CreateBookingInput = {
  clientId: string;
  vehicleId?: string | null;
  scheduledAt: string; // ISO 8601 UTC timestamp
  serviceIds: string[]; // UUIDs from services table
  notes?: string;
  estimatedDurationMinutes?: number;
};

type CreateBookingResult =
  | { bookingId: string; error: null }
  | { bookingId: null; error: string };

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  // 1. Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      client_id: input.clientId,
      vehicle_id: input.vehicleId || null,
      scheduled_at: input.scheduledAt,
      status: "requested",
      payment_status: "unpaid",
      notes: input.notes || null,
      estimated_duration_minutes: input.estimatedDurationMinutes || null,
    })
    .select("id")
    .single();

  if (bookingError) return { bookingId: null, error: bookingError.message };

  // 2. Fetch prices for selected services
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, base_price_cents")
    .in("id", input.serviceIds);

  if (servicesError)
    return { bookingId: null, error: servicesError.message };

  // 3. Insert booking_services with price snapshots
  const rows = services.map((s) => ({
    booking_id: booking.id,
    service_id: s.id,
    price_cents_at_booking: s.base_price_cents,
  }));

  const { error: joinError } = await supabase
    .from("booking_services")
    .insert(rows);

  if (joinError) return { bookingId: null, error: joinError.message };

  return { bookingId: booking.id, error: null };
}
