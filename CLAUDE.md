# CLAUDE.md

A novelty survival analysis of reorgs and manager changes (Kaplan-Meier, Weibull, Monte Carlo) in TypeScript. It reads [`managers.csv`](managers.csv) and renders the results into [`README.md`](README.md).

## Commands

- CI runs `npm run lint`, `npm run format:check`, `npm test` (vitest), and `npm run build` (`tsc`, the only typecheck, since vitest and tsx strip types without checking them). Run all four before committing; `npm run format` fixes formatting.

## Generated files

- `README.md` is rendered from [`src/README.md.ejs`](src/README.md.ejs) and `managers.csv` by `npm start`. Edit the template or the code, then run `npm start` and commit the regenerated README. Don't hand-edit it; CI reruns `npm start` and fails if `README.md` changes.
- The output is deterministic: `END_DATE` in [`src/context.ts`](src/context.ts) freezes "today" and the Monte Carlo RNG is seeded, so an unrelated diff in the README means something changed in the code.

## Gotchas

- `managers.csv` is entirely synthetic: invented handles (computing pioneers like `@ada` and `@grace`), invented dates, and generic notes, and `END_DATE` is an arbitrary freeze date. This repo is public, so never add real people, real dates, or real org events to the data, tests, or template.
