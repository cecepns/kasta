import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Shield, Trash2, UserCheck, Users as UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import WilayahSelector from "@/components/WilayahSelector";
import useList from "@/hooks/useList";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { confirmToast, request } from "@/utils/request";

export default function Users() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const list = useList(API_ENDPOINTS.USERS.LIST);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Wilayah data for modal
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);

  // Admin conflict check
  const [adminConflict, setAdminConflict] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    setLoadingProvinces(true);
    api
      .get(API_ENDPOINTS.WILAYAH.PROVINCES)
      .then((res) => setProvinces(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProvinces(false));
  }, []);

  // When form opens or province changes, load regencies
  const loadRegenciesForProvince = async (provName) => {
    if (!provName) {
      setRegencies([]);
      return;
    }
    const prov = provinces.find((p) => p.name.toLowerCase() === provName.toLowerCase());
    if (!prov) return;
    setLoadingRegencies(true);
    try {
      const res = await api.get(API_ENDPOINTS.WILAYAH.REGENCIES(prov.code));
      setRegencies(res.data?.data || res.data || []);
    } catch {
      setRegencies([]);
    } finally {
      setLoadingRegencies(false);
    }
  };

  const openForm = (u) => {
    if (u) {
      setForm({ ...u, password: "" });
      if (u.provinsi) loadRegenciesForProvince(u.provinsi);
    } else {
      setForm({
        name: "",
        username: "",
        password: "",
        role: isSuperAdmin ? "admin" : "user",
        provinsi: !isSuperAdmin ? currentUser?.provinsi : "",
        kabupaten: !isSuperAdmin ? currentUser?.kabupaten : "",
      });
      if (!isSuperAdmin && currentUser?.provinsi) {
        loadRegenciesForProvince(currentUser.provinsi);
      }
    }
    setAdminConflict(null);
  };

  // Check 1 admin per kabupaten rule when role or kabupaten changes
  useEffect(() => {
    if (!form || form.role !== "admin" || !form.kabupaten) {
      setAdminConflict(null);
      return;
    }
    setCheckingConflict(true);
    api
      .get(API_ENDPOINTS.USERS.CHECK_ADMIN, {
        params: { kabupaten: form.kabupaten, excludeId: form.id },
      })
      .then((res) => {
        const info = res.data?.data || res.data;
        if (info?.exists) {
          setAdminConflict(info.currentAdmin);
        } else {
          setAdminConflict(null);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingConflict(false));
  }, [form?.role, form?.kabupaten, form?.id]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || (!form.id && !form.password)) {
      return toast.error("Lengkapi nama, username, dan password");
    }
    if (form.role !== "superadmin" && !form.kabupaten) {
      return toast.error("Kabupaten/Kota wajib dipilih untuk akun wilayah");
    }
    if (form.role === "admin" && adminConflict) {
      return toast.error(
        `Kabupaten ${form.kabupaten} sudah memiliki Administrator (${adminConflict.name}). Maksimal 1 administrator per kabupaten.`
      );
    }

    setSaving(true);
    try {
      await request(
        () => (form.id ? api.put(API_ENDPOINTS.USERS.DETAIL(form.id), form) : api.post(API_ENDPOINTS.USERS.LIST, form)),
        "Pengguna berhasil disimpan"
      );
      setForm(null);
      list.reload();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    if (!(await confirmToast(`Hapus pengguna ${u.name} (@${u.username})?`))) return;
    await request(() => api.delete(API_ENDPOINTS.USERS.DETAIL(u.id)), "Pengguna berhasil dihapus").catch(() => null);
    list.reload();
  };

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const columns = [
    { key: "name", label: "Nama" },
    { key: "username", label: "Username", render: (r) => <span className="font-mono text-xs">@{r.username}</span> },
    {
      key: "role",
      label: "Peran",
      render: (r) => {
        if (r.role === "superadmin" || (!r.kabupaten && r.role === "admin")) {
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
              <Shield size={12} /> Administrator Pusat
            </span>
          );
        }
        if (r.role === "admin") {
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
              <UserCheck size={12} /> Administrator Wilayah
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sand-100 px-2 py-0.5 text-xs font-medium text-clay-700">
            <UsersIcon size={12} /> Staff Pengguna
          </span>
        );
      },
    },
    {
      key: "wilayah",
      label: "Cakupan Wilayah",
      render: (r) => {
        if (!r.kabupaten) {
          return <span className="text-xs text-purple-700 font-medium">Seluruh Wilayah (Nasional)</span>;
        }
        return (
          <div className="text-xs">
            <p className="font-semibold text-clay-900">{r.kabupaten}</p>
            {r.provinsi && <p className="text-clay-500">{r.provinsi}</p>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Manajemen Pengguna</h1>
          <p className="text-xs text-clay-600">
            {isSuperAdmin
              ? "Kelola akun Administrator Wilayah (maks. 1 per kabupaten) dan Staff Pengguna se-Indonesia"
              : `Kelola staff pengguna untuk wilayah ${currentUser?.kabupaten || ""}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => openForm(null)}>
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      <DataTable
        list={list}
        rows={list.rows}
        loading={list.loading}
        columns={columns}
        actions={(u) => {
          // Cannot edit/delete self from list
          if (u.id === currentUser?.id) return null;
          // Non-superadmin can only edit/delete staff (user) in their own kabupaten
          if (!isSuperAdmin && (u.role !== "user" || u.kabupaten !== currentUser?.kabupaten)) return null;

          return (
            <div className="flex justify-end gap-1">
              <button
                className="btn-ghost px-2 py-1"
                onClick={() => openForm(u)}
                aria-label="Edit"
                title="Edit pengguna"
              >
                <Pencil size={16} />
              </button>
              <button
                className="btn-ghost px-2 py-1 text-red-600"
                onClick={() => remove(u)}
                aria-label="Hapus"
                title="Hapus pengguna"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        }}
      />

      {form && (
        <Modal
          title={form.id ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          onClose={() => setForm(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Nama Lengkap">
              <input
                className="input"
                placeholder="Nama pegawai / operator"
                required
                value={form.name || ""}
                onChange={setField("name")}
              />
            </Field>

            <Field label="Username">
              <input
                className="input"
                placeholder="Username untuk login"
                required
                value={form.username || ""}
                onChange={setField("username")}
              />
            </Field>

            <Field label={form.id ? "Password Baru (Kosongkan jika tidak diganti)" : "Password (Min. 6 Karakter)"}>
              <input
                className="input"
                type="password"
                placeholder="******"
                required={!form.id}
                value={form.password || ""}
                onChange={setField("password")}
              />
            </Field>

            <Field label="Peran Akun">
              <select
                className="input font-medium"
                value={form.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setForm({
                    ...form,
                    role: newRole,
                    provinsi: newRole === "superadmin" ? "" : form.provinsi,
                    kabupaten: newRole === "superadmin" ? "" : form.kabupaten,
                  });
                }}
                disabled={!isSuperAdmin}
              >
                {isSuperAdmin && (
                  <option value="superadmin">Administrator Pusat (Akses Seluruh Wilayah)</option>
                )}
                {isSuperAdmin && (
                  <option value="admin">
                    Administrator Wilayah (Hak Edit & Input · Maks. 1 Orang/Kabupaten)
                  </option>
                )}
                <option value="user">Staff Pengguna Wilayah (Hak Akses Lihat/Baca Saja)</option>
              </select>
            </Field>

            {/* Region assignment for regional accounts */}
            {form.role !== "superadmin" && (
              <div className="space-y-3 rounded-xl border border-sand-200 bg-sand-50/70 p-3.5">
                <p className="text-xs font-bold text-clay-800 flex items-center justify-between">
                  <span>Penetapan Wilayah Kabupaten/Kota</span>
                  <span className="text-[11px] font-normal text-clay-500">API Resmi Kemendagri</span>
                </p>

                {isSuperAdmin ? (
                  <WilayahSelector
                    values={{
                      provinsi: form.provinsi,
                      kabupaten: form.kabupaten,
                    }}
                    levels={["provinsi", "kabupaten"]}
                    showDusun={false}
                    layout="grid"
                    onChange={(newLoc) => setForm((s) => ({ ...s, ...newLoc }))}
                  />
                ) : (
                  <div className="rounded-lg bg-white p-2.5 text-xs border border-sand-200 space-y-1">
                    <p className="text-clay-600">Wilayah kerja staff otomatis terkunci ke:</p>
                    <p className="font-bold text-clay-900 text-sm">
                      {currentUser?.kabupaten} ({currentUser?.provinsi})
                    </p>
                  </div>
                )}

                {/* 1 Admin Per Kabupaten Notification */}
                {form.role === "admin" && form.kabupaten && (
                  <div className="pt-1">
                    {checkingConflict ? (
                      <div className="flex items-center gap-2 text-xs text-clay-500">
                        <Loader2 size={14} className="animate-spin" /> Memeriksa ketersediaan kuota administrator...
                      </div>
                    ) : adminConflict ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertCircle size={15} className="text-red-600 shrink-0" />
                          <span>Batas Kuota: Wilayah Ini Sudah Memiliki 1 Administrator!</span>
                        </div>
                        <p>
                          Administrator saat ini: <strong>{adminConflict.name}</strong> (@{adminConflict.username}).
                          Sesuai ketentuan, masing-masing wilayah hanya boleh memiliki 1 orang penginput/administrator.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>Kabupaten ini belum memiliki Administrator. Kuota tersedia (1/1).</span>
                      </div>
                    )}
                  </div>
                )}

                {form.role === "user" && (
                  <p className="text-[11px] text-clay-500 italic">
                    ℹ️ Staff Pengguna dapat ditambahkan lebih dari 1 orang untuk wilayah yang sama.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-sand-200 pt-3">
              <button type="button" className="btn-outline" onClick={() => setForm(null)}>
                Batal
              </button>
              <button
                className="btn-primary"
                disabled={saving || (form.role === "admin" && !!adminConflict)}
              >
                {saving && <Loader2 size={16} className="animate-spin" />} Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
