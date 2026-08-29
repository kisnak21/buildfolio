# Buildfolio Implementation Plan

Status updated: 2026-08-26. AI generation is paused — Ideas and document workspace are Coming Soon while the selected Groq-primary model rebase is implemented and verified. Routing stays, no quota consumed.

This plan covers the next reliability, AI UX, Ideas Workspace, draft-project, and project-discovery improvements. Model selection remains an internal server concern; users should not choose providers directly.

## Principles

- Never log prompts, project input, API keys, backup passphrases, or full AI responses.
- Generate request IDs on the server and use them only for correlation.
- Keep drafts private until explicitly published.
- Treat provider fallback as an implementation detail.
- Prefer server-side filtering and authorization over client-side filtering.
- Add tests before expanding behavior across the existing application.

## Milestone 1: AI Reliability — Paused (Coming Soon)

> AI generation disabled at the API layer (`POST /api/ai/generate` and `GET /api/ai/quota` now return `503 Coming Soon`). Free-model timeouts / empty completions under OpenRouter require alternative-model evaluation before re-enabling. Keep the implementation for rebase.

- [ ] Paused — rebase to the selected two-model provider setup, then verify in staging

### Selected Provider Rebase

Decision confirmed on 2026-08-26: use exactly two active models. Model and provider selection remain server-side implementation details.

- Primary: direct Groq API with `openai/gpt-oss-120b` on the free/developer tier initially.
- Fallback: `z-ai/glm-5.2:free` through OpenRouter.
- Remove Dots3, Gemma, Nemotron, and Ox Alpha from the active model configuration rather than retaining commented entries.
- Keep AI routes in Coming Soon mode until both providers pass authenticated staging verification.
- Re-enable generation only after structured output, streaming, fallback, timeout, and quota behavior pass the rollout gate.

Update `src/lib/aiModels.ts` and `src/lib/services/aiService.ts`.

- Add provider metadata so each model resolves to either `groq` or `openrouter`.
- Make `openai/gpt-oss-120b` the default model and preserve `z-ai/glm-5.2:free` as the only fallback.
- Keep JSON and JSON Schema capability metadata enabled for both models.
- Replace the single-provider client with cached server-only clients per provider.
- Configure Groq with `GROQ_API_KEY` and optional `GROQ_BASE_URL`, defaulting to `https://api.groq.com/openai/v1`.
- Keep the existing OpenRouter key, base URL, attribution headers, and data-collection policy for the GLM fallback.
- Build one shared request shape, then add only provider-specific fields:
  - Groq uses `reasoning_effort` and must not receive the OpenRouter `provider` block.
  - OpenRouter retains provider parameter filtering and uses its normalized `reasoning` options.
- Start with low reasoning effort to protect the Ideas completion-token budget; adjust the GLM request only if its endpoint rejects or ignores that setting.
- Filter models whose provider key is not configured. Use the configured fallback when possible and return `503` when neither provider is configured.
- Preserve the current streaming parser, server-side Ideas validation, telemetry, cancellation, fallback events, and shared attempt/idle timeouts.
- Rename OpenRouter-specific internal function names where they become provider-neutral; keep public API behavior unchanged.

Update `tests/lib/services/aiService.test.ts`, `README.md`, and the AI route tests where model metadata is asserted.

- Replace test fixtures that reference removed models.
- Test that Groq requests omit OpenRouter fields and send the correct reasoning parameter.
- Test that OpenRouter GLM requests retain `require_parameters` for structured output.
- Test Groq-to-GLM fallback for streaming and non-streaming tasks.
- Test operation with only one provider configured and the `503` result when neither key exists.
- Keep coverage for redaction, abort, timeout, empty completion, malformed structured output, SSE metadata, and terminal events.
- Document both server-only API keys and the two-model fallback policy without exposing provider choice to users.

Staging rollout gate:

- Confirm Groq accepts the strict Ideas JSON Schema and returns exactly three server-validated ideas.
- Confirm first-token and total latency remain inside the existing 20-second idle and 22-second attempt timeouts.
- Confirm GLM accepts the chosen reasoning configuration and produces complete JSON within the Ideas token budget; increase the budget only if representative prompts prove truncation.
- Force a Groq failure and verify the request falls back once to GLM with correct telemetry and SSE progress.
- Verify successful generations consume quota once, while failed, timed-out, and cancelled attempts consume none.
- Check aggregate Groq developer-tier limits against the application quota of five generations per hour and fifteen per day per user.

### Observability

Update `src/app/api/ai/generate/route.ts`, `src/lib/services/aiService.ts`, and `src/lib/logger.ts`.

