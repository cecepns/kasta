import { createContext, useContext, useState } from "react";
import { api } from "@/utils/api";
import { API_ENDPOINTS } from "@/utils/endpoints";
import { request } from "@/utils/request";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("kasta_user") || "null"));

  const login = async (payload) => {
    const r = await request(() => api.post(API_ENDPOINTS.AUTH.LOGIN, payload));
    localStorage.setItem("kasta_token", r.data.token);
    localStorage.setItem("kasta_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
  };
  const logout = () => { localStorage.clear(); setUser(null); };

  return <AuthContext.Provider value={{ user, isAdmin: user?.role === "admin", login, logout }}>{children}</AuthContext.Provider>;
}
