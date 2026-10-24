import { AlertCircle, Check, Loader2, ShieldQuestion } from "lucide-react";
import { localFieldError } from "@/hooks/useTopup";

/** Step 2 — enter the in-game destination (User ID / Server / Zone). */
export const TopupAccountForm = ({
  game,
  values,
  onChange,
  errors,
  checking,
  validation,
  onValidate,
}) => {
  if (!game) return null;
  const fields = game.fields || [];

  return (
    <div data-testid="topup-account-form">
      <div className="flex items-center gap-3 mb-6">
        <img
          src={game.icon || game.banner}
          alt=""
          loading="lazy"
          className="w-11 h-11 object-cover border border-line"
        />
        <div>
          <p className="font-display font-bold text-sm">{game.name}</p>
          <p className="text-[10px] font-mono text-slate-500">{game.publisher}</p>
        </div>
      </div>

      <div className="space-y-5">
        {fields.map((field) => {
          const error = errors?.[field.key] ?? localFieldError(field, values[field.key]);
          const inputId = `topup-field-${field.key}`;
          return (
            <div key={field.key}>
              <label
                htmlFor={inputId}
                className="block text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2"
              >
                {field.label}
                {field.required === false && (
                  <span className="text-slate-600 normal-case tracking-normal"> (opsional)</span>
                )}
              </label>
              <input
                id={inputId}
                data-testid={`topup-input-${field.key}`}
                name={field.key}
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                inputMode={field.inputmode || "text"}
                placeholder={field.placeholder || ""}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : `${inputId}-help`}
                className={`w-full bg-void border px-3 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors ${
                  error ? "border-coral focus:border-coral" : "border-line focus:border-neon"
                }`}
              />
              {error ? (
                <p
                  id={`${inputId}-error`}
                  data-testid={`topup-error-${field.key}`}
                  className="flex items-start gap-1.5 mt-2 text-[11px] font-mono text-coral"
                >
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              ) : (
                <p id={`${inputId}-help`} className="mt-2 text-[11px] font-mono text-slate-600">
                  {field.help}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onValidate}
          disabled={checking}
          data-testid="topup-validate-button"
          className="inline-flex items-center gap-2 border border-neon/60 text-neon font-display font-bold text-[11px] uppercase tracking-[0.2em] px-5 py-3 hover:bg-neon hover:text-void transition-colors disabled:opacity-50"
        >
          {checking ? <Loader2 size={13} className="animate-spin" /> : <ShieldQuestion size={13} />}
          {checking ? "Memeriksa..." : "Cek Akun"}
        </button>

        <div aria-live="polite" role="status" className="text-[11px] font-mono">
          {validation?.ok && validation.checked && (
            <span data-testid="topup-validate-ok" className="inline-flex items-center gap-1.5 text-lime">
              <Check size={12} /> {validation.nickname || "Akun ditemukan"}
            </span>
          )}
          {validation?.ok && !validation.checked && (
            <span data-testid="topup-validate-unchecked" className="inline-flex items-center gap-1.5 text-slate-400">
              <ShieldQuestion size={12} /> {validation.message || "Akan diverifikasi admin"}
            </span>
          )}
          {validation && !validation.ok && (
            <span data-testid="topup-validate-fail" className="inline-flex items-center gap-1.5 text-coral">
              <AlertCircle size={12} /> {validation.message}
            </span>
          )}
        </div>
      </div>

      {game.notes && (
        <p className="mt-5 text-[11px] font-mono text-slate-500 border-l-2 border-neon/40 pl-3">
          {game.notes}
        </p>
      )}
    </div>
  );
};

export default TopupAccountForm;
