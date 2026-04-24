import { Routes, Route, Link } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import HomePage from "./routes/index";
import ServicesPage from "./routes/services";
import GalleryPage from "./routes/gallery";
import AboutPage from "./routes/about";
import BookPage from "./routes/book";
import ContactPage from "./routes/contact";
import Dashboard from "./routes/dashboard";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found.</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex h-10 px-5 items-center rounded-sm bg-primary text-primary-foreground text-sm">Go home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
