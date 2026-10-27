# RequestLab

A lightweight Postman alternative that runs locally. Build HTTP requests, organize them into collections, switch between environments and inspect responses.

## Features

- Send `GET`, `POST`, `PUT` and `DELETE` requests with query params, headers and a JSON or text body
- Save requests into collections, which persist in your browser's localStorage
- Environments with `{{variable}}` substitution in the URL, params, headers and body. Missing variables are flagged
- Response viewer with status, time, size, pretty or raw body, headers and timing history
- Light and dark themes, and `Ctrl/Cmd + Enter` to send

## How it works

Browsers block most cross-origin requests (CORS), so the app talks to a small local [Hono](https://hono.dev) proxy (`server/`, port 3001, localhost only). The proxy makes the real HTTP call. In development, Vite forwards `/api` to the proxy.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand, CodeMirror, Hono, Vitest

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the proxy (:3001) and the web app (:5173) |
| `npm test`      | Run unit tests (Vitest)                   |
| `npm run build` | Type-check and build for production       |
| `npm run lint`  | Run ESLint                                |

## Project structure

```
server/           Hono proxy (POST /api/send)
src/shared/       Types shared by server and web
src/core/         Framework-agnostic logic (unit-tested)
src/store/        Zustand store connecting core to the UI
src/components/   React UI (shadcn components in components/ui)
```
