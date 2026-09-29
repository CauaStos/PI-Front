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

A `VITE_API_URL` é opcional. Sem ela o front usa a mesma origem (`/api/v1`):
em dev o proxy do Vite cobre `/api`, e em produção o mesmo host serve o front e
a API. Defina só para apontar para uma API externa.

Não coloque secrets em variáveis `VITE_*`.

## Autenticação e fluxos

O login, o cadastro e a recuperação de senha usam o Better Auth do backend
(`/api/auth/*`). As telas públicas são:

- `/cadastro` — cadastro público com nome, email, senha (mínimo de 8
  caracteres) e confirmação. O papel é sempre `garcom`: o formulário não deixa
  escolher perfil e o backend ignora qualquer `role` enviado pelo cliente. O
  cadastro já cria a sessão, então o usuário entra direto após criar a conta.
- `/login` — login com email e senha. Depois de entrar, o app respeita o
  destino que o guard salvou (ex.: quem tentou abrir `/comandas` volta para lá).
- `/esqueci-senha` — envia o link de redefinição. **Não há SMTP**: em
  desenvolvimento, com `AUTH_PASSWORD_RESET_CONSOLE_URL=true` no backend, o
  link aparece no console do back. A tela mostra sempre uma mensagem neutra
  para não expor quais emails existem.
- `/redefinir-senha?token=...` — recebe o token do link, valida a nova senha e
  confirma a troca. Token inválido/expirado mostra erro visível.

Detalhes do token:

- O access token é um JWT de 15 minutos. Ele fica **apenas em memória**, nunca
  em `localStorage`/`sessionStorage`, para reduzir exposição.
- O cookie de sessão (httpOnly) continua existindo e é usado para renovar o
  JWT. Ao recarregar a página, o app renova o token sob demanda antes das
  chamadas.
- As rotas `/api/v1` exigem `Authorization: Bearer <jwt>`. O helper de API
  anexa o header automaticamente, e em `401` descarta o token velho, tenta
  renovar uma única vez e, se ainda falhar, encerra a sessão e manda para o
  login.
- O logout (`Sair`, no rodapé da barra lateral) aguarda o `signOut`, limpa o
  token em memória e redireciona para o login. Sessões de renovação em
  andamento são descartadas para não repopular o token depois do logout.

O primeiro admin continua sendo criado pelo `bootstrap-admin` no backend. Os
comandos estão no README do backend:

- [Primeiro usuário](https://github.com/CauaStos/PI-Backend#primeiro-usuário)
- [Dados de demonstração](https://github.com/CauaStos/PI-Backend#dados-de-demonstração)

Com a API rodando, o Swagger fica em `http://localhost:3000/api-docs/`.

## Deploy (mesma origem + Tailscale Serve)

Em produção o front é estático e fica atrás do nginx do PI-Backend, que serve o
`dist/` e faz proxy de `/api` e `/socket.io` para a API na mesma origem (porta
`3001`). O HTTPS do tailnet é terminado pelo Tailscale Serve.

```bash
npm ci
npm run build          # usa /api/v1 por padrão; não precisa de VITE_API_URL
```

Depois o backend sobe o Compose (`mongo` + `api` + `web`) e o Tailscale Serve
aponta para `127.0.0.1:3001`. Passo a passo em
[PI-Backend#deploy](https://github.com/CauaStos/PI-Backend#deploy-privado-na-tailnet-tailscale-serve).

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
npm test
```
