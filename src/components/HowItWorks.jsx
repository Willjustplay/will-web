import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MousePointerClick, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STEPS = [
  {
    num: "01",
    icon: MousePointerClick,
    title: "Pilih Akun / Jasa",
    desc: "Cari produk game impianmu di katalog atau pilih paket jasa joki rank sesuai kebutuhan & budget.",
  },
  {
    num: "02",
    icon: CreditCard,
    title: "Bayar & Konfirmasi",
    desc: "Transfer ke rekening bank, e-wallet, atau scan QRIS yang tersedia, lalu upload bukti transfer. Admin akan mengonfirmasi pembayaranmu.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Terima & Garansi",
    desc: "Data akun atau proses joki langsung dikirim dalam 5-15 menit. Dilengkapi garansi 100% aman.",
  },
];

export const HowItWorks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
  <section id="cara-kerja" data-testid="how-it-works-section" className="py-16 sm:py-24 border-t border-line bg-[#0A0D14]">
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      onClick={isAdmin ? () => navigate("/admin?mode=password") : undefined}
      data-testid="how-it-works-admin-trigger"
      title={isAdmin ? "Masuk panel admin" : undefined}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-neon/90 font-mono mb-3">
        02 &mdash; Cara Kerja
      </p>
      <h2 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl mb-14" data-testid="how-it-works-title">
        Tiga Langkah. <span className="text-stroke">Nol Ribet.</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            data-testid={`step-card-${s.num}`}
            className="group relative bg-panel border border-line hover:border-neon/40 p-7 transition-colors duration-300 overflow-hidden"
          >
            <span className="font-display font-black text-7xl sm:text-8xl text-stroke opacity-50 group-hover:opacity-100 transition-opacity duration-300">
              {s.num}
            </span>
            <div className="mt-6 flex items-center gap-3">
              <span className="w-9 h-9 grid place-items-center border border-neon/40 text-neon group-hover:bg-neon group-hover:text-void transition-colors duration-300">
                <s.icon size={16} />
              </span>
              <h3 className="font-display font-bold text-base uppercase tracking-tight">{s.title}</h3>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">{s.desc}</p>
            <span className="absolute top-0 left-0 w-0 h-px bg-neon transition-all duration-500 group-hover:w-full" />
            <span className="pointer-events-none absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-neon/0 group-hover:bg-neon/5 blur-2xl transition-colors duration-500" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  );
};