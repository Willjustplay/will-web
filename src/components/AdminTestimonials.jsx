import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, X, Loader2, Upload, Star } from "lucide-react";
import { toast } from "sonner";
import { api, imgSrc } from "@/lib/api";

const EMPTY = { name: "", game: "", product: "", rating: 5, text: "", image: "" };
const inputCls = "mt-1.5 w-full bg-void border border-line focus:border-neon/60 outline-none text-xs font-mono px-3 py-2.5 placeholder:text-slate-600 transition-colors";

export const AdminTestimonials = ({ items, headers, reload }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    if (!form.name || !form.text) {
      toast.error("Nama dan isi ulasan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/testimonials", { ...form, rating: Number(form.rating) }, { headers });
      toast.success("Testimoni ditambahkan");
      setOpen(false);
      setForm(EMPTY);
      reload();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menyimpan testimoni");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus testimoni ini?")) return;
    try {
      await api.delete(`/admin/testimonials/${id}`, { headers });
      toast.success("Testimoni dihapus");
      reload();
    } catch {
      toast.error("Gagal menghapus testimoni");
    }
  };

  const upload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/admin/upload", fd, { headers });
      setForm((p) => ({ ...p, image: data.url }));
      toast.success("Screenshot berhasil diupload");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengupload gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setForm(EMPTY); setOpen(true); }} data-testid="add-testimonial-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 bg-neon text-void hover:bg-lime transition-colors">
          <Plus size={13} /> Tambah Testimoni
        </button>
      </div>
      <div className="border border-line bg-panel overflow-x-auto" data-testid="admin-testimonials-table">
        {items.length === 0 ? (
          <p className="text-center text-xs text-slate-500 font-mono py-16">Belum ada testimoni.</p>
        ) : (
          <table className="w-full text-left text-xs font-mono min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Pembeli</th>
                <th className="px-4 py-3">Game / Produk</th>
                <th className="px-4 py-3">Ulasan</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-line/60 hover:bg-panelhover transition-colors" data-testid={`testimonial-row-${t.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.image ? (
                        <img src={imgSrc(t.image)} alt="" className="w-11 h-11 object-cover object-top border border-line" />
                      ) : (
                        <span className="w-11 h-11 grid place-items-center border border-line text-slate-600 text-[9px]">No img</span>
                      )}
                      <span className="font-sans font-bold text-slate-200">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neon">{t.game}<span className="block text-slate-500 text-[10px]">{t.product}</span></td>
                  <td className="px-4 py-3 text-slate-400 max-w-[300px] truncate">{t.text}</td>
                  <td className="px-4 py-3 text-lime flex items-center gap-1"><Star size={11} fill="currentColor" /> {t.rating}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => remove(t.id)} data-testid={`delete-testimonial-${t.id}`} className="w-8 h-8 grid place-items-center border border-line text-slate-400 hover:text-coral hover:border-coral/50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4" data-testid="testimonial-form-modal">
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-panel border border-line max-h-[90vh] overflow-y-auto" data-lenis-prevent>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display font-bold uppercase text-sm">Tambah Testimoni</h2>
              <button onClick={() => setOpen(false)} data-testid="testimonial-form-close" className="text-slate-500 hover:text-coral transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Nama Pembeli *</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Rizky A." data-testid="testimonial-name-input" className={inputCls} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Rating (1-5)</span>
                <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} data-testid="testimonial-rating-select" className={inputCls}>
                  {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} bintang</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Game</span>
                <input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} placeholder="mis. Mobile Legends" data-testid="testimonial-game-input" className={inputCls} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Produk yang dibeli</span>
                <input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="mis. Jasa Joki Mythic" data-testid="testimonial-product-input" className={inputCls} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Isi Ulasan *</span>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} data-testid="testimonial-text-input" className={`${inputCls} leading-relaxed`} />
              </label>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Screenshot Chat (opsional)</span>
                <div className="mt-1.5 flex items-start gap-3">
                  {form.image && <img src={imgSrc(form.image)} alt="preview" data-testid="testimonial-image-preview" className="w-20 h-20 object-cover object-top border border-line" />}
                  <div className="flex-1 space-y-2">
                    <label data-testid="testimonial-upload-label" className={`flex items-center justify-center gap-2 border border-dashed border-line hover:border-neon/60 text-slate-400 hover:text-neon text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {uploading ? "Mengupload..." : "Upload Screenshot Chat"}
                      <input type="file" accept="image/*" onChange={upload} data-testid="testimonial-file-input" className="hidden" />
                    </label>
                    <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="atau tempel URL gambar https://..." data-testid="testimonial-image-input" className={inputCls.replace("mt-1.5 ", "")} />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-line px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} data-testid="testimonial-cancel-button" className="text-[11px] font-bold uppercase tracking-widest px-5 py-3 border border-line text-slate-400 hover:text-slate-200 transition-colors">Batal</button>
              <button onClick={save} disabled={saving} data-testid="save-testimonial-button" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-5 py-3 bg-neon text-void hover:bg-lime transition-colors disabled:opacity-50">
                {saving && <Loader2 size={13} className="animate-spin" />} Simpan Testimoni
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
