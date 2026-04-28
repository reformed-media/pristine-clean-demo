import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createBooking } from "@/lib/bookings";
import { supabase } from "@/lib/supabase";
import { FadeIn } from "@/components/site/FadeIn";
import { SEO } from "@/components/site/SEO";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  base_price_cents: number;
  is_addon: boolean;
  display_order: number;
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

type WizardState = {
  selectedServiceIds: string[];
  category: string | null; // 'auto' | 'marine' | 'home'
  vehicle: Record<string, string>; // freeform fields for new vehicle entry
  savedVehicleId: string | null; // picked from existing vehicles
  date: string;
  time: string;
  address: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

const EMPTY_WIZARD: WizardState = {
  selectedServiceIds: [],
  category: null,
  vehicle: {},
  savedVehicleId: null,
  date: "",
  time: "",
  address: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildScheduledAt(date: string, time: string): string {
  // time is like "9:00 AM" — parse to 24h
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date(`${date}T12:00:00`).toISOString();
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const h = String(hours).padStart(2, "0");
  // Build a local datetime string and let Date convert to UTC
  return new Date(`${date}T${h}:${minutes}:00`).toISOString();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BookPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const tabParam = searchParams.get("tab");
  const tab: "new" | "existing" =
    tabParam === "existing" ? "existing" : "new";
  const setTab = (t: "new" | "existing") =>
    setSearchParams(t === "new" ? {} : { tab: t });

  // If logged in, always show the booking flow (no login card needed)
  const showLoginCard = tab === "existing" && !session;

  return (
    <>
      <SEO
        title="Book a Detail — Pristine Clean LI"
        description="Book mobile auto, marine, or home detailing on Long Island."
      />
      <section className="container-x py-16 md:py-24">
        <FadeIn>
          <h1 className="text-display uppercase text-5xl md:text-7xl">
            Book a detail.
          </h1>
          <p className="mt-4 text-muted-foreground">Takes under 2 minutes.</p>
        </FadeIn>

        {!session && (
          <div className="mt-10 inline-flex bg-surface border border-border rounded-sm p-1">
            <button
              onClick={() => setTab("new")}
              className={`px-5 h-10 text-sm rounded-sm ${tab === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              New Client
            </button>
            <button
              onClick={() => setTab("existing")}
              className={`px-5 h-10 text-sm rounded-sm ${tab === "existing" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Existing Client
            </button>
          </div>
        )}

        <div className="mt-10">
          {showLoginCard ? (
            <LoginCard onSwitch={() => setTab("new")} />
          ) : (
            <BookingFlow />
          )}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Login card (existing client, not logged in)
// ---------------------------------------------------------------------------

function LoginCard({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="max-w-md bg-surface border border-border rounded-sm p-8">
      <h2 className="text-2xl font-bold">Welcome back.</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Log in to manage your bookings.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Field label="Email">
          <input
            required
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            className="form-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110 disabled:opacity-40 transition"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <span />
        <button
          onClick={onSwitch}
          className="text-muted-foreground hover:text-foreground"
        >
          No account? Switch to New Client
        </button>
      </div>
      <FormStyles />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking flow
// ---------------------------------------------------------------------------

function BookingFlow() {
  const [searchParams] = useSearchParams();
  const preSelectSlug = searchParams.get("service");
  const navigate = useNavigate();
  const { session, user, client, signUp, refreshClient } = useAuth();
  const isLoggedIn = !!session;

  // Fetch services from DB
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Fetch saved vehicles for logged-in users
  const [savedVehicles, setSavedVehicles] = useState<VehicleRow[]>([]);

  const [wiz, setWiz] = useState<WizardState>(EMPTY_WIZARD);
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (partial: Partial<WizardState>) =>
    setWiz((prev) => ({ ...prev, ...partial }));

  // Total steps: logged-in users skip Step 4
  const totalSteps = isLoggedIn ? 3 : 4;
  const stepLabels = isLoggedIn
    ? ["Service", "Details", "Schedule"]
    : ["Service", "Details", "Schedule", "Account"];

  useEffect(() => {
    supabase
      .from("services")
      .select("id, slug, name, description, category, base_price_cents, is_addon, display_order")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data, error }) => {
        if (error) {
          setServicesError("Couldn't load services. Refresh to try again.");
        } else {
          setServices(data ?? []);
          // Pre-select from ?service= query param
          if (preSelectSlug && data) {
            const svc = data.find((s) => s.slug === preSelectSlug);
            if (svc) {
              update({
                selectedServiceIds: [svc.id],
                category: svc.category,
              });
            }
          }
        }
        setServicesLoading(false);
      });
  }, [preSelectSlug]);

  useEffect(() => {
    if (client) {
      supabase
        .from("vehicles")
        .select("id, year, make, model, color, plate, notes")
        .eq("client_id", client.id)
        .then(({ data }) => setSavedVehicles(data ?? []));
    }
  }, [client]);

  // Compute total price from selected services
  const selectedServices = services.filter((s) =>
    wiz.selectedServiceIds.includes(s.id),
  );
  const totalCents = selectedServices.reduce(
    (sum, s) => sum + s.base_price_cents,
    0,
  );

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------
  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);

    try {
      let clientId = client?.id;
      let currentUserId = user?.id;

      // New client signup
      if (!isLoggedIn) {
        const pw = (wiz as WizardState & { password?: string }).password;
        if (!pw) {
          setSubmitError("Password is required.");
          setSubmitting(false);
          return;
        }

        const signUpResult = await signUp({
          email: wiz.email,
          password: pw,
          firstName: wiz.firstName,
          lastName: wiz.lastName,
          phone: wiz.phone || undefined,
        });

        if (signUpResult.error) {
          setSubmitError(signUpResult.error);
          setSubmitting(false);
          return;
        }

        // Fetch the session to get user id
        const {
          data: { session: newSession },
        } = await supabase.auth.getSession();
        currentUserId = newSession?.user?.id;

        if (!currentUserId) {
          setSubmitError(
            "Account created but session not ready. Log in from your dashboard to complete your booking.",
          );
          setSubmitting(false);
          navigate("/book?tab=existing");
          return;
        }

        // Fetch the clients row created by the trigger
        // Retry a couple times since the trigger runs async
        let attempts = 0;
        while (!clientId && attempts < 5) {
          const { data } = await supabase
            .from("clients")
            .select("id")
            .eq("auth_user_id", currentUserId)
            .maybeSingle();
          clientId = data?.id;
          if (!clientId) {
            await new Promise((r) => setTimeout(r, 500));
            attempts++;
          }
        }

        if (!clientId) {
          setSubmitError(
            "Account created. Booking didn't go through. Try again from your dashboard.",
          );
          setSubmitting(false);
          await refreshClient();
          navigate("/dashboard");
          return;
        }
      }

      if (!clientId) {
        setSubmitError("Could not determine your account. Please try again.");
        setSubmitting(false);
        return;
      }

      // Insert vehicle if auto category and entering a new one
      let vehicleId: string | null = wiz.savedVehicleId;
      if (wiz.category === "auto" && !vehicleId && wiz.vehicle.make) {
        const { data: newVehicle, error: vErr } = await supabase
          .from("vehicles")
          .insert({
            client_id: clientId,
            year: wiz.vehicle.year ? parseInt(wiz.vehicle.year, 10) : null,
            make: wiz.vehicle.make,
            model: wiz.vehicle.model || "",
            color: wiz.vehicle.color || null,
            plate: wiz.vehicle.plate || null,
            notes: wiz.vehicle.notes || null,
          })
          .select("id")
          .single();

        if (vErr) {
          setSubmitError(vErr.message);
          setSubmitting(false);
          return;
        }
        vehicleId = newVehicle.id;
      }

      // Build notes from address + any freeform details for marine/home
      let notes = wiz.address ? `Address: ${wiz.address}` : "";
      if (wiz.category === "marine" || wiz.category === "home") {
        const details = Object.entries(wiz.vehicle)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        if (details) notes = notes ? `${notes}\n${details}` : details;
      }

      const scheduledAt = buildScheduledAt(wiz.date, wiz.time);

      const result = await createBooking({
        clientId,
        vehicleId,
        scheduledAt,
        serviceIds: wiz.selectedServiceIds,
        notes: notes || undefined,
      });

      if (result.error) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }

      // Refresh client data so dashboard picks up the new booking
      await refreshClient();
      navigate("/dashboard?booked=1");
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (servicesLoading) {
    return (
      <div className="max-w-3xl text-sm text-muted-foreground">
        Loading services...
      </div>
    );
  }
  if (servicesError) {
    return (
      <div className="max-w-3xl text-sm text-muted-foreground">
        {servicesError}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {isLoggedIn && client && (
        <p className="mb-4 text-sm text-muted-foreground">
          Booking as {client.first_name} {client.last_name}
        </p>
      )}

      <ProgressBar step={step} labels={stepLabels} />

      <div className="mt-8 bg-surface border border-border rounded-sm p-8">
        {step === 1 && (
          <ServiceStep
            services={services}
            wiz={wiz}
            update={update}
            next={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <DetailsStep
            wiz={wiz}
            update={update}
            savedVehicles={savedVehicles}
            isLoggedIn={isLoggedIn}
            next={() => setStep(3)}
            back={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ScheduleStep
            wiz={wiz}
            update={update}
            next={
              isLoggedIn
                ? undefined
                : () => setStep(4)
            }
            back={() => setStep(2)}
            onSubmit={isLoggedIn ? handleSubmit : undefined}
            submitting={submitting}
            totalCents={totalCents}
            selectedServices={selectedServices}
          />
        )}
        {step === 4 && !isLoggedIn && (
          <AccountStep
            wiz={wiz}
            update={update}
            onSubmit={handleSubmit}
            back={() => setStep(3)}
            submitting={submitting}
            totalCents={totalCents}
            selectedServices={selectedServices}
          />
        )}
        {submitError && (
          <p className="mt-4 text-sm text-muted-foreground">{submitError}</p>
        )}
      </div>
      <FormStyles />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}
    >
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n <= step;
        return (
          <div key={l}>
            <div
              className={`h-1 rounded-sm ${active ? "bg-primary" : "bg-border"}`}
            />
            <div
              className={`mt-2 text-xs uppercase tracking-widest ${active ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span className="font-mono mr-2">0{n}</span>
              {l}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Service selection
// ---------------------------------------------------------------------------

function ServiceStep({
  services,
  wiz,
  update,
  next,
}: {
  services: ServiceRow[];
  wiz: WizardState;
  update: (p: Partial<WizardState>) => void;
  next: () => void;
}) {
  const mainServices = services.filter((s) => !s.is_addon);
  const autoAddons = services.filter(
    (s) => s.is_addon && s.category === "auto",
  );

  // Group main services by category
  const categories = [
    {
      key: "auto",
      label: "Auto Detailing",
      items: mainServices.filter((s) => s.category === "auto"),
    },
    {
      key: "marine",
      label: "Marine Detailing",
      items: mainServices.filter((s) => s.category === "marine"),
    },
    {
      key: "home",
      label: "Home Services",
      items: mainServices.filter((s) => s.category === "home"),
    },
  ];

  // Currently selected main service
  const selectedMain = services.find(
    (s) => !s.is_addon && wiz.selectedServiceIds.includes(s.id),
  );

  function selectMain(svc: ServiceRow) {
    // When switching main service, keep add-ons only if same category
    const addons =
      svc.category === selectedMain?.category
        ? wiz.selectedServiceIds.filter((id) => {
            const s = services.find((x) => x.id === id);
            return s?.is_addon;
          })
        : [];
    update({
      selectedServiceIds: [svc.id, ...addons],
      category: svc.category,
    });
  }

  function toggleAddon(addonId: string) {
    const has = wiz.selectedServiceIds.includes(addonId);
    update({
      selectedServiceIds: has
        ? wiz.selectedServiceIds.filter((id) => id !== addonId)
        : [...wiz.selectedServiceIds, addonId],
    });
  }

  const totalCents = wiz.selectedServiceIds.reduce((sum, id) => {
    const s = services.find((x) => x.id === id);
    return sum + (s?.base_price_cents ?? 0);
  }, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold">Pick your service.</h2>
      <div className="mt-6 space-y-6">
        {categories.map((cat) => (
          <div key={cat.key} className="border border-border rounded-sm p-5">
            <div className="font-bold">{cat.label}</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cat.items.map((svc) => {
                const selected = wiz.selectedServiceIds.includes(svc.id);
                const priceLabel =
                  svc.category === "marine" || svc.category === "home"
                    ? `From ${formatCents(svc.base_price_cents)}`
                    : formatCents(svc.base_price_cents);
                return (
                  <button
                    key={svc.id}
                    onClick={() => selectMain(svc)}
                    className={`text-left p-4 rounded-sm border transition ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="text-sm font-medium">{svc.name}</div>
                    <div className="mt-1 text-xs text-primary">
                      {priceLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons for auto */}
      {wiz.category === "auto" && autoAddons.length > 0 && (
        <div className="mt-6 border border-border rounded-sm p-5">
          <div className="font-bold">Add-ons</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {autoAddons.map((addon) => {
              const selected = wiz.selectedServiceIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`text-left p-4 rounded-sm border transition ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <div className="text-sm font-medium">{addon.name}</div>
                  <div className="mt-1 text-xs text-primary">
                    + {formatCents(addon.base_price_cents)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {totalCents > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          Total: <span className="text-foreground">{formatCents(totalCents)}</span>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          disabled={!selectedMain}
          onClick={next}
          className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Details (vehicle / property info)
// ---------------------------------------------------------------------------

function DetailsStep({
  wiz,
  update,
  savedVehicles,
  isLoggedIn,
  next,
  back,
}: {
  wiz: WizardState;
  update: (p: Partial<WizardState>) => void;
  savedVehicles: VehicleRow[];
  isLoggedIn: boolean;
  next: () => void;
  back: () => void;
}) {
  const [v, setV] = useState<Record<string, string>>(wiz.vehicle);
  const [pickedId, setPickedId] = useState<string | null>(
    wiz.savedVehicleId,
  );
  const [addingNew, setAddingNew] = useState(false);
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  const isAuto = wiz.category === "auto";
  const showSavedVehicles =
    isAuto && isLoggedIn && savedVehicles.length > 0 && !addingNew;

  let fields: { k: string; label: string }[] = [];
  if (isAuto)
    fields = [
      { k: "year", label: "Year" },
      { k: "make", label: "Make" },
      { k: "model", label: "Model" },
      { k: "color", label: "Color" },
      { k: "plate", label: "Plate (optional)" },
      { k: "notes", label: "Notes (optional)" },
    ];
  else if (wiz.category === "marine")
    fields = [
      { k: "type", label: "Boat or Jetski" },
      { k: "length", label: "Length (ft)" },
      { k: "notes", label: "Notes" },
    ];
  else
    fields = [
      { k: "type", label: "Service Type" },
      { k: "sqft", label: "Approximate square footage" },
      { k: "notes", label: "Address or notes" },
    ];

  function handleNext() {
    if (showSavedVehicles && pickedId) {
      update({ savedVehicleId: pickedId, vehicle: {} });
    } else {
      update({ savedVehicleId: null, vehicle: v });
    }
    next();
  }

  const canContinue = showSavedVehicles
    ? !!pickedId
    : isAuto
      ? !!(v.make && v.model)
      : true;

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {isAuto
          ? "Your vehicle."
          : wiz.category === "marine"
            ? "Your boat."
            : "Your property."}
      </h2>

      {showSavedVehicles ? (
        <div className="mt-6 space-y-3">
          {savedVehicles.map((sv) => (
            <button
              key={sv.id}
              onClick={() => setPickedId(sv.id)}
              className={`w-full text-left p-4 rounded-sm border transition ${pickedId === sv.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              <div className="text-sm font-medium">
                {sv.year ? `${sv.year} ` : ""}
                {sv.make} {sv.model}
              </div>
              {sv.color && (
                <div className="text-xs text-muted-foreground mt-1">
                  {sv.color}
                </div>
              )}
            </button>
          ))}
          <button
            onClick={() => {
              setPickedId(null);
              setAddingNew(true);
            }}
            className="text-sm text-primary hover:brightness-110"
          >
            + Add a new vehicle
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <Field key={f.k} label={f.label}>
              <input
                className="form-input"
                value={v[f.k] ?? ""}
                onChange={(e) => set(f.k, e.target.value)}
              />
            </Field>
          ))}
        </div>
      )}

      {addingNew && isLoggedIn && savedVehicles.length > 0 && (
        <button
          onClick={() => {
            setAddingNew(false);
            setPickedId(savedVehicles[0]?.id ?? null);
          }}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Back to saved vehicles
        </button>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={back}
          className="h-12 px-6 rounded-sm border border-border hover:bg-background"
        >
          Back
        </button>
        <button
          disabled={!canContinue}
          onClick={handleNext}
          className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Schedule & location
// ---------------------------------------------------------------------------

function ScheduleStep({
  wiz,
  update,
  next,
  back,
  onSubmit,
  submitting,
  totalCents,
  selectedServices,
}: {
  wiz: WizardState;
  update: (p: Partial<WizardState>) => void;
  next?: () => void;
  back: () => void;
  onSubmit?: () => void;
  submitting: boolean;
  totalCents: number;
  selectedServices: ServiceRow[];
}) {
  const [date, setDate] = useState(wiz.date);
  const [time, setTime] = useState(wiz.time);
  const [address, setAddress] = useState(wiz.address);

  const valid = date && time && address;

  function handleContinue() {
    update({ date, time, address });
    if (onSubmit) {
      // Logged-in user: this is the final step
      // Update state synchronously before submit reads it
      Object.assign(wiz, { date, time, address });
      onSubmit();
    } else if (next) {
      next();
    }
  }

  // Set min date to today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h2 className="text-2xl font-bold">Schedule &amp; location.</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date">
          <input
            type="date"
            className="form-input"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Time">
          <select
            className="form-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="">Choose a slot</option>
            <option>9:00 AM</option>
            <option>11:00 AM</option>
            <option>1:00 PM</option>
            <option>3:00 PM</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Service Address">
            <input
              className="form-input"
              placeholder="Street, City, State, Zip"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <OrderSummary services={selectedServices} totalCents={totalCents} />

      <div className="mt-8 flex justify-between">
        <button
          onClick={back}
          className="h-12 px-6 rounded-sm border border-border hover:bg-background"
        >
          Back
        </button>
        <button
          disabled={!valid || submitting}
          onClick={handleContinue}
          className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110"
        >
          {onSubmit
            ? submitting
              ? "Booking..."
              : "Confirm Booking"
            : "Continue"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Account (new clients only)
// ---------------------------------------------------------------------------

function AccountStep({
  wiz,
  update,
  onSubmit,
  back,
  submitting,
  totalCents,
  selectedServices,
}: {
  wiz: WizardState;
  update: (p: Partial<WizardState>) => void;
  onSubmit: () => void;
  back: () => void;
  submitting: boolean;
  totalCents: number;
  selectedServices: ServiceRow[];
}) {
  const [firstName, setFirstName] = useState(wiz.firstName);
  const [lastName, setLastName] = useState(wiz.lastName);
  const [phone, setPhone] = useState(wiz.phone);
  const [email, setEmail] = useState(wiz.email);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const valid = firstName && lastName && email && pw && pw === pw2;

  function handleSubmit() {
    update({ firstName, lastName, phone, email });
    // Attach password to wiz for the submit handler
    Object.assign(wiz, { firstName, lastName, phone, email, password: pw });
    onSubmit();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Your info.</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name">
          <input
            className="form-input"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Field>
        <Field label="Last Name">
          <input
            className="form-input"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            className="form-input"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className="form-input"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </Field>
        <Field label="Confirm Password">
          <input
            type="password"
            className="form-input"
            placeholder="Confirm password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
        </Field>
      </div>

      {pw && pw2 && pw !== pw2 && (
        <p className="mt-4 text-sm text-muted-foreground">Passwords do not match.</p>
      )}

      <OrderSummary services={selectedServices} totalCents={totalCents} />

      <div className="mt-8 flex justify-between">
        <button
          onClick={back}
          className="h-12 px-6 rounded-sm border border-border hover:bg-background"
        >
          Back
        </button>
        <button
          disabled={!valid || submitting}
          onClick={handleSubmit}
          className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110"
        >
          {submitting ? "Creating account..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order summary (shown on final step)
// ---------------------------------------------------------------------------

function OrderSummary({
  services,
  totalCents,
}: {
  services: ServiceRow[];
  totalCents: number;
}) {
  if (services.length === 0) return null;
  return (
    <div className="mt-6 bg-background border border-border rounded-sm p-4 space-y-2 text-sm">
      {services.map((s) => (
        <div key={s.id} className="flex justify-between">
          <span className="text-muted-foreground">{s.name}</span>
          <span className="text-foreground">
            {formatCents(s.base_price_cents)}
          </span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-2">
        <span className="text-foreground font-medium">Total</span>
        <span className="text-primary font-medium">
          {formatCents(totalCents)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormStyles() {
  return (
    <style>{`.form-input{width:100%;height:44px;background:var(--background);border:1px solid var(--border);border-radius:4px;padding:0 12px;color:var(--foreground);font-size:14px;outline:none;transition:border-color .15s}
      .form-input:focus{border-color:var(--primary)}
      textarea.form-input{height:auto;padding:12px;line-height:1.5}`}</style>
  );
}
