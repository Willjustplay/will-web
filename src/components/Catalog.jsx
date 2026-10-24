import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, PackageSearch, Images, Heart, Zap, ArrowRight } from "lucide-react";
import { formatIDR, imgSrc } from "@/lib/api";
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

const CATEGORIES = ["Semua Kategori", "Akun Game", "Jasa Joki", "Topup Game", "Item Game", "Lainnya"];
const SORTS = [
  { v: "populer", l: "Paling Populer" },
  { v: "termurah", l: "Termurah" },
  { v: "termahal", l: "Termahal" },
  { v: "terbaru", l: "Terbaru" },
];

export const Catalog = ({ products, loading, onSelect }) => {
  const { isWishlisted, toggleWishlist } = useAuth();
  const [game, setGame] = useState("Semua Game");
  const [category, setCategory] = useState("Semua Kategori");
  const [sort, setSort] = useState("populer");
  const [q, setQ] = useState("");

  const games = useMemo(
    () => ["Semua Game", ...new Set(products.map((p) => p.game))],
    [products]
  );

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (game === "Semua Game" || p.game === game) &&
        (category === "Semua Kategori" || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q.toLowerCase()) || (p.game || "").toLowerCase().includes(q.toLowerCase()))
    );
    const sorters = {
      termurah: (a, b) => a.price - b.price,
      termahal: (a, b) => b.price - a.price,
      populer: (a, b) => (b.sold || 0) - (a.sold || 0),
      terbaru: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    };
    return [...list].sort(sorters[sort]);
  }, [products, game, category, q, sort]);

  return (
    <section id="katalog" data-testid="catalog-section" className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neon/90 font-mono mb-3">
              01 &mdash; Katalog
            </p>
            <h2 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl" data-testid="catalog-title">
              Pilih Senjata<span className="text-neon">mu.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari akun / jasa..."
                data-testid="catalog-search-input"
                className="w-full bg-panel border border-line focus:border-neon/60 outline-none text-xs font-mono pl-9 pr-3 py-2.5 placeholder:text-slate-600 transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              data-testid="catalog-sort-select"
              className="bg-panel border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 text-slate-300 transition-colors"
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border border-neon/30 bg-neon/[0.04] px-5 py-4 mb-8" data-testid="catalog-topup-banner">
          <div className="flex items-start gap-3">
            <Zap size={16} className="text-neon mt-0.5 shrink-0" />
            <p className="text-[11px] sm:text-xs font-mono text-slate-300">
              Mau top up diamond/UC langsung ke akunmu?{" "}
              <span className="text-slate-500">Cukup User ID &amp; Server, tanpa perlu login.</span>
            </p>
          </div>
          <Link
            to="/topup"
            data-testid="catalog-topup-link"
            className="shrink-0 inline-flex items-center gap-2 bg-neon text-void font-display font-bold text-[10px] uppercase tracking-[0.2em] px-4 py-2.5 hover:bg-lime transition-colors"
          >
            Top Up Sekarang <ArrowRight size={12} />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-4" data-testid="catalog-category-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              data-testid={`category-tab-${c.toLowerCase().replace(/\s+/g, "-")}`}
              className={`text-[11px] font-bold uppercase tracking-widest px-4 py-2 border transition-colors duration-200 ${
                category === c
                  ? "bg-neon text-void border-neon"
                  : "border-line text-slate-400 hover:text-neon hover:border-neon/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-10" data-testid="catalog-game-chips">
          {games.map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              data-testid={`game-chip-${g.toLowerCase().replace(/\s+/g, "-")}`}
              className={`whitespace-nowrap text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors duration-200 ${
                game === g
                  ? "border-coral text-coral"
                  : "border-line text-slate-500 hover:text-slate-300 hover:border-slate-500"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="catalog-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-panel border border-line animate-pulse">
                <div className="aspect-[4/3] bg-panelhover" />
                <div className="p-4 space-y-3">
                  <div className="h-2 w-1/3 bg-panelhover" />
                  <div className="h-4 w-3/4 bg-panelhover" />
                  <div className="h-3 w-1/2 bg-panelhover" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line bg-panel py-20 text-center" data-testid="catalog-empty">
            <PackageSearch size={36} className="mx-auto text-slate-600 mb-4" />
            <p className="text-sm text-slate-500 font-mono">Tidak ada produk ditemukan. Coba filter lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="catalog-grid">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                onClick={() => onSelect(p)}
                data-testid={`product-card-${p.id}`}
                className="group cursor-pointer text-left bg-panel border border-line hover:border-neon/50 hover:glow-cyan transition-colors duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={imgSrc(p.image)}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />
                  {p.images?.length > 0 && (
                    <span data-testid={`gallery-count-${p.id}`} className="absolute bottom-3 right-3 flex items-center gap-1 bg-void/80 backdrop-blur text-[9px] font-mono uppercase tracking-widest text-slate-300 px-2 py-1">
                      <Images size={10} /> +{p.images.length} foto
                    </span>
                  )}
                  {(() => {
                    const cbs = (p.badges?.length ? p.badges : (p.badge ? [p.badge] : [])).slice(0, 3);
                    return cbs.length > 0 ? (
                      <div className="absolute top-3 left-3 flex flex-col items-start gap-1" data-testid={`badges-${p.id}`}>
                        {cbs.map((b) => (
                          <span key={b} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 ${badgeCls(b)}`}>{b}</span>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                      data-testid={`wishlist-toggle-${p.id}`}
                      aria-label="Tambah ke favorit"
                      className="w-8 h-8 grid place-items-center bg-void/70 backdrop-blur border border-line/60 hover:border-neon transition-colors"
                    >
                      <Heart size={14} className={isWishlisted(p.id) ? "text-coral fill-coral" : "text-slate-300"} />
                    </button>
                    {p.stock < 1 && (
                      <span data-testid={`stock-out-${p.id}`} className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-coral text-white">
                        Habis
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-neon">
                    {p.game}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                      {p.category}
                      {p.rank ? ` • ${p.rank}` : ""}
                    </p>
                    {p.condition && (
                      <span data-testid={`condition-${p.id}`} className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${condCls(p.condition)}`}>
                        {p.condition}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-[13px] leading-snug min-h-[2.4em]">
                    {p.title}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono font-bold text-neon" data-testid={`price-${p.id}`}>
                      {formatIDR(p.price)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.sold} terjual</span>
                  </div>
                  <span className="block text-center text-[10px] font-bold uppercase tracking-[0.25em] border border-line group-hover:bg-neon group-hover:text-void group-hover:border-neon transition-colors duration-300 py-2.5 mt-2">
                    Detail &amp; Beli
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
