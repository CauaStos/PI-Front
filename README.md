# Projeto Interdisciplinar

## Desenvolvimento com Docker

Use o Compose de desenvolvimento para rodar o Vite com live reload:

```bash
docker compose -f compose.dev.yaml up app
```

Abra `http://localhost:5173`.

Esse modo monta o codigo local dentro do container, entao mudancas em `src/`,
`components/` e outros arquivos do app aparecem sem rebuild da imagem.

Para parar:

```bash
docker compose -f compose.dev.yaml down
```

## Build de producao

O `compose.yaml` principal gera uma imagem com `dist/` embutido. Depois de
alterar codigo, rode rebuild:

```bash
docker compose up -d --build app
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
