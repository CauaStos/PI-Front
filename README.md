# PI Frontend

Front do OnStage (Projeto Interdisciplinar): React + Vite + shadcn/ui.

## Requisitos

- Node.js 22+
- pi-backend rodando

## Para rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Depois, é só abrir o `http://localhost:5173`.

Sem `VITE_API_URL` no `.env` ele vai usar o proxy do próprio Vite pro `http://localhost:3000`. Ou seja, se o back estiver na porta padrão, não precisa configurar nada. Só mude essa env se a API estivar rodando em outra porta.

O app não tem cadastro por padrão. O primeiro login vem do bootstrap-admin do backend (leia o README do pi-backend).

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
npm test
```
