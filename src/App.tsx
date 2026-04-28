import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { AdminProvider } from "@/lib/admin-context";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireAdmin } from "@/admin/RequireAdmin";
import { AdminLayout } from "@/admin/AdminLayout";

import HomePage from "./routes/index";
import ServicesPage from "./routes/services";
import GalleryPage from "./routes/gallery";
import AboutPage from "./routes/about";
import BookPage from "./routes/book";
import ContactPage from "./routes/contact";
import Dashboard from "./routes/dashboard";
import SignupPage from "./routes/signup";
import AdminLoginPage from "./routes/admin-login";
import TodayView from "./routes/admin/today";
import CalendarView from "./routes/admin/calendar";
import ClientsView from "./routes/admin/clients";
import ClientDetailView from "./routes/admin/client-detail";
import LeadsView from "./routes/admin/leads";

function PublicShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display uppercase text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 px-5 items-center rounded-sm bg-primary text-primary-foreground text-sm"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Admin login — standalone, no AdminProvider needed */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected admin area — own layout, no public header/footer */}
        <Route
          path="/admin"
          element={
            <AdminProvider>
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            </AdminProvider>
          }
        >
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<TodayView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="clients" element={<ClientsView />} />
          <Route path="clients/:id" element={<ClientDetailView />} />
          <Route path="leads" element={<LeadsView />} />
        </Route>

        {/* Public site — header + footer shell */}
        <Route element={<PublicShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
