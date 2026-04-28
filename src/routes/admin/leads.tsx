import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { StatusBadge, formatCents } from "@/admin/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadStatus = "new" | "quoted" | "scheduled" | "lost";

type Lead = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  quoted_price_cents: number | null;
  notes: string | null;
  converted_client_id: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const inputCls =
  "w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

const selectCls =
  "w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

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

const STATUS_FILTERS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "quoted", label: "Quoted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "lost", label: "Lost" },
];

// ---------------------------------------------------------------------------
// Lead modal (add + edit)
// ---------------------------------------------------------------------------

function LeadModal({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: lead?.first_name ?? "",
    last_name: lead?.last_name ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    source: lead?.source ?? "",
    status: (lead?.status ?? "new") as LeadStatus,
    quoted_price: lead?.quoted_price_cents
      ? String(lead.quoted_price_cents / 100)
      : "",
    notes: lead?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      source: form.source.trim() || null,
      status: form.status,
      quoted_price_cents: form.quoted_price
        ? Math.round(parseFloat(form.quoted_price) * 100)
        : null,
      notes: form.notes.trim() || null,
    };
    if (lead) {
      await supabase.from("leads").update(payload).eq("id", lead.id);
    } else {
      await supabase.from("leads").insert(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-border rounded-sm w-full max-w-md p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold text-foreground mb-5">
          {lead ? "Edit Lead" : "Add Lead"}
        </h2>
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
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Source">
            <input
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Instagram, referral, etc."
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={selectCls}
              >
                <option value="new">New</option>
                <option value="quoted">Quoted</option>
                <option value="scheduled">Scheduled</option>
                <option value="lost">Lost</option>
              </select>
            </Field>
            <Field label="Quoted Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quoted_price}
                  onChange={(e) => set("quoted_price", e.target.value)}
                  className={`${inputCls} pl-7`}
                  placeholder="0"
                />
              </div>
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="What are they looking for..."
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

export default function LeadsView() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [editLead, setEditLead] = useState<Lead | null | "new">(null);
  const [converting, setConverting] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("updated_at", { ascending: false });
    setLeads((data as Lead[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filtered =
    filter === "all" ? leads : leads.filter((l) => l.status === filter);

  async function convertToClient(lead: Lead) {
    if (!confirm(`Convert ${lead.first_name} to a client?`)) return;
    setConverting(lead.id);
    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({
        first_name: lead.first_name,
        last_name: lead.last_name ?? "",
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
        auth_user_id: null,
      })
      .select("id")
      .single();

    if (error || !newClient) {
      setConverting(null);
      return;
    }

    await supabase
      .from("leads")
      .update({ converted_client_id: newClient.id })
      .eq("id", lead.id);

    setConverting(null);
    navigate(`/admin/clients/${newClient.id}`);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Leads
        </h1>
        <button
          onClick={() => setEditLead("new")}
          className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:brightness-110 transition-all"
        >
          Add Lead
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`h-8 px-4 rounded-sm text-xs font-medium border transition-colors ${
              filter === value
                ? "bg-primary/15 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {label}
            {value !== "all" && (
              <span className="ml-1.5 opacity-60">
                {leads.filter((l) => l.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No leads{filter !== "all" ? ` with status "${filter}"` : ""}.
        </p>
      ) : (
        <div className="bg-surface border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Name", "Phone", "Source", "Status", "Quoted", "Notes", "Updated", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left py-3 px-4 font-normal text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border hover:bg-white/3 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground">
                    {lead.first_name} {lead.last_name ?? ""}
                    {lead.email && (
                      <div className="text-xs text-muted-foreground font-normal">
                        {lead.email}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-primary hover:brightness-110"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {lead.source ?? "—"}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {lead.quoted_price_cents
                      ? formatCents(lead.quoted_price_cents)
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[180px]">
                    <span className="truncate block">
                      {lead.notes
                        ? lead.notes.slice(0, 60) +
                          (lead.notes.length > 60 ? "..." : "")
                        : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(lead.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditLead(lead)}
                        className="h-7 px-3 border border-border rounded-sm text-xs text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </button>
                      {lead.status === "scheduled" &&
                        !lead.converted_client_id && (
                          <button
                            onClick={() => convertToClient(lead)}
                            disabled={converting === lead.id}
                            className="h-7 px-3 bg-primary/15 border border-primary/30 text-primary rounded-sm text-xs hover:bg-primary/25 disabled:opacity-50 transition-colors"
                          >
                            {converting === lead.id
                              ? "..."
                              : "Convert to Client"}
                          </button>
                        )}
                      {lead.converted_client_id && (
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/clients/${lead.converted_client_id}`,
                            )
                          }
                          className="h-7 px-3 border border-border rounded-sm text-xs text-green-400"
                        >
                          View Client
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editLead !== null && (
        <LeadModal
          lead={editLead === "new" ? null : editLead}
          onClose={() => setEditLead(null)}
          onSaved={loadLeads}
        />
      )}
    </div>
  );
}
