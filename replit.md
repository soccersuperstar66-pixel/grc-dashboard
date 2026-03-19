# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Regulatory Tracking Dashboard for GRC (Governance, Risk & Compliance) teams.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/grc-dashboard)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod resolver

## Features

### Regulatory Tracker (/)
- Law registry table with: Law Name, Jurisdiction (federal/state/international), Status (proposed/enacted/effective), Summary, Relevant Policies (tags), Next Action, Deadlines
- Visual dashboard: bar chart by jurisdiction, status distribution chart, upcoming deadlines panel
- Filters: jurisdiction, status, text search
- Full CRUD: add, edit, delete regulations via modal dialog

### Gap Analysis Tool (/gap-analysis)
- 4 built-in frameworks: NIST CSF 2.0, ISO 27001:2022, SOC 2 Type II, HIPAA Security Rule
- Policy management: add/edit/delete organization policies with control coverage
- Run gap analysis: coverage percentage, covered controls vs gaps breakdown

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── grc-dashboard/      # React + Vite frontend (mounted at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `regulations` table — law tracking (jurisdiction enum, status enum, relevant_policies array, deadlines)
- `policies` table — organization policies (covered_controls array, status enum)

## API Routes

- `GET /api/regulations` — list with filters (jurisdiction, status, search)
- `POST /api/regulations` — create regulation
- `PUT /api/regulations/:id` — update regulation
- `DELETE /api/regulations/:id` — delete regulation
- `GET /api/regulations/stats` — dashboard statistics
- `GET /api/gap-analysis/frameworks` — list built-in compliance frameworks
- `GET /api/gap-analysis/policies` — list organization policies
- `POST /api/gap-analysis/policies` — create policy
- `PUT /api/gap-analysis/policies/:id` — update policy
- `DELETE /api/gap-analysis/policies/:id` — delete policy
- `POST /api/gap-analysis/analyze` — run gap analysis against a framework

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Development

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/grc-dashboard run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
