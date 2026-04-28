import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  type AdminBooking,
  ADMIN_BOOKING_SELECT,
  StatusBadge,
  formatCents,
  formatDate,
  formatTime,
  bookingTotal,
  vehicleLabel,
} from "./types";

interface BookingDrawerProps {
  bookingId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
}

const STATUS_TRANSITIONS: Record<
  string,
  { label: string; next: string } | null
> = {
  requested: { label: "Confirm Booking", next: "confirmed" },
  confirmed: { label: "Start Job", next: "in_progress" },
  // TODO: after clicking Mark Complete, prompt inline for final price rather
  // than requiring the user to scroll down and set it separately.
  in_progress: { label: "Mark Complete", next: "complete" },
  complete: null,
  cancelled: null,
};

const PAYMENT_METHODS = ["cash", "zelle", "venmo", "card"] as const;

export function BookingDrawer({
  bookingId,
  onClose,
  onUpdate,
}: BookingDrawerProps) {
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [finalPriceInput, setFinalPriceInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      return;
    }
    setLoading(true);
    supabase
      .from("bookings")
      .select(ADMIN_BOOKING_SELECT)
      .eq("id", bookingId)
      .single()
      .then(({ data }) => {
        const b = data as AdminBooking | null;
        setBooking(b);
        setInternalNotes(b?.internal_notes ?? "");
        setFinalPriceInput(
          b?.final_price_cents ? String(b.final_price_cents / 100) : "",
        );
        setPaymentMethod(b?.payment_method ?? "cash");
        setLoading(false);
      });
  }, [bookingId]);

  async function advanceStatus() {
    if (!booking) return;
    const transition = STATUS_TRANSITIONS[booking.status];
    if (!transition) return;
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: transition.next })
      .eq("id", booking.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update status.");
      return;
    }
    setBooking((b) =>
      b ? { ...b, status: transition.next as AdminBooking["status"] } : b,
    );
    toast.success(`Status: ${transition.next.replace("_", " ")}.`);
    onUpdate?.();
  }

  async function cancelBooking() {
    if (!booking) return;
    if (!confirm("Cancel this booking?")) return;
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to cancel booking.");
      return;
    }
    setBooking((b) => (b ? { ...b, status: "cancelled" } : b));
    toast.success("Booking cancelled.");
    onUpdate?.();
  }

  async function saveFinalPrice() {
    if (!booking) return;
    const dollars = parseFloat(finalPriceInput);
    if (isNaN(dollars) || dollars < 0) return;
    const cents = Math.round(dollars * 100);
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({ final_price_cents: cents })
      .eq("id", booking.id);
    setSaving(false);
    if (!error) {
      setBooking((b) => (b ? { ...b, final_price_cents: cents } : b));
      toast.success("Final price saved.");
      onUpdate?.();
    }
  }

  async function togglePaymentStatus() {
    if (!booking) return;
    const newStatus = booking.payment_status === "paid" ? "unpaid" : "paid";
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_status: newStatus,
        payment_method: newStatus === "paid" ? paymentMethod : null,
      })
      .eq("id", booking.id);
    setSaving(false);
    if (!error) {
      setBooking((b) =>
        b
          ? {
              ...b,
              payment_status: newStatus as AdminBooking["payment_status"],
              payment_method: newStatus === "paid" ? paymentMethod : null,
            }
          : b,
      );
      toast.success(
        newStatus === "paid" ? "Marked as paid." : "Marked as unpaid.",
      );
      onUpdate?.();
    }
  }

  async function saveInternalNotes() {
    if (!booking) return;
    await supabase
      .from("bookings")
      .update({ internal_notes: internalNotes })
      .eq("id", booking.id);
  }

  const transition = booking ? STATUS_TRANSITIONS[booking.status] : null;
  const total = booking ? bookingTotal(booking) : 0;
  const canCancel =
    booking &&
    booking.status !== "cancelled" &&
    booking.status !== "complete";

  return (
    <Sheet open={bookingId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-[500px] w-full bg-surface border-l border-border p-0 flex flex-col"
      >
        {loading || !booking ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {loading ? "Loading..." : "Booking not found."}
            </span>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <StatusBadge status={booking.status} />
                <SheetTitle className="text-base font-semibold">
                  {booking.client.first_name} {booking.client.last_name}
                </SheetTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(booking.scheduled_at)} at{" "}
                {formatTime(booking.scheduled_at)}
              </p>
            </SheetHeader>

            {/* ── Actions (pinned, no scroll) ── */}
            <div className="px-6 py-4 border-b border-border shrink-0 space-y-3">
              {/* Status advance + overflow menu */}
              <div className="flex items-center gap-2">
                {transition ? (
                  <button
                    onClick={advanceStatus}
                    disabled={saving}
                    className="flex-1 h-10 bg-primary text-primary-foreground rounded-sm text-sm font-medium disabled:opacity-50 hover:brightness-110 transition-all"
                  >
                    {transition.label}
                  </button>
                ) : (
                  <div className="flex-1 h-10 flex items-center px-3 bg-background border border-border rounded-sm">
                    <span className="text-sm text-muted-foreground capitalize">
                      {booking.status === "complete"
                        ? "Job complete"
                        : "Booking cancelled"}
                    </span>
                  </div>
                )}

                {canCancel && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="h-10 w-10 flex items-center justify-center border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        aria-label="More actions"
                      >
                        ···
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={cancelBooking}
                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                      >
                        Cancel booking
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Payment toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePaymentStatus}
                    disabled={saving}
                    className={`h-9 px-4 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 ${
                      booking.payment_status === "paid"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {booking.payment_status === "paid" ? "Paid" : "Mark as Paid"}
                  </button>
                  {booking.payment_status === "paid" && (
                    <span className="text-sm text-muted-foreground capitalize">
                      via {booking.payment_method ?? paymentMethod}
                    </span>
                  )}
                </div>

                {booking.payment_status !== "paid" && (
                  <div className="flex gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`px-3 py-1 rounded-sm text-xs border transition-colors capitalize ${
                          paymentMethod === m
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Scroll body (read-only info + less-frequent inputs) ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Services */}
              <section>
                <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                  Services
                </div>
                <div className="space-y-1">
                  {booking.booking_services.map((bs) => (
                    <div
                      key={bs.id}
                      className="flex justify-between text-sm text-foreground"
                    >
                      <span>{bs.service.name}</span>
                      <span className="text-muted-foreground">
                        {formatCents(bs.price_cents_at_booking)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
                    <span>Estimate</span>
                    <span>{formatCents(total)}</span>
                  </div>
                  {booking.final_price_cents !== null && (
                    <div className="flex justify-between text-sm font-semibold text-primary">
                      <span>Final price</span>
                      <span>{formatCents(booking.final_price_cents)}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Vehicle */}
              {booking.vehicle && (
                <section>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                    Vehicle
                  </div>
                  <p className="text-sm text-foreground">
                    {vehicleLabel(booking.vehicle)}
                    {booking.vehicle.color
                      ? ` · ${booking.vehicle.color}`
                      : ""}
                  </p>
                </section>
              )}

              {/* Address */}
              {booking.address && (
                <section>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                    Address
                  </div>
                  <p className="text-sm text-foreground">
                    {booking.address.street}, {booking.address.city},{" "}
                    {booking.address.state} {booking.address.zip}
                  </p>
                </section>
              )}

              {/* Client notes (read-only) */}
              {booking.notes && (
                <section>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                    Client Notes
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {booking.notes}
                  </p>
                </section>
              )}

              {/* Final price input */}
              <section>
                <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                  Set Final Price
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={finalPriceInput}
                      onChange={(e) => setFinalPriceInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-background border border-border rounded-sm pl-7 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={saveFinalPrice}
                    disabled={saving}
                    className="px-4 py-2 bg-surface border border-border rounded-sm text-sm text-foreground hover:border-primary transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </section>

              {/* Internal notes */}
              <section>
                <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                  Internal Notes
                </div>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  onBlur={saveInternalNotes}
                  rows={3}
                  placeholder="Notes only you can see..."
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </section>

              {/* Photos placeholder */}
              <button
                onClick={() => toast.info("Photo uploads coming soon.")}
                className="w-full h-9 border border-dashed border-border rounded-sm text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                Upload before/after photos
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
