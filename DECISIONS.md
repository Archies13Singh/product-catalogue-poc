# Decisions and assumptions

## Assumptions

Where the acceptance criteria were unclear, I made these assumptions.

### Home page

| Gap | Assumption |
|---|---|
| "I have chosen 5 products": who chooses, and how? | The owner chooses. The five product IDs are a backend setting, `FEATURED_PRODUCT_IDS`, shown in the configured order. The list is hand-picked, not calculated from ratings, because the criterion says "chosen". |
| A configured ID does not exist | It is skipped and a warning is logged. One wrong ID should not break the home page. |
| "Top rated" and "featured" are both used | They mean the same thing on the home page. |

### Category page

| Gap | Assumption |
|---|---|
| What makes a product "top rated" within a category? | The 3 products with the highest rating score, ties broken by the number of ratings. This differs from the home page on purpose: the home page list is chosen, the category list is calculated. |
| How many? | 3, set by `CATEGORY_TOP_RATED_COUNT`. The smallest category has 4 products, so at least one is left for the second section. |
| "Additional products" | Every other product in the category. No product appears in both sections. |
| Where are the category links? | In the header of every page. |

### Search

| Gap | Assumption |
|---|---|
| Which text is matched? | Title, description and category name. |
| How is it matched? | Case-insensitive, and part of a word matches: "jack" finds "jacket". |
| "WHEN I click the search button" | Search runs on submit, by button or Enter key. There is no search-as-you-type. |
| An empty search term | Clearing the box and submitting shows all products. An empty term excludes nothing, and a customer who clears a search expects the full list back. |
| No matches | A "No products found" message. |
| Where does the search run? | On the backend. Filtering 20 products in the browser would work, but a real data source will search for itself, and this way the frontend does not change when it does. |

### Product page

| Gap | Assumption |
|---|---|
| Which details? | Everything we have: image, title, category, rating, price, description. |
| Currency | One currency and locale for the site, set in one frontend file. Australian dollars is a placeholder. |
| Unknown product | A "Not found" page; the backend answers 404. |

### Enquiry

| Gap | Assumption |
|---|---|
| Which contact details? | Name and email are required. Phone and message are optional. |
| Where does the form appear? | On the product page, opened by the Enquire button. |
| What does the email contain? | The product title and ID, and the customer's details. Reply-To is the customer's address, so sales can reply directly. |
| When is "Thank you" shown? | Only after the mail server has accepted the email. If sending fails, the customer sees an error and the form keeps what they typed. |
| Does the customer get a copy? | No. The criterion only mentions the sales inbox. |
| How is email sent with no paid service? | Over SMTP to Mailpit, a local mail catcher with a web inbox. |

## Dropped or simplified

| What | Why |
|---|---|
| Admin screen for choosing featured products | Not in the criteria. A setting honours "I have chosen" at a fraction of the cost. |
| Storing enquiries in a database | The email is the record for now. A failed send is reported to the customer, not silently lost. |
| Confirmation email to the customer | Not asked for. |
| Login, cart, checkout, payment | The product is a catalogue with enquiries, not a shop. |
| Pagination and sorting | There are 20 products. |
| Polished visual design | The creative work is still in progress. The styling is plain and built on design tokens so it can be replaced. |
| Recent-searches list | I considered showing a customer's last few searches. It is a feature the criteria do not ask for, so I left it out and would confirm it with the owner first. |
| Deployed AWS infrastructure | The brief makes it optional. The solution runs as standard containers; see "Running on AWS" below. |
| Browser end-to-end tests in the repo | The critical path is covered by API tests and by frontend tests that drive the real pages. During the build I also ran the full journey in a real browser against the Docker setup, but those scripts are not committed. |
| Linting and formatting tools | Not set up. TypeScript strict mode is on for both apps. |

## Known limits

- **Product images load from the data source's own address.** All product data comes
  through our backend, as required. The image URL inside that data points at
  fakestoreapi.com, so the browser fetches the picture from there. Proxying images
  through the backend seemed more than a proof of concept needs.
