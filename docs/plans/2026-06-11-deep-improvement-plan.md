# Deep Improvement Plan

Created: 2026-06-11
Audit baseline: `03dfb3e`
Scope: `D:\dev\backpack`

This plan is written for implementation agents. It is intentionally self-contained: each section includes the evidence that triggered the work, the intended change, verification commands, and stop conditions.

## Executive Summary

The application has a strong modern stack, but several production-grade boundaries are not yet tight enough:

- Two chat persistence paths allow cross-user data mutation when an authenticated user knows or supplies another chat id.
- MCP server URLs are accepted as arbitrary outbound server-side URLs, which needs an explicit egress policy.
- Chat request logging currently includes user identifiers and prompt text in console output.
- The repo has no runnable test script or CI workflow, while linting and dependency audit are currently failing.
- Artifact versioning has a likely concurrent-write race.
- Audio transcription accepts unbounded uploads.
- MCP tool names are composed from user-controlled display names.

Treat the first four items as release blockers. The rest are hardening work that should follow immediately after the baseline is green.

## Current Repo Baseline

- Package manager: Bun (`package.json` has `packageManager: bun`).
- Framework: Next.js 16, React 19, tRPC, Drizzle/Postgres, Better Auth, AI SDK, Vercel Blob, Redis, MCP.
- TypeScript: `bun x tsc --noEmit --incremental false` passed at baseline.
- Lint/format: `bun x ultracite check` failed with 344 diagnostics repo-wide; `bun x ultracite check src --max-diagnostics=80` failed with 170 diagnostics under `src`.
- Dependency audit: `bun audit` reported 128 vulnerabilities, including 1 critical, 48 high, 69 moderate, and 10 low.
- Tests: no `test` script exists in `package.json`.
- CI: no GitHub Actions workflow exists under `.github/workflows`.
- Documentation: `README.md` is a short product blurb and screenshot list; setup and environment documentation are missing.

## Working Rules For Agents

- Do not print or commit values from `.env`. The file is ignored by `.gitignore`, and only variable names should ever be referenced in docs.
- Preserve unrelated local changes. If the worktree is dirty, inspect changes before editing touched files.
- Use `bun x ultracite fix` only when prepared for formatting churn. For narrow fixes, prefer scoped edits and then run targeted checks.
- Add regression tests with each behavior fix. A security fix without a test should be considered incomplete.
- Keep every implementation step small enough to review independently.

Before starting any phase, run:

```powershell
git status --short
git rev-parse --short HEAD
bun install
bun x tsc --noEmit --incremental false
```

If the commit has moved from `03dfb3e`, re-check the cited files before applying the steps.

## Priority Roadmap

| Priority | Work | Primary Risk | Suggested Owner |
| --- | --- | --- | --- |
| P0 | Add verification baseline: scripts, tests, CI, lint strategy | Future fixes cannot be trusted | Platform |
| P1 | Fix chat delete authorization | Cross-user deletion of messages/votes | Backend |
| P1 | Fix chat message save authorization | Cross-user message insertion/upsert | Backend |
| P1 | Patch direct vulnerable dependencies | Known vulnerable dependency graph | Platform |
| P1 | Redact chat request logging | Prompt and user metadata leakage | Backend |
| P2 | Add MCP URL egress policy | Server-side request forgery / internal network reachability | Backend |
| P2 | Serialize artifact version creation | Concurrent saves can fail or lose intent | Backend |
| P2 | Limit transcription uploads | Memory pressure and unsupported payloads | Backend |
| P3 | Sanitize MCP tool identifiers | Invalid or colliding tool names | Backend |
| P3 | Finish research agent wiring and onboarding docs | Incomplete user-facing mode and weak setup docs | Product |

## Phase 0: Verification Baseline

### Why

The repo currently has no test script or CI workflow, while lint and dependency audit fail. Security and correctness work should land with tests and automated checks so regressions are visible.

### Evidence

- `package.json` scripts only include development, build, lint, lint fix, database, prepare, and doctor scripts.
- `package.json` uses `npx ultracite check` in `lint`; project guidance prefers `bun x ultracite check`.
- `.github/workflows` does not exist.
- `bun x ultracite check` fails with 344 diagnostics.
- `bun x ultracite check src --max-diagnostics=80` fails with 170 diagnostics.
- `bun x tsc --noEmit --incremental false` passes.

### Scope

In scope:

