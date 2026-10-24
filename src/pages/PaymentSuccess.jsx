import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Clock, Home, MessageCircle, KeyRound, ExternalLink, Copy, Upload, XCircle, Zap, Star } from "lucide-react";
import { toast } from "sonner";
import { api, waLink, imgSrc, formatIDR } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ReviewModal } from "@/components/ReviewModal";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") || params.get("order_id");
  const { user } = useAuth();
  const [status, setStatus] = useState("checking");
  const [delivery, setDelivery] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [txData, setTxData] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [now, setNow] = useState(Date.now());
  void paymentType;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let tries = 0;
    let stopped = false;
    const applyData = (data) => {
      setTxData(data);
      if (data.payment_status === "paid" || data.status === "completed") {
        setStatus("paid");
        setDelivery(data.delivery_info || "");
        setPaymentType(data.payment_type || "");
        return true;
      }
      if (data.provider === "manual") {
        if (data.status === "rejected" || data.payment_status === "failed") {
          setStatus("rejected");
          return true;
        }
        if (data.status === "waiting_approval") {
          setStatus("manual_waiting");
          return false;
        }
        setStatus("manual_pending");
        return false;
      }
      if (data.provider === "paykita") {
        if (data.payment_status === "failed") {
          setStatus(data.status === "expired" ? "expired" : "failed");
          return true;
        }
        if (tries > 400) {
          setStatus("pending");
          return true;
        }
        setStatus("paykita_pending");
        return false;
      }
      if (data.payment_status === "failed") {
        setStatus("failed");
        return true;
      }
      if (tries > 12) {
        setStatus("pending");
        return true;
      }
      return false;
    };
    const poll = async () => {
      tries += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (stopped) return;
        if (applyData(data)) clearInterval(timer);
      } catch (err) {
        if (stopped) return;
        if (err.response?.status === 404 || tries > 12) {
          setStatus("error");
          clearInterval(timer);
        }
      }
    };
    const timer = setInterval(poll, 3000);
    poll();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [sessionId]);

  const uploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("proof", file);
      await api.post(`/payments/manual/upload-proof/${sessionId}`, fd);
      toast.success("Bukti transfer berhasil diupload");
      setStatus("manual_waiting");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengupload bukti");
    } finally {
      setUploading(false);
    }
  };

  const isLink = /^https?:\/\//i.test(delivery.trim());
  const copyDelivery = () => {
    navigator.clipboard.writeText(delivery).then(() => toast.success("Info akun disalin"));
  };

  const checkNow = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post(`/payments/paykita/sync/${sessionId}`);
      if (data.payment_status === "paid") toast.success("Pembayaran terkonfirmasi!");
      else if (data.payment_status === "failed") toast.error("Pembayaran kedaluwarsa / dibatalkan");
      else toast.info("Pembayaran belum terdeteksi. Coba lagi beberapa detik lagi.");
      const r = await api.get(`/payments/status/${sessionId}`);
      setTxData(r.data);
      if (r.data.payment_status === "paid") { setStatus("paid"); setDelivery(r.data.delivery_info || ""); }
      else if (r.data.payment_status === "failed") setStatus(r.data.status === "expired" ? "expired" : "failed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengecek status pembayaran");
    } finally {
      setSyncing(false);
    }
  };

  const expiresIn = txData?.expired_at ? Math.max(0, Math.floor((new Date(txData.expired_at).getTime() - now) / 1000)) : null;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Check whether this paid order can still be reviewed.
  useEffect(() => {
    if (status !== "paid" || !sessionId) return;
    let alive = true;
    api
      .get(`/reviews/eligibility/${sessionId}`, { params: user?.email ? { email: user.email } : {} })
      .then(({ data }) => alive && setReviewEligibility(data))
      .catch(() => alive && setReviewEligibility(null));
    return () => {
      alive = false;
    };
  }, [status, sessionId, user?.email]);

  const reviewProductTitle = txData?.product_title || reviewEligibility?.order?.product_title || "";

  return (
    <div data-testid="payment-success-page" className="min-h-screen bg-void grid-bg flex items-center justify-center px-4 py-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-panel border border-line p-10 text-center"
      >
        {status === "checking" && (
          <>
            <Loader2 size={52} className="mx-auto text-neon animate-spin" data-testid="payment-checking-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Memverifikasi Pembayaran...</h1>
            <p className="text-xs text-slate-400 mt-3 font-mono">Mohon tunggu, kami sedang mengonfirmasi transaksimu.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
              <CheckCircle2 size={60} className="mx-auto text-lime" data-testid="payment-paid-icon" />
            </motion.div>
            <h1 className="font-display font-black uppercase text-xl mt-6" data-testid="payment-success-title">
              Pembayaran <span className="text-lime">Berhasil</span>
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Pesananmu sudah kami terima dan pembayaran terkonfirmasi.
            </p>
            {delivery ? (
              <div className="mt-5 text-left border border-neon/40 bg-neon/5 p-4" data-testid="delivery-info-box">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound size={14} className="text-neon" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon">Info Akun / Akses Kamu</span>
                </div>
                {isLink ? (
                  <a
                    href={delivery.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="delivery-info-link"
                    className="flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] py-3 hover:bg-lime transition-colors duration-300 break-all"
                  >
                    <ExternalLink size={14} /> Buka Link Akun
                  </a>
                ) : (
                  <pre data-testid="delivery-info-text" className="whitespace-pre-wrap break-words font-mono text-[11px] text-slate-200 leading-relaxed">{delivery}</pre>
                )}
                <button
                  onClick={copyDelivery}
                  data-testid="delivery-info-copy"
                  className="mt-3 w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-400 hover:text-neon text-[10px] font-bold uppercase tracking-[0.2em] py-2.5 transition-colors duration-300"
                >
                  <Copy size={12} /> Salin Info
                </button>
                <p className="text-[10px] font-mono text-slate-500 mt-3 leading-relaxed">
                  Simpan info ini baik-baik. Butuh bantuan? Hubungi CS via WhatsApp.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Data akun / detail pesanan akan dikirim via WhatsApp dalam 5-15 menit.
              </p>
            )}
            <p className="text-[10px] font-mono text-slate-600 mt-4 break-all" data-testid="payment-session-id">
              ID Sesi: {sessionId}
            </p>
            {!reviewEligibility?.has_review ? (
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                data-testid="payment-review-button"
                className="mt-4 w-full flex items-center justify-center gap-2 border border-lime/50 text-lime hover:bg-lime/10 text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
              >
                <Star size={13} /> Beri Ulasan
              </button>
            ) : (
              <p
                data-testid="payment-review-done"
                className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-lime"
              >
                <Star size={12} fill="currentColor" /> Terima kasih, ulasanmu sudah tayang
              </p>
            )}
          </>
        )}
        {status === "manual_pending" && txData && (
          <>
            <h1 className="font-display font-bold uppercase text-lg mt-6" data-testid="manual-pending-title">Selesaikan Pembayaran</h1>
            <p className="text-xs text-slate-400 mt-2">
              Silakan transfer sebesar <strong className="text-neon" data-testid="manual-amount">{formatIDR(txData.amount)}</strong> ke tujuan berikut:
            </p>
            
            <div className="mt-4 bg-void border border-line p-4 text-left" data-testid="manual-destination-box">
               <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{txData.manual_destination?.name || "Tujuan Transfer"}</p>
               {txData.manual_destination?.type === "qris" && txData.manual_destination?.image && (
                 <div className="mb-3">
                   <img src={imgSrc(txData.manual_destination.image)} alt="QRIS" className="max-w-[200px] mx-auto border border-line p-2 bg-white" />
                 </div>
               )}
               {txData.manual_destination?.account_number && txData.manual_destination.account_number !== "-" && (
                 <div className="flex items-center justify-between gap-2 mb-1">
                   <p className="font-mono text-lg text-white font-bold break-all" data-testid="manual-account-number">{txData.manual_destination.account_number}</p>
                   <button
                     type="button"
                     onClick={() => navigator.clipboard.writeText(txData.manual_destination.account_number).then(() => toast.success("Nomor disalin"))}
                     data-testid="manual-copy-account"
                     className="shrink-0 grid place-items-center w-8 h-8 border border-line text-slate-400 hover:text-neon hover:border-neon/60 transition-colors"
                     aria-label="Salin nomor"
                   >
                     <Copy size={13} />
                   </button>
                 </div>
               )}
               {txData.manual_destination?.account_name && (
                 <p className="text-xs text-slate-400">a/n <span className="text-white">{txData.manual_destination.account_name}</span></p>
               )}
               {!txData.manual_destination && (
                 <p className="text-xs text-coral">Tujuan transfer tidak lagi tersedia. Hubungi CS untuk bantuan.</p>
               )}
            </div>

            <div className="mt-6">
              <label className="block w-full cursor-pointer bg-panel border border-neon/50 hover:bg-neon/10 transition-colors p-4 text-center" data-testid="upload-proof-label">
                 <span className="text-xs font-bold uppercase tracking-wider text-neon flex flex-col items-center gap-2">
                   {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                   {uploading ? "Mengupload..." : "Upload Bukti Transfer"}
                 </span>
                 <input type="file" accept="image/*" className="hidden" onChange={uploadProof} disabled={uploading} data-testid="upload-proof-input" />
              </label>
              <p className="text-[10px] text-slate-500 mt-2">Pastikan bukti transfer terlihat jelas.</p>
            </div>
          </>
        )}
        
        {status === "paykita_pending" && txData && (
          <>
            <h1 className="font-display font-bold uppercase text-lg mt-2" data-testid="paykita-pending-title">Scan QRIS untuk Membayar</h1>
            <p className="text-xs text-slate-400 mt-2">
              Bayar sebesar <strong className="text-neon" data-testid="paykita-amount">{formatIDR(txData.amount)}</strong> dengan memindai QRIS di bawah. Pembayaran terdeteksi otomatis.
            </p>
            <div className="mt-4 bg-white p-3 inline-block mx-auto" data-testid="paykita-qris-box">
              {txData.qris_image ? (
                <img src={imgSrc(txData.qris_image)} alt="QRIS" className="w-56 h-56 object-contain mx-auto" data-testid="paykita-qris-image" />
              ) : txData.qris_string ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(txData.qris_string)}`}
                  alt="QRIS"
                  className="w-56 h-56 object-contain mx-auto"
                  data-testid="paykita-qris-generated"
                />
              ) : (
                <p className="text-xs text-coral p-6">Kode QRIS belum tersedia. Mohon tunggu sebentar.</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-neon">
              <Loader2 size={14} className="animate-spin" /> Menunggu pembayaran...
            </div>
            {expiresIn !== null && (
              <p className="mt-2 text-[11px] font-mono text-slate-400" data-testid="paykita-countdown">
                QRIS berlaku <span className={expiresIn < 60 ? "text-coral font-bold" : "text-white font-bold"}>{mmss(expiresIn)}</span> lagi
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={checkNow}
                disabled={syncing}
                data-testid="paykita-check-button"
                className="w-full flex items-center justify-center gap-2 border border-neon/50 text-neon hover:bg-neon/10 text-[10px] font-bold uppercase tracking-[0.2em] py-2.5 transition-colors disabled:opacity-50"
              >
                {syncing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Saya Sudah Bayar — Cek Sekarang
              </button>
              {txData.pay_url && (
                <a href={txData.pay_url} target="_blank" rel="noopener noreferrer" data-testid="paykita-pay-link" className="w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-400 hover:text-neon text-[10px] font-bold uppercase tracking-[0.2em] py-2.5 transition-colors">
                  <ExternalLink size={12} /> Buka Halaman Pembayaran PayKita
                </a>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-600 mt-3 break-all">ID Sesi: {sessionId}</p>
          </>
        )}

        {status === "manual_waiting" && (
          <>
            <Clock size={52} className="mx-auto text-lime" />
            <h1 className="font-display font-bold uppercase text-lg mt-6 text-lime" data-testid="manual-waiting-title">Menunggu Konfirmasi</h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Bukti transfer berhasil diupload. Admin kami akan segera memverifikasi pembayaranmu dalam waktu 5-15 menit. Halaman ini akan otomatis terupdate.
            </p>
            <p className="text-[10px] font-mono text-slate-600 mt-4 break-all">
              ID Sesi: {sessionId}
            </p>
          </>
        )}

        {(status === "rejected" || status === "failed" || status === "expired") && (
          <>
            <XCircle size={52} className="mx-auto text-coral" data-testid="payment-rejected-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6 text-coral">
              {status === "rejected" ? "Pembayaran Ditolak" : status === "expired" ? "QRIS Kedaluwarsa" : "Pembayaran Gagal"}
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              {status === "rejected"
                ? "Bukti transfer kamu tidak dapat kami verifikasi. Jika merasa sudah membayar, hubungi CS dengan menyertakan ID sesi di bawah."
                : status === "expired"
                  ? "Waktu pembayaran QRIS sudah habis. Silakan pesan ulang untuk mendapatkan QRIS baru. Jika kamu sudah terlanjur membayar, hubungi CS."
                  : "Transaksi tidak berhasil diproses. Silakan coba pesan ulang atau hubungi CS."}
            </p>
            <p className="text-[10px] font-mono text-slate-600 mt-4 break-all">
              ID Sesi: {sessionId}
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <Clock size={52} className="mx-auto text-neon" data-testid="payment-pending-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Pembayaran Diproses</h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Pembayaranmu masih dalam proses konfirmasi. Hubungi CS jika butuh bantuan.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <Clock size={52} className="mx-auto text-coral" data-testid="payment-error-icon" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Tidak Dapat Memverifikasi</h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Kami tidak menemukan sesi pembayaran ini. Hubungi CS untuk bantuan.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <Link
            to="/"
            data-testid="payment-back-home-button"
            className="flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300"
          >
            <Home size={14} /> Kembali ke Beranda
          </Link>
          <a
            href={waLink(`Halo WillJustPlay, saya mau tanya pesanan dengan sesi: ${sessionId || "-"}`)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="payment-cs-button"
            className="flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[11px] font-bold uppercase tracking-[0.2em] py-3 transition-colors duration-300"
          >
            <MessageCircle size={13} /> Hubungi CS
          </a>
        </div>
      </motion.div>
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        sessionId={sessionId}
        productTitle={reviewProductTitle}
        defaultEmail={user?.email || ""}
        onSubmitted={() => setReviewEligibility((e) => ({ ...(e || {}), has_review: true }))}
      />
    </div>
  );
}
