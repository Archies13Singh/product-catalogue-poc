# Plan

This plan was agreed before any code was written. It was produced with Claude Code after
walking through the challenge brief section by section and checking the live Fake Store
API. `DECISIONS.md` records the assumptions and cuts in full; this file is the build plan.

## Goal

A product catalogue where a customer can browse, search, view a product and send an
enquiry that reaches the sales inbox. The product data source, the look and feel, and the
email provider must each be replaceable without a rewrite.

## Findings from the live Fake Store API

- 20 products in 4 categories: electronics (6), jewelery (4), men's clothing (4),
  women's clothing (6).
- Each product has an id, title, price, description, category, image and a rating
  (`rate`, `count`).
- There is no search endpoint and no concept of featured products.
- A request for a product that does not exist returns `200` with an empty body, not a
  `404`. The backend must turn this into a 404.
- Category names contain spaces and apostrophes, so URLs need slugs such as
  `mens-clothing`.

## Stack

| Part | Choice | Reason |
|---|---|---|
| Backend | Node.js, Express, TypeScript | Widely known and small |
| Validation | zod | One tool for env config, requests and upstream responses |
| Email | nodemailer over SMTP, to Mailpit locally | Free, no account, emails visible in a browser |
| Frontend | React, TypeScript, Vite, React Router | Standard and quick to set up |
| Styling | Plain CSS with tokens as CSS variables | A new design means editing tokens, not components |
| Tests | Vitest, supertest, React Testing Library | One test runner on both sides |
| Run | Docker Compose: frontend, backend, Mailpit | One command for the reviewer |

Not used, on purpose: a database, Redux, React Query, a UI component library, an ORM, a
dependency-injection framework.

## Structure

```
backend/src
  config.ts              env parsed and validated at startup
  app.ts                 createApp(deps) builds Express from its dependencies
  server.ts              wires the real adapters and starts listening
  products/
    product.ts           our own Product type
    productSource.ts     interface: listProducts(), getProduct(id)
    fakeStoreSource.ts   adapter, the only file that knows Fake Store
    productService.ts    featured, category split, search
    productRoutes.ts
  enquiries/
    mailer.ts            interface: send(message)
    smtpMailer.ts        adapter, the only file that knows nodemailer
    enquiryService.ts    validates, looks up the product, builds the email
    enquiryRoutes.ts
  http/errors.ts         one error handler, one error shape
frontend/src
  api/                   the only place that calls fetch
  pages/                 Home, Category, Search, Product, NotFound
  components/            ProductTile, ProductGrid, SearchBar, EnquiryForm, Layout
  styles/tokens.css      colours, spacing, fonts
```

Two interfaces, `ProductSource` and `Mailer`, each with one adapter, are passed into
`createApp`. Tests pass in fakes.

- `ProductSource` has two methods only. Categories, featured products, top rated and
  search are worked out in `productService` from the product list, so a new adapter has
  little to implement.
- The Fake Store adapter caches the product list in memory for about 60 seconds.

## API

| Endpoint | Returns |
|---|---|
| `GET /api/products/featured` | The 5 configured products |
| `GET /api/categories` | `[{ slug, name }]` |
| `GET /api/categories/:slug` | `{ category, topRated, others }` |
| `GET /api/products?search=term` | Matching products |
| `GET /api/products/:id` | One product, or 404 |
| `POST /api/enquiries` | 201 when the email is accepted |
| `GET /health` | Health check |

Errors are `{ error: { code, message } }`: 400 invalid input, 404 not found, 502 when the
Fake Store API or the mail server fails.

## Pages

| URL | Page |
|---|---|
| `/` | Featured products |
| `/category/:slug` | "Top rated" and "More in this category" |
| `/search?q=term` | Results, or "No products found" |
| `/products/:id` | Details and the Enquire button, which opens the form on the same page |

The header has the category links and the search bar. Every page handles loading, error
and empty states. The browser calls `/api` on its own origin, proxied to the backend.

## Assumptions built into the plan

- The 5 featured products are product IDs in backend config (`FEATURED_PRODUCT_IDS`).
- "Top rated" on a category page is the 3 highest-rated products in that category, ties
  broken by review count. The rest appear as additional products, with no duplicates.
- Search is a case-insensitive substring match on title, description and category. It
  runs on the backend. An empty term is not searched.
- An enquiry needs a name and an email address; phone and message are optional.
- The email goes to the address in `SALES_INBOX_EMAIL`, with Reply-To set to the customer.
- "Thank you" is shown only when the mail server has accepted the email.

## Security and validation

- Enquiry input is validated on the server, with length limits.
- The product named in the email is looked up by the backend from its ID.
- The email is plain text.
- `helmet`, a request body size limit, and a rate limit on the enquiry endpoint.
- Config is validated at startup. No secrets in the repo.

## Tests

| Test | Proves |
|---|---|
| `productService` unit tests | Featured follows config; category split has no duplicates; search matching |
| `fakeStoreSource` test | Mapping to our Product type; an empty body becomes "not found" |
| API tests with fakes | Success and failure responses for each endpoint |
| Enquiry API tests | Valid: mailer called, 201. Invalid: 400, mailer not called. Mailer fails: 502 |
| Frontend tests | Enquiry form shows "Thank you" or an error; search shows results |

## Cuts

Admin screen for featured products, storing enquiries, confirmation email to the customer,
pagination and sorting, login, deployed AWS infrastructure, browser end-to-end tests,
polished visual design.

## Build order

| Step | Work | Estimate |
|---|---|---|
| 0 | Repo, initial commit on `main`, feature branch, `CLAUDE.md`, this plan | 10 min |
| 1 | Backend: config, product source and adapter, service, routes, tests | 45 min |
| 2 | Backend: enquiry, mailer, tests | 25 min |
| 3 | Frontend: layout, pages, API client, tokens | 45 min |
| 4 | Frontend: enquiry form, tests | 20 min |
| 5 | Docker Compose with Mailpit, then a run from a fresh clone | 15 min |
| 6 | README, DECISIONS, AI_USAGE, pull request description | 20 min |

Each step is reviewed before the next one starts.
