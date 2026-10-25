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
            <h1 className="text-2xl font-extrabold tracking-tight text-clay-900">KASTA</h1>
            <p className="text-xs text-clay-600 mt-0.5">
              Sistem Informasi Arsip Sengketa & Perkara Pertanahan
            </p>
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

        <div className="mt-6 border-t border-sand-100 pt-4 text-center">
          <p className="text-[11px] text-clay-500">
            Aplikasi internal kantor · Hak akses terbatas untuk pegawai berwenang
          </p>
        </div>
      </div>
    </div>
  );
}

