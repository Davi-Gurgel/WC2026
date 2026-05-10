<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16, React 19, TypeScript app for a World Cup 2026 simulator. Route segments and page UI live in `app/`, shared UI in `components/`, and reusable primitives in `components/ui/`. Tournament rules, data access, utilities, and shared types live in `lib/`; JSON source data is in `data/`. Static assets belong in `public/`. Tests are colocated as `*.test.ts` or `*.test.tsx`.

## Build, Test, and Development Commands

- `corepack enable pnpm`: enable the pinned pnpm version from `package.json`.
- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the local Next.js development server at `http://localhost:3000`.
- `pnpm build`: create a production Next.js build.
- `pnpm lint`: run ESLint with Next core web vitals rules.
- `pnpm typecheck`: run strict TypeScript checks without emitting files.
- `pnpm test`: run the Vitest suite once.

Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before opening a PR.

## Coding Style & Naming Conventions

Use TypeScript for all app logic. Prefer named exports, PascalCase for React components, camelCase for functions and variables, and uppercase enum-like strings where tournament phases use them. Use the `@/*` path alias, as in `@/lib/tournament`. Keep components small and compose shared presentation elements from `components/ui/`. Styling uses Tailwind CSS classes; keep class lists readable and consistent with nearby components. Prettier with the Tailwind plugin is available; ESLint is the enforced lint gate.

## Testing Guidelines

Vitest is the test runner. Pure tournament logic uses the default `node` environment; React component tests can opt into jsdom with `// @vitest-environment jsdom`. Use Testing Library for component behavior. Add or update colocated tests when changing tournament rules, persistence, routing assumptions, or shared UI behavior.

## Commit & Pull Request Guidelines

Recent history uses short conventional-style commits such as `fix: harden tournament hydration` and `chore: tighten local config hygiene`. Follow that pattern: `fix:`, `feat:`, `chore:`, `test:`, or `docs:` plus an imperative summary. Pull requests should include a description, linked issue when applicable, screenshots for UI changes, and verification commands.

## Security & Configuration Tips

Do not commit local environment files, generated `.next/` output, or `node_modules/`. Validate imported JSON data with existing typed helpers and schemas rather than bypassing `lib/` APIs.
