import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Gamepad2 } from "lucide-react";
import { formatIDR, imgSrc } from "@/lib/api";

/** Step 1 — pick the game to top up. */
export const TopupGameGrid = ({ games, loading, error, value, onSelect, onRetry }) => {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return games;
    return games.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(needle) ||
        (g.publisher || "").toLowerCase().includes(needle)
    );
  }, [games, q]);

  if (loading) {
    return (
      <div
        data-testid="topup-games-loading"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 bg-panel border border-line animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="topup-games-error"
        className="border border-coral/40 bg-coral/5 p-8 text-center"
      >
        <p className="text-sm font-mono text-coral">Gagal memuat daftar game.</p>
        <button
          type="button"
          onClick={onRetry}
          data-testid="topup-games-retry"
          className="mt-5 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-lime transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div data-testid="topup-games-empty" className="border border-line bg-panel p-10 text-center">
        <Gamepad2 size={30} className="mx-auto text-slate-600 mb-3" />
        <p className="text-sm font-mono text-slate-500">Belum ada game yang tersedia untuk top up.</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="topup-game-search" className="sr-only">
        Cari game
      </label>
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="topup-game-search"
          data-testid="topup-game-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari game, mis. Mobile Legends"
          className="w-full bg-void border border-line pl-9 pr-3 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-neon transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p
          data-testid="topup-games-no-match"
          className="text-sm font-mono text-slate-500 text-center py-12"
        >
          Tidak ada game yang cocok.
        </p>
      ) : (
        <div
          data-testid="topup-game-grid"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filtered.map((g, i) => {
            const selected = value === g.slug;
            return (
              <motion.button
                key={g.slug}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: (i % 8) * 0.04 }}
                onClick={() => onSelect(g)}
                data-testid={`topup-game-${g.slug}`}
                aria-pressed={selected}
                className={`group text-left bg-panel border transition-colors duration-300 overflow-hidden ${
                  selected ? "border-neon glow-cyan" : "border-line hover:border-neon/60"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={imgSrc(g.banner || g.icon)}
                    alt={g.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
                  {g.featured && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-neon text-void">
                      Populer
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-display font-bold text-[12px] leading-tight truncate">
                    {g.name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">{g.publisher}</p>
                  {g.min_price > 0 && (
                    <p className="text-[10px] font-mono text-neon mt-1.5">
                      Mulai {formatIDR(g.min_price)}
                    </p>
                  )}
                  {g.denominations?.length > 0 && (
                    <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                      {g.denominations.length} pilihan nominal
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopupGameGrid;