- Add `typecheck`, `check`, `test`, and `audit` scripts.
- Add a minimal test runner if one is not already configured. Prefer Vitest for TypeScript unit tests.
- Add GitHub Actions for install, typecheck, lint, test, and audit.
- Decide whether to normalize generated/local agent files or exclude them from formatting checks.

Out of scope:

- Broad refactors unrelated to verification.
- Reformatting the entire repo unless the team explicitly accepts a formatting-only change.

### Implementation Steps

1. Inspect current scripts and dependency versions in `package.json`.
2. Add scripts:
   - `typecheck`: `tsc --noEmit --incremental false`
   - `lint`: `bun x ultracite check`
   - `lint:fix`: `bun x ultracite fix`
   - `check`: run typecheck, lint, and tests in sequence
   - `audit`: `bun audit`
3. If Vitest is not installed, add it as a dev dependency and configure it for server-side unit tests.
4. Add `.github/workflows/ci.yml` with Bun setup, install, typecheck, lint, test, and audit steps.
5. Run scoped lint to determine whether `.agents`, `.claude`, or generated files need explicit formatter/linter exclusion.
6. Add at least one empty-safe test target so `bun test` or `bun run test` fails only on real test failures, not missing configuration.

### Verification

```powershell
bun install
bun run typecheck
bun run test
bun run lint
bun run audit
bun run check
```

### Done Criteria

- CI exists and exercises the same commands developers run locally.
- `bun run typecheck` passes.
- `bun run test` runs successfully.
- Lint has a documented path to green, either by targeted exclusions for generated files or by formatting fixes.
- Audit failures are visible in CI or documented with an allowlist and expiration date.

### Stop Conditions

- Do not hide source-code lint diagnostics with broad ignores.
- Do not commit generated lockfile churn without understanding dependency changes.

## Phase 1: Fix Chat Delete Authorization

### Why

The delete path removes votes and messages by `chatId` before checking that the chat belongs to the current user. An authenticated user who knows another user's chat id can delete that chat's child records even if the final chat delete does not match ownership.

### Evidence

- `src/lib/server/routers/chat.ts` calls `deleteChatById({ id: input.chatId, userId: ctx.session.user.id })` from a protected procedure.
- `src/lib/db/queries/chat.ts` deletes `vote` rows by `chatId`.
- `src/lib/db/queries/chat.ts` deletes `message` rows by `chatId`.
- Only after those deletes does it delete `chat` with `and(eq(chat.id, id), eq(chat.userId, userId))`.

### Scope

In scope:

- Ensure ownership is verified before deleting any child records.
- Make the operation transactional.
- Add regression coverage for deleting an owned chat and attempting to delete another user's chat.

Out of scope:

- Redesigning the full chat schema.
- Changing public route names unless required.

### Implementation Steps

1. Update `deleteChatById` so it first selects or deletes the chat with both `id` and `userId`.
2. If the chat is not owned by the user, return a clear not-found/unauthorized result without touching child rows.
3. Move child deletes inside a transaction after ownership is established.
4. Prefer database cascade constraints if existing schema supports them; otherwise keep explicit child deletes inside the transaction.
5. Have the tRPC procedure surface a stable error when a chat is missing or not owned.
6. Add tests that create two users and two chats:
   - user A can delete user A's chat, messages, and votes.
   - user A cannot delete user B's messages or votes by passing user B's chat id.

### Verification

```powershell
bun run typecheck
bun run test -- chat
bun x ultracite check src/lib/db/queries/chat.ts src/lib/server/routers/chat.ts
```

### Done Criteria

- Child rows are never deleted unless chat ownership has already matched.
- Unauthorized delete attempts leave the target chat, messages, and votes unchanged.
- Regression tests fail on the old implementation and pass on the new implementation.

### Stop Conditions

- Stop if tests require production database credentials. Add an isolated test database or mock repository layer first.
- Stop if schema constraints differ between Drizzle definitions and actual migrations.

## Phase 2: Fix Chat Message Save Authorization

### Why

The protected `saveMessages` procedure accepts caller-supplied `chatId` values and forwards them directly to the database upsert. Because `message` rows do not include `userId`, ownership must be checked through the parent chat before any insert or update.

### Evidence

- `src/lib/server/routers/chat.ts` exposes `saveMessages`.
- It accepts `messages[].chatId`, `role`, `parts: z.array(z.any())`, and `attachments: z.array(z.any())`.
- It ignores `ctx.session.user.id` during the mutation body.
- `src/lib/db/queries/chat.ts` upserts messages using caller-supplied ids and chat ids.
- `src/lib/db/schema/app.ts` defines `message.chatId` but no `message.userId`.

