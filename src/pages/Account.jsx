import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User, Mail, ShieldCheck, LogOut, Loader2,
  Package, Heart, ArrowRight, KeyRound, Star,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewModal } from "@/components/ReviewModal";
import { useAuth } from "@/context/AuthContext";
import { api, formatIDR, imgSrc } from "@/lib/api";
import { toast } from "sonner";

const linkify = (text) =>
  String(text || "").split(/(\s+)/).map((part, i) =>
    /^https?:\/\//i.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="text-neon underline break-all">{part}</a>
    ) : (
      part
    )
  );

const statusStyle = (o) => {
  const s = o.payment_status;
  if (s === "paid") return "text-lime border-lime/40 bg-lime/10";
  if (s === "failed" || s === "cancelled") return "text-coral border-coral/40 bg-coral/10";
  return "text-neon border-neon/40 bg-neon/10";
};

const statusLabel = (o) => {
  const s = o.payment_status;
  if (s === "paid") return "Lunas";
  if (s === "failed") return o.status === "rejected" ? "Ditolak" : "Gagal";
  if (s === "cancelled") return "Dibatalkan";
  if (o.status === "waiting_approval") return "Menunggu Verifikasi";
  return o.provider === "manual" ? "Belum Dibayar" : "Menunggu";
};

const fmtDate = (v) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(v);
  }
};

