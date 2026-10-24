import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, Lock, User, Zap, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { formatApiError, api } from "@/lib/api";

const inputWrap = "flex items-center gap-2.5 bg-void border border-line focus-within:border-neon/60 px-3.5 transition-colors";
const inputCls = "flex-1 bg-transparent outline-none text-sm font-mono py-3 placeholder:text-slate-600 text-slate-100";

export const AuthModal = ({ open, tab, setTab, onClose, onLogin, onRegister, onForgot }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setPassword("");
      setNeedsVerify(false);
    }
  }, [open, tab]);

  const resendVerification = async () => {
    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-verification", { email });
      toast.success(data.message || "Email verifikasi telah dikirim ulang. Cek inbox atau folder spam kamu.");
      setError("");
    } catch (err) {
      const detail = formatApiError(err.response?.data?.detail);
      if (err.response?.status === 429) {
        setError(detail || "Tunggu sebentar sebelum meminta tautan baru lagi.");
      } else if (err.response?.status === 503) {
        setError(detail || "Pengiriman email belum aktif. Hubungi CS via WhatsApp untuk verifikasi manual.");
      } else {
        setError(detail || "Gagal mengirim ulang email verifikasi. Coba lagi.");
      }
    } finally {
      setResending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerify(false);
    try {
      if (tab === "register") {
        const res = await onRegister(email, password, name);
        toast.success(res.message || "Akun berhasil dibuat. Silakan periksa email Anda untuk verifikasi.");
        if (res.token) {
          onClose();
        } else {
          // Email verification required (or the send failed): keep the user on
          // a screen where they can resend the link.
          setNeedsVerify(true);
          setTab("login");
        }
      } else if (tab === "forgot") {
        await onForgot(email);
        toast.success("Tautan reset password telah dikirim jika email terdaftar.");
        setTab("login");
      } else {
        await onLogin(email, password);
        toast.success("Berhasil masuk. Selamat datang kembali!");
        onClose();
      }
    } catch (err) {
      if (tab === "login" && err.response?.status === 403) {
        setNeedsVerify(true);
      }
      const detail = err.response?.data?.detail;
      setError(formatApiError(detail) || (err.response ? "Gagal, coba lagi" : "Tidak dapat terhubung ke server. Periksa koneksi internet kamu."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="auth-modal"
          className="fixed inset-0 z-[100] bg-void/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-panel border border-line max-h-[90vh] overflow-y-auto"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 grid place-items-center bg-neon text-void">
                  <Zap size={16} strokeWidth={2.75} />
                </span>
                <span className="font-display font-extrabold text-sm uppercase tracking-tight">
                  Will<span className="text-neon">Just</span>Play
                </span>
              </div>
              <button onClick={onClose} data-testid="auth-modal-close" className="text-slate-500 hover:text-coral transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 border-b border-line">
              {["login", "register"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  data-testid={`auth-tab-${t}`}
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] py-3.5 transition-colors ${
                    tab === t || (tab === "forgot" && t === "login") ? "bg-neon/10 text-neon" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t === "login" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="p-6 space-y-3">
              {tab === "register" && (
                <div className={inputWrap}>
                  <User size={15} className="text-slate-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu"
                    data-testid="auth-name-input"
                    className={inputCls}
                  />
                </div>
              )}
              <div className={inputWrap}>
                <Mail size={15} className="text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  data-testid="auth-email-input"
                  className={inputCls}
                />
              </div>
              
              {tab !== "forgot" && (
                <div className={inputWrap}>
                  <Lock size={15} className="text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === "register" ? "Password (min. 6 karakter)" : "Password"}
                    data-testid="auth-password-input"
                    className={inputCls}
                  />
                </div>
              )}

              {error && (
                <p data-testid="auth-error" className="text-[11px] font-mono text-coral">{error}</p>
              )}

              {needsVerify && tab === "login" && (
                <div
                  data-testid="auth-verify-notice"
                  className="border border-neon/40 bg-neon/5 px-3 py-3 space-y-2.5"
                >
                  <p className="flex items-start gap-2 text-[11px] font-mono text-slate-300">
                    <MailCheck size={13} className="mt-0.5 shrink-0 text-neon" />
                    Akun terbuat{email ? ` (${email})` : ""} tetapi belum diverifikasi. Buka tautan
                    verifikasi di email kamu, lalu masuk kembali.
                  </p>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={resending}
                    data-testid="auth-resend-verification-button"
                    className="w-full flex items-center justify-center gap-2 border border-neon/50 text-neon font-mono text-[10px] uppercase tracking-[0.15em] py-2.5 hover:bg-neon/10 transition-colors duration-300 disabled:opacity-50"
                  >
                    {resending ? <Loader2 size={13} className="animate-spin" /> : <MailCheck size={13} />}
                    Kirim ulang email verifikasi
                  </button>
                </div>
              )}

              {tab === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setTab("forgot")} data-testid="auth-forgot-link" className="text-[10px] font-mono text-slate-400 hover:text-neon">Lupa password?</button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                data-testid="auth-submit-button"
                className="w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300 disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {tab === "register" ? "Buat Akun" : tab === "forgot" ? "Reset Password" : "Masuk"}
              </button>

              <p className="text-center text-[11px] font-mono text-slate-500">
                {tab === "forgot" ? (
                  <button type="button" onClick={() => setTab("login")} className="text-neon hover:underline">Kembali ke Login</button>
                ) : (
                  <>
                    {tab === "register" ? "Sudah punya akun? " : "Belum punya akun? "}
                    <button
                      type="button"
                      onClick={() => setTab(tab === "register" ? "login" : "register")}
                      data-testid="auth-switch-tab"
                      className="text-neon hover:underline"
                    >
                      {tab === "register" ? "Masuk" : "Daftar"}
                    </button>
                  </>
                )}
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