### Scope

In scope:

- Require ownership validation for every message save.
- Prevent cross-chat and cross-user upserts.
- Replace broad `z.any()` shapes where practical.
- Add regression tests for foreign chat mutation attempts.

Out of scope:

- Rebuilding the AI message format.
- Migrating historical messages unless needed for constraints.

### Implementation Steps

1. Search client and server call sites for `saveMessages`.
2. If the procedure is not used by trusted client code, remove it from the public tRPC router or make it server-internal.
3. If it must remain public, require a single `chatId` at the procedure input root.
4. Reject payloads where any message has a different `chatId`.
5. Check `chat.id` and `chat.userId` before calling the database upsert.
6. In the database helper, accept an already-authorized `chatId` and avoid trusting per-message chat ids.
7. Tighten validation for `parts` and `attachments` using existing AI SDK types or a conservative local schema.
8. Add tests:
   - saving messages to an owned chat succeeds.
   - saving messages to another user's chat fails and creates no rows.
   - attempting to mix chat ids in one request fails.
   - attempting to overwrite a message in another user's chat fails.

### Verification

```powershell
bun run typecheck
bun run test -- chat
bun x ultracite check src/lib/db/queries/chat.ts src/lib/server/routers/chat.ts
```

### Done Criteria

- `ctx.session.user.id` participates in authorization before all message writes.
- Caller-supplied message ids cannot be used to mutate another user's messages.
- Input validation rejects mixed-chat payloads and malformed message payloads.

### Stop Conditions

- Stop if the same database helper is used by trusted AI generation internals. Split public authorization from internal persistence instead of weakening either path.

## Phase 3: Patch Dependency Vulnerabilities

### Why

`bun audit` reports critical and high vulnerabilities in the dependency graph. Several affected packages are direct dependencies, so remediation is likely possible without waiting on transitive maintainers.

### Evidence

Direct dependency lines include:

- `better-auth`
- `drizzle-orm`
- `js-cookie`
- `next`
- `ws`
- `postcss`

Audit baseline:

- 128 total vulnerabilities
- 1 critical
- 48 high
- 69 moderate
- 10 low

### Scope

In scope:

- Update vulnerable direct dependencies.
- Refresh `bun.lock`.
- Run build, typecheck, tests, lint, and audit.
- Document any remaining transitive vulnerabilities that cannot be patched immediately.

Out of scope:

- Large framework migrations unrelated to vulnerability remediation.
- Ignoring critical/high advisories without a documented reason and owner.

### Implementation Steps

1. Run `bun audit` and save the advisory package names and patched versions in the PR description.
2. Update direct vulnerable packages first:
   - `next`
   - `better-auth`
   - `drizzle-orm`
   - `js-cookie`
   - `ws`
   - `postcss`
3. Use targeted updates where possible before trying broad `bun update --latest`.
4. Re-run `bun install`.
5. Fix type or API breakages one package at a time.
6. Re-run `bun audit`.
7. For remaining transitive advisories, identify the top-level package that pulls them in and either update it or create a follow-up issue.

### Verification

```powershell
bun install
bun audit
bun run typecheck
bun run test
bun run build
bun run lint
```

### Done Criteria

- Critical and high direct dependency advisories are resolved.
- Remaining advisories, if any, are transitive, documented, and tracked.
- Build and typecheck pass after dependency updates.

### Stop Conditions

- Stop and split the work if a framework upgrade forces broad application changes.
- Do not suppress audit output without a dated remediation note.

## Phase 4: Redact Chat Request Logging

### Why

The chat API logs request metadata that includes user ids, chat ids, and up to 500 characters of prompt text. Console logs often flow into hosted log aggregation and should be safe by default.

### Evidence

- `src/app/api/chat/route.ts` calls `logChatRequestMetadata(createChatRequestLogPayload(...))`.
- `src/app/api/chat/_lib/request-logger.ts` prints a JSON payload with `console.log`.
- The payload includes `userId`, `chatId`, `query`, model metadata, selected agent, selected tools, and attachment metadata.

### Scope

In scope:

- Make production logging redact or omit prompt text and stable user identifiers.
- Keep enough metadata for debugging, metrics, and abuse investigation.
- Add unit tests for the redaction helper.

Out of scope:

