# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **`artifacts/gkm-medical`** — Patient-facing Expo (React Native) mobile app. Runs on port 20803.
- **`artifacts/doctor-admin-app`** — Doctor admin Expo (React Native) mobile app (converted from Vite web app). Runs on port 3002.
- **`artifacts/api-server`** — Express 5 backend API. Runs on port 8080.
- **`artifacts/mockup-sandbox`** — UI component mockup sandbox.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Doctor Admin App (mobile)

Converted from Vite + React + Tailwind web app to Expo React Native mobile app.

- **Framework**: Expo Router + React Native
- **Auth**: Supabase (via `doctor_admins` table), session persisted with AsyncStorage
- **QR Scanner**: expo-camera `CameraView` with `onBarcodeScanned`
- **Language**: Arabic (RTL forced via `I18nManager.forceRTL`)
- **Screens**: Login (`app/index.tsx`), Dashboard (`app/dashboard.tsx`) with Today / Scanner / History tabs

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
