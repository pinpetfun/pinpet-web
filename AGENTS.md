# Repository Guidelines

## Project Structure & Module Organization
App code sits in `src/`: `components/` for UI shells, `contexts/` for providers, `hooks/` for shared state, `services/` for Solana and API calls, and `utils/` for formatting helpers. `src/assets/` holds images and motion data, while `index.css` and `App.css` bootstrap Tailwind. Keep static files in `public/`, ignore compiled output in `dist/`, and treat `example/` plus `notes/` as reference material only.

## Build, Test, and Development Commands
Run `npm install` once per machine. Use `npm run dev` for the local server, `npm run build` for production bundles, `npm run preview` to smoke-test the build, and `npm run lint` (append `-- --fix` to auto-correct) to enforce style. Execute all commands from the repository root so Vite resolves aliases correctly.

## Coding Style & Naming Conventions
ESLint rules are defined in `eslint.config.js` with React, Hooks, and Vite refresh presets. Stick to 2-space indentation, semicolons, and single quotes. Name components with `PascalCase`, hooks with a `use` prefix, providers as `*Provider`, and keep files aligned with their default export. Compose Tailwind classes by grouping layout, color, and motion utilities to keep JSX readable, and centralize shared configuration in `src/config.ts`.

## Testing Guidelines
Automated testing is not wired yet. When introducing tests, colocate Vitest suites beside components using `.test.tsx` filenames or under `src/__tests__/`, mock Solana RPC and WebSocket clients, and capture wallet flows with deterministic fixtures. Until then, treat `npm run lint` and manual wallet/WebSocket checks as required before opening a pull request, and document what you exercised.

## Commit & Pull Request Guidelines
Use focused commits with imperative subjects (`Add coin depth chart`), summarizing the why in the body if context is non-obvious. Pull requests should include: a short narrative, screenshots or GIFs for UI changes, notes on new env vars, and a checklist of manual verifications. Tag domain reviewers (SDK, wallet, trading UI) and flag follow-up tasks so they do not get lost.

## Environment & Security Tips
Runtime settings flow through `VITE_*` variables—create a `.env.local` based on any templates in `example/`. The app throws if `VITE_SERVER_URL`, `VITE_GATEWAY_URL`, or `VITE_SPINPET_API_URL` are missing, so verify them before `npm run dev`. Never commit secrets; reference them through `config.ts` helpers so they can rotate safely.
