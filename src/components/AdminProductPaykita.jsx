import { useState } from "react";
import { Copy, KeyRound, CheckCircle2, Loader2, PlugZap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

export const EMPTY_PRODUCT_PAYKITA = { api_key: "", webhook_secret: "", clear: false };

const inputCls = "mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors";

export function AdminProductPaykita({ value, onChange, product }) {
  const [testing, setTesting] = useState(false);
  const v = { ...EMPTY_PRODUCT_PAYKITA, ...(value || {}) };
  const set = (patch) => onChange({ ...v, ...patch });
  const keySet = !!product?.paykita_api_key_set && !v.clear;

  const copy = (text) => navigator.clipboard.writeText(text).then(() => toast.success("URL webhook disalin"));

  const test = async () => {
    setTesting(true);
    try {
      const { data } = await api.post(`/admin/payments/paykita/test-product/${product.id}`);
      toast.success(`PayKita OK (${data.source === "product" ? "key produk" : "key global"}) — ${data.project || "-"} · ${data.provider || ""}`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Tes koneksi gagal");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="sm:col-span-2 border border-neon/30 bg-void/40 p-4 space-y-4" data-testid="product-paykita-section">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neon"><KeyRound size={13} /> PayKita Khusus Produk Ini (opsional)</span>
          <p className="mt-1 text-[10px] font-mono text-slate-500 leading-relaxed">
            Isi jika produk ini ingin pakai akun/API key PayKita yang berbeda. Kosongkan untuk memakai pengaturan global di tab Pembayaran Otomatis.
          </p>
        </div>
        {keySet && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] text-lime font-mono" data-testid="product-paykita-key-status"><CheckCircle2 size={12} /> {product.paykita_api_key_masked}</span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">API Key PayKita (pk_live_...)</span>
          <input type="password" value={v.api_key} onChange={(e) => set({ api_key: e.target.value, clear: false })} placeholder={keySet ? "•••••• (kosongkan jika tidak diubah)" : "Tempel API key produk ini"} data-testid="product-paykita-api-key-input" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Webhook Secret (opsional)</span>
          <input type="password" value={v.webhook_secret} onChange={(e) => set({ webhook_secret: e.target.value, clear: false })} placeholder={product?.paykita_webhook_secret_set && !v.clear ? "•••••• tersimpan" : "secret HMAC dari PayKita"} data-testid="product-paykita-secret-input" className={inputCls} />
        </label>
      </div>

      {product?.paykita_webhook_url && (
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">URL Webhook Produk (dikirim otomatis ke PayKita di setiap order)</span>
          <div className="mt-1.5 flex gap-2">
            <input readOnly value={product.paykita_webhook_url} data-testid="product-paykita-webhook-url" className="flex-1 bg-void border border-neon/30 px-3 py-2.5 text-[11px] text-neon font-mono outline-none" />
            <button type="button" onClick={() => copy(product.paykita_webhook_url)} data-testid="product-paykita-copy-webhook" aria-label="Salin URL webhook" className="shrink-0 grid place-items-center w-10 border border-line text-slate-400 hover:text-neon hover:border-neon/60 transition-colors">
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {product && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={test} disabled={testing} data-testid="product-paykita-test-button" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-neon/50 text-neon hover:bg-neon hover:text-void transition-colors disabled:opacity-50">
            {testing ? <Loader2 size={12} className="animate-spin" /> : <PlugZap size={12} />} Tes Koneksi (key tersimpan)
          </button>
          {keySet && (
            <button type="button" onClick={() => set({ api_key: "", webhook_secret: "", clear: true })} data-testid="product-paykita-clear-button" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 border border-coral/50 text-coral hover:bg-coral hover:text-white transition-colors">
              <Trash2 size={12} /> Hapus Key Produk
            </button>
          )}
          {v.clear && <span className="text-[10px] font-mono text-coral self-center" data-testid="product-paykita-clear-note">Key produk akan dihapus saat disimpan.</span>}
        </div>
      )}
    </div>
  );
}
