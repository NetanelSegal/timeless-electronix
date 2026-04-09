# Documentation hub — Timeless Electronix

Central navigation for people and AI agents. Detailed access rules live in the repository root: [`AI-DOCS-NAVIGATION.md`](../AI-DOCS-NAVIGATION.md).

## Lifecycle folders

| # | Folder | What belongs here |
|---|--------|-------------------|
| 01 | [01-Discovery](01-Discovery/) | Research, stakeholders, problem framing |
| 02 | [02-Frameworks](02-Frameworks/) | Stack and tooling decisions (ADRs) |
| 03 | [03-PRDs](03-PRDs/) | Product requirements and acceptance criteria |
| 04 | [04-Architecture](04-Architecture/) | System design, **DB schema**, **data flow**, APIs |
| 05 | [05-Design](05-Design/) | UX/UI, RTL, design artifacts |
| 06 | [06-Development](06-Development/) | Setup, **tasks**, **progress**, dev runbooks |
| 07 | [07-Tests](07-Tests/) | Test strategy and quality gates |
| 08 | [08-Feedback](08-Feedback/) | User and stakeholder feedback |
| 09 | [09-Analytics](09-Analytics/) | Metrics, events, experiments |
| 99 | [99-Archive](99-Archive/) | Deprecated or historical docs only |

## Mandatory reads by task type

- **Any substantial code or schema change:** `06-Development` + `04-Architecture`.
- **New backend feature:** `06-Development`, `04-Architecture` (API + **data model**), `03-PRDs`; then align `07-Tests`.
- **UI/feature behavior:** `03-PRDs`, `05-Design` (if present), `04-Architecture` for API/data.
- **Stack/tooling change:** `02-Frameworks` + `04-Architecture`.

## Active engineering tracking

- Task list: [`06-Development/tasks.md`](06-Development/tasks.md)  
- Progress log: [`06-Development/progress.md`](06-Development/progress.md)
