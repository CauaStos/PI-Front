import { Navigate, Route, Routes } from "react-router-dom"

import { ComandasPage } from "@/pages/ComandasPage"
import MusicasPage from "@/pages/MusicasPage"
import ProdutosPage from "@/pages/ProdutosPage"
import { LoginPage } from "@/pages/LoginPage"
import { AuthGuard } from "./AuthGuard"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Navigate to="/comandas" replace />} />
        <Route
          path="/dashboard"
          element={<Navigate to="/comandas" replace />}
        />
        <Route path="/comandas" element={<ComandasPage />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/musicas" element={<MusicasPage />} />
        <Route path="*" element={<Navigate to="/comandas" replace />} />
      </Route>
    </Routes>
  )
}
