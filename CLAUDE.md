# Agent instructions

This repo is a product catalogue proof of concept that must be able to grow. The product
data source, the look and feel, and the email provider are all expected to change. Read
`docs/PLAN.md` before making changes.

## Scope

- Build only what `docs/PLAN.md` describes. Do not add features, libraries or abstractions
  that are not in the plan. If something seems missing, say so and wait for a decision.
- No database, state management library, UI component library or ORM.
- Work one plan step at a time and stop for review after each step.

## Boundaries (do not break these)

- The frontend calls only our backend under `/api`. It never calls the Fake Store API.
- `backend/src/products/fakeStoreSource.ts` is the only file that knows about the Fake
  Store API or its data shape. Everything else uses the `ProductSource` interface and our
  own `Product` type.
- `backend/src/enquiries/smtpMailer.ts` is the only file that imports nodemailer.
  Everything else uses the `Mailer` interface.
- Dependencies are passed into `createApp(deps)` in `backend/src/app.ts`. Real adapters
  are wired only in `backend/src/server.ts`.
- In the frontend, only `frontend/src/api/` calls `fetch`. Components and pages use those
  functions.
- Colours, spacing and fonts come from CSS variables in `frontend/src/styles/tokens.css`.
  Do not hard-code them in components.

## Code conventions

- TypeScript in strict mode. No `any`; use `unknown` and narrow it.
- Validate all external input with zod: environment variables, request bodies, route and
  query parameters, and responses from the Fake Store API.
- All configuration is read in `backend/src/config.ts`. No `process.env` anywhere else.
- Routes stay thin: parse input, call a service, send the response. Logic lives in services.
- Errors are thrown as typed errors and turned into responses by the single error handler
  in `backend/src/http/errors.ts`. The response shape is always
  `{ "error": { "code": string, "message": string } }`.
- Never commit secrets. New settings go in `.env.example` with a safe placeholder value.
- Comments explain why, not what.

## Testing

- Every change to behaviour comes with a test.
- Tests use hand-written fakes of `ProductSource` and `Mailer` passed to `createApp`.
  Tests never call the real Fake Store API or a real mail server.
- Run the tests before saying a step is finished, and report failures as they are.

## Commands

```
cd backend  && npm test && npm run typecheck
cd frontend && npm test && npm run typecheck
docker compose up --build
```
