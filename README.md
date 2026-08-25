# PI Frontend

Interface web do Projeto Interdisciplinar, feita com React e Vite.

## Requisitos

- Node.js 22 ou superior
- Backend em execucao

## Rodando localmente

```bash
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`. Antes de iniciar, confira se `VITE_API_URL` no
`.env` aponta para a API correta.

## Scripts

```bash
npm run dev        # inicia o Vite com recarregamento automatico
npm run build      # gera a versao de producao
npm start          # visualiza o build de producao
npm run lint       # verifica o codigo
npm run typecheck  # verifica os tipos TypeScript
```

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