- Introducing a full observability vendor.
- Removing all request logging.

### Implementation Steps

1. Extract a pure `createSafeChatRequestLogPayload` function if one does not already exist.
2. Default to omitting raw prompt text.
3. Either omit `userId`/`chatId` or replace them with irreversible hashes using a server-side salt.
4. Keep non-sensitive operational metadata:
   - message length
   - attachment count and MIME categories
   - model id
   - mode
   - selected tool count or names if names are non-sensitive
5. Gate raw prompt logging behind an explicit development-only environment flag.
6. Replace direct `console.log` with an application logger wrapper if one exists; otherwise keep a small wrapper that can be swapped later.
7. Add tests for:
   - default production payload does not include query text.
   - user/chat identifiers are absent or hashed.
   - debug flag is ignored in production.
   - development debug payload includes raw fields only when explicitly enabled.

### Verification

```powershell
bun run typecheck
bun run test -- request-logger
bun x ultracite check src/app/api/chat/_lib/request-logger.ts src/app/api/chat/route.ts
```

### Done Criteria

- Production logs do not include raw prompt text by default.
- Production logs do not include stable user ids or chat ids in plain text.
- Tests lock the redaction behavior.

### Stop Conditions

- Stop if there is an existing logging policy elsewhere in the repo. Align with it instead of adding a second convention.

## Phase 5: Add MCP URL Egress Policy

### Why

Users can add MCP servers with arbitrary URLs. The server then connects to those URLs from backend code. Without an explicit policy, this can reach internal services, metadata endpoints, loopback addresses, or unsupported protocols.

### Evidence

- `src/lib/server/routers/mcp.ts` accepts `url: z.string().url()` in `addServer`.
- `testConnection` resolves the arbitrary URL and races it against a timeout.
- `src/lib/mcp/client.ts` constructs HTTP MCP transports from persisted server URLs.

### Scope

In scope:

- Centralize URL validation.
- Restrict protocols.
- Deny private, loopback, link-local, multicast, and metadata-service ranges by default.
- Allow local development exceptions only behind explicit configuration.
- Add tests for accepted and rejected URLs.

Out of scope:

- Building a full outbound proxy.
- Supporting non-HTTP transports unless already required.

### Implementation Steps

1. Create a server-only URL policy helper, for example `src/lib/server/security/url-policy.ts`.
2. Parse URLs with the `URL` constructor.
3. Allow only `https:` by default. Decide whether `http:` is allowed in development only.
4. Reject embedded credentials.
5. Resolve hostnames before connecting.
6. Reject IPs in:
   - `127.0.0.0/8`
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
   - `169.254.0.0/16`
   - `::1`
   - `fc00::/7`
   - `fe80::/10`
   - cloud metadata addresses such as `169.254.169.254`
7. Apply the helper in:
   - add/update server input handling
   - connection testing
   - runtime MCP client creation
8. Add timeout and abort handling wherever supported by the transport library.
9. Add tests for:
   - valid public HTTPS host.
   - `localhost`.
   - `127.0.0.1`.
   - private IPv4.
   - IPv6 loopback.
   - `file:`, `ftp:`, and `http:` in production.
   - URL with username/password.

### Verification

```powershell
bun run typecheck
bun run test -- mcp
bun x ultracite check src/lib/server/routers/mcp.ts src/lib/mcp/client.ts
```

### Done Criteria

- No backend MCP connection is made before URL policy approval.
- Production rejects internal network destinations by default.
- Development exceptions are explicit, documented, and disabled by default.

### Stop Conditions

- Stop if deployment genuinely requires private MCP servers. Add an allowlist mechanism instead of reopening arbitrary egress.

## Phase 6: Serialize Artifact Version Creation

### Why

Appending an artifact version reads the current max version and then inserts max + 1. Concurrent requests can calculate the same next version and race on the unique index.

### Evidence

- `src/lib/db/queries/artifacts.ts` selects the current artifact.
- It then selects the maximum `versionNumber`.
- It calculates `nextVersionNumber = maxVersion + 1`.
- It inserts the new version.
- `src/lib/db/schema/app.ts` has a unique index on `(artifactId, versionNumber)`.

### Scope

In scope:

- Make version allocation safe under concurrent writes.
- Add a concurrency regression test.
- Preserve the existing public artifact API.

Out of scope:

- Redesigning artifact storage.
- Migrating existing artifact content.

### Implementation Steps