export default function Account() {
  const { user, initializing, openAuth, logout, toggleWishlist } = useAuth();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState({});
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    Promise.allSettled([
      api.get("/me/orders"),
      api.get("/me/wishlist"),
      api.get("/reviews/mine"),
    ])
      .then(([o, w, r]) => {
        if (!alive) return;
        if (o.status === "fulfilled") setOrders(o.value.data || []);
        if (w.status === "fulfilled") setWishlist(w.value.data || []);
        if (r.status === "fulfilled") {
          const map = {};
          (r.value.data || []).forEach((rev) => {
            if (rev.id) map[rev.id] = rev;
          });
          setReviewed(map);
        }
        if (o.status === "rejected" && w.status === "rejected") toast.error("Gagal memuat data akun. Coba muat ulang halaman.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-void grid-bg">
      <Navbar />
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 sm:py-14">
        {initializing ? (
          <div className="flex items-center justify-center py-32" data-testid="account-initializing">
            <Loader2 size={28} className="animate-spin text-neon" />
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="account-guest">
            <User size={44} className="text-slate-600 mb-5" />
            <h1 className="font-display font-black uppercase text-2xl text-slate-100">Akun Saya</h1>
            <p className="text-slate-400 font-mono text-xs mt-3">Silakan login untuk melihat detail akun Anda.</p>
            <button
              onClick={() => openAuth("login")}
              data-testid="account-login-button"
              className="mt-8 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-8 py-3.5 hover:bg-lime transition-colors duration-300"
            >
              Login Sekarang
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
            data-testid="account-dashboard"
          >
            <div>
              <p className="text-[11px] font-mono tracking-[0.3em] text-neon uppercase">Panel Member</p>
              <h1 className="font-display font-black uppercase text-3xl sm:text-4xl text-slate-100 mt-2">
                Halo, <span className="text-neon">{user.name || "Member"}</span>
              </h1>
            </div>

            {/* Profile card */}
            <div className="bg-panel border border-line p-6 sm:p-8" data-testid="account-profile-card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="w-16 h-16 grid place-items-center bg-neon/10 border border-neon/30 shrink-0">
                  <User size={28} className="text-neon" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-100 font-display font-bold" data-testid="account-name">
                    {user.name || "Member"}
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border border-line text-slate-400">
                      {user.role || "buyer"}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-xs font-mono text-slate-400" data-testid="account-email">
                    <Mail size={13} /> {user.email}
                  </p>
                  <p className="flex items-center gap-2 text-xs font-mono">
                    <ShieldCheck size={13} className="text-lime" />
                    <span className="text-lime">Akun terverifikasi</span>
                  </p>
                </div>
                <button
                  onClick={logout}
                  data-testid="account-logout-button"
                  className="flex items-center justify-center gap-2 border border-line hover:border-coral/60 text-slate-300 hover:text-coral text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-3 transition-colors duration-300"
                >
                  <LogOut size={13} /> Keluar
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-neon" />
              </div>
            ) : (
              <>
                {/* Orders */}
                <section data-testid="account-orders-section">
                  <h2 className="flex items-center gap-2 font-display font-bold uppercase text-sm text-slate-100 mb-4">
                    <Package size={16} className="text-neon" /> Riwayat Pesanan
                    <span className="text-[10px] font-mono text-slate-500">({orders.length})</span>
                  </h2>
                  {orders.length === 0 ? (
                    <div className="bg-panel border border-line p-8 text-center" data-testid="account-orders-empty">
                      <p className="text-xs font-mono text-slate-400">Belum ada pesanan. Yuk jelajahi katalog!</p>
                      <Link
                        to="/#katalog"
                        className="inline-flex items-center gap-1.5 mt-4 text-neon font-mono text-[11px] uppercase tracking-widest hover:underline"
                      >
                        Lihat Katalog <ArrowRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((o) => (
                        <div
                          key={o.session_id || o.order_id}
                          data-testid="account-order-item"
                          className="bg-panel border border-line p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-display font-bold text-slate-100 truncate">
                              {o.product_title || "Produk"}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1">
                              #{o.order_id || o.session_id} &bull; {fmtDate(o.created_at)}
                            </p>
                            {o.payment_status === "paid" && o.delivery_info && (
                              <div className="mt-2 bg-lime/5 border border-lime/25 px-3 py-2.5" data-testid="account-order-access">
                                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-lime mb-1.5">
                                  <KeyRound size={11} /> Akses Akun / Link
                                </p>
                                <p className="text-[11px] font-mono text-slate-100 whitespace-pre-wrap break-words leading-relaxed">
                                  {linkify(o.delivery_info)}
                                </p>
                              </div>
                            )}
                            {o.provider === "manual" && o.payment_status === "pending" && (
                              <Link
                                to={`/payment/success?session_id=${o.session_id}`}
                                data-testid="account-order-continue"
                                className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-widest text-neon border border-neon/40 hover:bg-neon/10 px-2.5 py-1.5 transition-colors"
                              >
                                {o.status === "waiting_approval" ? "Lihat Status" : "Selesaikan Pembayaran"} <ArrowRight size={11} />
                              </Link>
                            )}
                            {o.payment_status === "paid" && (
                              <div className="mt-3" data-testid="account-order-review">
                                {reviewed[o.session_id] ? (
                                  <span
                                    data-testid="account-order-reviewed"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-lime"
                                  >
                                    <Star size={11} fill="currentColor" /> Sudah diulas
                                    <span className="text-slate-500">({reviewed[o.session_id].rating}/5)</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setReviewTarget(o)}
                                    data-testid="account-order-review-button"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-void bg-lime hover:bg-neon px-2.5 py-1.5 transition-colors"
                                  >
                                    <Star size={11} /> Beri Ulasan
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <span className="text-sm font-display font-bold text-neon">{formatIDR(o.amount)}</span>
                            <span data-testid="account-order-status" className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border ${statusStyle(o)}`}>
                              {statusLabel(o)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Wishlist */}
                <section data-testid="account-wishlist-section">
                  <h2 className="flex items-center gap-2 font-display font-bold uppercase text-sm text-slate-100 mb-4">
                    <Heart size={16} className="text-coral" /> Wishlist
                    <span className="text-[10px] font-mono text-slate-500">({wishlist.length})</span>
                  </h2>
                  {wishlist.length === 0 ? (
                    <div className="bg-panel border border-line p-8 text-center" data-testid="account-wishlist-empty">
                      <p className="text-xs font-mono text-slate-400">Wishlist kamu masih kosong.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {wishlist.map((p) => (
                        <div key={p.id} data-testid="account-wishlist-item" className="bg-panel border border-line overflow-hidden group relative">
                          <button
                            onClick={() => toggleWishlist(p.id).then(() => setWishlist((w) => w.filter((x) => x.id !== p.id)))}
                            data-testid="account-wishlist-remove"
                            aria-label="Hapus dari wishlist"
                            className="absolute top-2 right-2 z-10 grid place-items-center w-7 h-7 bg-void/80 border border-line text-coral hover:border-coral transition-colors"
                          >
                            <Heart size={13} className="fill-coral" />
                          </button>
                          <div className="aspect-video overflow-hidden bg-void">
                            <img
                              src={imgSrc(p.image)}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{p.game}</p>
                            <p className="text-xs font-display font-bold text-slate-100 truncate mt-1">{p.title}</p>
                            <p className="text-sm font-display font-bold text-neon mt-1">{formatIDR(p.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </motion.div>
        )}
      </div>
      <Footer />
      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        sessionId={reviewTarget?.session_id}
        productTitle={reviewTarget?.product_title}
        defaultEmail={user?.email || ""}
        onSubmitted={() => {
          setReviewed((m) => ({
            ...m,
            [reviewTarget?.session_id]: { rating: 5, id: reviewTarget?.session_id },
          }));
        }}
      />
    </div>
  );
}
