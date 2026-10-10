---
name: project-setup
description: Use when configuring or fixing tsconfig, vite.config, path aliases, env variables, Tailwind setup, or project scaffolding.
---

# Setup Invariants
- `@/*` alias in BOTH `tsconfig.app.json` (`paths`) and `vite.config.ts` (`resolve.alias`).
- `tsconfig.app.json`: `"strict": true`, `"resolveJsonModule": true`.
- `@types/node` as a devDependency (for `path.resolve` in `vite.config.ts`).
- Tailwind v4 via `@tailwindcss/vite`; CSS entry is just `@import "tailwindcss";` (no static `@theme` tokens).
- Env: all client vars `VITE_`-prefixed, validated once in `src/config/env.ts` with zod (template in `api-client`). Must include `VITE_API_URL` and `VITE_USE_MOCKS`.
- Read env only via `env.ts`. Never `import.meta.env` inline elsewhere.
- `.ts`/`.tsx` only, mocks included. Use `vite.config.ts` and `eslint.config.ts`. If a tool truly requires a `.js` config, flag it instead of adding one. (`eslint.config.ts` needs the `jiti` devDependency; ask before installing.)
- Ask before installing any package.

## Template: vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

## Template: tsconfig.app.json (relevant keys)

```json
{
  "compilerOptions": {
    "strict": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## Template: env files

```bash
# .env.example (committed)
VITE_API_URL=http://localhost:4000/api
VITE_USE_MOCKS=true
```
`.env`, `.env.local` and `.env.*.local` are gitignored. Only `.env.example` is committed.

## Template: env type hints

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCKS: string;
}
```

## Provider order (src/main.tsx)
`QueryClientProvider` → `RouterProvider`. i18n initialized by importing `@/i18n` first. `applyTheme` called once before render using the persisted theme.
