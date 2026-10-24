import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Plus, Pencil, Trash2, RotateCcw, LogOut, X, Loader2, Package, Receipt, ArrowLeft, Upload, MessageSquareQuote, Webhook, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { api, formatIDR, imgSrc, formatApiError } from "@/lib/api";
import { AdminTestimonials } from "@/components/AdminTestimonials";
import { AdminPayment } from "@/components/AdminPayment";
import { AdminPaykita } from "@/components/AdminPaykita";
import { AdminSocials } from "@/components/AdminSocials";
import { AdminProductPaykita, EMPTY_PRODUCT_PAYKITA } from "@/components/AdminProductPaykita";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = ["Akun Game", "Jasa Joki", "Topup Game", "Item Game", "Lainnya"];
const BADGE_PRESETS = ["Verified Seller", "Garansi 100%", "Diskon Hot"];
const CONDITION_PRESETS = ["ready", "unready", "sold"];

const EMPTY_FORM = {
  game: "", category: "Akun Game", title: "", price: 0, rank: "",
  image: "", images: [], stock: 1, badges: [], description: "", featured: false, sold: 0, rating: 5.0,
  warranty: "100%", delivery_info: "", condition: "ready", paykita: EMPTY_PRODUCT_PAYKITA,
};

export default function Admin() {
  const { user, login, adminLogin, logout: authLogout, initializing } = useAuth();
  const [params] = useSearchParams();
  const passwordOnly = params.get("mode") === "password";
  const authed = !!user && user.role === "admin";
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [checking, setChecking] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [tab, setTab] = useState("produk");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [badgeInput, setBadgeInput] = useState("");
  const [proofUrl, setProofUrl] = useState(null);
  const editingProduct = products.find((p) => p.id === editing);

  const viewProof = async (o) => {
    if (o.payment_proof) return setProofUrl(o.payment_proof);
    try {
      const { data } = await api.get(`/admin/orders/${o.session_id}/proof`);
      setProofUrl(data.payment_proof);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memuat bukti pembayaran");
    }
  };

  const orderStatusLabel = (o) => {
    if (o.payment_status === "paid") return "Lunas";
    if (o.payment_status === "failed") return o.status === "rejected" ? "Ditolak" : o.status === "expired" ? "Kedaluwarsa" : "Gagal";
    if (o.status === "waiting_approval") return "Perlu Verifikasi";
    return o.provider === "manual" ? "Belum Bayar" : "Menunggu QRIS";
  };

  const syncOrder = async (o) => {
    try {
      const { data } = await api.post(`/admin/orders/${o.session_id}/sync`);
      toast.success(`Status PayKita: ${data.paykita_status || data.payment_status}`);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal cek status ke PayKita");
    }
  };

  const headers = {};

  const load = useCallback(async () => {
    try {
      const [p, o, t] = await Promise.all([
        api.get("/admin/products"),
        api.get("/admin/orders"),
        api.get("/testimonials"),
      ]);
      setProducts(p.data);
      setOrders(o.data);
      setTestimonials(t.data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memuat data admin");
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const doLogin = async () => {
    if (passwordOnly) {
      if (!loginPass) {
        toast.error("Password wajib diisi");
        return;
      }
      setChecking(true);
      try {
        await adminLogin(loginPass);
      } catch (e) {
        toast.error(formatApiError(e.response?.data?.detail) || "Login gagal");
      } finally {
        setChecking(false);
      }
      return;
    }
    if (!loginEmail || !loginPass) {
      toast.error("Email & password wajib diisi");
      return;
    }
    setChecking(true);
    try {
      const u = await login(loginEmail, loginPass);
      if (u.role !== "admin") toast.error("Akun ini bukan admin");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Login gagal");
    } finally {
      setChecking(false);
    }
  };

  const logout = () => authLogout();

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing("new");
  };

  const openEdit = (p) => {
    setForm({
      game: p.game, category: p.category, title: p.title, price: p.price,
      rank: p.rank || "", image: p.image || "", images: p.images || [], stock: p.stock,
      badges: p.badges?.length ? p.badges : (p.badge ? [p.badge] : []),
      description: p.description || "", featured: !!p.featured, sold: p.sold || 0, rating: p.rating || 5,
      warranty: p.warranty || "100%", delivery_info: p.delivery_info || "", condition: p.condition || "",
      paykita: EMPTY_PRODUCT_PAYKITA,
    });
    setEditing(p.id);
  };

  const save = async () => {
    if (!form.title || !form.game || !form.price) {
      toast.error("Judul, game, dan harga wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, badge: form.badges[0] || "", price: Number(form.price), stock: Number(form.stock), sold: Number(form.sold), rating: Number(form.rating) };
      if (editing === "new") {
        await api.post("/admin/products", payload, { headers });
        toast.success("Produk baru ditambahkan");
      } else {
        await api.put(`/admin/products/${editing}`, payload, { headers });
        toast.success("Produk diperbarui");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus produk ini secara permanen?")) return;
    try {
      await api.delete(`/admin/products/${id}`, { headers });
      toast.success("Produk dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus produk");
    }
  };

  const uploadImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/admin/upload", fd, { headers });
      setForm((prev) => ({ ...prev, image: data.url }));
      toast.success("Gambar berhasil diupload");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengupload gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const uploadGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const room = 5 - form.images.length;
    if (room <= 0) {
      toast.error("Maksimal 5 gambar tambahan");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const urls = [];
      for (const f of files.slice(0, room)) {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/admin/upload", fd, { headers });
        urls.push(data.url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls].slice(0, 5) }));
      toast.success(`${urls.length} gambar tambahan diupload`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengupload gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (idx) => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const addBadge = (b) => {
    const v = (b || "").trim();
    if (!v) return;
    if (form.badges.includes(v)) { setBadgeInput(""); return; }
    if (form.badges.length >= 3) { toast.error("Maksimal 3 badge"); return; }
    setForm((prev) => ({ ...prev, badges: [...prev.badges, v] }));
    setBadgeInput("");
  };
  const removeBadge = (b) => setForm((prev) => ({ ...prev, badges: prev.badges.filter((x) => x !== b) }));

  const resetSeed = async () => {
    if (!window.confirm("Reset katalog ke data contoh awal? Semua perubahan akan hilang.")) return;
    try {
      await api.post("/admin/reset", {}, { headers });
      toast.success("Katalog direset ke data contoh");
      load();
    } catch {
      toast.error("Gagal mereset katalog");
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-void grid-bg flex items-center justify-center" data-testid="admin-loading">
        <Loader2 size={28} className="animate-spin text-neon" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div data-testid="admin-login-page" className="min-h-screen bg-void grid-bg flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full bg-panel border border-line p-8"
        >
          <span className="w-11 h-11 grid place-items-center border border-neon/40 text-neon mb-6">
            <ShieldCheck size={20} />
          </span>
          <h1 className="font-display font-bold uppercase text-lg" data-testid="admin-login-title">Panel Admin</h1>
          {user && user.role !== "admin" ? (
            <>
              <p className="text-xs text-coral font-mono mt-2 mb-6" data-testid="admin-not-authorized">
                Akun "{user.email}" bukan admin. Silakan keluar dan masuk dengan akun admin.
              </p>
              <button onClick={logout} data-testid="admin-switch-account" className="w-full bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors">
                Keluar
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 font-mono mt-2 mb-6">
                {passwordOnly ? "Masukkan password admin." : "Masuk dengan email & password admin."}
              </p>
              {!passwordOnly && (
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email admin"
                  data-testid="admin-email-input"
                  className="w-full bg-void border border-line focus:border-neon/60 outline-none text-sm font-mono px-4 py-3 placeholder:text-slate-600 transition-colors"
                />
              )}
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
                placeholder="Password"
                autoFocus={passwordOnly}
                data-testid="admin-password-input"
                className={`${passwordOnly ? "" : "mt-3 "}w-full bg-void border border-line focus:border-neon/60 outline-none text-sm font-mono px-4 py-3 placeholder:text-slate-600 transition-colors`}
              />
              <button
                onClick={doLogin}
                disabled={checking}
                data-testid="admin-login-button"
                className="mt-3 w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300 disabled:opacity-50"
              >
                {checking && <Loader2 size={14} className="animate-spin" />}
                Masuk
              </button>
            </>
          )}
          <Link to="/" data-testid="admin-back-home-link" className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-neon transition-colors">
            <ArrowLeft size={12} /> Kembali ke beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-void text-slate-100">
      <header className="border-b border-line bg-panel/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 grid place-items-center bg-neon text-void"><ShieldCheck size={15} /></span>
            <span className="font-display font-extrabold text-sm uppercase tracking-tight">Admin <span className="text-neon">WillJustPlay</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" data-testid="admin-view-store-button" className="text-[11px] uppercase tracking-widest text-slate-400 hover:text-neon border border-line hover:border-neon/50 px-3 py-2 transition-colors">
              Lihat Toko
            </Link>
            <button onClick={logout} data-testid="admin-logout-button" className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-400 hover:text-coral border border-line hover:border-coral/50 px-3 py-2 transition-colors">
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab("produk")}
              data-testid="admin-tab-products"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "produk" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Package size={13} /> Produk ({products.length})
            </button>
            <button
              onClick={() => setTab("pesanan")}
              data-testid="admin-tab-orders"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "pesanan" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Receipt size={13} /> Pesanan ({orders.length})
            </button>
            <button
              onClick={() => setTab("testimoni")}
              data-testid="admin-tab-testimonials"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "testimoni" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <MessageSquareQuote size={13} /> Testimoni ({testimonials.length})
            </button>
            <button
              onClick={() => setTab("pembayaran")}
              data-testid="admin-tab-payments"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "pembayaran" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Receipt size={13} /> Pembayaran Manual
            </button>
            <button
              onClick={() => setTab("paykita")}
              data-testid="admin-tab-paykita"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "paykita" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Webhook size={13} /> Pembayaran Otomatis
            </button>
            <button
              onClick={() => setTab("sosial")}
              data-testid="admin-tab-socials"
              className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border transition-colors ${tab === "sosial" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
            >
              <Share2 size={13} /> Sosial Media
            </button>
          </div>
          {tab === "produk" && (
            <div className="flex flex-wrap gap-2">
              <button onClick={resetSeed} data-testid="reset-seed-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 border border-coral/50 text-coral hover:bg-coral hover:text-white transition-colors">
                <RotateCcw size={13} /> Reset Data Contoh
              </button>
              <button onClick={openNew} data-testid="add-product-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 bg-neon text-void hover:bg-lime transition-colors">
                <Plus size={13} /> Tambah Produk
              </button>
            </div>
          )}
        </div>

        {tab === "pembayaran" && <AdminPayment />}

        {tab === "paykita" && <AdminPaykita />}

        {tab === "sosial" && <AdminSocials />}

        {tab === "produk" && (
          <div className="border border-line bg-panel overflow-x-auto" data-testid="admin-products-table">
            <table className="w-full text-left text-xs font-mono min-w-[760px]">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 hover:bg-panelhover transition-colors" data-testid={`admin-row-${p.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={imgSrc(p.image)} alt="" className="w-11 h-11 object-cover border border-line" />
                        <span className="font-sans font-bold text-slate-200 max-w-[220px] truncate">{p.title}</span>
                        {p.paykita_api_key_set && (
                          <span data-testid={`own-key-badge-${p.id}`} title="Memakai API key PayKita sendiri" className="shrink-0 text-[9px] font-bold uppercase tracking-widest border border-neon/40 text-neon px-1.5 py-0.5">PayKita</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neon">{p.game}</td>
                    <td className="px-4 py-3 text-slate-400">{p.category}</td>
                    <td className="px-4 py-3 text-neon font-bold">{formatIDR(p.price)}</td>
                    <td className="px-4 py-3">{p.stock < 1 ? <span className="text-coral">Habis</span> : p.stock}</td>
                    <td className="px-4 py-3 text-slate-400">{(p.badges?.length ? p.badges : (p.badge ? [p.badge] : [])).join(", ") || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`} className="w-8 h-8 grid place-items-center border border-line text-slate-400 hover:text-neon hover:border-neon/50 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => remove(p.id)} data-testid={`delete-product-${p.id}`} className="w-8 h-8 grid place-items-center border border-line text-slate-400 hover:text-coral hover:border-coral/50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "testimoni" && (
          <AdminTestimonials items={testimonials} headers={headers} reload={load} />
        )}

        {tab === "pesanan" && (
          <div className="border border-line bg-panel overflow-x-auto" data-testid="admin-orders-table">
            {orders.length === 0 ? (
              <p className="text-center text-xs text-slate-500 font-mono py-16">Belum ada pesanan masuk.</p>
            ) : (
              <table className="w-full text-left text-xs font-mono min-w-[760px]">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3">Sesi</th>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Pembeli</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.session_id} className="border-b border-line/60" data-testid={`order-row-${o.session_id.slice(-6)}`}>
                      <td className="px-4 py-3 text-slate-500">...{o.session_id.slice(-10)}</td>
                      <td className="px-4 py-3 text-slate-200 max-w-[240px] truncate">{o.product_title}</td>
                      <td className="px-4 py-3 text-slate-400 text-[10px] max-w-[180px]" data-testid={`order-buyer-${o.session_id.slice(-6)}`}>
                        <div className="truncate">{o.buyer_whatsapp || "-"}</div>
                        <div className="truncate text-slate-500">{o.buyer_email || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 uppercase text-[10px]">{o.provider || "midtrans"}{o.payment_type ? ` · ${o.payment_type}` : ""}{o.destination_name ? ` · ${o.destination_name}` : ""}</td>
                      <td className="px-4 py-3 text-neon font-bold">{formatIDR(o.amount)}</td>
                      <td className="px-4 py-3">
                        <span data-testid={`order-status-${o.session_id.slice(-6)}`} className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          o.payment_status === "paid" ? "bg-lime/15 text-lime" : o.payment_status === "failed" ? "bg-coral/15 text-coral" : o.status === "waiting_approval" ? "bg-coral/10 text-coral" : "bg-neon/10 text-neon"
                        }`}>
                          {orderStatusLabel(o)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{(o.created_at || "").slice(0, 16).replace("T", " ")}</td>
                      <td className="px-4 py-3 text-right">
                        {o.provider === "paykita" && o.payment_status === "pending" && (
                          <button
                            type="button"
                            onClick={() => syncOrder(o)}
                            data-testid={`sync-order-${o.session_id.slice(-6)}`}
                            className="text-[10px] text-neon border border-neon/40 hover:bg-neon/10 px-2.5 py-1 uppercase tracking-widest transition-colors"
                          >
                            Cek Status
                          </button>
                        )}
                        {o.provider === "manual" && (
                          <div className="flex flex-col items-end gap-1.5">
                            {o.has_proof || o.payment_proof ? (
                              <button
                                type="button"
                                onClick={() => viewProof(o)}
                                data-testid={`view-proof-${o.session_id.slice(-6)}`}
                                className="text-[10px] text-neon border border-neon/40 hover:bg-neon/10 px-2.5 py-1 uppercase tracking-widest transition-colors"
                              >
                                Lihat Bukti
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">Menunggu Bukti</span>
                            )}
                            {o.status === "waiting_approval" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm("Terima pembayaran ini?")) return;
                                    try {
                                      await api.post(`/admin/orders/${o.session_id}/approve`);
                                      toast.success("Pembayaran diterima!");
                                      load();
                                    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Gagal menerima pembayaran"); }
                                  }}
                                  data-testid={`approve-order-${o.session_id.slice(-6)}`}
                                  className="bg-lime text-void px-2 py-1 text-[9px] font-bold uppercase tracking-widest hover:opacity-80"
                                >Terima</button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm("Tolak pembayaran ini?")) return;
                                    try {
                                      await api.post(`/admin/orders/${o.session_id}/reject`);
                                      toast.success("Pembayaran ditolak");
                                      load();
                                    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Gagal menolak pembayaran"); }
                                  }}
                                  data-testid={`reject-order-${o.session_id.slice(-6)}`}
                                  className="bg-coral text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest hover:opacity-80"
                                >Tolak</button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="product-form-modal">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-panel border border-line max-h-[90vh] overflow-y-auto"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display font-bold uppercase text-sm" data-testid="product-form-title">
                {editing === "new" ? "Tambah Produk Baru" : "Edit Produk"}
              </h2>
              <button onClick={() => setEditing(null)} data-testid="product-form-close" className="text-slate-500 hover:text-coral transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Judul Produk *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="form-title-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Nama Game *</span>
                <input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} placeholder="mis. Mobile Legends" data-testid="form-game-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Kategori</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="form-category-select"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Harga (IDR) *</span>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="form-price-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Rank / Tier</span>
                <input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="mis. Mythic Glory" data-testid="form-rank-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Stok</span>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} data-testid="form-stock-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Garansi</span>
                <input value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="mis. 100% / 30 Hari" data-testid="form-warranty-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Kondisi Akun</span>
                <input list="condition-presets" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="ready / unready / sold / custom" data-testid="form-condition-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
                <datalist id="condition-presets">
                  {CONDITION_PRESETS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </label>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Gambar Produk</span>
                <div className="mt-1.5 flex items-start gap-3">
                  {form.image && (
                    <img src={imgSrc(form.image)} alt="preview" data-testid="form-image-preview" className="w-20 h-20 object-cover border border-line" />
                  )}
                  <div className="flex-1 space-y-2">
                    <label data-testid="form-image-upload-label" className={`flex items-center justify-center gap-2 border border-dashed border-line hover:border-neon/60 text-slate-400 hover:text-neon text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {uploading ? "Mengupload..." : "Upload dari Komputer"}
                      <input type="file" accept="image/*" onChange={uploadImage} data-testid="form-image-file-input" className="hidden" />
                    </label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="atau tempel URL gambar https://..." data-testid="form-image-input"
                      className="w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Gambar Tambahan ({form.images.length}/5)</span>
                <div className="mt-1.5 flex flex-wrap gap-2" data-testid="form-gallery-list">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 border border-line group" data-testid={`form-gallery-item-${i}`}>
                      <img src={imgSrc(url)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(i)} data-testid={`form-gallery-remove-${i}`} className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center bg-coral text-white">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <label data-testid="form-gallery-upload-label" className={`w-16 h-16 grid place-items-center border border-dashed border-line hover:border-neon/60 text-slate-500 hover:text-neon cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      <input type="file" accept="image/*" multiple onChange={uploadGallery} data-testid="form-gallery-file-input" className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Badge ({form.badges.length}/3) — bisa custom, maks 3</span>
                {form.badges.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2" data-testid="form-badges-list">
                    {form.badges.map((b) => (
                      <span key={b} data-testid={`form-badge-chip-${b}`} className="flex items-center gap-1.5 bg-neon/10 border border-neon/40 text-neon text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5">
                        {b}
                        <button type="button" onClick={() => removeBadge(b)} data-testid={`form-badge-remove-${b}`} className="text-neon/70 hover:text-coral transition-colors"><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BADGE_PRESETS.map((b) => (
                    <button key={b} type="button" onClick={() => addBadge(b)} data-testid={`form-badge-preset-${b}`} disabled={form.badges.includes(b) || form.badges.length >= 3}
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 border border-line text-slate-400 hover:text-neon hover:border-neon/50 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                      + {b}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={badgeInput} onChange={(e) => setBadgeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBadge(badgeInput); } }}
                    placeholder="Badge custom..." data-testid="form-badge-custom-input"
                    className="flex-1 bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors" />
                  <button type="button" onClick={() => addBadge(badgeInput)} data-testid="form-badge-add-button" disabled={form.badges.length >= 3}
                    className="px-4 border border-neon/50 text-neon text-[11px] font-bold uppercase tracking-widest hover:bg-neon hover:text-void transition-colors disabled:opacity-30 disabled:pointer-events-none">Tambah</button>
                </div>
              </div>
              <label className="flex items-center gap-2.5 sm:col-span-2 pt-2">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="form-featured-checkbox"
                  className="w-4 h-4 accent-[#00F0FF]" />
                <span className="text-[10px] uppercase tracking-widest text-slate-400">Tampilkan sebagai Unggulan di Hero</span>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Deskripsi</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} data-testid="form-description-input"
                  className="mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 leading-relaxed transition-colors" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-neon">Info Akun / Link (dikirim otomatis setelah bayar)</span>
                <textarea value={form.delivery_info} onChange={(e) => setForm({ ...form, delivery_info: e.target.value })} rows={4} placeholder="Tempel detail login akun game, kode voucher, atau link (mis. https://...). Pembeli akan langsung melihat ini di halaman sukses setelah pembayaran terkonfirmasi." data-testid="form-delivery-input"
                  className="mt-1.5 w-full bg-void border border-neon/30 focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 leading-relaxed placeholder:text-slate-600 transition-colors" />
              </label>
              <AdminProductPaykita
                value={form.paykita}
                onChange={(paykita) => setForm((prev) => ({ ...prev, paykita }))}
                product={editingProduct}
              />
            </div>
            <div className="border-t border-line px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} data-testid="form-cancel-button" className="text-[11px] font-bold uppercase tracking-widest px-5 py-3 border border-line text-slate-400 hover:text-slate-200 transition-colors">
                Batal
              </button>
              <button onClick={save} disabled={saving} data-testid="save-product-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-5 py-3 bg-neon text-void hover:bg-lime transition-colors disabled:opacity-50">
                {saving && <Loader2 size={13} className="animate-spin" />}
                Simpan Produk
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {proofUrl && (
        <div
          className="fixed inset-0 z-[60] bg-void/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setProofUrl(null)}
          data-testid="proof-modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-panel border border-line max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h3 className="font-display font-bold uppercase text-xs text-slate-100">Bukti Pembayaran</h3>
              <button onClick={() => setProofUrl(null)} data-testid="proof-modal-close" className="text-slate-500 hover:text-coral transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <img src={proofUrl} alt="Bukti pembayaran" data-testid="proof-modal-image" className="w-full h-auto object-contain border border-line bg-void" />
              <a
                href={proofUrl}
                download="bukti-pembayaran"
                data-testid="proof-modal-download"
                className="mt-4 flex items-center justify-center gap-2 border border-neon/50 text-neon text-[10px] font-bold uppercase tracking-widest py-2.5 hover:bg-neon/10 transition-colors"
              >
                Unduh Bukti
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
