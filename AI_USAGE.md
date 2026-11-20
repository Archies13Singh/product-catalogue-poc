# AI usage

## Tools and models

- **Claude Code**, running in the VS Code extension, for the whole task.
- **Models:** Claude Opus 5.5 for the walkthrough of the brief, then Claude Fable 5.2 for
  planning and building.

The AI wrote the code, the tests and the first drafts of these documents. I directed it,
decided what to build and what to leave out, and reviewed the result.

## Agent instruction file

[CLAUDE.md](CLAUDE.md) was written before any application code. It tells the agent to:

- build only what the plan describes, one step at a time, and stop for review after each step;
- keep the boundaries: only one file may know the Fake Store API, only one file may import
  nodemailer, only `frontend/src/api/` may call `fetch`, and colours come from tokens;
- validate all outside input, read settings in one file, and use one error shape;
- write a test with every change in behaviour, use fakes, and report failures as they are.

## Plan

[docs/PLAN.md](docs/PLAN.md) is the plan I approved before the build started. It was
written after checking the live Fake Store API. Its last section records where the build
departed from it.

## How I worked

1. **Understand first.** I had the AI explain the brief section by section, and asked
   questions, before any planning.
2. **Plan, then approve.** I asked for a plan that covered every requirement without
   over-engineering. It listed what would be left out as well as what would be built.
3. **Build in six steps**, each ending with tests, a check against the running app, and a
   stop for my review. Each step is one commit.
4. **Cross-check against the requirements** after each step, before moving on.

## Key moments that shaped the solution

Prompts are quoted with the spelling tidied.

### 1. Understanding the brief before writing code

My first prompt asked for an explanation, not a build:

> "Before developing anything I really want to understand everything ... explain me one
> by one, first I want to understand the Scenario clearly."

The walkthrough surfaced the gaps in the acceptance criteria early: who chooses the
featured products, what "top rated" means on a category page, which text search matches,
and how to send email with no paid service. Those became the assumptions in
[DECISIONS.md](DECISIONS.md).

### 2. Asking for a plan that is complete but not over-engineered

> "Plan things in such a way that we cover all the requirements with best and not
> over-engineered coding practices and solutions."

This led to two small interfaces with one adapter each, passed into `createApp`, and an
explicit list of things not used: no database, no state library, no data-fetching
library, no UI kit. Before planning, the AI checked the live Fake Store API and found two
things the design had to handle: an unknown product returns `200` with an empty body, and
category names contain spaces and apostrophes.

### 3. Asking for a requirements cross-check after each step

After the backend steps and again after the frontend, I asked whether every requirement
was really met. For example:

> "I want you to check again if frontend is working fine and all good based on requirement?"

These checks were not a formality. They found a rate-limit gap and a browser console
error; both are described in the next section.

### 4. Turning down a feature of my own

I suggested keeping a customer's last three searches so they could click one instead of
retyping, and asked whether it was a fair assumption. We discussed it and I agreed it was
a new feature, not an assumption: the search criterion is complete without it. I left it
out and listed it in DECISIONS.md as something to confirm with the owner.

### 5. Verifying a claim myself

During the first live test, the AI reported that the network was blocking the Fake Store
API. I did not take that on trust. I opened the API in my own browser, then ran our
backend and compared the two responses for the same product. That confirmed the block
had been temporary, and showed me the translation from the Fake Store shape to our own.

## Where the AI got something wrong, and how it was caught

| What went wrong | How it was caught | What changed |
|---|---|---|
| It used a TypeScript setting that TypeScript 7 has removed. | The type-check failed. CLAUDE.md requires checks to pass before a step is finished. | The setting was corrected. |
| It chose the default featured products before looking at their ratings. One was rated 2.2 and would have appeared under "Top rated products". | The first live test failed on the network, so I asked for it to be run again. The real data showed the low ratings, and the AI flagged them. | I approved a new default list, all rated 4.6 or higher. |
| The site had no icon, so every page logged a 404 error in the browser console. The screenshots looked fine. | I asked for the frontend to be checked again against the requirements. That check drove a real browser and read the console. | An empty icon was declared in `index.html`. |
| The enquiry form kept showing "Enter a valid email address" after the address had been corrected. All the automated tests passed with this bug in place. | It was visible in a screenshot from the real-browser run of the enquiry journey. | A one-line fix, plus a test that fails without the fix. |
| The enquiry rate limit would have treated all visitors as one once the backend sat behind a proxy, because every request would arrive from the proxy's address. | I asked whether all the requirements for that step were complete. The AI's review listed this as a gap. | A `TRUST_PROXY_HOPS` setting and a test with two visitors. |
| The backend's dev command did not read the `.env` file, though the instructions implied it did. | Found while the README was being written against the real commands. | The dev command now reads `.env` if it exists. |
| Submitting an empty search left the previous results on screen under the old heading, with only a hint to enter a term. The AI had built and tested this as the intended behaviour. | I found it myself while using the site: I searched, cleared the box and pressed Enter. | An empty search now lists all products. The test for the old behaviour was replaced. |

The AI also departed from the plan once on purpose: single products are read from the
cached product list, not from the Fake Store single-product endpoint. It flagged the
change and recorded it in the plan. I kept it, and the reasoning is in DECISIONS.md.

## What I took from this

- **Passing tests were not enough.** Three of the problems above were only visible in a
  real browser. I would add automated end-to-end tests next.
- **Asking "is every requirement met?" after each step paid off.** The AI's first
  "done" was not always complete, and a direct question brought out the gaps.
- **A written instruction file kept the structure consistent** across six steps. The
  boundaries in CLAUDE.md are the ones I would explain first to a new team member.

## A mistake of my own

Partway through, I merged pull requests into `main` on GitHub, and after resetting it I
did so a second time. That would have left the final pull request showing only part of
the work. I reset `main` to the initial commit so that one open pull request shows the
whole solution. Pull requests #1 to #6 remain in the closed list as a result.
