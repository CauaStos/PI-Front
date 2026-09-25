# PI Frontend

Front do OnStage (Projeto Interdisciplinar): React + Vite + shadcn/ui.

O back-end fica no repositório [PI-Backend](https://github.com/CauaStos/PI-Backend).

## Requisitos

- Node.js 22.12+ e npm 10.x
- pi-backend rodando em `http://localhost:3000`

React, Vite e as outras dependências vêm pelo npm.

## Como rodar

Com o backend rodando, execute:

```bash
npm ci
cp .env.example .env
npm run dev
```

Depois, é só abrir o `http://localhost:5173`.

## Variáveis de ambiente

A única variável é a `VITE_API_URL`, que é a URL da API. O `.env.example`
já vem com `http://localhost:3000/api/v1`, que segue o setup padrão.

Em dev você também pode usar `VITE_API_URL=/api/v1` e as chamadas
irão passar pelo proxy do Vite em vez de irem direto pro back. Dos dois
jeitos funciona.

## Primeiro login e dados para testar

O app não tem cadastro: o primeiro admin é criado pelo `bootstrap-admin`
no backend, e o login é com o email e a senha que você definiu lá.

Os comandos estão no README do backend:

- [Primeiro usuário](https://github.com/CauaStos/PI-Backend#primeiro-usuário)
- [Dados de demonstração](https://github.com/CauaStos/PI-Backend#dados-de-demonstração)

Com a API rodando, o Swagger fica em `http://localhost:3000/api-docs/`.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
npm test
```
