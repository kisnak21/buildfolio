# Buildfolio Implementation Plan

Status updated: 2026-08-25. Milestones 1, 2, and 6 are complete in the current worktree.

This plan covers the next reliability, AI UX, Ideas Workspace, draft-project, and project-discovery improvements. Model selection remains an internal server concern; users should not choose providers directly.

## Principles

- Never log prompts, project input, API keys, backup passphrases, or full AI responses.
- Generate request IDs on the server and use them only for correlation.
- Keep drafts private until explicitly published.
- Treat provider fallback as an implementation detail.
- Prefer server-side filtering and authorization over client-side filtering.
- Add tests before expanding behavior across the existing application.

## Milestone 1: AI Reliability

- [x] Complete

### [x] Observability

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

### [x] OpenAI SDK Consistency

Update `src/lib/services/aiService.ts` so description and README generation use the same OpenAI SDK client as Ideas.

- Keep a single server-only OpenAI client configured with `OPENROUTER_BASE_URL`, `OPENROUTER_API_KEY`, `HTTP-Referer`, and `X-OpenRouter-Title`.
- Replace the remaining manual `fetch()` request in `generateSingleWithOpenRouter()` with `chat.completions.create()`.
- Use the same timeout and abort handling for all tasks.
- Centralize provider error mapping for SDK errors, status codes, rate limits, timeouts, and connection failures.
- Preserve provider routing, JSON response format, reasoning options, fallback order, and returned model metadata.
- Remove duplicated OpenRouter transport logic after the migration.

### [x] Structured Ideas Output

Update `src/lib/aiModels.ts` and `src/lib/services/aiService.ts`.

- Define one strict Ideas schema with exactly three items.
- Require title, summary, description, category, and technologies.
- Enforce field lengths, category enum, technology limits, required fields, and `additionalProperties: false`.
- Use `response_format.type = json_schema` for models verified to support structured outputs.
- Fall back to `json_object` for models that do not support JSON Schema.
- Continue server-side validation because JSON Schema alone cannot guarantee unique titles.
- Verify structured-output support for every configured fallback model before enabling it.

Capability metadata verified on 2026-08-25: Dots3, Nemotron 3 Super, and GLM 5.2 advertise `structured_outputs`; Ox Alpha and both Gemma endpoints use JSON mode.

## Milestone 2: AI Controls and UX

- [x] Complete

### [x] Cancel and Retry

Update `src/lib/api/realApiClient.ts`, `src/lib/api/aiApi.ts`, `src/components/dashboard/ProjectForm.tsx`, and `src/app/dashboard/ideas/IdeasClient.tsx`.

- Pass an external `AbortSignal` through streaming and non-streaming requests.
- Compose caller cancellation with the existing timeout controller.
- Distinguish user cancellation from provider timeout and provider failure.
- Ensure cancellation does not consume successful-generation quota.
- Add a visible `Cancel` action while generation is active.
- Preserve the last generation input and add an explicit `Retry` action after failure.
- Do not automatically retry a user-cancelled request.

### [x] Visible Progress

Create a shared `AiGenerationProgress` component.

- Ideas displays connection, attempt, fallback, drafting, validation, and completion states.
- Ideas uses current SSE events plus first-token and validation events where useful.
- Description and README display an indeterminate staged progress state because they remain non-streaming at the UI boundary.
- Do not display fake percentage completion.
- Keep `aria-live`, `aria-busy`, keyboard focus, and reduced-motion behavior accessible.

### [x] Quota and Retry-After

Update `src/lib/rateLimit.ts`, `src/app/api/ai/generate/route.ts`, `src/lib/api/realApiClient.ts`, and both AI clients.

- Add authenticated `GET /api/ai/quota` returning hourly and daily remaining counts plus reset timestamps.
- Preserve response headers in `realApiClient`, including `Retry-After` and rate-limit headers.
- Add a `quota` SSE event after successful Ideas quota consumption.
- Add `Retry-After` to application quota errors consistently.
- Parse retry timing on the client and show a countdown instead of a generic error.
- Display current remaining hourly and daily quota in both AI surfaces.
- Keep quota consumption success-only and document the existing concurrency limitation for later atomic-counter work.

## Milestone 3: Backup Verification

Workflow: `.github/workflows/backup.yml`.
Runbook: `README.md` backup section.

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

## Milestone 4: Save Ideas as Draft Projects

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

- Add `Save as draft` to each generated idea.
- Show confirmation and link to edit the draft.
- Add a dashboard Drafts view.
- Allow incomplete draft fields where appropriate.
- Add a clear `Publish` action with full validation.

## Milestone 5: Search, Filter, Bookmark, and Share

### Server-Side Search and Filters

Update `src/lib/services/projectService.ts`, `src/app/api/projects/route.ts`, `src/lib/api/projectsApi.ts`, `src/store/redux/projectsSlice.ts`, and `src/app/projects/ProjectsClient.tsx`.

