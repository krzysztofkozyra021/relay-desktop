# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Relay Desktop is an Electron app for installers and service technicians to register hardware devices and generate QR codes. Scanning a QR code takes users to a fault-reporting form on the Relay web/mobile platform. The app stores device records locally in SQLite.

## Commands

```bash
make install      # install dependencies (runs pnpm install + electron-builder install-app-deps)
make dev          # start dev server with hot-reload
make build        # production build
make lint         # check with Biome
make fix          # auto-fix Biome issues
make typecheck    # TypeScript check (no emit)
make clean        # remove build artifacts
```

Underlying pnpm scripts are also available directly (`pnpm dev`, `pnpm lint`, etc.).

## Environment

Copy `.env.example` to `.env` and set:

```
VITE_RELAY_BASE_URL=https://relay.app/r
```

`VITE_RELAY_BASE_URL` is the base URL embedded in QR codes — each QR encodes `${VITE_RELAY_BASE_URL}/<device-uuid>`.

## Architecture

This is a standard **electron-vite** three-process app:

| Process | Entry | Role |
|---|---|---|
| Main | `src/main/index.ts` | Node.js, IPC handlers, SQLite, file dialogs |
| Preload | `src/preload/index.ts` | Context bridge — exposes `window.dbAPI` and `window.qrAPI` to renderer |
| Renderer | `src/renderer/index.tsx` | React 19 + React Router + Tailwind CSS |

### IPC channels

All renderer→main communication goes through the context bridge:

- `window.dbAPI.getDevices()` → `db:get-devices`
- `window.dbAPI.addDevice(...)` → `db:add-device`
- `window.qrAPI.savePng(dataUrl, filename)` → `qr:save-png` (opens native Save dialog)

New IPC channels must be registered in both `src/main/index.ts` (handler) and `src/preload/index.ts` (bridge + type declaration on `Window`).

### Database

`src/main/database.ts` opens a `better-sqlite3` database at `app.getPath('userData')/relay-offline.db` with WAL mode. Schema is a single `devices` table; migrations are handled with `CREATE TABLE IF NOT EXISTS`.

### Shared code

`src/shared/` is imported by both main and renderer:
- `types.ts` — `Device` interface and Electron window/IPC types
- `constants.ts` — `ENVIRONMENT` and `PLATFORM` flags
- `utils.ts` — shared utilities (e.g. `waitFor`)

### Path aliases

`tsconfig.json` maps `*` → `src/*` and `~/*` → `./`, so imports like `import { Device } from 'shared/types'` resolve to `src/shared/types.ts`.

### QR generation

`src/renderer/components/ui/QRPreview.tsx` renders QR codes client-side using the `qrcode` library. `QRPreview` renders an inline SVG; `exportDeviceQrAsPng` generates a 1024px PNG data URL and delegates saving to `window.qrAPI.savePng`.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite`. No `tailwind.config.js` — configuration is done through the vite plugin. The `no-print` and `print-area` CSS classes in `globals.css` control what appears when printing device labels.

## Linter

Biome is the sole linter/formatter. Single quotes, 2-space indent, no semicolons (except where required), trailing commas in ES5 positions. Run `make fix` to auto-correct. The `src/lib/electron-app/extensions/` directory is excluded from linting.
