import { useEffect, useRef, Component } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Account from "@/pages/Account";
import Topup from "@/pages/Topup";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen grid place-items-center bg-void font-mono text-xs text-slate-400 p-6 text-center">
          <div>
            <p>Terjadi kesalahan pada halaman.</p>
            <button
              data-testid="app-reload-button"
              className="mt-4 text-neon underline"
              onClick={() => {
                this.setState({ err: null });
                window.location.href = "/";
              }}
            >
              Muat ulang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-void grid-bg p-6 text-center" data-testid="not-found-page">
      <div>
        <p className="font-display font-black text-6xl text-stroke">404</p>
        <p className="mt-4 text-xs font-mono text-slate-400">Halaman tidak ditemukan.</p>
        <Link to="/" data-testid="not-found-home-link" className="mt-6 inline-block text-neon font-mono text-[11px] uppercase tracking-widest hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

function ScrollManager({ lenisRef }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenisRef]);
  return null;
}

function App() {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Smooth-scroll in-page anchors (e.g. /#katalog) through Lenis
    const onClick = (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const m = href.match(/#(.+)$/);
      if (!m) return;
      const el = document.getElementById(m[1]);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -80, duration: 1.2 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <ScrollManager lenisRef={lenisRef} />
        <ErrorBoundary>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/topup" element={<Topup />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/akun" element={<Account />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

export default App;