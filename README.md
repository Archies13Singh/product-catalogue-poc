# Product Catalogue

A product catalogue proof of concept. A customer can browse featured products and
categories, search, open a product, and send an enquiry that is emailed to the sales inbox.

It is built as a foundation, not a throwaway: the product data source, the look and feel,
and the email provider can each be replaced without touching the rest. See
[DECISIONS.md](DECISIONS.md) for the assumptions and trade-offs, and
[AI_USAGE.md](AI_USAGE.md) for how AI tools were used.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Client | React web app, TypeScript, Vite | A web app is the quickest for a reviewer to run, with no simulator needed. TypeScript is the brief's stated preference. |
| Backend | Node.js, TypeScript, Express | One language on both sides, so the product shape reads the same in the frontend and the backend. Express is small and widely known. |
| Email (local) | Mailpit | A local mail catcher with a web inbox. No account, no cost, and no email leaves your machine. |

## Run it

You need Docker with Compose. Nothing else: no accounts, no keys, no `.env` file.

```bash
docker compose up --build
```

If your Docker uses the older standalone command, run `docker-compose up --build`.

The first run takes about two minutes. Then open:

| What | Address |
|---|---|
| The site | http://localhost:8080 |
| The sales inbox (Mailpit) | http://localhost:8025 |

Stop it with `Ctrl+C`.

The backend fetches products from https://fakestoreapi.com, so it needs internet access.

### Try the main journey

1. Open http://localhost:8080. The home page shows the five featured products.
2. Click a category in the header to see its top rated products and the rest.
3. Type `jacket` in the search box and click **Search**.
4. Click a product tile to open its details page.
5. Click **Enquire**, fill in the form and send it. You will see a thank-you message.
6. Open http://localhost:8025 to see the email that reached the sales inbox.

## Run the tests

You need Node.js 22 or later. The tests use in-memory fakes, so they need no network, no
backend and no mail server.

```bash
cd backend && npm ci && npm test       # 52 tests
cd frontend && npm ci && npm test      # 17 tests
```

`npm run typecheck` in either folder runs the TypeScript checks.

## Configuration

Every setting has a working default, so configuration is optional. To change one, copy
[.env.example](.env.example) to `.env` and edit it. Compose and the backend's dev command
both read that file. Never commit `.env`.

| Setting | Default | Purpose |
|---|---|---|
| `FEATURED_PRODUCT_IDS` | `3,5,11,12,18` | The products featured on the home page, in display order |
| `CATEGORY_TOP_RATED_COUNT` | `3` | How many products appear under "Top rated" on a category page |
| `SALES_INBOX_EMAIL` | `sales@example.com` | The inbox that receives enquiries |
| `MAIL_FROM` | `no-reply@example.com` | The address enquiries are sent from |
| `SMTP_HOST`, `SMTP_PORT` | `localhost`, `1025` | The mail server. Compose points these at Mailpit |
| `SMTP_USER`, `SMTP_PASSWORD` | empty | Only needed for a real mail provider |
| `FAKE_STORE_BASE_URL` | `https://fakestoreapi.com` | The product data source |
| `PRODUCT_CACHE_TTL_SECONDS` | `60` | How long the product list is cached in memory |
| `ENQUIRY_RATE_LIMIT_MAX` | `5` | Enquiries allowed per visitor in each 15 minutes |
| `TRUST_PROXY_HOPS` | `0` | Reverse proxies in front of the backend. Compose sets this to 1 |
| `PORT` | `3000` | The backend's port |

## Develop without Docker

Run Mailpit alone, then each app with live reload:

```bash
docker compose up mailpit                 # the mail catcher only
cd backend && npm ci && npm run dev       # http://localhost:3000
cd frontend && npm ci && npm run dev      # http://localhost:5173
```

The frontend dev server forwards `/api` to the backend on port 3000.

## How it is organised

```
backend/src
  config.ts              all settings, validated at startup
  app.ts                 createApp(deps): builds the app from its dependencies
  server.ts              the one place where real adapters are chosen
  products/
    product.ts           our own Product model
    productSource.ts     interface: where products come from
    fakeStoreSource.ts   adapter: the only file that knows the Fake Store API
    productService.ts    featured, categories, category split, search
    productRoutes.ts
  enquiries/
    mailer.ts            interface: how email is sent
    smtpMailer.ts        adapter: the only file that knows nodemailer
    enquiryService.ts    validates, looks up the product, builds the email
    enquiryRoutes.ts
  http/errors.ts         error types, one error handler, one error shape
frontend/src
  api/                   the only code that calls fetch, and only our backend
  pages/                 Home, Category, Search, Product, Not found
  components/            Layout, SearchBar, ProductGrid, ProductTile, EnquiryForm
  hooks/useAsync.ts      loading, error and retry state for a request
  styles/tokens.css      every colour, font size and space, as CSS variables
```

The browser only ever calls our backend under `/api`. The backend is the only thing that
talks to the Fake Store API and to the mail server.

```
Browser ──► nginx ──► /api ──► Backend ──► ProductSource ──► Fake Store API
              │                    └─────► Mailer ─────────► Mailpit (SMTP)
              └──► static site
```

## API

| Endpoint | Returns |
|---|---|
| `GET /api/products/featured` | The featured products |
| `GET /api/categories` | `[{ slug, name }]` |
| `GET /api/categories/:slug` | `{ category, topRated, others }` |
| `GET /api/products?search=term` | Products matching the term |
| `GET /api/products` | All products |
| `GET /api/products/:id` | One product |
| `POST /api/enquiries` | `201` once the email has been accepted |
| `GET /health` | `{ status: "ok" }` |

Errors always have the shape `{ "error": { "code", "message" } }`, with status 400, 404,
413, 429, 502 or 500.

## Time spent

About 7 hours, which is over the suggested 2 to 3 hours.

| Activity | Time |
|---|---|
| Planning | 1.5 hours |
| Building | 3 hours |
| Testing | 0.5 hours |
| Reviewing | 2 hours |

Planning ran long because I went back over the brief several times to make sure no
requirement was missed. Reviewing took two hours because I wanted to understand every
file and check the coding standards before submitting, since I own every line.
