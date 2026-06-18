# Model Catalog and Server Runtime Handoff

## Status

- **State:** Ready for implementation
- **Written against commit:** `d3c2424`
- **Date:** 2026-06-15
- **Scope:** Refactor the model catalog/runtime boundary only
- **Primary files:** `src/lib/ai/model-metadata.ts`, `src/lib/ai/models.ts`

## Objective

Simplify model configuration so the application has one canonical list of
supported models, an obvious server-only runtime module, and no legacy model ID
mapping or model ID resolution layer.

The finished design must make adding, removing, or changing a model a
single-definition operation. Client code must never import provider SDKs or
provider instances. Server execution code must consume runtime models derived
from the canonical catalog.

## Non-Negotiable Product Decisions

1. Remove the legacy model ID map completely.
2. Remove `normalizeModelId` completely.
3. Do not replace it with `resolveModelId`, aliases, migrations, compatibility
   maps, chained fallbacks, or another model ID transformation helper.
4. Model IDs are exact identifiers. A requested ID either exists in the
   available catalog or it does not.
5. Keep one canonical model definition list.
6. Preserve the production availability rule:
   - non-production exposes every configured model;
   - production exposes models with `enabledInProduction: true`;
   - the configured default must always be a valid available model.
7. Provider SDK imports and instantiated `LanguageModel` values are server-only.
8. Do not remove the user's uncommitted `Nex AGI: Nex-N2-Pro` model addition.

## Current State

### Canonical metadata

`src/lib/ai/model-metadata.ts` currently owns:

- model metadata and capability types;
- the model definition array;
- environment-dependent availability filtering;
- model lookup;
- fallback behavior;
- a broken reference to the deleted `legacyModelIdMap`.

The user has already removed the legacy map from this file, but
`normalizeModelId` still references it. `bun run typecheck` currently fails:

```text
src/lib/ai/model-metadata.ts(226,3): error TS2304:
Cannot find name 'legacyModelIdMap'.
src/lib/ai/model-metadata.ts(226,44): error TS2304:
Cannot find name 'legacyModelIdMap'.
```

### Server runtime

`src/lib/ai/models.ts` imports every provider SDK, derives runtime models from
the metadata list, and duplicates availability filtering and lookup.

It does not currently import `"server-only"`, even though it constructs provider
instances and imports `src/lib/ai/providers.ts`, which is server-only.

### Consumers

Client-facing consumers currently import `src/lib/ai/model-metadata.ts`:

- `src/components/model-selector.tsx`
- `src/lib/store/slices/model.slice.ts`

Preference serialization also imports it:

- `src/lib/store/prefs-codec.ts`

Server runtime consumers currently import `src/lib/ai/models.ts`:

- `src/app/api/chat/route.ts`
- `src/app/api/chat/_lib/provider-options.ts`
- `src/app/api/chat/_lib/request-logger.ts`

## Target Architecture

Use these names:

### `src/lib/ai/models.ts`

This becomes the canonical, provider-SDK-free model catalog.

It is safe for client bundles and shared preference code. It is not marked with
`"use client"` because the server runtime must derive its instances from this
same source of truth. Treat it as the public catalog used by client-facing code,
not as a React Client Component module.

It owns:

- `InputModality`
- `OutputModality`
- `ModelCapabilities`
- the catalog model type, preferably named `ModelDefinition`
- the single canonical model definition array
- production availability filtering
- exact ID lookup
- exact ID validation/type guard if useful

Suggested public API:

```ts
export type ModelId = (typeof models)[number]["id"];

export const models = [/* canonical definitions */] as const satisfies
	readonly ModelDefinition[];

export const availableModels = /* filter models once */;

export const getModel = (modelId: string): ModelDefinition | undefined =>
	availableModels.find((model) => model.id === modelId);

export const isModelId = (modelId: string): modelId is ModelId =>
	models.some((model) => model.id === modelId);
```

Names may be adjusted to satisfy TypeScript inference and Ultracite, but the
behavior must remain exact-match only.

### `src/lib/ai/models.server.ts`

This becomes the explicit server-only runtime module.

It must begin with:

```ts
import "server-only";
```

It owns:

- provider SDK imports;
- provider-to-SDK construction;
- the runtime model type;
- runtime instances derived from `availableModels`;
- exact runtime lookup.

Suggested public API:

```ts
export interface RuntimeModel extends ModelDefinition {
	instance: LanguageModel;
}

export const runtimeModels = availableModels.map(/* instantiate */);

export const getRuntimeModel = (
	modelId: string
): RuntimeModel | undefined =>
	runtimeModels.find((model) => model.id === modelId);
```

Do not re-filter the full catalog in this file. Derive runtime instances from
the already-filtered `availableModels` exported by `models.ts`.

## Default Model Invariant

`src/lib/ai/defaults.ts` currently declares:

