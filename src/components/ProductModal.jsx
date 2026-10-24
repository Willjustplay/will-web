import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Zap, MessageCircle, Loader2, Star, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatIDR, waLink, imgSrc } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const badgeCls = (b) =>
  b === "Diskon Hot" ? "bg-coral text-white" : b === "Garansi 100%" ? "bg-lime text-void" : "bg-neon text-void";
const condCls = (c) => {
  const v = (c || "").toLowerCase();
  if (v === "ready") return "bg-lime text-void";
  if (v === "sold") return "bg-slate-600 text-slate-200";
  if (v === "unready") return "bg-coral text-white";
  return "border border-neon/50 text-neon bg-void";
};

export const ProductModal = ({ product, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerWa, setBuyerWa] = useState("");
  const [showDescription, setShowDescription] = useState(true);
  const [manualDestinations, setManualDestinations] = useState([]);
  const [selectedDest, setSelectedDest] = useState("");
  const [methods, setMethods] = useState([{ id: "manual", label: "Transfer Manual" }]);
  const [method, setMethod] = useState("manual");
  const paykitaAvailable = methods.some((m) => m.id === "paykita");
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [touchX, setTouchX] = useState(null);
  const gallery = product ? [product.image, ...(product.images || [])].filter(Boolean) : [];
  const mBadges = product ? (product.badges?.length ? product.badges : (product.badge ? [product.badge] : [])).slice(0, 3) : [];

  const goNext = () => setActive((i) => (i + 1) % gallery.length);
  const goPrev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length);

  useEffect(() => {
    setLoading(false);
    setActive(0);
    setZoom(false);
    setBuyerEmail(user?.email || "");
    api.get("/payments/manual-destinations").then((r) => {
      setManualDestinations(r.data);
      if (r.data.length > 0) setSelectedDest((cur) => (r.data.some((d) => d.id === cur) ? cur : r.data[0].id));
    }).catch(() => {});
    api.get("/payments/methods", { params: { product_id: product?.id } }).then((r) => {
      if (Array.isArray(r.data) && r.data.length) {
        setMethods(r.data);
        setMethod(r.data.some((m) => m.id === "paykita") ? "paykita" : "manual");
      }
    }).catch(() => {});
  }, [product, user?.email]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, gallery.length]);

  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 50) goPrev();
    else if (dx < -50) goNext();
    setTouchX(null);
  };

  const handleBuy = async () => {
    if (!buyerEmail.trim() && !buyerWa.trim()) {
      toast.error("Isi email atau nomor WhatsApp untuk pengiriman pesanan");
      return;
    }
    const buyer = { buyer_email: buyerEmail.trim(), buyer_whatsapp: buyerWa.trim() };
    setLoading(true);
    try {
      if (method === "paykita") {
        const { data } = await api.post("/payments/paykita/checkout", {
          ...buyer,
          product_id: product.id,
          origin_url: window.location.origin,
        });
        window.location.href = data.checkout_url;
        return;
      }
      if (!selectedDest) {
        toast.error("Pilih tujuan pembayaran manual terlebih dahulu");
        setLoading(false);
        return;
      }
      const { data } = await api.post("/payments/manual/checkout", {
        ...buyer,
        product_id: product.id,
        destination_id: selectedDest,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || (e.response ? "Gagal membuat sesi pembayaran" : "Tidak dapat terhubung ke server. Coba lagi."));
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-testid="product-modal"
        data-lenis-prevent
        aria-describedby={undefined}
        className="max-w-3xl w-[95vw] max-h-[90vh] bg-panel border-line text-slate-100 p-0 overflow-y-auto overflow-x-hidden gap-0 focus:outline-none [&>button:last-child]:z-20 [&>button:last-child]:bg-void/70 [&>button:last-child]:p-1.5 [&>button:last-child]:text-slate-200 [&>button:last-child]:opacity-100"
      >
        {product && <DialogTitle className="sr-only">{product.title}</DialogTitle>}
        {product && (
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-square md:aspect-auto md:min-h-[420px] group">
              <img src={imgSrc(gallery[active] || product.image)} alt={product.title} data-testid="modal-main-image" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent pointer-events-none" />
              <button
                onClick={() => setZoom(true)}
                data-testid="modal-zoom-button"
                aria-label="Perbesar gambar"
                className="absolute top-4 right-14 grid place-items-center w-9 h-9 bg-void/70 backdrop-blur text-slate-200 hover:text-neon border border-line/60 hover:border-neon transition-colors duration-200"
              >
                <Maximize2 size={15} />
              </button>
              {gallery.length > 1 && (
                <div className="absolute bottom-3 inset-x-3 flex gap-1.5 justify-center" data-testid="modal-gallery-thumbs">
                  {gallery.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      data-testid={`modal-thumb-${i}`}
                      className={`w-12 h-12 overflow-hidden border transition-colors duration-200 ${active === i ? "border-neon" : "border-line/60 opacity-70 hover:opacity-100"}`}
                    >
                      <img src={imgSrc(g)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {mBadges.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5" data-testid="modal-badges">
                  {mBadges.map((b) => (
                    <span key={b} className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 ${badgeCls(b)}`}>
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8 flex flex-col">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-neon mb-2">
                {product.game} &bull; {product.category}
              </p>
              {product.condition && (
                <span className={`self-start mb-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${condCls(product.condition)}`} data-testid="modal-condition">
                  {product.condition}
                </span>
              )}
              <h3 className="font-display font-bold text-lg leading-snug" data-testid="modal-product-title">
                {product.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-lime">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-mono">{product.rating}</span>
                <span className="text-[10px] font-mono text-slate-500 ml-1">({product.sold} terjual)</span>
              </div>
              <div className="mt-4 border-t border-line/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                    Deskripsi
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDescription((prev) => !prev)}
                    data-testid="toggle-product-description"
                    aria-label={showDescription ? "Sembunyikan deskripsi produk" : "Tampilkan deskripsi produk"}
                    title={showDescription ? "Sembunyikan" : "Tampilkan"}
                    className="inline-flex items-center justify-center w-5 h-5 text-xs font-mono font-bold text-neon hover:text-lime border border-line hover:border-neon/40 bg-void/50 transition-colors"
                  >
                    {showDescription ? "<" : ">"}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {showDescription && (
                    <motion.p
                      key="modal-description"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden text-xs leading-relaxed text-slate-400"
                      data-testid="modal-product-description"
                    >
                      {product.description || "Tidak ada rincian deskripsi tambahan untuk produk ini."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-3 gap-px bg-line border border-line mt-5 text-center">
                <div className="bg-void px-2 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Rank</p>
                  <p className="text-[11px] font-bold mt-1">{product.rank || "-"}</p>
                </div>
                <div className="bg-void px-2 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Stok</p>
                  <p className="text-[11px] font-bold mt-1" data-testid="modal-stock">{product.stock}</p>
                </div>
                <div className="bg-void px-2 py-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">Garansi</p>
                  <p className="text-[11px] font-bold mt-1 text-lime" data-testid="modal-warranty">{product.warranty || "100%"}</p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <p className="font-mono font-bold text-2xl text-neon" data-testid="modal-price">
                  {formatIDR(product.price)}
                </p>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2" data-testid="buyer-contact-fields">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">No. WhatsApp</span>
                      <input
                        type="tel"
                        value={buyerWa}
                        onChange={(e) => setBuyerWa(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        data-testid="buyer-whatsapp-input"
                        className="mt-1 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2 placeholder:text-slate-600 transition-colors"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">Email</span>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="kamu@email.com"
                        data-testid="buyer-email-input"
                        className="mt-1 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2 placeholder:text-slate-600 transition-colors"
                      />
                    </label>
                  </div>
                  {paykitaAvailable && (
                    <div className="grid grid-cols-2 gap-2" data-testid="payment-method-tabs">
                      <button
                        type="button"
                        onClick={() => setMethod("paykita")}
                        data-testid="method-paykita"
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 border transition-colors ${method === "paykita" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
                      >
                        QRIS Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod("manual")}
                        data-testid="method-manual"
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 border transition-colors ${method === "manual" ? "bg-neon text-void border-neon" : "border-line text-slate-400 hover:text-neon"}`}
                      >
                        Transfer Manual
                      </button>
                    </div>
                  )}

                  {method === "paykita" ? (
                    <div className="bg-panel border border-neon/30 p-3" data-testid="paykita-info-box">
                      <label className="block text-[10px] uppercase tracking-widest text-neon mb-1">Pembayaran Otomatis (PayKita)</label>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Setelah menekan Beli, kamu akan mendapat kode QRIS. Pembayaran terdeteksi otomatis dan pesanan langsung aktif.
                      </p>
                    </div>
                  ) : (
                    <>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500">Metode Pembayaran: <span className="text-neon">Transfer Manual</span></label>
                      {manualDestinations.length > 0 ? (
                        <div className="bg-panel border border-line p-3">
                          <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Pilih Tujuan Transfer</label>
                          <select
                            value={selectedDest}
                            onChange={(e) => setSelectedDest(e.target.value)}
                            data-testid="manual-destination-select"
                            className="w-full bg-void border border-line px-3 py-2 text-xs text-white outline-none focus:border-neon"
                          >
                            {manualDestinations.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                            ))}
                          </select>
                          {manualDestinations.find(d => d.id === selectedDest)?.account_name && (
                             <p className="mt-2 text-[10px] text-slate-400">Atas Nama: <span className="text-white">{manualDestinations.find(d => d.id === selectedDest)?.account_name}</span></p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-coral mt-2">Tidak ada tujuan transfer manual yang tersedia saat ini.</p>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={handleBuy}
                  disabled={loading || product.stock < 1 || (method === "manual" && !selectedDest)}
                  data-testid="modal-buy-button"
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-4 hover:bg-lime transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Zap size={15} />
                  )}
                  {product.stock < 1 ? "Stok Habis" : loading ? "Memproses..." : "Beli Sekarang"}
                </button>
                <a
                  href={waLink(`Halo WillJustPlay, saya mau tanya ketersediaan produk: ${product.title} (${formatIDR(product.price)})`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="modal-wa-button"
                  className="mt-2 w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
                >
                  <MessageCircle size={13} />
                  Tanya via WA
                </a>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500 text-center">
                  <ShieldCheck size={12} className="text-lime flex-shrink-0" />
                  {method === "paykita" ? "QRIS otomatis — pesanan aktif begitu pembayaran terdeteksi." : "Pembayaran manual. Silakan upload bukti transfer setelah pesanan dibuat."}
                </p>
              </div>
            </div>
          </div>
        )}
        {product && zoom && createPortal((
          <div
            data-testid="zoom-gallery-overlay"
            className="fixed inset-0 z-[120] bg-void/95 backdrop-blur-sm flex flex-col"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400" data-testid="zoom-counter">
                {active + 1} / {gallery.length}
              </span>
              <button
                onClick={() => setZoom(false)}
                data-testid="zoom-close-button"
                aria-label="Tutup"
                className="grid place-items-center w-10 h-10 text-slate-300 hover:text-neon transition-colors duration-200"
              >
                <X size={22} />
              </button>
            </div>
            <div className="relative flex-1 flex items-center justify-center px-2 sm:px-16 overflow-hidden">
              <img
                src={imgSrc(gallery[active])}
                alt={product.title}
                data-testid="zoom-main-image"
                className="max-h-full max-w-full object-contain select-none"
                draggable="false"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    data-testid="zoom-prev-button"
                    aria-label="Sebelumnya"
                    className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 bg-panel/80 border border-line hover:border-neon text-slate-200 hover:text-neon transition-colors duration-200"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goNext}
                    data-testid="zoom-next-button"
                    aria-label="Selanjutnya"
                    className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 bg-panel/80 border border-line hover:border-neon text-slate-200 hover:text-neon transition-colors duration-200"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-1.5 justify-center px-4 py-4 shrink-0 overflow-x-auto" data-testid="zoom-thumbs">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    data-testid={`zoom-thumb-${i}`}
                    className={`w-14 h-14 shrink-0 overflow-hidden border transition-colors duration-200 ${active === i ? "border-neon" : "border-line/60 opacity-60 hover:opacity-100"}`}
                  >
                    <img src={imgSrc(g)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ), document.body)}
      </DialogContent>
    </Dialog>
  );
};