- Generate a server-side `requestId` for every AI request.
- Return `X-Request-ID` on normal responses and include the ID in SSE metadata and terminal events.
- Record structured metadata only:
  - request ID
  - task
  - selected and actual model
  - attempt number and fallback count
  - provider status and error class
  - request start time
  - first-token latency
  - total latency
  - output character count
  - success or failure
- Add explicit completion logging for Ideas streams, not only non-streaming tasks.
- Keep provider status and sanitized error messages, but never log request input or response content.
- Add tests proving prompt text cannot appear in AI log payloads.

### OpenAI SDK Consistency

Update `src/lib/services/aiService.ts` so description and README generation use the same OpenAI SDK client as Ideas.

- Keep a single server-only OpenAI client configured with `OPENROUTER_BASE_URL`, `OPENROUTER_API_KEY`, `HTTP-Referer`, and `X-OpenRouter-Title`.
- Replace the remaining manual `fetch()` request in `generateSingleWithOpenRouter()` with `chat.completions.create()`.
- Use the same timeout and abort handling for all tasks.
- Centralize provider error mapping for SDK errors, status codes, rate limits, timeouts, and connection failures.
- Preserve provider routing, JSON response format, reasoning options, fallback order, and returned model metadata.
- Remove duplicated OpenRouter transport logic after the migration.

### Structured Ideas Output

Update `src/lib/aiModels.ts` and `src/lib/services/aiService.ts`.

- Define one strict Ideas schema with exactly three items.
- Require title, summary, description, category, and technologies.
- Enforce field lengths, category enum, technology limits, required fields, and `additionalProperties: false`.
- Use `response_format.type = json_schema` for models verified to support structured outputs.
- Fall back to `json_object` for models that do not support JSON Schema.
- Continue server-side validation because JSON Schema alone cannot guarantee unique titles.
- Verify structured-output support for every configured fallback model before enabling it.

Historical capability metadata verified on 2026-08-25: Dots3, Nemotron 3 Super, and GLM 5.2 advertise `structured_outputs`; Ox Alpha and both Gemma endpoints use JSON mode. The selected rebase removes all of these except GLM 5.2 and adds Groq-hosted GPT-OSS 120B with strict structured-output support.

## Milestone 2: AI Controls and UX — Paused (Coming Soon)

- [ ] Paused — UI now generic (no experience selector), quota/progress components retained for rebase

### Cancel and Retry

Update `src/lib/api/realApiClient.ts`, `src/lib/api/aiApi.ts`, `src/components/dashboard/ProjectForm.tsx`, and `src/app/dashboard/ideas/IdeasClient.tsx`.

- Pass an external `AbortSignal` through streaming and non-streaming requests.
- Compose caller cancellation with the existing timeout controller.
- Distinguish user cancellation from provider timeout and provider failure.
- Ensure cancellation does not consume successful-generation quota.
- Add a visible `Cancel` action while generation is active.
- Preserve the last generation input and add an explicit `Retry` action after failure.
- Do not automatically retry a user-cancelled request.

### Visible Progress

Create a shared `AiGenerationProgress` component.

- Ideas displays connection, attempt, fallback, drafting, validation, and completion states.
- Ideas uses current SSE events plus first-token and validation events where useful.
- Description and README display an indeterminate staged progress state because they remain non-streaming at the UI boundary.
- Do not display fake percentage completion.
- Keep `aria-live`, `aria-busy`, keyboard focus, and reduced-motion behavior accessible.

### Quota and Retry-After

Update `src/lib/rateLimit.ts`, `src/app/api/ai/generate/route.ts`, `src/lib/api/realApiClient.ts`, and both AI clients.

- Add authenticated `GET /api/ai/quota` returning hourly and daily remaining counts plus reset timestamps.
- Preserve response headers in `realApiClient`, including `Retry-After` and rate-limit headers.
- Add a `quota` SSE event after successful Ideas quota consumption.
- Add `Retry-After` to application quota errors consistently.
- Parse retry timing on the client and show a countdown instead of a generic error.
- Display current remaining hourly and daily quota in both AI surfaces.
- Keep quota consumption success-only and document the existing concurrency limitation for later atomic-counter work.

## Milestone 3: Backup Verification: Operational verification pending

Workflow: `.github/workflows/backup.yml`.
Runbook: `README.md` backup section.

- [x] Nightly encrypted backup workflow and restore runbook exist.
- [x] Verify GitHub secret names and dispatch the workflow. Run `33186633551` completed the artifact, disposable restore, and heartbeat checks successfully.
- [ ] Download and decrypt an artifact for the separate manual restore drill.

### Secret Verification

- Verify that these GitHub secret names exist without printing their values:
  - `BACKUP_DATABASE_URL`
  - `BACKUP_ENCRYPTION_PASSPHRASE`
  - `BACKUP_HEARTBEAT_URL`