```ts
export const DEFAULT_MODEL_ID = "gemini-flash-latest" as const;
```

Keep this constant unless restructuring it clearly improves compile-time
validation without creating an import cycle.

The implementation must guarantee:

- `DEFAULT_MODEL_ID` exactly matches one catalog entry;
- that entry remains available in production;
- an invalid default fails loudly during development/build rather than silently
  selecting the first model.

Do not retain the current `availableModels[0]` fallback. Ordering the catalog
must not alter the application's default model.

A small invariant check is acceptable:

```ts
const defaultModel = models.find(
	(model) => model.id === DEFAULT_MODEL_ID
);

if (!defaultModel) {
	throw new Error(`Default model is not configured: ${DEFAULT_MODEL_ID}`);
}
```

If the default is configured but disabled in production, prefer treating that
as a configuration error instead of overriding the availability rule.

## Invalid and Stale IDs

There must be no conversion from an old ID to a current ID.

Required behavior:

- exact current ID: accepted;
- unknown or removed ID: not found;
- legacy ID: not found;
- provider ID spelling error: not found.

Preference parsing may default an invalid persisted preference to
`DEFAULT_MODEL_ID`, but that is input validation, not ID resolution. If this is
implemented:

- validate membership by exact match;
- do not map the invalid value to a related model;
- do not preserve aliases;
- keep the behavior localized to the preference parsing boundary;
- ensure the serialized state contains only a valid exact ID.

The API boundary must continue rejecting unknown IDs as a bad request. It must
not silently execute a different model.

## Implementation Steps

### 1. Protect Existing Work

Before editing, inspect:

```powershell
git status --short
git diff -- src/lib/ai/model-metadata.ts src/lib/ai/models.ts
```

The working tree already contains unrelated modifications. Do not revert them.
In particular, preserve the uncommitted Nex-N2-Pro catalog entry.

### 2. Rename the Modules

Perform these semantic renames:

- `src/lib/ai/model-metadata.ts` -> `src/lib/ai/models.ts`
- existing `src/lib/ai/models.ts` -> `src/lib/ai/models.server.ts`

Take care with the name collision. Move the existing server file first or use
another non-destructive sequence.

Do not introduce an `index.ts` barrel.

### 3. Simplify the Canonical Catalog

In the new `src/lib/ai/models.ts`:

- retain the full model list and metadata;
- retain the Nex-N2-Pro entry;
- delete `legacyModelIdMap`;
- delete `normalizeModelId`;
- delete fallback model selection;
- make `getModel` an exact lookup;
- calculate `availableModels` only here;
- use readonly inference where practical;
- validate the default model invariant;
- use explicit return types where they improve clarity.

Avoid widening provider values to arbitrary strings if a provider union can be
derived or declared cleanly. The provider type should constrain the server
factory switch.

### 4. Make Runtime Construction Server-Only

In `src/lib/ai/models.server.ts`:

- add `import "server-only";` as the first import;
- import `availableModels` and catalog types from `@/lib/ai/models`;
- retain the provider SDK construction switch;
- derive `runtimeModels` from `availableModels`;
- remove duplicate `NODE_ENV` filtering;
- remove imports of `DEFAULT_MODEL_ID`;
- remove all normalization exports;
- expose an exact `getRuntimeModel`;
- throw descriptively for an unsupported provider.

The canonical catalog remains the only place where model records are entered.

### 5. Update Client and Shared Consumers

Update imports from `@/lib/ai/model-metadata` to `@/lib/ai/models`.

`src/components/model-selector.tsx`:

- use `availableModels` from the catalog;
- use exact `getModel`;
- remove `normalizeModelId`;
- do not silently choose `availableModels[0]`;
- ensure the selected ID entering the component/store has already been
  validated;
- keep the existing model grouping and capability UI behavior.

`src/lib/store/slices/model.slice.ts`:

- remove normalization calls;
- initialize with `DEFAULT_MODEL_ID`;
- type `modelId` and `setModelId` with `ModelId` where this does not force unsafe
  casts at UI boundaries;
- reject or ignore invalid arbitrary strings rather than transforming them.

`src/lib/store/prefs-codec.ts`:

- remove normalization calls;
- validate persisted `modelId` using exact catalog membership;
- use `DEFAULT_MODEL_ID` when the persisted value is absent or invalid;
- serialize the already-valid ID unchanged.

Do not add a compatibility migration for old model IDs.

### 6. Update Server Consumers

Update runtime imports:

- `src/app/api/chat/route.ts` imports `getRuntimeModel` from
  `@/lib/ai/models.server`;
- `src/app/api/chat/_lib/provider-options.ts` imports `RuntimeModel` from
  `@/lib/ai/models.server`;
- `src/app/api/chat/_lib/request-logger.ts` imports `ModelCapabilities` from
  `@/lib/ai/models`, because capabilities are catalog metadata and do not
  require server runtime imports.

