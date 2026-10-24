import { motion } from "framer-motion";
import { Zap, Ban } from "lucide-react";
import { formatIDR } from "@/lib/api";

/** Step 3 — pick the denomination to buy. */
export const DenominationGrid = ({ game, value, onSelect }) => {
  if (!game) return null;
  const denoms = game.denominations || [];

  if (!denoms.length) {
    return (
      <div data-testid="topup-denom-empty" className="border border-line bg-panel p-10 text-center">
        <Ban size={28} className="mx-auto text-slate-600 mb-3" />
        <p className="text-sm font-mono text-slate-500">
          Nominal untuk {game.name} sedang tidak tersedia.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
          Pilih nominal {game.currency ? `(${game.currency})` : ""}
        </p>
        <p className="text-[10px] font-mono text-slate-500">
          {denoms.length} pilihan
        </p>
      </div>

      <div
        data-testid="topup-denom-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        {denoms.map((d, i) => {
          const soldOut = (d.stock ?? 1) < 1;
          const selected = value === d.code;
          return (
            <motion.button
              key={d.code}
              type="button"
              disabled={soldOut}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: (i % 8) * 0.03 }}
              onClick={() => !soldOut && onSelect(d)}
              data-testid={`topup-denom-${d.code}`}
              aria-pressed={selected}
              className={`relative text-left p-4 border transition-colors duration-200 min-h-[92px] ${
                soldOut
                  ? "border-line/60 bg-panel/40 cursor-not-allowed opacity-55"
                  : selected
                    ? "border-neon bg-neon/5 glow-cyan cursor-pointer"
                    : "border-line bg-panel hover:border-neon/60 cursor-pointer"
              }`}
            >
              {d.badge && !soldOut && (
                <span className="absolute top-0 right-0 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-lime text-void">
                  {d.badge}
                </span>
              )}
              <p className="flex items-center gap-1 font-display font-bold text-[12px] leading-tight pr-8">
                <Zap size={11} className="text-neon shrink-0" />
                {d.label}
              </p>
              <p className="mt-2 font-mono font-bold text-[13px] text-neon">
                {formatIDR(d.price)}
              </p>
              {d.price_strike > d.price && (
                <p className="font-mono text-[10px] text-slate-600 line-through">
                  {formatIDR(d.price_strike)}
                </p>
              )}
              <p className="mt-1 text-[9px] font-mono uppercase tracking-widest text-slate-500">
                {soldOut ? "Stok habis" : `Stok ${d.stock}`}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DenominationGrid;
