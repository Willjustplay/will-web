import { useEffect, useState } from "react";
import { Loader2, Star, Upload, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api, formatApiError, imgSrc } from "@/lib/api";

const MIN_LEN = 10;
const MAX_LEN = 600;
const inputId = "review-text";

export const ReviewModal = ({ open, onClose, sessionId, productTitle, defaultEmail = "", onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(5);
    setHover(0);
    setText("");
    setImage("");
    setEmail(defaultEmail);
    setError("");
  }, [open, defaultEmail]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd);
      setImage(data.url);
      toast.success("Screenshot diunggah");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Gagal mengunggah gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async () => {
    setError("");
    if (text.trim().length < MIN_LEN) {
      setError(`Ulasan minimal ${MIN_LEN} karakter`);
      return;
    }
    if (text.trim().length > MAX_LEN) {
      setError(`Ulasan maksimal ${MAX_LEN} karakter`);
      return;
    }
    if (!email.trim()) {
      setError("Masukkan email yang dipakai saat membeli");
      return;
    }
    setSaving(true);
    try {
      await api.post("/reviews", {
        session_id: sessionId,
        rating,
        text: text.trim(),
        image,
        buyer_email: email.trim(),
      });
      toast.success("Terima kasih! Ulasanmu sudah tayang.");
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      const message =
        formatApiError(err.response?.data?.detail) || "Gagal mengirim ulasan. Coba lagi.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remaining = MAX_LEN - text.length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent
        data-testid="review-modal"
        aria-describedby={undefined}
        className="max-w-lg w-[95vw] bg-panel border-line text-slate-100 p-0 overflow-hidden gap-0"
      >
        <div className="px-6 pt-6 pb-4 border-b border-line">
          <DialogTitle className="font-display font-bold uppercase text-sm" data-testid="review-modal-title">
            Beri Ulasan
          </DialogTitle>
          <p className="mt-1 text-[11px] font-mono text-slate-500 truncate">{productTitle}</p>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto" data-lenis-prevent>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">Rating</p>
            <div className="flex items-center gap-1.5" data-testid="review-stars" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} bintang`}
                  data-testid={`review-star-${n}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1 text-lime transition-transform hover:scale-110"
                >
                  <Star
                    size={22}
                    fill={(hover || rating) >= n ? "currentColor" : "none"}
                    className={(hover || rating) >= n ? "" : "text-slate-600"}
                  />
                </button>
              ))}
              <span className="ml-2 text-[11px] font-mono text-slate-400" data-testid="review-rating-label">
                {rating}/5
              </span>
            </div>
          </div>

          <div>
            <label htmlFor={inputId} className="block text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">
              Ulasan
            </label>
            <textarea
              id={inputId}
              data-testid="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Ceritakan pengalamanmu: kecepatan proses, kualitas akun/item, pelayanan admin..."
              aria-invalid={!!error && text.trim().length < MIN_LEN}
              className="w-full bg-void border border-line focus:border-neon outline-none text-xs font-mono px-3 py-3 placeholder:text-slate-600 transition-colors resize-y"
            />
            <p
              className={`mt-1.5 text-[10px] font-mono ${remaining < 0 ? "text-coral" : "text-slate-600"}`}
              data-testid="review-char-count"
            >
              {text.length}/{MAX_LEN} karakter (min {MIN_LEN})
            </p>
          </div>

          <div>
            <label htmlFor="review-email" className="block text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">
              Email Pembelian
            </label>
            <input
              id="review-email"
              data-testid="review-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email yang dipakai saat membeli"
              className="w-full bg-void border border-line focus:border-neon outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors"
            />
            <p className="mt-1.5 text-[10px] font-mono text-slate-600">
              Dipakai hanya untuk memverifikasi pesanan ini.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-2">
              Screenshot (opsional)
            </p>
            {image ? (
              <div className="relative border border-line">
                <img src={imgSrc(image)} alt="Lampiran ulasan" className="w-full max-h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  data-testid="review-image-remove"
                  aria-label="Hapus gambar"
                  className="absolute top-2 right-2 grid place-items-center w-7 h-7 bg-void/80 border border-line text-coral hover:border-coral"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label
                data-testid="review-upload-label"
                className="flex items-center justify-center gap-2 border border-dashed border-line hover:border-neon/60 text-slate-400 hover:text-neon text-[11px] font-mono py-4 cursor-pointer transition-colors"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Mengunggah..." : "Unggah bukti chat"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={upload}
                  disabled={uploading}
                  data-testid="review-upload-input"
                />
              </label>
            )}
          </div>

          {error && (
            <p data-testid="review-error" className="text-[11px] font-mono text-coral">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            data-testid="review-cancel"
            className="text-[11px] font-mono uppercase tracking-widest text-slate-400 hover:text-slate-200 px-4 py-2.5 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || uploading}
            data-testid="review-submit"
            className="inline-flex items-center gap-2 bg-neon text-void font-display font-bold text-[11px] uppercase tracking-[0.2em] px-5 py-2.5 hover:bg-lime transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            {saving ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