1. Inspect the Drizzle transaction capabilities available in this project.
2. Choose one serialization strategy:
   - row lock the parent artifact before reading max version;
   - use a Postgres advisory transaction lock keyed by artifact id;
   - or retry on unique violation with a bounded retry loop.
3. Keep the ownership predicate in the transaction.
4. Ensure `updatedAt` updates only for the authorized artifact.
5. Add tests that issue concurrent append operations for the same artifact and assert sequential version numbers.
6. Add a test that concurrent writes to different artifacts do not block each other unnecessarily if using locks.

### Verification

```powershell
bun run typecheck
bun run test -- artifact
bun x ultracite check src/lib/db/queries/artifacts.ts
```

### Done Criteria

- Concurrent appends produce unique, contiguous version numbers or a documented retry behavior.
- No user can append to another user's artifact.
- Tests cover concurrent writes.

### Stop Conditions

- Stop if tests run against a database that cannot model Postgres locking semantics. Use an integration test database for this phase.

## Phase 7: Limit Audio Transcription Uploads

### Why

The transcription route reads the whole uploaded audio file into memory without checking size, type, or duration. This can create memory pressure and unexpected provider calls.

### Evidence

- `src/lib/server/routers/chat.ts` has a `transcribe` procedure.
- It accepts `FormData`.
- It reads the uploaded file with `Buffer.from(await audioFile.arrayBuffer())`.
- No max byte size, allowed MIME type, or empty-file guard appears before reading the full payload.

### Scope

In scope:

- Add server-side size and MIME validation.
- Reject empty files.
- Return clear client errors.
- Add tests for validation.

Out of scope:

- Building streaming transcription unless provider and product requirements demand it.
- Client-side recording UI changes unless needed to surface errors.

### Implementation Steps

1. Define constants near the route or in a shared config file:
   - `MAX_TRANSCRIPTION_AUDIO_BYTES`
   - `ALLOWED_TRANSCRIPTION_MIME_TYPES`
2. Check that the file exists and is a `File`.
3. Check `audioFile.size` before calling `arrayBuffer`.
4. Check MIME type before reading.
5. Reject zero-byte files.
6. Optionally check extension only as a secondary signal, not as security.
7. Return `TRPCError` with a stable code and safe message.
8. Add tests for:
   - missing file.
   - empty file.
   - oversized file.
   - unsupported MIME type.
   - valid small audio file.

### Verification

```powershell
bun run typecheck
bun run test -- transcribe
bun x ultracite check src/lib/server/routers/chat.ts
```

### Done Criteria

- Oversized and unsupported files are rejected before buffering.
- Error messages are user-safe.
- Tests cover boundary sizes.

### Stop Conditions

- Stop if platform-level body size limits already reject uploads first. Document them and still keep route-level validation for defense in depth.

## Phase 8: Sanitize MCP Tool Identifiers

### Why

Tool names are composed from a user-controlled server display name and a remote tool name. Those names may include spaces, punctuation, Unicode, collisions, or model/tool-call-invalid characters.

### Evidence

- `src/lib/server/routers/mcp.ts` accepts server `name` as any non-empty string up to 255 characters.
- `src/lib/mcp/client.ts` builds `const prefixedName = \`mcp_${server.name}_${toolName}\`` and uses it as an object key.

### Scope

In scope:

- Separate display names from internal tool identifiers.
- Slugify or encode identifiers into a stable allowed character set.
- Detect collisions.
- Preserve a mapping back to server id and original tool name.

Out of scope:

- Changing the user-visible server naming UX unless necessary.

### Implementation Steps

1. Define an identifier policy, such as `/^[a-zA-Z0-9_-]{1,64}$/`.
2. Create a helper that converts `{ serverId, serverName, toolName }` into a safe internal id.
3. Prefer stable ids based on server id plus sanitized tool name over display name.
4. If sanitization causes collisions, append a short deterministic hash.
5. Keep display name metadata separately for UI rendering.
6. Add tests for:
   - spaces and punctuation.
   - Unicode names.
   - duplicate names after sanitization.
   - very long names.

### Verification

```powershell
bun run typecheck
bun run test -- mcp
bun x ultracite check src/lib/mcp/client.ts
```

### Done Criteria

- All generated tool identifiers satisfy the chosen regex.
- Collisions are deterministic and tested.
- Display names remain intact for humans.

### Stop Conditions

- Stop if downstream AI SDK tooling imposes a different schema. Use the stricter downstream schema.

