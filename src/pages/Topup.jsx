import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopupStepper } from "@/components/topup/TopupStepper";
import { TopupGameGrid } from "@/components/topup/TopupGameGrid";
import { TopupAccountForm } from "@/components/topup/TopupAccountForm";
import { DenominationGrid } from "@/components/topup/DenominationGrid";
import { TopupPaymentStep } from "@/components/topup/TopupPaymentStep";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTopupGames, validateTopupDestination, localFieldError } from "@/hooks/useTopup";

const STEPS = ["game", "account", "denomination", "payment"];

const slugifyId = (v) =>
  String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Topup() {
  const { user } = useAuth();
  const { games, loading, error, reload } = useTopupGames();

  const [step, setStep] = useState("game");
  const [slug, setSlug] = useState("");
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [validation, setValidation] = useState(null);
  const [denomination, setDenomination] = useState(null);
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [destinationId, setDestinationId] = useState("");
  const [methods, setMethods] = useState([{ id: "manual", label: "Transfer Manual" }]);
  const [method, setMethod] = useState("manual");
  const [submitting, setSubmitting] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const game = useMemo(() => games.find((g) => g.slug === slug) || null, [games, slug]);

  useEffect(() => {
    if (user?.email) setEmail((cur) => cur || user.email);
  }, [user?.email]);

  const productId = useMemo(
    () => (game && denomination ? `topup-${slugifyId(game.slug)}-${slugifyId(denomination.code)}` : ""),
    [game, denomination]
  );

  // Payment options depend on the chosen nominal (per-product PayKita overrides).
  useEffect(() => {
    if (!game || !denomination) return;
    let alive = true;
    Promise.allSettled([
      api.get("/payments/manual-destinations"),
      api.get("/payments/methods", { params: { product_id: productId } }),
    ]).then(([d, m]) => {
      if (!alive) return;
      if (d.status === "fulfilled") {
        const rows = Array.isArray(d.value.data) ? d.value.data : [];
        setDestinations(rows);
        setDestinationId((cur) => (rows.some((r) => r.id === cur) ? cur : rows[0]?.id || ""));
      }
      if (m.status === "fulfilled" && Array.isArray(m.value.data) && m.value.data.length) {
        setMethods(m.value.data);
        setMethod((cur) =>
          m.value.data.some((x) => x.id === cur)
            ? cur
            : m.value.data.some((x) => x.id === "paykita")
              ? "paykita"
              : "manual"
        );
      }
    });
    return () => {
      alive = false;
    };
  }, [game, denomination, productId]);

  const accountErrors = useCallback(
    () =>
      Object.fromEntries(
        (game?.fields || [])
          .map((f) => [f.key, localFieldError(f, values[f.key])])
          .filter(([, msg]) => msg)
      ),
    [game, values]
  );

  const chooseGame = (g) => {
    setSlug(g.slug);
    setValues({});
    setErrors({});
    setValidation(null);
    setDenomination(null);
    setSummaryError("");
    setStep("account");
  };

  const changeField = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setValidation(null);
  };

  const runValidate = async () => {
    const found = accountErrors();
    setErrors(found);
    if (Object.keys(found).length) {
      setValidation({ ok: false, checked: false, message: Object.values(found)[0] });
      return false;
    }
    setChecking(true);
    try {
      const result = await validateTopupDestination(slug, values);
      setValidation(result);
      if (!result.ok) {
        toast.error(result.message || "Data tujuan tidak valid");
        return false;
      }
      if (result.checked) toast.success(result.nickname || "Akun ditemukan");
      return true;
    } finally {
      setChecking(false);
    }
  };

  const nextFromAccount = async () => {
    if (await runValidate()) setStep("denomination");
  };

  const destinationLabel = useMemo(
    () =>
      (game?.fields || [])
        .map((f) => (values[f.key] ? `${f.label}: ${values[f.key]}` : ""))
        .filter(Boolean)
        .join(" • "),
    [game, values]
  );

  const reachable = (target) => {
    const index = STEPS.indexOf(target);
    if (index === 0) return true;
    if (index === 1) return !!slug;
    if (index === 2) return !!slug && !Object.keys(accountErrors()).length;
    return !!denomination;
  };

  const submit = async () => {
    setSummaryError("");
    if (!email.trim() && !wa.trim()) {
      setSummaryError("Isi email atau nomor WhatsApp untuk pengiriman pesanan.");
      return;
    }
    if (method === "manual" && !destinationId) {
      setSummaryError("Pilih tujuan transfer terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        game: slug,
        denomination_code: denomination.code,
        product_id: productId,
        destination: values,
        buyer_email: email.trim(),
        buyer_whatsapp: wa.trim(),
        method,
        origin_url: window.location.origin,
      };
      if (method === "manual") payload.destination_id = destinationId;
      const { data } = await api.post("/payments/topup/checkout", payload);
      window.location.href = data.checkout_url;
    } catch (e) {
      const message =
        formatApiError(e.response?.data?.detail) ||
        (e.response ? "Gagal membuat pesanan" : "Tidak dapat terhubung ke server. Coba lagi.");
      setSummaryError(message);
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-void grid-bg">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 sm:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-neon mb-2">
              Top Up Instan
            </p>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
              Top Up <span className="text-stroke">Game</span>
            </h1>
            <p className="mt-2 text-xs font-mono text-slate-500 max-w-lg">
              Pilih game, masukkan User ID &amp; Server, pilih nominal, lalu bayar. Proses 1-10
              menit setelah pembayaran terverifikasi.
            </p>
          </div>
          <Link
            to="/"
            data-testid="topup-back-home"
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-slate-400 hover:text-neon transition-colors"
          >
            <ArrowLeft size={13} /> Kembali ke Beranda
          </Link>
        </div>

        <TopupStepper current={step} onGoTo={setStep} reachable={reachable} />

        {step === "game" && (
          <motion.section
            key="game"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            aria-label="Pilih game"
          >
            <TopupGameGrid
              games={games}
              loading={loading}
              error={error}
              value={slug}
              onSelect={chooseGame}
              onRetry={reload}
            />
          </motion.section>
        )}

        {step === "account" && (
          <motion.section
            key="account"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            aria-label="Isi tujuan top up"
            className="border border-line bg-panel p-6 sm:p-8"
          >
            <TopupAccountForm
              game={game}
              values={values}
              onChange={changeField}
              errors={errors}
              checking={checking}
              validation={validation}
              onValidate={runValidate}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep("game")}
                data-testid="topup-prev-game"
                className="inline-flex items-center gap-2 border border-line text-slate-400 font-mono text-[11px] uppercase tracking-widest px-5 py-3 hover:text-neon hover:border-neon/60 transition-colors"
              >
                <ArrowLeft size={13} /> Ganti Game
              </button>
              <button
                type="button"
                onClick={nextFromAccount}
                disabled={checking}
                data-testid="topup-next-denomination"
                className="inline-flex items-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-lime transition-colors disabled:opacity-60"
              >
                Pilih Nominal <ArrowRight size={13} />
              </button>
            </div>
          </motion.section>
        )}

        {step === "denomination" && (
          <motion.section
            key="denomination"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            aria-label="Pilih nominal"
            className="border border-line bg-panel p-6 sm:p-8"
          >
            <DenominationGrid
              game={game}
              value={denomination?.code}
              onSelect={(d) => {
                setDenomination(d);
                setSummaryError("");
              }}
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("account")}
                data-testid="topup-prev-account"
                className="inline-flex items-center gap-2 border border-line text-slate-400 font-mono text-[11px] uppercase tracking-widest px-5 py-3 hover:text-neon hover:border-neon/60 transition-colors"
              >
                <ArrowLeft size={13} /> Ubah Tujuan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!denomination) {
                    toast.error("Pilih nominal top up terlebih dahulu");
                    return;
                  }
                  setStep("payment");
                }}
                data-testid="topup-next-payment"
                className="inline-flex items-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-lime transition-colors"
              >
                Lanjut Bayar <ArrowRight size={13} />
              </button>
              {denomination && (
                <span className="inline-flex items-center gap-2 text-[11px] font-mono text-lime self-center">
                  <Zap size={12} /> {denomination.label} dipilih
                </span>
              )}
            </div>
          </motion.section>
        )}

        {step === "payment" && (
          <motion.section
            key="payment"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            aria-label="Pembayaran"
          >
            <TopupPaymentStep
              game={game}
              denomination={denomination}
              destinationLabel={destinationLabel}
              email={email}
              wa={wa}
              onEmail={setEmail}
              onWa={setWa}
              destinations={destinations}
              destinationId={destinationId}
              onDestination={setDestinationId}
              methods={methods}
              method={method}
              onMethod={setMethod}
              submitting={submitting}
              summaryError={summaryError}
              onSubmit={submit}
            />
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setStep("denomination")}
                data-testid="topup-prev-denomination"
                className="inline-flex items-center gap-2 border border-line text-slate-400 font-mono text-[11px] uppercase tracking-widest px-5 py-3 hover:text-neon hover:border-neon/60 transition-colors"
              >
                <ArrowLeft size={13} /> Ubah Nominal
              </button>
            </div>
          </motion.section>
        )}

        {step !== "game" && error && (
          <button
            type="button"
            onClick={reload}
            data-testid="topup-reload-games"
            className="mt-8 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-slate-500 hover:text-neon transition-colors"
          >
            <RefreshCw size={12} /> Muat ulang daftar game
          </button>
        )}
      </div>

      <Footer />
    </main>
  );
}
