import { useState, useEffect } from "react";
import { Loader2, Save, Copy, Webhook, KeyRound, CheckCircle2, PlugZap, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

export function AdminPaykita() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [cfg, setCfg] = useState({
    enabled: false,
    base_url: "https://pay.digikita.id",
    api_key_set: false,
    api_key_masked: "",
    webhook_secret_set: false,
    webhook_url: "",
    products_with_own_key: 0,
    last_test: null,
  });
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/admin/payments/paykita");
      setCfg(data);
      setTestResult(data.last_test);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memuat pengaturan PayKita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { enabled: cfg.enabled, base_url: cfg.base_url };
      if (apiKey.trim()) payload.api_key = apiKey.trim();
      if (webhookSecret.trim()) payload.webhook_secret = webhookSecret.trim();
      const { data } = await api.put("/admin/payments/paykita", payload);
      setCfg(data);
      setApiKey("");
      setWebhookSecret("");
      toast.success("Pengaturan PayKita disimpan");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const payload = { base_url: cfg.base_url };
      if (apiKey.trim()) payload.api_key = apiKey.trim();
      const { data } = await api.post("/admin/payments/paykita/test", payload);
      setTestResult(data);
      toast.success(`Terhubung ke PayKita — ${data.project || "project"} (${data.provider || "-"}, ${data.mode || "-"})`);
    } catch (e) {
      setTestResult({ ok: false, error: formatApiError(e.response?.data?.detail) || "Tes koneksi gagal" });
      toast.error(formatApiError(e.response?.data?.detail) || "Tes koneksi gagal");
    } finally {
      setTesting(false);
    }
  };

  const copy = (text, label) => navigator.clipboard.writeText(text).then(() => toast.success(`${label} disalin`));
  const ready = cfg.enabled && cfg.api_key_set;

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-neon" /></div>;

  return (
    <div className="space-y-6 max-w-2xl" data-testid="admin-paykita">
      <div>
        <h2 className="text-xl font-display font-black uppercase text-white">Pembayaran Otomatis — PayKita</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono leading-relaxed">
          QRIS dinamis per transaksi, konfirmasi otomatis saat pembayaran terdeteksi. Cukup tempel API key dari dashboard PayKita → Simpan → Aktifkan.
        </p>
      </div>

      <div className={`flex items-center gap-3 border p-4 ${ready ? "border-lime/40 bg-lime/5" : "border-coral/40 bg-coral/5"}`} data-testid="paykita-status-banner">
        <Zap size={16} className={ready ? "text-lime" : "text-coral"} />
        <div className="text-xs font-mono">
          <p className={`font-bold ${ready ? "text-lime" : "text-coral"}`}>{ready ? "AKTIF — pelanggan bisa bayar via QRIS otomatis" : "NONAKTIF — pelanggan hanya melihat Transfer Manual"}</p>
          <p className="text-slate-400 mt-0.5">
            {cfg.api_key_set ? `API key tersimpan (${cfg.api_key_masked})` : "API key belum diisi"}
            {cfg.products_with_own_key > 0 && ` · ${cfg.products_with_own_key} produk memakai key sendiri`}
          </p>
        </div>
      </div>

      <div className="bg-panel border border-line p-6 space-y-5">
        <label className="flex items-center justify-between gap-4 cursor-pointer" data-testid="paykita-enabled-toggle">
          <span className="text-sm font-bold text-white">Aktifkan PayKita untuk pelanggan</span>
          <input
            type="checkbox"
            checked={!!cfg.enabled}
            onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
            className="w-5 h-5 accent-[#00F0FF]"
            data-testid="paykita-enabled-checkbox"
          />
        </label>

        <div>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 mb-2">
            <KeyRound size={12} /> API Key (pk_live_...)
            {cfg.api_key_set && <span className="flex items-center gap-1 text-lime normal-case tracking-normal"><CheckCircle2 size={12} /> tersimpan: {cfg.api_key_masked}</span>}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={cfg.api_key_set ? "•••••• (kosongkan jika tidak ingin mengubah)" : "Tempel API key PayKita di sini"}
            data-testid="paykita-api-key-input"
            className="w-full bg-void border border-line px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-neon"
          />
          <p className="text-[10px] font-mono text-slate-500 mt-1.5">Dashboard PayKita → menu API → buat API key (perlu langganan REST API).</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 mb-2">
            Webhook Secret (HMAC-SHA256, opsional)
            {cfg.webhook_secret_set && <span className="flex items-center gap-1 text-lime normal-case tracking-normal"><CheckCircle2 size={12} /> tersimpan</span>}
          </label>
          <input
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={cfg.webhook_secret_set ? "•••••• (kosongkan jika tidak ingin mengubah)" : "Secret untuk verifikasi signature webhook"}
            data-testid="paykita-webhook-secret-input"
            className="w-full bg-void border border-line px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-neon"
          />
          <p className="text-[10px] font-mono text-slate-500 mt-1.5 flex items-start gap-1.5">
            <Info size={11} className="shrink-0 mt-0.5" /> Tanpa secret pun aman: setiap webhook yang masuk selalu diverifikasi ulang ke API PayKita sebelum pesanan ditandai lunas.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 mb-2">
            <Webhook size={12} /> URL Webhook
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={cfg.webhook_url}
              data-testid="paykita-webhook-url"
              className="flex-1 bg-void border border-neon/30 px-4 py-2.5 text-xs text-neon font-mono outline-none"
            />
            <button
              type="button"
              onClick={() => copy(cfg.webhook_url, "URL webhook")}
              data-testid="paykita-copy-webhook"
              className="shrink-0 grid place-items-center w-11 border border-line text-slate-400 hover:text-neon hover:border-neon/60 transition-colors"
              aria-label="Salin URL webhook"
            >
              <Copy size={15} />
            </button>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-1.5">URL ini dikirim otomatis ke PayKita di setiap order, jadi tidak wajib diisi manual di dashboard. Status juga dicek berkala ke API PayKita sebagai cadangan.</p>
        </div>

        <details className="border border-line/60 p-3" data-testid="paykita-advanced">
          <summary className="text-[10px] uppercase tracking-wider text-slate-400 cursor-pointer">Pengaturan lanjutan</summary>
          <label className="block mt-3 text-[10px] uppercase tracking-wider text-slate-400 mb-2">Base URL API</label>
          <input
            type="text"
            value={cfg.base_url}
            onChange={(e) => setCfg({ ...cfg, base_url: e.target.value })}
            data-testid="paykita-base-url-input"
            className="w-full bg-void border border-line px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-neon"
          />
        </details>

        {testResult && (
          <div className={`text-xs font-mono border p-3 ${testResult.ok ? "border-lime/40 text-lime" : "border-coral/40 text-coral"}`} data-testid="paykita-test-result">
            {testResult.ok
              ? `✓ Terhubung — project "${testResult.project || "-"}" · provider ${testResult.provider || "-"} · mode ${testResult.mode || "-"}${testResult.tested_at ? ` · ${testResult.tested_at.slice(0, 16).replace("T", " ")}` : ""}`
              : `✕ ${testResult.error}`}
          </div>
        )}

        <div className="pt-2 flex flex-wrap justify-end gap-2">
          <button
            onClick={test}
            disabled={testing || (!apiKey.trim() && !cfg.api_key_set)}
            data-testid="paykita-test-button"
            className="border border-neon/50 text-neon px-5 py-2.5 font-bold uppercase text-[10px] tracking-wider hover:bg-neon/10 flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />} Tes Koneksi
          </button>
          <button
            onClick={save}
            disabled={saving}
            data-testid="paykita-save-button"
            className="bg-neon text-void px-6 py-2.5 font-bold uppercase text-[10px] tracking-wider hover:bg-lime flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
