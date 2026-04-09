# AI documentation navigation (Timeless Electronix)

This file is the **primary table of contents and access contract** for agents working in this repository. Before substantial work, orient here, then open `docs/README.md` and the numbered folders below.

## How to use this map

1. **Identify the phase** of the task (discovery, spec, build, verify, learn).
2. **Read the mandatory folders** listed under “Strict access rules” for that kind of work.
3. **Write documentation back** into the folder that matches the artifact (do not park unrelated notes in `99-Archive` until they are truly superseded).

---

## Folder purposes (lifecycle order)

| Folder | Purpose |
|--------|---------|
| **01-Discovery** | Problem space, stakeholders, constraints, research notes, competitive scan, and discovery outcomes. Nothing here is a committed spec until reflected in `03-PRDs` or `04-Architecture`. |
| **02-Frameworks** | Technology and process choices: stack, libraries, hosting, tooling ADRs, and “why we chose X.” Not feature requirements. |
| **03-PRDs** | Product requirements: goals, user stories, acceptance criteria, scope, and release intent. Single source of truth for *what* we build. |
| **04-Architecture** | System design: services boundaries, API shape, **database schema and data flow**, integration points, security model, and deployment topology. Authoritative for *how* the system fits together. |
| **05-Design** | UX/UI: flows, wireframes, visual specs, RTL/Hebrew layout notes, component inventory, links to design files. Authoritative for *how it should look and behave* in the product UI. |
| **06-Development** | Day-to-day engineering: local setup, conventions pointers, **task lists**, **progress logs**, runbooks, and implementation notes that are not architecture-level. |
| **07-Tests** | Test strategy, suites, coverage targets, E2E scenarios, and quality gates. |
| **08-Feedback** | Qualitative input: user feedback, support themes, usability issues, and prioritization notes (link to issues/PRs where possible). |
| **09-Analytics** | Quantitative product and technical metrics: events, funnels, definitions, dashboards, and experiment readouts. |
| **99-Archive** | Superseded or historical documents only. Do not use as the working location for current specs. |

---

## Strict access rules (when you MUST read which folder)

**Always (before any non-trivial code or schema change)**  
- Read **`06-Development`** for active tasks, progress, and engineering notes (`tasks.md`, `progress.md` when present).  
- Read **`04-Architecture`** for API boundaries, **DB schema and data flow**, and integration assumptions.

**Before starting discovery or reshaping scope**  
- Read **`01-Discovery`** and **`03-PRDs`** so you do not contradict agreed product intent.

**Before proposing or changing stack/tooling**  
- Read **`02-Frameworks`** and **`04-Architecture`** so proposals align with existing decisions and deployment reality.

**Before implementing or changing a feature’s behavior**  
- Read **`03-PRDs`** (requirements) and **`04-Architecture`** (technical shape). If the UI is specified, read **`05-Design`**.

**Before writing a new backend feature (API, service, Prisma, auth)**  
- Read **`06-Development`** (team conventions and task context).  
- Read **`04-Architecture`** (**API architecture**, data model, error and security patterns).  
- Read **`03-PRDs`** for acceptance criteria.  
- After implementation, update **`07-Tests`** expectations or add pointers to new tests.

**Before frontend/UI work**  
- Read **`05-Design`** when visual or UX specs exist.  
- Read **`03-PRDs`** for behavior and acceptance criteria.  
- Read **`04-Architecture`** for API contracts and data the UI consumes.

**Before adding or changing automated tests**  
- Read **`07-Tests`** for strategy and naming/layout expectations.  
- Read **`04-Architecture`** for boundaries under test (API vs client vs DB).

**When interpreting bugs, UX complaints, or post-launch learnings**  
- Read **`08-Feedback`** and **`09-Analytics`** when those files contain relevant entries for the area you are changing.

**When unsure if a document is still current**  
- Prefer the lowest numbered “living” folder that fits; move obsolete copies to **`99-Archive`** with a short note pointing to the replacement.

---

## Relationship to Cursor rules

Workspace rules under `.cursor/rules/` remain **enforceable** for code style and stack (e.g. monorepo layout, RTL, Prisma). This file and `docs/README.md` govern **where written product and engineering knowledge lives** and **which docs to load** for context.

---

## Quick links

- Central human/AI hub: [`docs/README.md`](docs/README.md)
