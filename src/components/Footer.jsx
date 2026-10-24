import { Zap, MessageCircle, ShieldCheck, CreditCard, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { waLink } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const Footer = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
  <footer id="kontak" data-testid="main-footer" className="border-t border-line bg-void overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
      <div className="grid md:grid-cols-12 gap-10 pb-14">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-8 h-8 grid place-items-center bg-neon text-void">
              <Zap size={17} strokeWidth={2.75} />
            </span>
            <span className="font-display font-extrabold text-sm tracking-tight uppercase">
              Will<span className="text-neon">Just</span>Play
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
            Marketplace akun game &amp; jasa joki terpercaya di Indonesia. Semua
            transaksi dilindungi garansi 100% uang kembali.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={waLink("Halo WillJustPlay!")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-whatsapp-button"
              className="inline-flex items-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-5 py-3 hover:bg-lime transition-colors duration-300"
            >
              <MessageCircle size={14} />
              Chat WhatsApp CS
            </a>
            {isAdmin && (
              <Link
                to="/admin"
                data-testid="footer-admin-link"
                aria-label="Panel Admin"
                className="inline-flex items-center gap-2 border border-lime/50 text-lime hover:bg-lime/10 font-display font-bold text-[11px] uppercase tracking-[0.2em] px-5 py-3 transition-colors duration-300"
              >
                <ShieldCheck size={14} />
                Panel Admin
              </Link>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-4">Navigasi</p>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link to="/topup" data-testid="footer-link-topup" className="hover:text-neon transition-colors">Top Up Game</Link></li>
            <li><a href="#katalog" data-testid="footer-link-catalog" className="hover:text-neon transition-colors">Katalog Produk</a></li>
            <li><a href="#cara-kerja" data-testid="footer-link-howto" className="hover:text-neon transition-colors">Cara Kerja</a></li>
            <li><a href="#testimoni" data-testid="footer-link-testimonials" className="hover:text-neon transition-colors">Testimoni</a></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-4">Jaminan Kami</p>
          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex items-center gap-2.5"><ShieldCheck size={14} className="text-lime" /> Garansi 100% uang kembali</li>
            <li className="flex items-center gap-2.5"><CreditCard size={14} className="text-neon" /> Pembayaran via Transfer Bank / E-Wallet / QRIS</li>
            <li className="flex items-center gap-2.5"><Clock size={14} className="text-coral" /> Proses cepat 5-15 menit</li>
          </ul>
        </div>
      </div>

      <p className="font-display font-black uppercase text-center leading-none text-[16vw] md:text-[11vw] text-stroke opacity-30 select-none" aria-hidden="true">
        WJPGAME
      </p>

      <div className="border-t border-line mt-6 pt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          &copy; 2026 WillJustPlay &mdash; Store Game Indonesia
        </p>
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Akun &bull; Joki &bull; Top Up
        </p>
      </div>
    </div>
  </footer>
  );
};
