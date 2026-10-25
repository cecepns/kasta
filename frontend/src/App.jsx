import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Records from "@/pages/Records";
import MapPage from "@/pages/MapPage";
import Users from "@/pages/Users";

export default function App() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sengketa" element={<Records key="sengketa" type="sengketa" />} />
        <Route path="/perkara" element={<Records key="perkara" type="perkara" />} />
        <Route path="/peta" element={<MapPage />} />
        {user.role === "admin" && <Route path="/pengguna" element={<Users />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