## Phase 9: Finish Research Agent Wiring

### Why

The repo contains a research agent prompt and UI affordance, but chat prompt routing appears to send all selected agents through a generic agent prompt. This makes the research mode look partially implemented.

### Evidence

- `TODO.md` lists `Research Agent`.
- `src/components/mode-selector-rows.tsx` includes `AGENT_KEYS = ["research"]`.
- `src/lib/ai/prompts/research.ts` defines `ResearchAgentPrompt`.
- `src/app/api/chat/_lib/prompt.ts` routes `mode === "agent" && selectedAgent` to a generic `AgentModePrompt`.

### Scope

In scope:

- Confirm intended behavior for research mode.
- Wire the research prompt when `selectedAgent === "research"`.
- Add tests for prompt selection.
- Ensure UI labels and mode ids stay consistent.

Out of scope:

- Creating additional agents.
- Major agent orchestration changes.

### Implementation Steps

1. Search all selected-agent values and ensure `"research"` is the canonical key.
2. Add a prompt selection map keyed by agent id.
3. Route research to `ResearchAgentPrompt`.
4. Preserve a generic fallback for unknown or future agent ids only if product wants it.
5. Add tests for:
   - default chat prompt.
   - generic agent prompt if still supported.
   - research agent prompt.
   - unknown agent behavior.

### Verification

```powershell
bun run typecheck
bun run test -- prompt
bun x ultracite check src/app/api/chat/_lib/prompt.ts src/lib/ai/prompts/research.ts
```

### Done Criteria

- Selecting the research agent produces the research prompt.
- Prompt selection behavior is covered by tests.
- Unknown agent behavior is explicit.

### Stop Conditions

- Stop if product intentionally wants research to use the generic prompt. In that case, remove dead prompt code or document the future work.

## Phase 10: Add Onboarding And Environment Documentation

### Why

The README does not explain setup, required services, environment variables, database migration flow, or verification commands. This increases onboarding cost and makes automated agents more likely to guess.

### Evidence

- `README.md` is a short product description with screenshots.
- No `.env.example` was identified during the audit.
- The runtime depends on database, auth secrets, AI providers, blob storage, Redis, and other external services.

### Scope

In scope:

- Add `.env.example` with names only and safe placeholder values.
- Update README setup steps.
- Document verification commands.
- Document local database migration flow.

Out of scope:

- Publishing real credentials.
- Writing production deployment runbooks.

### Implementation Steps

1. Inventory `process.env` usage across the repo.
2. Create `.env.example` with placeholders only.
3. Update README with:
   - prerequisites
   - install command
   - local environment setup
   - database migration commands
   - dev server command
   - verification commands
4. Group optional provider variables separately from required variables.
5. Include a short note that `.env` is ignored and must not be committed.

### Verification

```powershell
bun install
bun run typecheck
bun run lint
```

### Done Criteria

- A new contributor can start the app without reading source code.
- Required and optional environment variables are clearly separated.
- No secrets appear in docs.

### Stop Conditions

- Stop if an environment variable's purpose is unclear. Mark it as unknown and ask the maintainer rather than inventing semantics.

## Suggested Commit Breakdown

1. `chore: add verification baseline`
2. `fix: authorize chat deletion before child cleanup`
3. `fix: authorize chat message saves`
4. `chore: update vulnerable dependencies`
5. `fix: redact chat request logs`
6. `fix: enforce mcp url egress policy`
7. `fix: serialize artifact version creation`
8. `fix: validate transcription uploads`
9. `fix: sanitize mcp tool identifiers`
10. `docs: add setup and environment guide`
11. `feat: wire research agent prompt`

Prefer one PR per P1 fix if the team wants fast review. Keep dependency updates separate from behavior changes.

## Final Acceptance Checklist

- `bun run typecheck` passes.
- `bun run test` passes.
- `bun run lint` passes or has only documented legacy diagnostics with tracked issues.
- `bun run audit` has no critical/high direct dependency vulnerabilities.
- CI runs all required checks.
- Chat delete cannot mutate another user's data.
- Chat message save cannot insert or update messages in another user's chat.
- Production chat request logs do not include raw prompt text or plain user ids.
- MCP URLs cannot reach private/internal network destinations by default.
- Artifact concurrent version appends are deterministic.
- Transcription rejects unsupported and oversized files before buffering.
- MCP tool identifiers are stable, safe, and collision-resistant.
- README and `.env.example` allow safe local setup without exposing secrets.
