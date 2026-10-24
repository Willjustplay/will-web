import { Check } from "lucide-react";

const STEPS = [
  { id: "game", label: "Pilih Game" },
  { id: "account", label: "Isi Tujuan" },
  { id: "denomination", label: "Pilih Nominal" },
  { id: "payment", label: "Bayar" },
];

/** Horizontal progress indicator for the top up wizard (scrolls on mobile). */
export const TopupStepper = ({ current, onGoTo, reachable }) => {
  const index = STEPS.findIndex((s) => s.id === current);

  return (
    <ol
      data-testid="topup-stepper"
      className="flex items-stretch gap-1.5 overflow-x-auto pb-1 mb-8 sm:mb-10"
      aria-label="Langkah top up"
    >
      {STEPS.map((step, i) => {
        const done = i < index;
        const active = i === index;
        const canGo = reachable ? reachable(step.id) : false;
        return (
          <li key={step.id} className="flex-1 min-w-[86px]">
            <button
              type="button"
              onClick={() => canGo && onGoTo(step.id)}
              disabled={!canGo}
              data-testid={`topup-step-${step.id}`}
              aria-current={active ? "step" : undefined}
              className={`w-full text-left border-t-2 pt-3 transition-colors duration-300 ${
                active ? "border-neon" : done ? "border-lime" : "border-line"
              } ${canGo ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 shrink-0 grid place-items-center text-[10px] font-bold font-mono ${
                    active
                      ? "bg-neon text-void"
                      : done
                        ? "bg-lime text-void"
                        : "border border-line text-slate-500"
                  }`}
                >
                  {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-[0.18em] whitespace-nowrap ${
                    active ? "text-neon" : done ? "text-lime" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

export default TopupStepper;
