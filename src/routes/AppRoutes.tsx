import { Navigate, Route, Routes } from "react-router-dom"

import { ComandasPage } from "@/pages/ComandasPage"
import DashboardPage from "@/pages/DashboardPage"
import MusicasPage from "@/pages/MusicasPage"
import ProdutosPage from "@/pages/ProdutosPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"
import { AuthGuard } from "./AuthGuard"
import { PublicOnly } from "./PublicOnly"

export function AppRoutes() {
  return (
    <Routes>
      {/*
       * Fora de PublicOnly: o link de reset precisa funcionar mesmo com uma
       * sessao ativa (o link pode ser de outra conta). A tela descarta a sessao
       * atual apos a troca de senha.
       */}
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Navigate to="/comandas" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/comandas" element={<ComandasPage />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/musicas" element={<MusicasPage />} />
        <Route path="*" element={<Navigate to="/comandas" replace />} />
      </Route>
    </Routes>
  )
}
