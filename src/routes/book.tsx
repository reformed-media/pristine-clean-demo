import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { FadeIn } from "@/components/site/FadeIn";

const search = z.object({
  tab: z.enum(["new", "existing"]).catch("new").optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Book a Detail — Pristine Clean LI" },
      { name: "description", content: "Book mobile auto, marine, or home detailing on Long Island." },
      { property: "og:title", content: "Book a Detail — Pristine Clean LI" },
      { property: "og:description", content: "Book mobile detailing on Long Island in under 2 minutes." },
    ],
  }),
  component: BookPage,
});

type Booking = {
  service?: string;
  subtype?: string;
  vehicle?: Record<string, string>;
  date?: string;
  time?: string;
  address?: string;
  name?: string;
  phone?: string;
  email?: string;
};

function BookPage() {
  const { tab = "new" } = Route.useSearch();
  const navigate = useNavigate();
  const setTab = (t: "new" | "existing") => navigate({ to: "/book", search: { tab: t } });

  return (
    <>
      <section className="container-x py-16 md:py-24">
        <FadeIn>
          <h1 className="text-display uppercase text-5xl md:text-7xl">Book a detail.</h1>
          <p className="mt-4 text-muted-foreground">Takes under 2 minutes.</p>
        </FadeIn>

        <div className="mt-10 inline-flex bg-surface border border-border rounded-sm p-1">
          <button onClick={() => setTab("new")} className={`px-5 h-10 text-sm rounded-sm ${tab === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>New Client</button>
          <button onClick={() => setTab("existing")} className={`px-5 h-10 text-sm rounded-sm ${tab === "existing" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Existing Client</button>
        </div>

        <div className="mt-10">
          {tab === "existing" ? <LoginCard onSwitch={() => setTab("new")} /> : <BookingFlow />}
        </div>
      </section>
    </>
  );
}

function LoginCard({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  // TODO: wire to real auth and database (Supabase) post-signature
  return (
    <div className="max-w-md bg-surface border border-border rounded-sm p-8">
      <h2 className="text-2xl font-bold">Welcome back.</h2>
      <p className="mt-1 text-sm text-muted-foreground">Log in to manage your bookings.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/dashboard" });
        }}
      >
        <Field label="Email"><input required type="email" className="form-input" defaultValue="client@example.com" /></Field>
        <Field label="Password"><input required type="password" className="form-input" defaultValue="••••••••" /></Field>
        <button className="w-full h-12 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110">Log in</button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <a href="#" className="text-muted-foreground hover:text-foreground">Forgot password?</a>
        <button onClick={onSwitch} className="text-muted-foreground hover:text-foreground">No account? Switch to New Client</button>
      </div>
      <FormStyles />
    </div>
  );
}

function BookingFlow() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<Booking>({});
  const [done, setDone] = useState(false);
  const update = (b: Partial<Booking>) => setBooking((prev) => ({ ...prev, ...b }));

  if (done) return <SuccessScreen booking={booking} />;

  return (
    <div className="max-w-3xl">
      <ProgressBar step={step} />
      <div className="mt-8 bg-surface border border-border rounded-sm p-8">
        {step === 1 && <Step1 booking={booking} update={update} next={() => setStep(2)} />}
        {step === 2 && <Step2 booking={booking} update={update} next={() => setStep(3)} back={() => setStep(1)} />}
        {step === 3 && <Step3 booking={booking} update={update} next={() => setStep(4)} back={() => setStep(2)} />}
        {step === 4 && <Step4 booking={booking} update={update} submit={() => setDone(true)} back={() => setStep(3)} />}
      </div>
      <FormStyles />
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const labels = ["Service", "Details", "Schedule", "Account"];
  return (
    <div className="grid grid-cols-4 gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n <= step;
        return (
          <div key={l}>
            <div className={`h-1 rounded-sm ${active ? "bg-primary" : "bg-border"}`} />
            <div className={`mt-2 text-xs uppercase tracking-widest ${active ? "text-foreground" : "text-muted-foreground"}`}>
              <span className="font-mono mr-2">0{n}</span>{l}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Step1({ booking, update, next }: { booking: Booking; update: (b: Partial<Booking>) => void; next: () => void }) {
  const services = [
    { id: "auto", name: "Auto Detailing", subs: [
      { id: "exterior", label: "Exterior Only", price: "$120" },
      { id: "interior", label: "Interior Only", price: "$150" },
      { id: "full", label: "Full Detail", price: "$225" },
    ]},
    { id: "marine", name: "Marine Detailing", subs: [
      { id: "marine-quote", label: "Boat or Jetski", price: "From $400 (quote to follow)" },
    ]},
    { id: "home", name: "Home Services", subs: [
      { id: "pressure", label: "Pressure Washing", price: "From $250" },
      { id: "fence", label: "Fence & Window", price: "From $150" },
    ]},
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Pick your service.</h2>
      <div className="mt-6 space-y-6">
        {services.map((s) => (
          <div key={s.id} className="border border-border rounded-sm p-5">
            <div className="font-bold">{s.name}</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {s.subs.map((sub) => {
                const selected = booking.service === s.id && booking.subtype === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => update({ service: s.id, subtype: sub.id })}
                    className={`text-left p-4 rounded-sm border transition ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="text-sm font-medium">{sub.label}</div>
                    <div className="mt-1 text-xs text-primary">{sub.price}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button disabled={!booking.subtype} onClick={next} className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110">Continue</button>
      </div>
    </div>
  );
}

function Step2({ booking, update, next, back }: { booking: Booking; update: (b: Partial<Booking>) => void; next: () => void; back: () => void }) {
  const [v, setV] = useState<Record<string, string>>(booking.vehicle ?? {});
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  let fields: { k: string; label: string; type?: string }[] = [];
  if (booking.service === "auto") fields = [
    { k: "year", label: "Year" },
    { k: "make", label: "Make" },
    { k: "model", label: "Model" },
    { k: "color", label: "Color" },
    { k: "notes", label: "Notes" },
  ];
  else if (booking.service === "marine") fields = [
    { k: "type", label: "Boat or Jetski" },
    { k: "length", label: "Length (ft)" },
    { k: "notes", label: "Notes" },
  ];
  else fields = [
    { k: "type", label: "Service Type" },
    { k: "sqft", label: "Approximate square footage" },
    { k: "notes", label: "Address or notes" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">{booking.service === "auto" ? "Your vehicle." : booking.service === "marine" ? "Your boat." : "Your property."}</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <Field key={f.k} label={f.label}>
            <input className="form-input" value={v[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={back} className="h-12 px-6 rounded-sm border border-border hover:bg-background">Back</button>
        <button onClick={() => { update({ vehicle: v }); next(); }} className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110">Continue</button>
      </div>
    </div>
  );
}

function Step3({ booking, update, next, back }: { booking: Booking; update: (b: Partial<Booking>) => void; next: () => void; back: () => void }) {
  const [date, setDate] = useState(booking.date ?? "");
  const [time, setTime] = useState(booking.time ?? "");
  const [address, setAddress] = useState(booking.address ?? "");

  return (
    <div>
      <h2 className="text-2xl font-bold">Schedule &amp; location.</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date"><input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Time">
          <select className="form-input" value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="">Choose a slot</option>
            <option>9:00 AM</option>
            <option>11:00 AM</option>
            <option>1:00 PM</option>
            <option>3:00 PM</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Service Address"><input className="form-input" placeholder="Street, City, State, Zip" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={back} className="h-12 px-6 rounded-sm border border-border hover:bg-background">Back</button>
        <button disabled={!date || !time || !address} onClick={() => { update({ date, time, address }); next(); }} className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110">Continue</button>
      </div>
    </div>
  );
}

function Step4({ booking, update, submit, back }: { booking: Booking; update: (b: Partial<Booking>) => void; submit: () => void; back: () => void }) {
  const [name, setName] = useState(booking.name ?? "");
  const [phone, setPhone] = useState(booking.phone ?? "");
  const [email, setEmail] = useState(booking.email ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const valid = name && phone && email && pw && pw === pw2;
  // TODO: wire to backend post-signature
  return (
    <div>
      <h2 className="text-2xl font-bold">Your info.</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name"><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Phone"><input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="Email"><input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <div />
        <Field label="Password"><input type="password" className="form-input" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Confirm Password"><input type="password" className="form-input" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
      </div>
      <label className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
        <input type="checkbox" defaultChecked /> Text me reminders about my appointment.
      </label>
      <div className="mt-8 flex justify-between">
        <button onClick={back} className="h-12 px-6 rounded-sm border border-border hover:bg-background">Back</button>
        <button
          disabled={!valid}
          onClick={() => { update({ name, phone, email }); submit(); }}
          className="h-12 px-8 rounded-sm bg-primary text-primary-foreground font-medium disabled:opacity-40 hover:brightness-110"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
}

function SuccessScreen({ booking }: { booking: Booking }) {
  return (
    <div className="max-w-2xl bg-surface border border-border rounded-sm p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl">✓</div>
      <h2 className="mt-6 text-display uppercase text-3xl md:text-4xl">Booking confirmed.</h2>
      <p className="mt-2 text-muted-foreground">You'll get a confirmation text from Nick shortly.</p>
      <div className="mt-8 text-left bg-background border border-border rounded-sm p-6 space-y-2 text-sm">
        <Row k="Service" v={`${booking.service} · ${booking.subtype}`} />
        <Row k="Date" v={booking.date ?? ""} />
        <Row k="Time" v={booking.time ?? ""} />
        <Row k="Address" v={booking.address ?? ""} />
        <Row k="Name" v={booking.name ?? ""} />
      </div>
      <Link to="/dashboard" className="mt-8 inline-flex h-12 px-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-medium hover:brightness-110">Go to My Dashboard</Link>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground uppercase text-xs tracking-widest">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
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
