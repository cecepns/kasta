import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Scale,
  Gavel,
  Map,
  Users,
  LogOut,
  Menu,
  X,
  MapPin,
  Shield,
  UserCheck,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Layout() {
  const { user, isSuperAdmin, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(window.innerWidth >= 1024);

  const nav = [
    ["/", "Dashboard", LayoutDashboard],
    ["/sengketa", "Sengketa", Scale],
    ["/perkara", "Perkara", Gavel],
    ["/peta", "Peta", Map],
    ...(isAdmin ? [["/pengguna", "Pengguna", Users]] : []),
  ];
  const close = () => window.innerWidth < 1024 && setOpen(false);

  const roleLabel = isSuperAdmin
    ? "Administrator Pusat"
    : user?.role === "admin"
    ? "Administrator Wilayah"
    : "Staff Pengguna Wilayah";

  return (
    <div className="min-h-screen bg-sand-50/50">
      {open && <div className="fixed inset-0 z-30 bg-clay-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sand-200 bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center px-5 border-b border-sand-100">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="KASTA" className="h-9 w-auto rounded-lg object-contain shadow-sm" />
            <div>
              <span className="text-base font-extrabold tracking-tight text-clay-900 leading-none">KASTA</span>
              <span className="block text-[10px] text-clay-500 font-medium leading-tight">initiative by Alvariz M.T.</span>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-clay-700 text-white shadow-sm shadow-clay-700/20" : "text-clay-700 hover:bg-sand-100/80"
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        {/* User Card in Sidebar */}
        <div className="border-t border-sand-200 p-4 space-y-3 bg-sand-50/40">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-bold text-clay-900">{user?.name}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-clay-600 font-medium">
              {isSuperAdmin ? (
                <Shield size={13} className="text-purple-600" />
              ) : user?.role === "admin" ? (
                <UserCheck size={13} className="text-amber-600" />
              ) : (
                <Users size={13} className="text-clay-500" />
              )}
              <span>{roleLabel}</span>
            </div>

            {/* Region badge */}
            <div className="pt-1">
              {user?.kabupaten ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-2 py-1 text-[11px] font-semibold text-clay-800 shadow-xs">
                  <MapPin size={12} className="text-red-500 shrink-0" />
                  <span className="truncate">{user.kabupaten}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700">
                  <Globe size={12} className="shrink-0" />
                  <span>Akses Nasional (Pusat)</span>
                </span>
              )}
            </div>
          </div>

          <button onClick={logout} className="btn-outline w-full py-1.5 text-xs">
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ${open ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-sand-200 bg-white/95 px-4 backdrop-blur sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              className="btn-ghost -ml-2 px-2"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Top Wilayah Scope Banner */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-50 px-3 py-1 text-xs text-clay-800 font-medium shadow-xs">
                {user?.kabupaten ? (
                  <>
                    <MapPin size={13} className="text-red-500" />
                    <span>Wilayah: <strong>{user.kabupaten}</strong></span>
                    {user.provinsi && <span className="text-clay-500">({user.provinsi})</span>}
                  </>
                ) : (
                  <>
                    <Globe size={13} className="text-purple-600" />
                    <span>Wilayah: <strong>Seluruh Wilayah Indonesia (Pusat)</strong></span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="font-bold text-clay-900 block leading-tight">{user?.name}</span>
              <span className="text-[11px] text-clay-500 block leading-tight">{roleLabel}</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-700 text-white font-bold text-sm shadow-xs">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