- Dispatch the backup workflow manually.
- Confirm the workflow creates an artifact, completes restore verification, and reports the heartbeat.
- Treat missing secrets as an operational blocker; never commit them or expose them in logs.

### Manual Restore Drill

- Download the encrypted artifact to a secure temporary directory.
- Verify the SHA-256 checksum.
- Decrypt without placing the passphrase in shell history.
- Restore only to a disposable PostgreSQL database or pinned container.
- Run `pg_restore --list` and a full `pg_restore` into the disposable target.
- Verify public tables, representative rows, and a basic application health query.
- Remove plaintext dumps, decrypted files, containers, and temporary credentials.
- Record restore duration, result, and recovery steps in the README.
- After the first successful drill, consider adding a manually triggered `restore-drill.yml` workflow.

## Milestone 4: Save Ideas as Draft Projects: Manual project flow implemented

Recommended design: add a `status` field to `Project` rather than creating a duplicate idea table. This reuses the existing edit form and makes publishing a state transition.

### Data Model

Update `prisma/schema.prisma` with a migration after `0004_moderation_invariants`.

- Add `ProjectStatus` with `DRAFT` and `PUBLISHED`.
- Default existing and new normal projects to `PUBLISHED`.
- Add an index for owner and status.
- Keep the current project fields so an AI idea can become a project without duplicating data.

### Server Authorization and Visibility

Update `src/lib/visibility.ts`, `src/lib/services/projectService.ts`, and project API routes.

- Add `POST /api/projects/drafts` or an equivalent dedicated draft action.
- Derive owner identity from the authenticated session, never from client `user_id`.
- Allow owners to read and edit their own drafts.
- Allow an explicit publish action after normal project validation.
- Make `publicProjectWhere()` require `PUBLISHED`.
- Exclude drafts from public lists, detail pages, profiles, sitemap, search, comments, likes, bookmarks, and public/admin metrics.

### UI

Update `IdeasClient.tsx`, dashboard components, and edit-project surfaces.

- [ ] Add `Save as draft` to each generated idea when the Ideas workspace returns.
- [x] Add `Save as draft` to the manual New Project flow.
- [x] Show success feedback and a link to edit drafts from the dashboard Drafts view.
- [x] Allow optional category, technologies, links, and thumbnail fields to remain empty.
- [x] Add a clear `Publish` action with full validation.

Project title, slug, and description remain required because the current database columns are non-null and publishing requires those fields.

## Milestone 5: Search, Filter, Bookmark, and Share

### Server-Side Search and Filters

Update `src/lib/services/projectService.ts`, `src/app/api/projects/route.ts`, `src/lib/api/projectsApi.ts`, `src/store/redux/projectsSlice.ts`, and `src/app/projects/ProjectsClient.tsx`.

- [x] Move search, category, technology, and sorting to the server.
- [x] Send filters as URL query parameters.
- [x] Reset pagination when a filter changes.
- [x] Keep search and filters in the browser URL so filtered views can be shared.
- [x] Return pagination totals based on the filtered query.
- [x] Add author filtering for the public catalog.
- Evaluate PostgreSQL indexes or full-text/trigram search as the catalog grows.
- [x] Remove local filtering that only searches the currently loaded page.

### Bookmarks

Update `src/lib/services/bookmarkService.ts`, bookmark routes, `BookmarksClient.tsx`, and `ProjectCard.tsx`.

- [x] Return full project data from the bookmark query instead of joining against the default 20-project list.
- [x] Add direct remove-bookmark behavior on the bookmarks page.
- [x] Add bookmark toggles to project cards and search results.
- [x] Add bookmark state to server responses or hydrate it consistently from the current user.
- [x] Keep draft projects out of public bookmarks.
- Consider folders, tags, and notes only after the basic projection is corrected.

### Sharing

Update `ProjectCard.tsx` and `ProjectDetailClient.tsx`.

- [x] Add a share button using `navigator.share()` where supported.
- [x] Fall back to copying the public project URL to the clipboard.
- [x] Show a clear success or failure state.
- [x] Share only published, publicly visible projects.
- [x] Reuse existing Open Graph metadata.
- [x] Keep the current ID route initially; move to slug routes separately if canonical URLs are desired.

## Milestone 6: Ideas Workspace Documents — Paused (Coming Soon)

- [ ] Paused — `/dashboard/ideas` renders Coming Soon, routing preserved; document generation re-queued for alternative-model rebase

The Ideas page becomes the workspace for turning one generated idea into an actionable project package. The workspace stays inside `/dashboard/ideas`; a separate route is not needed because generated documents are initially ephemeral.

Confirmed product decisions:

- Design output means a Markdown Design Spec, not an image or visual mockup.
- The workspace starts after the user selects one of the generated ideas.
- PRD, Design Spec, Style Guide, and README are separate document actions.
- Documents can be edited, copied, and downloaded.
- Documents are not persisted in the database in the first version.
- Project submission keeps only explicit description generation; README generation moves out of `ProjectForm`.

### AI Tasks and Contracts

Update `src/lib/aiModels.ts`, `src/lib/services/aiService.ts`, `src/lib/api/aiApi.ts`, and `src/app/api/ai/generate/route.ts`.

- Extend `AiTask` with `prd`, `design`, and `styleGuide` while retaining `readme` for the Ideas workspace.
- Add a selected-idea `summary` field to the AI input contract.
- Return document tasks using the existing text result shape: `{ task, text, model }`.
- Generate documents as Markdown using the shared OpenAI SDK client and error handling.
- Keep Ideas generation streaming; use non-streaming document generation initially.
- Count each successful generated document as one AI quota unit.
- Make each document prompt explicitly separate factual project context from design recommendations.

### Document Prompts

- PRD: problem, target users, goals, non-goals, user stories, MVP scope, requirements, acceptance criteria, risks, metrics, and milestones.
- Design Spec: product direction, information architecture, layouts, flows, interaction states, responsive behavior, accessibility, and implementation notes.
- Style Guide: visual personality, semantic color roles, typography, spacing, radii, shadows, components, and UI states.
- README: purpose, overview, features based on supplied facts, tech stack, setup placeholders, and links.

### Ideas UI

Update `src/app/dashboard/ideas/IdeasClient.tsx` and add reusable components:

- `src/components/dashboard/IdeaWorkspace.tsx`
- `src/components/dashboard/GeneratedDocumentPanel.tsx`
- `src/components/dashboard/AiGenerationProgress.tsx`

- Add selected-idea state and document tabs for PRD, Design Spec, Style Guide, and README.
- Provide Generate, Regenerate, Copy, Download, and Edit actions.
- Preserve generated documents per selected idea during the current page session.
- Use safe filenames such as `project-name-prd.md`, `project-name-design-spec.md`, `project-name-style-guide.md`, and `README.md`.
- Add loading, retry, cancel, empty, copy-success, download, and provider-error states.
- Avoid a `Generate all` action initially because it could consume four quota units at once.

### Copy and Download Utilities

Add client-safe helpers in `src/lib/utils.ts` or a dedicated document utility module:

- `copyText(text)` using the Clipboard API.
- `downloadText(filename, content, mimeType)` using a Blob and object URL cleanup.
- Keep downloaded content as UTF-8 Markdown.

### Project Form Changes

Update `src/components/dashboard/ProjectForm.tsx`.

- Remove README generation, README state, and README copy controls.
- Keep only Write Description and Rewrite Description.
- Keep description generation explicit rather than automatically consuming quota during project submission.
- Keep `Start this project` prefill behavior unchanged.

### Documentation

Update `README.md` and `src/app/privacy/page.tsx` to describe document generation under Project Ideas instead of the project form.

## Testing and CI

Vitest and the CI test script already exist. The current non-AI regression suite covers visibility, project filters, draft/publish routes, bookmark projection, utilities, and the paused AI behavior.

- Unit-test Ideas schema and parser behavior.
- Mock OpenAI SDK async iterators for normal stream, provider error, fallback, empty stream, malformed output, and abort.
- Test request ID and log redaction behavior.
- Test quota headers, SSE quota events, and Retry-After parsing.
- [x] Test draft route ownership input, publish transition routing, and public visibility exclusion.
- [x] Test server-side filters and correct pagination totals.
- [x] Test bookmark retrieval independently of project page size.
- Test task-specific prompts and document result parsing for PRD, Design Spec, Style Guide, and README.
- Test copy/download helpers and Ideas Workspace document state.
- Test that ProjectForm exposes description generation but not README generation.
- Add browser coverage for cancel, retry, visible progress, save draft, bookmark, and share.

## Verification Commands

```bash
npm test
npm run lint
npm run typecheck
npm run build
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Use an authenticated staging session for AI SSE verification and a disposable database for backup restore verification. Never use the production database as a restore target.

## Recommended Order

1. [x] Add test foundation and AI observability.
2. [x] Migrate description and README to the OpenAI SDK.
3. [x] Add structured JSON Schema and verify model capability.
4. [x] Add cancel, retry, visible progress, quota, and Retry-After UX.
5. Rebase AI generation to direct Groq with OpenRouter GLM fallback, pass the staging rollout gate, and re-enable the routes.
6. Verify backup secrets and complete a manual restore drill.
7. [x] Expand Project Ideas into the document workspace and move README generation there.
8. Add draft status, draft APIs, and visibility safeguards.
9. Move search and filters server-side.
10. Correct bookmark data loading and add card actions.
11. Add share UI and then public API documentation.
