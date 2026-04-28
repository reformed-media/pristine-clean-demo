import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatCents } from "@/admin/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  lifetime_spend_cents: number;
  archived_at: string | null;
  created_at: string;
  bookings: { id: string; scheduled_at: string; status: string }[];
};

type SortKey = "name" | "last_booking" | "spend" | "total_bookings";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lastBookingDate(client: ClientRow): string | null {
  if (!client.bookings || client.bookings.length === 0) return null;
  const sorted = [...client.bookings].sort(
    (a, b) =>
      new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
  );
  return sorted[0].scheduled_at;
}

function formatLastBooking(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Add client modal
// ---------------------------------------------------------------------------

function AddClientModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim()) return;
    setSaving(true);
    const { error: err } = await supabase.from("clients").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      auth_user_id: null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-border rounded-sm w-full max-w-md p-6 mx-4">
        <h2 className="text-base font-bold text-foreground mb-5">Add Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *">
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
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
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
// Page
// ---------------------------------------------------------------------------

export default function ClientsView() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchDebounced, setSearchDebounced] = useState("");

  const loadClients = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select(
        "id, first_name, last_name, email, phone, lifetime_spend_cents, archived_at, created_at, bookings(id, scheduled_at, status)",
      )
      .is("archived_at", null)
      .order("last_name", { ascending: true });
    setClients((data as ClientRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filtered = useMemo(() => {
    const q = searchDebounced.toLowerCase();
    return clients.filter(
      (c) =>
        !q ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [clients, searchDebounced]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortKey === "name") {
        av = `${a.last_name} ${a.first_name}`.toLowerCase();
        bv = `${b.last_name} ${b.first_name}`.toLowerCase();
      } else if (sortKey === "last_booking") {
        av = lastBookingDate(a) ?? "0000";
        bv = lastBookingDate(b) ?? "0000";
      } else if (sortKey === "spend") {
        av = a.lifetime_spend_cents;
        bv = b.lifetime_spend_cents;
      } else if (sortKey === "total_bookings") {
        av = a.bookings.length;
        bv = b.bookings.length;
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  function SortHeader({
    label,
    k,
  }: {
    label: string;
    k: SortKey;
  }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => handleSort(k)}
        className="text-left py-3 font-normal text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground select-none"
      >
        {label}
        {active && (
          <span className="ml-1 text-primary">{sortAsc ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Clients
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:brightness-110 transition-all"
        >
          Add Client
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full max-w-sm bg-surface border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <SortHeader label="Name" k="name" />
                <th className="text-left py-3 font-normal text-xs uppercase tracking-widest text-muted-foreground">
                  Phone
                </th>
                <th className="text-left py-3 font-normal text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </th>
                <SortHeader label="Last Booking" k="last_booking" />
                <SortHeader label="Lifetime" k="spend" />
                <SortHeader label="Bookings" k="total_bookings" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {search ? "No clients match your search." : "No clients yet."}
                  </td>
                </tr>
              ) : (
                sorted.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/clients/${c.id}`)}
                    className="border-t border-border cursor-pointer hover:bg-white/3 transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="py-3 pr-4">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:brightness-110"
                        >
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {c.email ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatLastBooking(lastBookingDate(c))}
                    </td>
                    <td className="py-3 pr-4 text-foreground">
                      {formatCents(c.lifetime_spend_cents)}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {c.bookings.length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onSaved={loadClients}
        />
      )}
    </div>
  );
}
