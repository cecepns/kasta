import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Share,
  Shield,
  Smartphone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const isIos =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  useEffect(() => {
    // Cek apakah aplikasi sudah berjalan dalam mode standalone (PWA terinstall)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Tangkap event instalasi browser (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem("kasta_pwa_dismissed");
      if (!dismissed) {
        setShowInstallModal(true);
      }
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Tampilkan popup otomatis jika belum ditutup di sesi ini
    const dismissed = sessionStorage.getItem("kasta_pwa_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowInstallModal(true);
      }, 700);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setShowInstallModal(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleDismissModal = () => {
    setShowInstallModal(false);
    sessionStorage.setItem("kasta_pwa_dismissed", "true");
  };

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

        {/* Tombol Install PWA jika belum mode standalone */}
        {!isStandalone && (
          <div className="mt-5 border-t border-sand-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowGuide(false);
                setShowInstallModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-sand-50/80 px-4 py-1.5 text-xs font-semibold text-clay-700 shadow-sm transition hover:bg-sand-100 hover:text-clay-900 hover:border-sand-300"
            >
              <Download size={14} className="text-clay-600" />
              <span>Install Aplikasi KASTA</span>
            </button>
          </div>
        )}
      </div>

      {/* Popup / Modal Install PWA */}
      {showInstallModal && !isStandalone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-clay-900/60 backdrop-blur-sm transition-all"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-sand-200 text-center animate-in zoom-in-95 duration-200">
            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={handleDismissModal}
              className="absolute right-4 top-4 rounded-full p-1.5 text-clay-400 hover:text-clay-700 hover:bg-sand-100 transition"
              aria-label="Tutup popup"
            >
              <X size={18} />
            </button>

            {/* Icon Logo KASTA */}
            <div className="mx-auto mb-4 flex items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-sand-50 to-white border border-sand-200/80 shadow-inner w-36 h-20">
              <img
                src="/logo.png"
                alt="Logo KASTA"
                className="max-h-full max-w-full object-contain drop-shadow-sm"
              />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sand-100 text-clay-800 text-[11px] font-semibold mb-2">
              <Sparkles size={12} className="text-clay-600" />
              <span>Aplikasi Web Progresif (PWA)</span>
            </div>

            {/* Judul & Keterangan */}
            <h2 className="text-xl font-extrabold text-clay-900">
              Install Aplikasi KASTA
            </h2>
            <p className="text-xs text-clay-600 mt-1 mb-4 leading-relaxed">
              Pasang KASTA langsung di perangkat Anda untuk akses cepat dari layar utama dan pengalaman penggunaan yang optimal.
            </p>

            {/* Keunggulan */}
            <div className="mb-5 rounded-2xl bg-sand-50/60 border border-sand-100 p-3.5 text-left space-y-2.5 text-xs text-clay-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Akses 1-klik langsung dari Beranda HP / Laptop</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Tampilan layar penuh tanpa terganggu bilah URL</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Performa lebih responsif dan hemat kuota data</span>
              </div>
            </div>

            {/* Petunjuk Manual / iOS Safari */}
            {showGuide && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-left text-xs text-amber-900">
                {isIos ? (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <Share size={14} className="text-amber-800" /> Cara pasang di Safari iOS:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
                      <li>Ketuk tombol <strong>Share</strong> (ikon kotak panah ke atas) di bilah navigasi Safari bawah.</li>
                      <li>Gulir ke bawah dan ketuk <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).</li>
                      <li>Ketuk <strong>"Tambah"</strong> di sudut kanan atas.</li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-amber-800" /> Cara pasang di browser:
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Klik ikon install <Download size={12} className="inline mx-0.5" /> di bilah alamat browser, atau klik menu titik tiga (⋮) di pojok kanan atas lalu pilih <strong>"Install KASTA"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn-primary w-full py-2.5 text-sm font-semibold tracking-wide shadow-md shadow-clay-700/20 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                <span>{deferredPrompt ? "Install Aplikasi Sekarang" : showGuide ? "Sudah Paham" : "Pasang Sekarang"}</span>
              </button>

              <button
                type="button"
                onClick={handleDismissModal}
                className="w-full py-1.5 text-xs font-medium text-clay-500 hover:text-clay-800 transition"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

