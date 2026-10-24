import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token reset password tidak valid atau tidak ditemukan");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, newPassword: password });
      toast.success(data.message || "Password berhasil diubah!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-void grid-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display font-bold text-coral text-xl">Token Tidak Valid</h1>
          <p className="text-slate-400 mt-2 font-mono text-xs">Tautan reset password ini mungkin sudah kedaluwarsa.</p>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-neon font-mono text-[11px] uppercase tracking-widest hover:underline">
            <ArrowLeft size={14} /> Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center px-4 py-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-sm w-full bg-panel border border-line p-8"
      >
        <div className="text-center mb-6">
          <Lock size={40} className="mx-auto text-neon mb-4" />
          <h1 className="font-display font-black uppercase text-xl text-slate-100">
            Reset <span className="text-neon">Password</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Silakan masukkan password baru untuk akunmu.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2.5 bg-void border border-line focus-within:border-neon/60 px-3.5 transition-colors">
            <Lock size={15} className="text-slate-500" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password baru (min 6 karakter)"
              data-testid="reset-password-input"
              className="flex-1 bg-transparent outline-none text-sm font-mono py-3 placeholder:text-slate-600 text-slate-100"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            data-testid="reset-password-submit"
            className="w-full flex items-center justify-center gap-2 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] py-3.5 hover:bg-lime transition-colors duration-300 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Simpan Password Baru
          </button>
        </form>
      </motion.div>
    </div>
  );
}
