import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SOCIAL_PLATFORMS, socialIcon } from "@/lib/socials";

export function AdminSocials() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/social-links");
      setLinks(data);
    } catch {
      toast.error("Gagal memuat sosial media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing.id) {
        await api.put(`/admin/social-links/${editing.id}`, editing);
        toast.success("Sosial media diperbarui");
      } else {
        await api.post("/admin/social-links", editing);
        toast.success("Sosial media ditambahkan");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus sosial media ini?")) return;
    try {
      await api.delete(`/admin/social-links/${id}`);
      toast.success("Terhapus");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menghapus");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-neon" /></div>;

  return (
    <div className="space-y-6" data-testid="admin-socials">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-black uppercase text-white">Sosial Media</h2>
        <button
          onClick={() => setEditing({ platform: "facebook", name: "", url: "", is_active: true })}
          data-testid="add-social-button"
          className="bg-neon text-void px-4 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-lime flex items-center gap-2 transition-colors"
        >
          <Plus size={14} /> Tambah Baru
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-panel border border-line p-6 space-y-4" data-testid="social-form">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold uppercase text-neon">{editing.id ? "Edit Sosial Media" : "Sosial Media Baru"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Platform</label>
              <select
                data-testid="social-platform-select"
                className="w-full bg-void border border-line px-4 py-2 text-sm text-white"
                value={editing.platform}
                onChange={(e) => setEditing({ ...editing, platform: e.target.value })}
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Nama Tampilan (cth: Facebook, Instagram)</label>
              <input
                required
                type="text"
                data-testid="social-name-input"
                className="w-full bg-void border border-line px-4 py-2 text-sm text-white"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">URL / Link (https://...)</label>
              <input
                required
                type="url"
                placeholder="https://..."
                data-testid="social-url-input"
                className="w-full bg-void border border-line px-4 py-2 text-sm text-white font-mono"
                value={editing.url}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="social-active-checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#00F0FF]"
                />
                Aktif (Tampilkan di tombol Sosial Media)
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" data-testid="social-save-button" className="bg-neon text-void px-6 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-lime flex items-center gap-2 transition-colors">
              <Save size={14} /> Simpan
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((s) => {
          const Icon = socialIcon(s.platform);
          return (
            <div key={s.id} data-testid={`social-card-${s.id}`} className="bg-panel border border-line p-4 flex gap-4 items-start relative group">
              <span className="w-11 h-11 grid place-items-center border border-neon/40 text-neon shrink-0"><Icon size={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {s.name}
                    {!s.is_active && <span className="text-[9px] bg-coral/20 text-coral px-1.5 py-0.5 uppercase tracking-wider">Nonaktif</span>}
                  </h4>
                  <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setEditing(s)} data-testid={`social-edit-${s.id}`} aria-label="Edit" className="text-slate-400 hover:text-neon transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => remove(s.id)} data-testid={`social-delete-${s.id}`} aria-label="Hapus" className="text-slate-400 hover:text-coral transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{s.platform}</p>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-neon/80 hover:text-neon font-mono truncate max-w-full">
                  <ExternalLink size={12} className="shrink-0" /> <span className="truncate">{s.url}</span>
                </a>
              </div>
            </div>
          );
        })}
        {links.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 py-10 font-mono text-sm">
            Belum ada sosial media
          </div>
        )}
      </div>
    </div>
  );
}
