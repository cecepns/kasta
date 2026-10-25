import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Scale, Gavel, Map, Users, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(window.innerWidth >= 1024);
  const nav = [
    ["/", "Dashboard", LayoutDashboard], ["/sengketa", "Sengketa", Scale], ["/perkara", "Perkara", Gavel], ["/peta", "Peta", Map],
    ...(isAdmin ? [["/pengguna", "Pengguna", Users]] : []),
  ];
  const close = () => window.innerWidth < 1024 && setOpen(false);

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-clay-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sand-200 bg-white transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center px-5">
          <NavLink to="/" className="flex items-center">
            <img src="/logo.png" alt="KASTA" className="h-10 w-auto rounded-lg object-contain" />
          </NavLink>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={close}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-clay-700 text-white" : "text-clay-800 hover:bg-sand-100"}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sand-200 p-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="mb-3 text-xs text-clay-600">{isAdmin ? "Administrator" : "User"}</p>
          <button onClick={logout} className="btn-outline w-full"><LogOut size={16} /> Keluar</button>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ${open ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-sand-200 bg-sand-50/90 px-4 backdrop-blur sm:px-6">
          <button className="btn-ghost -ml-2 px-2" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
