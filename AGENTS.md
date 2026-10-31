# UseablePay Architecture

UseablePay is a TanStack Start application deployed on Netlify. It demonstrates a mobile-money bill payment journey and persists completed demo payments in Netlify Database.

## Key directories

- `src/routes/` contains file-based pages and document metadata. The main product experience lives in `index.tsx`.
- `src/server/` contains callable server functions. Database access and payment input validation stay here.
- `db/` contains the Drizzle schema and Netlify Database client.
- `netlify/database/migrations/` contains deploy-time database migrations. Never edit an applied migration.
- `src/styles.css` contains the complete visual system and responsive behavior.
- `public/` contains static assets.

## Conventions

- Use TypeScript and single quotes, with no semicolons.
- Keep money as integer fils in storage and convert only for display. One UseableCoin equals KWD 1.000.
- Validate server-function input with Zod and `.inputValidator(...)`.
- Never persist mobile-money PINs. The current flow deliberately removes the PIN before inserting a transaction.
- Keep database imports in server code; UI modules call server functions.
- Maintain keyboard focus, accessible labels, reduced-motion support, and the mobile layouts when changing interactions.

## Non-obvious decisions

The wallet begins with a demo balance of 284.760 UC and derives its displayed balance by subtracting persisted payments. The payment UI is explicitly a demo because no mobile-money provider credentials were supplied. The read path falls back to an empty wallet history while a fresh database is provisioning, but writes require the deployed database and migration.

## Commands

- `pnpm dev` starts Vite directly.
- `netlify dev --port 8889` is preferred when testing Netlify server behavior.
- `pnpm build` creates a production build.
- `pnpm drizzle-kit generate --name <action_name>` generates a migration after schema changes.
