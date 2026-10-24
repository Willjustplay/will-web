import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Home } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const hasFetched = useRef(false);
  const { openAuth } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan di URL.");
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    api.post("/auth/verify-email", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email berhasil diverifikasi.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Gagal memverifikasi email atau token sudah tidak berlaku.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center px-4 py-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-panel border border-line p-10 text-center"
      >
        {status === "loading" && (
          <>
            <Loader2 size={52} className="mx-auto text-neon animate-spin" />
            <h1 className="font-display font-bold uppercase text-lg mt-6">Memverifikasi...</h1>
            <p className="text-xs text-slate-400 mt-3 font-mono">Mohon tunggu, kami sedang memverifikasi email kamu.</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
              <CheckCircle2 size={60} className="mx-auto text-lime" />
            </motion.div>
            <h1 className="font-display font-black uppercase text-xl mt-6">
              Email <span className="text-lime">Terverifikasi!</span>
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed font-mono">
              {message}
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => openAuth("login")}
                data-testid="verify-login-button"
                className="w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300"
              >
                Login Sekarang
              </button>
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 transition-colors duration-300"
              >
                <Home size={14} /> Kembali ke Beranda
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
              <XCircle size={60} className="mx-auto text-coral" />
            </motion.div>
            <h1 className="font-display font-bold uppercase text-xl mt-6">
              Verifikasi <span className="text-coral">Gagal</span>
            </h1>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed font-mono">
              {message}
            </p>
            <div className="mt-8">
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 border border-line hover:border-neon/60 text-slate-300 hover:text-neon text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 transition-colors duration-300"
              >
                <Home size={14} /> Kembali ke Beranda
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