- **The backend depends on the Fake Store API being reachable.** The product list is
  cached for 60 seconds. If the API is down and the cache has expired, pages show an
  error with a retry button. During the build, one network blocked the API for a while,
  which is how I know this path works.
- **The cache and the rate limit live in memory.** Both reset on restart and are not
  shared between several backend instances.
- **The SMTP adapter has no automated test.** It is a thin wrapper, verified by sending
  real email to Mailpit. The tests use a fake mailer.
- **The frontend's product types are a hand-written copy of the backend's.** Fine at this
  size; they could drift apart as the API grows.
- **Single products are read from the cached list**, not from the Fake Store
  single-product endpoint. That endpoint answers "200 with an empty body" for an unknown
  ID, and the cached list avoids a network call per product page. The `ProductSource`
  interface still has `getProduct`, so a database-backed source can look up by key.

## How the design supports growth

The brief names three things that will change. Each has one place to change.

### The product data source

`ProductSource` is an interface with two methods: `listProducts()` and `getProduct(id)`.
`FakeStoreSource` is the only file that knows the Fake Store API or its data shape, and it
converts that shape into our own `Product` model. Everything else, including the
frontend, depends only on our model.

To move to a database or another API: write a new class that implements `ProductSource`,
and change one line in `server.ts`. Routes, services, tests and the frontend stay as they
are. Product IDs are strings in our model so a new source can use any kind of ID.

### The email provider

`Mailer` is an interface with one method: `send(message)`. `SmtpMailer` is the only file
that imports nodemailer.

- A provider with an SMTP endpoint, such as Amazon SES, needs only new values for
  `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASSWORD`. No code changes.
- A provider with its own API needs a new class that implements `Mailer`, and one line in
  `server.ts`.

A failed send is turned into an error response in the enquiry service, not in the
adapter, so every future adapter gets the same behaviour.

### The look and feel

Every colour, font size, space and radius is a CSS variable in
`frontend/src/styles/tokens.css`. Components contain no hard-coded colours. A new brand
starts by editing that one file. Components are separate from data loading, so they can
be restyled or replaced without touching the API code.

### Other things that help

- **Dependencies are passed in.** `createApp({ config, productSource, mailer })` receives
  everything it needs. Tests pass in fakes, so the tests do not change when an adapter does.
- **Settings are read and validated in one file.** A wrong setting stops the backend at
  startup with a message that names it.
- **One error shape.** Every error response looks the same, so the frontend handles them
  in one place.
- **The frontend calls the backend through one module.** Changing the API means changing
  `frontend/src/api/`.

### Running on AWS

Nothing in the solution is tied to a cloud provider. The path I would take:

- The backend container on ECS Fargate or App Runner, behind a load balancer that uses
  the `/health` endpoint.
- The frontend's static files on S3 with CloudFront, with `/api` routed to the backend.
  The nginx container also runs on ECS as it is.
- Email through Amazon SES over SMTP, with the credentials in Secrets Manager.
- The rate limit moved to a shared store such as ElastiCache once there is more than one
  backend instance.

## What I would do next with another day

1. **Automated end-to-end tests** for the main journey, run against the Compose setup,
   plus a CI pipeline that runs type checks and tests on every push.
2. **Keep serving the last good product list** when the data source is down, so a short
   outage does not take the catalogue offline.
3. **Store enquiries** before sending, so a mail failure can be retried and no lead is lost.
4. **An admin screen** for choosing featured products, replacing the setting.
5. **Share or generate the API types** so the frontend and backend cannot drift apart.
6. **Linting and formatting** with ESLint and Prettier.
7. **Request logging** with request IDs, and a shared store for the rate limit.
8. **Spam protection** on the enquiry form beyond the rate limit.
9. **An accessibility pass** with a screen reader. The markup uses labels, headings and
   alt text, but I have not tested it with assistive technology.
