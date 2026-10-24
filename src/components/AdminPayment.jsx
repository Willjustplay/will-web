import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api, imgSrc } from "@/lib/api";

export function AdminPayment() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/payments/manual-destinations");
      setDestinations(data);
    } catch (e) {
      toast.error("Gagal memuat metode pembayaran");
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
        await api.put(`/admin/payments/manual-destinations/${editing.id}`, editing);
        toast.success("Tujuan pembayaran diperbarui");
      } else {
        await api.post("/admin/payments/manual-destinations", editing);
        toast.success("Tujuan pembayaran ditambahkan");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus tujuan pembayaran ini?")) return;
    try {
      await api.delete(`/admin/payments/manual-destinations/${id}`);
      toast.success("Terhapus");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Gagal menghapus");
    }
  };

  const uploadImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post("/admin/upload", fd);
      setEditing((prev) => ({ ...prev, image: data.url }));
      toast.success("Gambar berhasil diupload");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengupload gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-neon" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-black uppercase text-white">Tujuan Pembayaran Manual</h2>
        <button
          onClick={() => setEditing({ type: "bank", name: "", account_name: "", account_number: "", image: "", is_active: true })}
          data-testid="add-destination-button"
          className="bg-neon text-void px-4 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-lime flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Baru
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-panel border border-line p-6 space-y-4" data-testid="destination-form">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold uppercase text-neon">{editing.id ? "Edit Tujuan" : "Tujuan Baru"}</h3>
            <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Tipe</label>
              <select
                data-testid="destination-type-select"
                className="w-full bg-void border border-line px-4 py-2 text-sm text-white"
                value={editing.type}
                onChange={e => setEditing({...editing, type: e.target.value})}
              >
                <option value="bank">Transfer Bank</option>
                <option value="ewallet">E-Wallet (Dana, Ovo, dll)</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Nama (cth: BCA, DANA, QRIS Toko)</label>
              <input required type="text" data-testid="destination-name-input" className="w-full bg-void border border-line px-4 py-2 text-sm text-white" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Atas Nama (Akun / Rekening)</label>
              <input type="text" data-testid="destination-account-name-input" className="w-full bg-void border border-line px-4 py-2 text-sm text-white" value={editing.account_name} onChange={e => setEditing({...editing, account_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Nomor Rekening / No HP</label>
              <input type="text" data-testid="destination-account-number-input" className="w-full bg-void border border-line px-4 py-2 text-sm text-white" value={editing.account_number} onChange={e => setEditing({...editing, account_number: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-2">Gambar / QR Code (QRIS)</label>
              <div className="flex gap-4 items-end">
                {editing.image && (
                  <img src={imgSrc(editing.image)} alt="QR" className="w-24 h-24 object-cover border border-line" />
                )}
                <div className="flex-1">
                  <label className="cursor-pointer bg-void border border-line px-4 py-2 text-sm text-slate-300 hover:text-white flex items-center justify-center gap-2">
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                    {uploading ? "Mengupload..." : "Upload Gambar (Khusus QRIS/Logo)"}
                    <input type="file" className="hidden" accept="image/*" onChange={uploadImage} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({...editing, is_active: e.target.checked})} className="bg-void border-line text-neon" />
                Aktif (Tampilkan ke pelanggan)
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" data-testid="destination-save-button" className="bg-neon text-void px-6 py-2 font-bold uppercase text-[10px] tracking-wider hover:bg-lime flex items-center gap-2">
              <Save size={14} /> Simpan
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {destinations.map(d => (
          <div key={d.id} data-testid={`destination-card-${d.id}`} className="bg-panel border border-line p-4 flex gap-4 items-start relative group">
            {d.image && (
              <img src={imgSrc(d.image)} alt={d.name} className="w-16 h-16 object-cover border border-line bg-void" />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-white flex items-center gap-2">
                  {d.name} 
                  {!d.is_active && <span className="text-[9px] bg-coral/20 text-coral px-1.5 py-0.5 uppercase tracking-wider">Nonaktif</span>}
                </h4>
                <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(d)} data-testid={`destination-edit-${d.id}`} aria-label="Edit" className="text-slate-400 hover:text-neon"><Pencil size={14} /></button>
                  <button onClick={() => remove(d.id)} data-testid={`destination-delete-${d.id}`} aria-label="Hapus" className="text-slate-400 hover:text-coral"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{d.type}</p>
              <div className="mt-2 text-sm text-slate-300">
                {d.account_number && <p className="font-mono">{d.account_number}</p>}
                {d.account_name && <p>{d.account_name}</p>}
              </div>
            </div>
          </div>
        ))}
        {destinations.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 py-10 font-mono text-sm">
            Belum ada tujuan pembayaran
          </div>
        )}
      </div>
    </div>
  );
}
