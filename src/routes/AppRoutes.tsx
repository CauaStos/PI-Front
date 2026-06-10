import { Navigate, Route, Routes } from "react-router-dom"

import { ComandasPage } from "@/src/pages/ComandasPage"
import ProdutosPage from "@/src/pages/ProdutosPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/comandas" replace />} />
      <Route path="/dashboard" element={<Navigate to="/comandas" replace />} />
      <Route path="/comandas" element={<ComandasPage />} />
      <Route path="/produtos" element={<ProdutosPage />} />
      <Route path="/musicas" element={<Navigate to="/comandas" replace />} />
      <Route path="*" element={<Navigate to="/comandas" replace />} />
    </Routes>
  )
}
