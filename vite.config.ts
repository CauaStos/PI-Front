import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react({ compiler: true }), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@\/(components|lib)\//,
        replacement: `${path.resolve(__dirname)}/$1/`,
      },
      { find: /^@\//, replacement: `${path.resolve(__dirname, "src")}/` },
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "100.111.246.78",
      "laptop.neko-bortle.ts.net",
      "*.ts.net",
    ],
    hmr: {
      protocol: "ws",
      host: "100.111.246.78",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