- Move search, category, technology, and sorting to the server.
- Send filters as URL query parameters.
- Reset pagination when a filter changes.
- Keep search and filters in the browser URL so filtered views can be shared.
- Return pagination totals based on the filtered query.
- Add author filtering if it is useful for the public catalog.
- Evaluate PostgreSQL indexes or full-text/trigram search as the catalog grows.
- Remove local filtering that only searches the currently loaded page.

### Bookmarks

Update `src/lib/services/bookmarkService.ts`, bookmark routes, `BookmarksClient.tsx`, and `ProjectCard.tsx`.

- Return full project data from the bookmark query instead of joining against the default 20-project list.
- Add direct remove-bookmark behavior on the bookmarks page.
- Add bookmark toggles to project cards and search results.
- Add bookmark state to server responses or hydrate it consistently from the current user.
- Keep draft projects out of public bookmarks.
- Consider folders, tags, and notes only after the basic projection is corrected.

### Sharing

Update `ProjectCard.tsx` and `ProjectDetailClient.tsx`.

- Add a share button using `navigator.share()` where supported.
- Fall back to copying the public project URL to the clipboard.
- Show a clear success or failure state.
- Share only published, publicly visible projects.
- Reuse existing Open Graph metadata.
- Keep the current ID route initially; move to slug routes separately if canonical URLs are desired.

## Milestone 6: Ideas Workspace Documents

- [x] Complete

The Ideas page becomes the workspace for turning one generated idea into an actionable project package. The workspace stays inside `/dashboard/ideas`; a separate route is not needed because generated documents are initially ephemeral.

Confirmed product decisions:

- Design output means a Markdown Design Spec, not an image or visual mockup.
- The workspace starts after the user selects one of the generated ideas.
- PRD, Design Spec, Style Guide, and README are separate document actions.
- Documents can be edited, copied, and downloaded.
- Documents are not persisted in the database in the first version.
- Project submission keeps only explicit description generation; README generation moves out of `ProjectForm`.

### [x] AI Tasks and Contracts

Update `src/lib/aiModels.ts`, `src/lib/services/aiService.ts`, `src/lib/api/aiApi.ts`, and `src/app/api/ai/generate/route.ts`.

- Extend `AiTask` with `prd`, `design`, and `styleGuide` while retaining `readme` for the Ideas workspace.
- Add a selected-idea `summary` field to the AI input contract.
- Return document tasks using the existing text result shape: `{ task, text, model }`.
- Generate documents as Markdown using the shared OpenAI SDK client and error handling.
- Keep Ideas generation streaming; use non-streaming document generation initially.
- Count each successful generated document as one AI quota unit.
- Make each document prompt explicitly separate factual project context from design recommendations.

### [x] Document Prompts

- PRD: problem, target users, goals, non-goals, user stories, MVP scope, requirements, acceptance criteria, risks, metrics, and milestones.
- Design Spec: product direction, information architecture, layouts, flows, interaction states, responsive behavior, accessibility, and implementation notes.
- Style Guide: visual personality, semantic color roles, typography, spacing, radii, shadows, components, and UI states.
- README: purpose, overview, features based on supplied facts, tech stack, setup placeholders, and links.

### [x] Ideas UI

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

### [x] Copy and Download Utilities

Add client-safe helpers in `src/lib/utils.ts` or a dedicated document utility module:

- `copyText(text)` using the Clipboard API.
- `downloadText(filename, content, mimeType)` using a Blob and object URL cleanup.
- Keep downloaded content as UTF-8 Markdown.

### [x] Project Form Changes

Update `src/components/dashboard/ProjectForm.tsx`.

- Remove README generation, README state, and README copy controls.
- Keep only Write Description and Rewrite Description.
- Keep description generation explicit rather than automatically consuming quota during project submission.
- Keep `Start this project` prefill behavior unchanged.

### [x] Documentation

Update `README.md` and `src/app/privacy/page.tsx` to describe document generation under Project Ideas instead of the project form.

## Testing and CI

There are currently no test files or test script. Add a test runner and include it in `.github/workflows/ci.yml`.

- Unit-test Ideas schema and parser behavior.
- Mock OpenAI SDK async iterators for normal stream, provider error, fallback, empty stream, malformed output, and abort.
- Test request ID and log redaction behavior.
- Test quota headers, SSE quota events, and Retry-After parsing.
- Test draft ownership, publish transition, and public visibility exclusion.
- Test server-side filters and correct pagination totals.
- Test bookmark retrieval independently of project page size.
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
5. Verify backup secrets and complete a manual restore drill.
6. [x] Expand Project Ideas into the document workspace and move README generation there.
7. Add draft status, draft APIs, and visibility safeguards.
8. Move search and filters server-side.
9. Correct bookmark data loading and add card actions.
10. Add share UI and then public API documentation.
