import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import useList from "@/hooks/useList";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { confirmToast, request } from "@/utils/request";

const columns = [
  { key: "name", label: "Nama" }, { key: "username", label: "Username" },
  { key: "role", label: "Peran", render: (r) => (r.role === "admin" ? "Administrator" : "User") },
];

export default function Users() {
  const list = useList(API_ENDPOINTS.USERS.LIST);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || (!form.id && !form.password)) return toast.error("Lengkapi nama, username, dan password");
    setSaving(true);
    try {
      await request(() => form.id ? api.put(API_ENDPOINTS.USERS.DETAIL(form.id), form) : api.post(API_ENDPOINTS.USERS.LIST, form), "Pengguna disimpan");
      setForm(null); list.reload();
    } catch { /* toast tampil */ } finally { setSaving(false); }
  };
  const remove = async (u) => {
    if (!(await confirmToast(`Hapus pengguna ${u.name}?`))) return;
    await request(() => api.delete(API_ENDPOINTS.USERS.DETAIL(u.id)), "Pengguna dihapus").catch(() => null);
    list.reload();
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <h1>Pengguna</h1>
      <DataTable list={list} rows={list.rows} loading={list.loading} columns={columns}
        toolbar={<button className="btn-primary" onClick={() => setForm({ role: "user" })}><Plus size={16} /> Tambah</button>}
        actions={(u) => (
          <div className="flex justify-end gap-1">
            <button className="btn-ghost px-2 py-1" onClick={() => setForm({ ...u, password: "" })} aria-label="Edit"><Pencil size={16} /></button>
            <button className="btn-ghost px-2 py-1 text-red-600" onClick={() => remove(u)} aria-label="Hapus"><Trash2 size={16} /></button>
          </div>
        )} />
      {form && (
        <Modal title={form.id ? "Edit pengguna" : "Tambah pengguna"} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            <Field label="Nama"><input className="input" value={form.name || ""} onChange={set("name")} /></Field>
            <Field label="Username"><input className="input" value={form.username || ""} onChange={set("username")} /></Field>
            <Field label={form.id ? "Password baru (opsional)" : "Password"}><input className="input" type="password" value={form.password || ""} onChange={set("password")} /></Field>
            <Field label="Peran"><select className="input" value={form.role} onChange={set("role")}><option value="user">User</option><option value="admin">Administrator</option></select></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />} Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
