import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
import { BookingDrawer } from "@/admin/BookingDrawer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientDetail = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lifetime_spend_cents: number;
  archived_at: string | null;
  created_at: string;
};

type VehicleRow = {
  id: string;
  year: number | null;
  make: string;
  model: string;
  color: string | null;
  plate: string | null;
  notes: string | null;
};

type CommLog = {
  id: string;
  channel: string;
  direction: string;
  summary: string;
  occurred_at: string;
};

// ---------------------------------------------------------------------------
// Shared input style
// ---------------------------------------------------------------------------

const inputCls =
  "w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit client modal
// ---------------------------------------------------------------------------

function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: ClientDetail;
  onClose: () => void;
  onSaved: (updated: Partial<ClientDetail>) => void;
}) {
  const [form, setForm] = useState({
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    notes: client.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const update = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };
    await supabase.from("clients").update(update).eq("id", client.id);
    setSaving(false);
    onSaved(update);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-border rounded-sm w-full max-w-md p-6 mx-4">
        <h2 className="text-base font-bold text-foreground mb-5">
          Edit Client
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input
                required
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Last Name">
              <input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 border border-border rounded-sm text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 bg-primary text-primary-foreground rounded-sm text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add/edit vehicle modal
// ---------------------------------------------------------------------------

function VehicleModal({
  clientId,
  vehicle,
  onClose,
  onSaved,
}: {
  clientId: string;
  vehicle: VehicleRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    year: vehicle?.year ? String(vehicle.year) : "",
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    color: vehicle?.color ?? "",
    plate: vehicle?.plate ?? "",
    notes: vehicle?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      client_id: clientId,
      year: form.year ? parseInt(form.year) : null,
      make: form.make.trim(),
      model: form.model.trim(),
      color: form.color.trim() || null,
      plate: form.plate.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (vehicle) {
      await supabase.from("vehicles").update(payload).eq("id", vehicle.id);
    } else {
      await supabase.from("vehicles").insert(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-border rounded-sm w-full max-w-md p-6 mx-4">
        <h2 className="text-base font-bold text-foreground mb-5">
          {vehicle ? "Edit Vehicle" : "Add Vehicle"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Year">
              <input
                type="number"
                min="1900"
                max="2099"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                className={inputCls}
                placeholder="2023"
              />
            </Field>
            <Field label="Make *">
              <input
                required
                value={form.make}
                onChange={(e) => set("make", e.target.value)}
                className={inputCls}
                placeholder="BMW"
              />
            </Field>
            <Field label="Model *">
              <input
                required
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                className={inputCls}
                placeholder="M3"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Color">
              <input
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                className={inputCls}
                placeholder="Alpine White"
              />
            </Field>
            <Field label="Plate">
              <input
                value={form.plate}
                onChange={(e) => set("plate", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="PPF, ceramic coat, etc."
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 border border-border rounded-sm text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 bg-primary text-primary-foreground rounded-sm text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add communication log modal
// ---------------------------------------------------------------------------

function CommModal({
  clientId,
  onClose,
  onSaved,
}: {
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    channel: "call",
    direction: "inbound",
    summary: "",
    occurred_at: new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("communication_log").insert({
      client_id: clientId,
      channel: form.channel,
      direction: form.direction,
      summary: form.summary.trim(),
      occurred_at: new Date(form.occurred_at).toISOString(),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  const selectCls =
    "w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-border rounded-sm w-full max-w-md p-6 mx-4">
        <h2 className="text-base font-bold text-foreground mb-5">
          Log Communication
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <select
                value={form.channel}
                onChange={(e) => set("channel", e.target.value)}
                className={selectCls}
              >
                {[
                  "call",
                  "text",
                  "email",
                  "instagram",
                  "in_person",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Direction">
              <select
                value={form.direction}
                onChange={(e) => set("direction", e.target.value)}
                className={selectCls}
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </Field>
          </div>
          <Field label="When">
            <input
              type="datetime-local"
              value={form.occurred_at}
              onChange={(e) => set("occurred_at", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Summary *">
            <textarea
              required
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="What happened..."
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 border border-border rounded-sm text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 bg-primary text-primary-foreground rounded-sm text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Tab = "bookings" | "vehicles" | "communication";

export default function ClientDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [commLogs, setCommLogs] = useState<CommLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState<Tab>("bookings");
  const [showEdit, setShowEdit] = useState(false);
  const [vehicleModal, setVehicleModal] = useState<VehicleRow | null | "new">(
    null,
  );
  const [showCommModal, setShowCommModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  const loadAll = useCallback(async () => {
    if (!id) return;
    const [
      { data: clientData },
      { data: bookingsData },
      { data: vehiclesData },
      { data: commData },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("bookings")
        .select(ADMIN_BOOKING_SELECT)
        .eq("client_id", id)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("vehicles")
        .select("id, year, make, model, color, plate, notes")
        .eq("client_id", id),
      supabase
        .from("communication_log")
        .select("id, channel, direction, summary, occurred_at")
        .eq("client_id", id)
        .order("occurred_at", { ascending: false }),
    ]);

    const c = clientData as ClientDetail | null;
    setClient(c);
    setNotes(c?.notes ?? "");
    setBookings((bookingsData as AdminBooking[] | null) ?? []);
    setVehicles((vehiclesData as VehicleRow[] | null) ?? []);
    setCommLogs((commData as CommLog[] | null) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveNotes() {
    if (!client) return;
    await supabase
      .from("clients")
      .update({ notes })
      .eq("id", client.id);
  }

  async function archiveClient() {
    if (!client) return;
    if (!confirm("Archive this client?")) return;
    await supabase
      .from("clients")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", client.id);
    navigate("/admin/clients");
  }

  async function deleteVehicle(vehicleId: string) {
    if (!confirm("Delete this vehicle?")) return;
    await supabase.from("vehicles").delete().eq("id", vehicleId);
    setVehicles((vs) => vs.filter((v) => v.id !== vehicleId));
  }

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading...</div>
    );
  }
  if (!client) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Client not found.</p>
        <Link
          to="/admin/clients"
          className="mt-2 text-sm text-primary hover:brightness-110"
        >
          Back to clients
        </Link>
      </div>
    );
  }

  const totalBookings = bookings.length;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/admin/clients" className="hover:text-foreground">
          Clients
        </Link>
        <span>›</span>
        <span className="text-foreground">
          {client.first_name} {client.last_name}
        </span>
      </div>

      <div className="flex gap-8">
        {/* Left panel */}
        <aside className="w-[340px] shrink-0 space-y-4">
          {/* Contact card */}
          <div className="bg-surface border border-border rounded-sm p-5 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {client.first_name} {client.last_name}
              </h1>
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-primary hover:brightness-110 block mt-1"
                >
                  {client.phone}
                </a>
              )}
              {client.email && (
                <div className="text-sm text-muted-foreground mt-0.5">
                  {client.email}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  Lifetime spend
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {formatCents(client.lifetime_spend_cents)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  Bookings
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {totalBookings}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 h-8 border border-border rounded-sm text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={archiveClient}
                className="flex-1 h-8 border border-red-500/30 rounded-sm text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-surface border border-border rounded-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={5}
              placeholder="Notes about this client..."
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </aside>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-0 border-b border-border mb-6">
            {(["bookings", "vehicles", "communication"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm capitalize border-b-2 transition-colors ${
                  tab === t
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Bookings tab */}
          {tab === "bookings" && (
            <div>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No bookings yet.
                </p>
              ) : (
                <div className="bg-surface border border-border rounded-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        {["Date", "Status", "Services", "Vehicle", "Total", "Payment"].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left py-3 px-4 font-normal text-xs uppercase tracking-widest text-muted-foreground first:pl-4"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => setSelectedBookingId(b.id)}
                          className="border-t border-border cursor-pointer hover:bg-white/3 transition-colors"
                        >
                          <td className="py-3 px-4 text-foreground">
                            <div>{formatDate(b.scheduled_at)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(b.scheduled_at)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-[180px] truncate">
                            {b.booking_services.map((bs) => bs.service.name).join(", ")}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {b.vehicle ? vehicleLabel(b.vehicle) : "—"}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {b.final_price_cents != null
                              ? formatCents(b.final_price_cents)
                              : formatCents(bookingTotal(b))}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs ${
                                b.payment_status === "paid"
                                  ? "text-green-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {b.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Vehicles tab */}
          {tab === "vehicles" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setVehicleModal("new")}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:brightness-110 transition-all"
                >
                  Add Vehicle
                </button>
              </div>
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles.</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="bg-surface border border-border rounded-sm p-4 flex items-start justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {vehicleLabel(v)}
                        </div>
                        {v.color && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {v.color}
                            {v.plate ? ` · ${v.plate}` : ""}
                          </div>
                        )}
                        {v.notes && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-md">
                            {v.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setVehicleModal(v)}
                          className="h-7 px-3 border border-border rounded-sm text-xs text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVehicle(v.id)}
                          className="h-7 px-3 border border-red-500/30 rounded-sm text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Communication tab */}
          {tab === "communication" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCommModal(true)}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:brightness-110 transition-all"
                >
                  Log Entry
                </button>
              </div>
              {commLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No communication logged yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {commLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-surface border border-border rounded-sm px-4 py-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground capitalize">
                          {log.channel.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.direction}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(log.occurred_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setClient((c) => (c ? { ...c, ...updated } : c))}
        />
      )}
      {vehicleModal !== null && (
        <VehicleModal
          clientId={client.id}
          vehicle={vehicleModal === "new" ? null : vehicleModal}
          onClose={() => setVehicleModal(null)}
          onSaved={loadAll}
        />
      )}
      {showCommModal && (
        <CommModal
          clientId={client.id}
          onClose={() => setShowCommModal(false)}
          onSaved={loadAll}
        />
      )}

      {/* Booking drawer — wired from bookings tab */}
      <BookingDrawer
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        onUpdate={loadAll}
      />
    </div>
  );
}
