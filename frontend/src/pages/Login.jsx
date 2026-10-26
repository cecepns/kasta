import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Shield, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return;
    setBusy(true);
    try {
      await login(form);
    } catch {
      /* toast error otomatis ditangani oleh interceptor/request utils */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sand-50 p-4">
      {/* Decorative background shapes */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sun/40 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-clay-700/10 blur-3xl pointer-events-none" />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 bg-clay-700/80 pointer-events-none opacity-90"
        style={{ clipPath: "ellipse(80% 100% at 30% 100%)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/5 bg-clay-900 pointer-events-none"
        style={{ clipPath: "ellipse(70% 100% at 75% 100%)" }}
      />

      <div className="card relative z-10 w-full max-w-md p-6 sm:p-8 shadow-2xl bg-white/95 backdrop-blur-md border border-sand-200 rounded-2xl">
        <div className="mb-6 text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-700 text-white shadow-md shadow-clay-700/20">
            <Shield size={28} className="text-sun" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-clay-900 leading-none">KASTA</h1>
            <p className="text-xs font-semibold text-clay-600 mt-1">
              initiative by Alvariz M.T.
            </p>
            {/* <p className="text-[11px] text-clay-400 mt-0.5">
              Sistem Informasi Arsip Sengketa & Perkara Pertanahan
            </p> */}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-clay-700">
              Username
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-clay-400"
              />
              <input
                type="text"
                className="input pl-9 text-sm"
                placeholder="Masukkan username"
                autoFocus
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-clay-700">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-clay-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                className="input pl-9 pr-10 text-sm"
                placeholder="Masukkan password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-400 hover:text-clay-600"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-2.5 text-sm font-semibold tracking-wide shadow-md shadow-clay-700/10 mt-2"
            disabled={busy}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Memeriksa akun...
              </span>
            ) : (
              "Masuk ke Sistem"
            )}
          </button>
        </form>

        {/* Info & Demo Switcher */}
        {/* <div className="mt-5 space-y-2.5 border-t border-sand-100 pt-3.5">
          <p className="text-[11px] text-clay-600 text-center">
            Wilayah kerja ditentukan otomatis sesuai penetapan Administrator pada akun masing-masing.
          </p>

          <div className="rounded-xl border border-sand-200 bg-sand-50/70 p-2.5 space-y-1.5 text-xs">
            <span className="text-[11px] font-bold text-clay-700 block uppercase tracking-wider">
              Akun Uji Coba Multi-Wilayah:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setForm({ username: "admin", password: "admin123" })}
                className="rounded border border-purple-200 bg-purple-50/60 p-1.5 text-left text-purple-900 hover:bg-purple-100 transition"
              >
                <strong>Admin Pusat</strong>
                <span className="block text-[10px] text-purple-700">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ username: "admin_makassar", password: "admin123" })}
                className="rounded border border-amber-200 bg-amber-50/60 p-1.5 text-left text-amber-900 hover:bg-amber-100 transition"
              >
                <strong>Admin Makassar</strong>
                <span className="block text-[10px] text-amber-700">Kota Makassar</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ username: "admin_bandung", password: "admin123" })}
                className="rounded border border-blue-200 bg-blue-50/60 p-1.5 text-left text-blue-900 hover:bg-blue-100 transition"
              >
                <strong>Admin Bandung</strong>
                <span className="block text-[10px] text-blue-700">Kab. Bandung</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ username: "user_makassar", password: "user123" })}
                className="rounded border border-sand-200 bg-white p-1.5 text-left text-clay-800 hover:bg-sand-100 transition"
              >
                <strong>Staff Makassar</strong>
                <span className="block text-[10px] text-clay-500">Lihat/Baca Saja</span>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

