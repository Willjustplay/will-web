import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, Home } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex flex-col bg-void grid-bg" data-testid="payment-cancel-page">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-24 text-center">
        <XCircle size={52} className="text-coral mb-6" />
        <h1 className="font-display font-black uppercase text-xl sm:text-2xl text-slate-100">Pembayaran <span className="text-coral">Dibatalkan</span></h1>
        <p className="text-xs font-mono text-slate-400 mt-3">Transaksi Anda telah dibatalkan. Tidak ada dana yang ditarik.</p>
        <Link
          to="/"
          data-testid="cancel-back-home"
          className="mt-8 inline-flex items-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-7 py-3.5 hover:bg-lime transition-colors duration-300"
        >
          <Home size={14} /> Kembali ke Beranda
        </Link>
      </div>
      <Footer />
    </div>
  );
}
