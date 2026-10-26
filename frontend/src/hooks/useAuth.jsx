import { createContext, useContext, useState } from "react";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { request } from "@/utils/request";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("kasta_user") || "null"));
  const [superAdminScope, setSuperAdminScope] = useState("");

  const isSuperAdmin = !user ? false : user.role === "superadmin" || (!user.kabupaten && user.role === "admin");
  const isAdmin = !user ? false : isSuperAdmin || user.role === "admin";
  const canManage = isAdmin;
  const isStaff = user?.role === "user";

  // Active kabupaten: non-superadmin is strictly locked to user.kabupaten; superadmin can switch scope
  const activeKabupaten = !isSuperAdmin ? (user?.kabupaten || "") : superAdminScope;

  const login = async (payload) => {
    const r = await request(() => api.post(API_ENDPOINTS.AUTH.LOGIN, payload));
    localStorage.setItem("kasta_token", r.data.token);
    localStorage.setItem("kasta_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    setSuperAdminScope("");
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setSuperAdminScope("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isSuperAdmin,
        isAdmin,
        canManage,
        isStaff,
        kabupaten: user?.kabupaten || null,
        provinsi: user?.provinsi || null,
        activeKabupaten,
        superAdminScope,
        setSuperAdminScope,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
