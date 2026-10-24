import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, MessageSquare, X } from "lucide-react";
import { api, imgSrc } from "@/lib/api";

const Stars = ({ n }) => (
  <span className="flex gap-0.5 text-lime">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={11} fill={i < n ? "currentColor" : "none"} className={i < n ? "" : "text-slate-600"} />
    ))}
  </span>
);

export const Testimonials = () => {
  const [items, setItems] = useState([]);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    api.get("/testimonials").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="testimoni" data-testid="testimonials-section" className="py-16 sm:py-24 border-t border-line bg-void grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-neon/90 font-mono mb-3">03 &mdash; Bukti Sosial</p>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-14">
          <h2 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl" data-testid="testimonials-title">
            Kata Mereka. <span className="text-stroke">Bukan Kata Kami.</span>
          </h2>
          <p className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <MessageSquare size={13} className="text-neon" /> {items.length} ulasan terverifikasi
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.1, ease: [0.16, 1, 0.3, 1] }}
              data-testid={`testimonial-card-${t.id}`}
              className="group relative bg-panel border border-line hover:border-neon/40 p-6 flex flex-col transition-colors duration-300"
            >
              <Quote size={22} className="text-neon/30 group-hover:text-neon transition-colors duration-300" />
              <p className="mt-4 text-xs leading-relaxed text-slate-300 flex-1">"{t.text}"</p>
              {t.image && (
                <button
                  onClick={() => setZoom(t)}
                  data-testid={`testimonial-image-${t.id}`}
                  className="mt-5 relative block overflow-hidden border border-line hover:border-neon/60 transition-colors"
                >
                  <img src={imgSrc(t.image)} alt={`Bukti chat ${t.name}`} className="w-full max-h-52 object-cover object-top group-hover:scale-[1.02] transition-transform duration-500" />
                  <span className="absolute bottom-2 left-2 bg-void/80 backdrop-blur text-[9px] font-mono uppercase tracking-widest text-neon px-2 py-1">Screenshot chat</span>
                </button>
              )}
              <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs uppercase truncate">{t.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">{t.game}{t.product ? ` • ${t.product}` : ""}</p>
                </div>
                <Stars n={t.rating} />
              </div>
              <span className="absolute top-0 left-0 w-0 h-px bg-neon transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>

      {zoom && (
        <div onClick={() => setZoom(null)} data-testid="testimonial-zoom" className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out">
          <button className="absolute top-5 right-5 text-slate-400 hover:text-coral" data-testid="testimonial-zoom-close"><X size={22} /></button>
          <img src={imgSrc(zoom.image)} alt="Bukti chat" className="max-h-[90vh] max-w-full border border-line" />
        </div>
      )}
    </section>
  );
};
