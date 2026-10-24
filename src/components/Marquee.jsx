import { Zap } from "lucide-react";

const ITEMS = [
  "100% Garansi Akun Aman",
  "Joki Pro Player Fast Rank",
  "Top Up Otomatis 24/7",
  "Proses Hanya 5-15 Menit",
  "Chat CS WhatsApp Responsif",
];

export const Marquee = () => {
  const seq = [...ITEMS, ...ITEMS];
  return (
    <div
      data-testid="marquee-strip"
      className="group relative border-y border-line bg-[#0A0D14] overflow-hidden py-5 select-none marquee-mask"
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex">
            {seq.map((t, i) => (
              <span
                key={i}
                className="flex items-center gap-10 px-10 font-display text-[11px] uppercase tracking-[0.35em] text-neon/70"
              >
                {t}
                <Zap size={11} className="text-coral/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};