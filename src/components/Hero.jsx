import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { ArrowDown, Share2, ChevronDown, ShieldCheck, Timer, BadgeCheck, Zap } from "lucide-react";
import { formatIDR, imgSrc, api } from "@/lib/api";
import { socialIcon } from "@/lib/socials";

const LINES = [
  { text: "BELI AKUN GAME", cls: "text-slate-100" },
  { text: "& JASA JOKI", cls: "text-neon" },
  { text: "INSTANT.", cls: "text-stroke" },
];

const EASE = [0.16, 1, 0.3, 1];

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K+` : `${n}`);

export const Hero = ({ featured, products = [] }) => {
  const totalSold = products.reduce((s, p) => s + (p.sold || 0), 0);
  const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : "5.0";
  const highlight = featured || products.find((p) => p.featured) || products[0] || null;
  const ref = useRef(null);
  const socialRef = useRef(null);
  const [socialLinks, setSocialLinks] = useState([]);
  const [socialOpen, setSocialOpen] = useState(false);
  const mx = useMotionValue(0.5);

  useEffect(() => {
    api.get("/social-links").then(({ data }) => setSocialLinks(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (socialRef.current && !socialRef.current.contains(e.target)) setSocialOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 120, damping: 18 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const visualFade = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      data-testid="hero-section"
      className="relative overflow-hidden grid-bg pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <div className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-neon/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-coral/10 blur-[140px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 lg:gap-8 items-start relative">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-2 h-2 bg-lime animate-pulse-dot" />
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-neon/90 font-mono" data-testid="hero-eyebrow">
              Marketplace Game Indonesia &bull; 100% Garansi Aman
            </p>
          </motion.div>

          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.95] text-4xl sm:text-6xl lg:text-7xl" data-testid="hero-title">
            {LINES.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2 + i * 0.14, duration: 0.9, ease: EASE }}
                  className={`block ${line.cls}`}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.85, duration: 0.9, ease: EASE }}
            className="mt-5 h-[3px] w-44 origin-left bg-neon glow-cyan"
            data-testid="hero-accent-bar"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8, ease: EASE }}
            className="mt-7 max-w-xl text-sm sm:text-base leading-relaxed text-slate-400"
            data-testid="hero-subtitle"
          >
            Store game terpercaya, dapatkan akun game berkualitas dan joki dengan
            harga terjangkau, proses cepat dan tanpa ribet juga bergaransi.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#katalog"
              data-testid="hero-cta-catalog"
              className="group inline-flex items-center gap-3 border border-line text-slate-300 hover:border-neon/60 hover:text-neon font-display font-bold text-xs uppercase tracking-[0.2em] px-7 py-4 transition-colors duration-300"
            >
              Jelajahi Katalog
              <ArrowDown size={15} className="transition-transform duration-300 group-hover:translate-y-1" />
            </a>
            <Link
              to="/topup"
              data-testid="hero-cta-topup"
              className="group inline-flex items-center gap-3 bg-neon text-void font-display font-bold text-xs uppercase tracking-[0.2em] px-7 py-4 hover:bg-lime hover:glow-cyan transition-all duration-300"
            >
              <Zap size={15} />
              Top Up Instan
            </Link>
            <div className="relative" ref={socialRef}>
              <button
                type="button"
                onClick={() => setSocialOpen((o) => !o)}
                data-testid="hero-cta-social"
                aria-haspopup="true"
                aria-expanded={socialOpen}
                className="inline-flex items-center gap-3 border border-line hover:border-neon/60 text-slate-300 hover:text-neon font-display font-bold text-xs uppercase tracking-[0.2em] px-7 py-4 transition-colors duration-300"
              >
                <Share2 size={15} />
                Sosial Media
                <ChevronDown size={14} className={`transition-transform duration-300 ${socialOpen ? "rotate-180" : ""}`} />
              </button>
              {socialOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-60 bg-panel border border-line z-50 py-1.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200"
                  data-testid="hero-social-menu"
                >
                  {socialLinks.length === 0 ? (
                    <p className="px-4 py-3 text-[11px] font-mono text-slate-500" data-testid="hero-social-empty">
                      Belum ada sosial media
                    </p>
                  ) : (
                    socialLinks.map((s) => {
                      const Icon = socialIcon(s.platform);
                      return (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setSocialOpen(false)}
                          data-testid={`hero-social-link-${s.id || s.platform}`}
                          className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-neon hover:bg-void transition-colors"
                        >
                          <Icon size={15} /> {s.name}
                        </a>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="mt-14 grid grid-cols-3 max-w-md divide-x divide-line border border-line bg-void/60 backdrop-blur-sm"
            data-testid="hero-metrics"
          >
            {[
              { v: compact(totalSold), l: "Produk Terjual", t: "hero-metric-sold" },
              { v: `${avgRating}/5`, l: "Rating Pembeli", t: "hero-metric-rating" },
              { v: "10.00-22.00", l: "Jam Operasional", t: "hero-metric-cs" },
            ].map((s) => (
              <div key={s.l} className="px-4 py-4">
                <p className="font-display font-bold text-lg sm:text-xl text-neon" data-testid={s.t}>{s.v}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div className="lg:col-span-5" style={{ perspective: 1200, y: visualY, opacity: visualFade }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative"
            data-testid="hero-featured-card"
          >
            <div className="absolute -inset-px bg-gradient-to-br from-neon/50 via-transparent to-coral/40 pointer-events-none" />
            <div className="relative bg-panel border border-line glow-cyan">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={imgSrc(highlight?.image)}
                  alt={highlight?.title || "Produk unggulan"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />
                <div className="holo-shimmer" />
                <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-neon text-void text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5">
                  <BadgeCheck size={12} /> Unggulan
                </span>
              </div>
              <div className="p-5 border-t border-line" style={{ transform: "translateZ(30px)" }}>
                <p className="text-[10px] uppercase tracking-[0.25em] text-neon mb-2">
                  {highlight?.game || "Mobile Legends"}
                </p>
                <h3 className="font-display font-bold text-sm leading-snug">
                  {highlight?.title || "Akun Sultan Mythic Glory"}
                </h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-lg text-neon">
                    {highlight ? formatIDR(highlight.price) : "Rp 4.500.000"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {highlight?.sold ?? 214} terjual
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 top-8 hidden sm:flex items-center gap-2 bg-panel border border-lime/40 px-3 py-2 animate-float" style={{ transform: "translateZ(50px)" }}>
              <ShieldCheck size={14} className="text-lime" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-lime">Garansi 100%</span>
            </div>
            <div className="absolute -left-4 top-28 hidden sm:flex items-center gap-2 bg-panel border border-neon/40 px-3 py-2 animate-float" style={{ transform: "translateZ(40px)", animationDelay: "1.2s" }}>
              <Timer size={14} className="text-neon" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neon">Proses 5-15 Menit</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        data-testid="hero-scroll-cue"
        className="hidden lg:flex absolute bottom-7 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-slate-500"
      >
        <span className="text-[9px] font-mono uppercase tracking-[0.4em]">Scroll</span>
        <span className="block w-px h-10 bg-gradient-to-b from-neon to-transparent animate-pulse-dot" />
      </motion.div>
    </section>
  );
};