In the chat route, preserve the existing bad-request behavior for an unknown
model ID. Update local naming only where it makes runtime/catalog distinction
clear.

### 7. Remove the Old Module

Confirm there are no remaining imports or references:

```powershell
rg -n "model-metadata|normalizeModelId|legacyModelIdMap" src
```

Expected result: no matches.

Also confirm server runtime imports are appropriately scoped:

```powershell
rg -n "models\.server" src
```

Expected result: only server/API modules import it. No file containing
`"use client"` may import `models.server.ts`.

## Tests

The repository currently has no established unit-test suite. Do not introduce a
new test framework solely for this refactor.

Verification should cover these behaviors through type checking, static search,
and existing application checks:

1. The default ID exists exactly in the catalog.
2. Production availability contains only production-enabled entries.
3. Exact valid IDs return their corresponding catalog/runtime model.
4. Unknown IDs return `undefined`.
5. Former legacy IDs return `undefined`.
6. Invalid persisted preference IDs become the configured default without alias
   conversion.
7. Client modules cannot pull provider SDKs into their dependency graph.
8. Every runtime model is derived from an available catalog entry.

If a lightweight existing test pattern is discovered while implementing, add
focused tests for catalog lookup and preference parsing. Otherwise do not widen
the task.

## Verification Gates

Run in this order:

```powershell
bun run typecheck
bun run lint
bun run build
```

Expected:

- all commands exit successfully;
- no missing `legacyModelIdMap` error;
- no client/server boundary error from Next.js;
- no unsupported provider error during build;
- no remaining normalization or legacy mapping references.

Then run:

```powershell
rg -n "model-metadata|normalizeModelId|legacyModelIdMap" src
rg -n "from \"@/lib/ai/models.server\"" src
git diff --check
git diff -- src/lib/ai src/components/model-selector.tsx src/lib/store src/app/api/chat
```

Review the final diff to confirm:

- model entries appear in one source list only;
- availability filtering appears once only;
- provider instantiation appears only in `models.server.ts`;
- no unrelated user changes were reverted;
- the Nex-N2-Pro entry remains present.

## Files In Scope

- `src/lib/ai/model-metadata.ts` (rename/remove)
- `src/lib/ai/models.ts` (replace with canonical catalog)
- `src/lib/ai/models.server.ts` (new name for server runtime)
- `src/lib/ai/defaults.ts` only if needed for a clean invariant
- `src/components/model-selector.tsx`
- `src/lib/store/prefs-codec.ts`
- `src/lib/store/slices/model.slice.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/chat/_lib/provider-options.ts`
- `src/app/api/chat/_lib/request-logger.ts`

## Explicitly Out of Scope

- changing which models are enabled in production;
- changing model names, IDs, modalities, or capabilities;
- changing provider credentials or provider configuration;
- adding model discovery from external APIs;
- changing chat streaming behavior;
- migrating unrelated preference fields;
- adding legacy compatibility;
- broad store refactors;
- changing database code;
- modifying screenshots or unrelated documentation.

## Risks and Mitigations

### Client/server import leakage

Risk: provider SDKs or environment-dependent provider setup enter a client
bundle.

Mitigation: put all provider imports behind `models.server.ts`, mark it with
`server-only`, and inspect imports from client components.

### Silent model substitution

Risk: stale or invalid IDs execute a different model, obscuring configuration
errors.

Mitigation: exact lookup only at the API/runtime boundary. Preference parsing
may choose the explicit default only after rejecting an invalid persisted
value.

### Default unavailable in production

Risk: the configured default is hidden by production filtering.

Mitigation: assert the invariant explicitly. Do not append the default as an
exception to filtering and do not select the first available model.

### Loss of uncommitted user work

Risk: renaming files overwrites the user's current model list edits.

Mitigation: inspect and preserve the working diff before moving files. Verify
the Nex-N2-Pro entry after the refactor.

## Done Criteria

The task is complete only when all statements are true:

- `model-metadata.ts` no longer exists.
- `models.ts` is the single canonical, provider-free catalog.
- `models.server.ts` is explicitly server-only.
- model entries are defined once.
- availability filtering is defined once.
- no legacy ID map exists.
- no normalization or resolution helper exists.
- exact unknown IDs are not mapped to another model.
- persisted invalid IDs are validated at the preference boundary.
- server runtime models are derived from the available catalog.
- all import sites use names matching their responsibility.
- `bun run typecheck`, `bun run lint`, and `bun run build` pass.
- unrelated working-tree changes remain intact.

## Suggested Skills

The implementing agent should invoke:

- `diagnose` if client/server boundary or build failures appear;
- `vercel-react-best-practices` for any non-trivial changes to the model
  selector;
- `react-doctor` after changing React code and before finalizing;
- `review` for a final scope and standards check.

