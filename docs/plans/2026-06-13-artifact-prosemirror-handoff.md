# Handoff: Artifact Workspace & ProseMirror Improvements

> **Purpose**: A fresh agent picks this up and executes 4 fixes across the artifact workspace, ProseMirror editor, and streaming state management — in one PR with atomic commits.
>
> **Audit source**: See `implementation_plan.md` in the conversation artifacts for the full 9-finding audit (commit `d3c2424`). This handoff covers the 4 approved findings plus a revised Finding 3 (wire toolbar back in, not delete).

---

## Context

**Project**: Backpack — a Next.js 16 AI chat app with artifact workspace (ProseMirror-based rich text editor for streamed AI-generated content).

**Key files** (all paths relative to repo root):

| File | Role |
|------|------|
| `src/components/artifacts/rich-text-editor.tsx` | ProseMirror editor component (516 lines) |
| `src/components/artifacts/text-artifact.tsx` | Artifact viewer/editor with header, toolbar toggle, diff view (596 lines) |
| `src/components/artifacts/artifact-workspace.tsx` | Workspace shell — queries, state, delegates to TextArtifact (303 lines) |
| `src/components/artifacts/use-artifact-stream-state.ts` | React hook that processes dataStream into ArtifactSnapshot (177 lines) |
| `src/lib/artifacts/client-stream-state.ts` | Pure reducer for artifact stream events (141 lines) |
| `src/lib/artifacts/types.ts` | Type definitions for artifact stream events (60 lines) |

**Tech stack**: React 19, Next.js 16, ProseMirror (prosemirror-{model,state,view,commands,markdown,tables,inputrules,example-setup}), Immer, TanStack Query, tRPC, motion/react, Tailwind CSS 4.

**Package manager**: `bun`

**Verification commands**:

| Purpose | Command | Expected |
|---------|---------|----------|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Lint fix | `bun run lint:fix` | exit 0 |
| Build | `bun run build` | exit 0 |

**Coding standards**: See `AGENTS.md` in repo root. Key rules: use `const`/`let` never `var`, arrow functions for callbacks, `for...of` over `.forEach()`, avoid spread in accumulators, use Immer for immutable updates, React function components with hooks.

---

## Decisions (resolved during design interview)

| Decision | Resolution |
|----------|------------|
| Scope | 4 findings: streaming perf, toolbar restoration, Immer reducer, snapshot cleanup. **Skip** Finding 4 (keep `prosemirror-example-setup`). |
| Streaming strategy | **Append-only insert** during streaming; keep full-replace for version restores and non-streaming external updates. |
| Dead toolbar code | **Wire it back in** — the toolbar was disabled by mistake, not intentionally removed. |
| Toolbar items | All items: Bold, Italic, Code, Paragraph, H1, H2, Bullet list, Ordered list, Blockquote, Table insert/toggle header/delete, Add column/row, Delete column/row. |
| Toolbar position | **Top toolbar**, below the header, traditional word-processor style. |
| Toolbar during streaming | **Show but disable all buttons** — user sees the shape, buttons are grayed out. |
| `prosemirror-example-setup` | **Keep it** — it works, don't touch it. |
| Snapshot cleanup | **Clear `content` to `""` on `finish` event** — keep the snapshot entry for status tracking. |
| Spread-in-loop fix | **Use Immer `produce()`** — project already depends on `immer@^11.1.8`. |
| Git workflow | **One PR, atomic commits** — one commit per finding, squash-merge. |

---

## Execution order

The commits must land in this order within the PR:

### Commit 1: Wire toolbar back into `RichTextEditor`

**What**: Restore the toolbar that was disabled by mistake. The `EditorToolbarButton` component, `useEditorToolbarItems` hook, `runCommand`, `canRunCommand`, `isMarkActive`, `isTextblockActive`, and `isWrappedInNode` utility functions already exist in `rich-text-editor.tsx` but are never rendered.

**Changes to `src/components/artifacts/rich-text-editor.tsx`**:

1. In `PureRichTextEditor`, add a toolbar `<div>` above the editor container (between the `<section>` opening tag and the `.rich-text-editor` div). Position it as a top bar below the artifact header.
2. Map `toolbarItems` (from the existing `useEditorToolbarItems` hook) and render `<EditorToolbarButton>` for each. 
3. Add table column/row operations to the toolbar items array — `addColumnAfter`, `addRowAfter`, `deleteColumn`, `deleteRow` are already imported but not in the items list.
4. During streaming (`status === "streaming"`), render the toolbar but disable all buttons. Use the existing `canRunCommand` to determine disabled state, AND-ed with `status !== "streaming"`.
5. Keep `forceToolbarUpdate` — it's now needed again since the toolbar reads active-mark state from the editor view.

**Toolbar layout guidance**:
- Use a horizontal flex row with `gap-1`, `px-3 py-1.5`, `border-b`, matching the existing `bg-card dark:bg-neutral-900` theme.
- Group items visually: `[Paragraph | H1 | H2] | [Bold | Italic | Code] | [Bullet | Ordered | Quote] | [Table ops]` with small separators between groups.
- Table column/row operations should only be visible when the cursor is inside a table (use `isInTable(view.state)` from `prosemirror-tables`).

**Verification**: Build the app (`bun run build`), open an artifact, confirm toolbar is visible with all buttons, confirm buttons are disabled during streaming.

---

### Commit 2: Append-only streaming for ProseMirror editor

**What**: During streaming, instead of re-parsing the entire markdown and doing `replaceWith(0, doc.content.size, newContent)`, parse only the new content delta and insert it at the end of the document.

**Changes to `src/components/artifacts/rich-text-editor.tsx`**:

1. Track the last-known streaming content length in a ref: `const streamContentLengthRef = useRef(0)`.

2. In the `content` sync effect (currently lines 430-451), split into two paths:

   **Streaming path** (when `status === "streaming"`):
   ```
   - Compare content.length vs streamContentLengthRef.current
   - If content is longer, extract the delta: content.slice(streamContentLengthRef.current)
   - Parse only the delta via parseMarkdownDocument(delta)
   - Insert at the end: tr.insert(view.state.doc.content.size, parsedDelta.content)
   - Set meta "external" to true
   - Update streamContentLengthRef.current = content.length
   - Update latestContentRef.current = content
   ```

   **Non-streaming path** (idle — version restores, initial load):
   ```
   - Keep the existing full-replace logic
   - Reset streamContentLengthRef.current = 0
   ```

3. When streaming starts (status transitions from "idle" to "streaming"), reset `streamContentLengthRef.current = content.length` to establish the baseline for delta tracking.

4. When streaming ends (status transitions from "streaming" to "idle"), do one final full-replace to ensure the document is perfectly in sync with the final content (corrects any markdown-parsing edge cases from the incremental inserts).

**Important edge case**: The delta string may contain a partial markdown construct (e.g., half a table row). `parseMarkdownDocument` will fall back to wrapping it in a paragraph. This is acceptable during streaming — the final full-replace on stream finish corrects it.

**Verification**: 
- `bun run build` succeeds.
- Manually test: start a chat, trigger an artifact stream, confirm content appears incrementally without visible jank.
- Test with a large artifact (paste 200+ lines of markdown, ask AI to rewrite it) — confirm no stutter during streaming.

---

### Commit 3: Use Immer `produce()` in `reduceArtifactStreamEvents`

**What**: Replace the spread-in-loop pattern in `client-stream-state.ts` with Immer's `produce()`.

**Changes to `src/lib/artifacts/client-stream-state.ts`**:

1. Add import: `import { produce } from "immer"`.

2. Rewrite `reduceArtifactStreamEvents`:
   ```typescript
   export function reduceArtifactStreamEvents({
     state,
     events,
   }: {
     state: ArtifactStreamState;
     events: ArtifactStreamEvent[];
   }): ArtifactStreamUpdateResult {
     const finishedArtifactIds: string[] = [];
     const errorMessages: string[] = [];

     const nextState = produce(state, (draft) => {
       for (const event of events) {
         switch (event.event) {
           case "open": {
             draft.openArtifactId = event.artifactId;
             draft.snapshots[event.artifactId] = {
               artifactId: event.artifactId,
               chatId: event.chatId,
               kind: event.kind,
               title: event.title,
               content: event.content,
               status: event.status,
               versionNumber: event.versionNumber,
             };
             break;
           }
           case "delta": {
             const existing = draft.snapshots[event.artifactId];
             if (!existing) break;
             existing.content += event.delta;
             existing.status = "streaming";
             break;
           }
           case "finish": {
             const existing = draft.snapshots[event.artifactId];
             if (!existing) break;
             existing.content = "";  // Clear content — server version replaces it
             existing.status = "idle";
             existing.versionNumber = event.versionNumber;
             finishedArtifactIds.push(event.artifactId);
             break;
           }
           case "error": {
             errorMessages.push(event.message);
             if (!event.artifactId) break;
             const existing = draft.snapshots[event.artifactId];
             if (!existing) break;
             existing.status = "idle";
             break;
           }
           default:
             break;
         }
       }
     });

     return { state: nextState, finishedArtifactIds, errorMessages };
   }
   ```

3. Note: the `finish` case now also clears `content` to `""` — this is the snapshot cleanup from Finding 7, bundled into this commit since we're already rewriting the reducer.

**Verification**: `bun run typecheck && bun run lint && bun run build` all pass. Manually test a full artifact stream lifecycle (open → stream → finish → re-open) to confirm content loads correctly from the server after streaming finishes.

---

### Commit 4: Snapshot content cleanup on finish (already done in Commit 3)

This is bundled into Commit 3. The `finish` case in the Immer reducer sets `existing.content = ""` instead of `existing.content = event.content`.

**Important**: Verify that `artifact-workspace.tsx` does NOT read `snapshot.content` after `status` becomes `"idle"`. Check lines 203-206 — `sourceContent` reads `snapshot.content` only when `snapshot.artifactId === openArtifactId`, and the parent falls through to `latestVersion?.content ?? ""` when the snapshot content is empty. The `ArtifactWorkspaceSession` at line 207 uses `draftContent ?? sourceContent` — so when `sourceContent` is `""` and `latestVersion` hasn't loaded yet, the editor will briefly show empty content. This is acceptable because:

1. The `trpc.artifact.getById` query is already being invalidated on `onArtifactFinished` (see `chat.tsx:138`).
2. The query should resolve quickly since the data was just written.

If a flash of empty content is unacceptable, keep `existing.content = event.content` (the full content from the finish event) and add a cleanup timer that clears it after 5 seconds.

---

## STOP conditions

Stop and report back if:

- The ProseMirror document becomes visually corrupted during streaming (characters out of order, duplicate content).
- `parseMarkdownDocument` throws on a delta string during append-only streaming — the fallback paragraph wrapper should handle this, but if it doesn't, STOP.
- The toolbar buttons cause the editor to lose focus or the cursor to jump unexpectedly.
- `bun run typecheck` reports type errors after the Immer refactor.
- Any file outside the scope list needs modification.

## Scope

**In scope** (the only files to modify):
- `src/components/artifacts/rich-text-editor.tsx`
- `src/lib/artifacts/client-stream-state.ts`

**Out of scope** (do NOT touch):
- `src/components/artifacts/text-artifact.tsx` — no changes needed
- `src/components/artifacts/artifact-workspace.tsx` — no changes needed
- `src/lib/artifacts/types.ts` — no type changes
- `src/components/artifacts/use-artifact-stream-state.ts` — no changes needed
- `prosemirror-example-setup` — explicitly decided to keep it
- Any server-side artifact code

## Suggested skills

The executing agent should invoke these skills if available:

- **`vercel-react-best-practices`** — when wiring the toolbar, ensure hook dependency arrays are correct and no unnecessary re-renders are introduced.
- **`baseline-ui`** — when styling the toolbar, validate animation durations, typography, and component accessibility.
- **`fixing-accessibility`** — the toolbar buttons need proper `aria-label`, `aria-pressed`, and keyboard navigation.
- **`react-doctor`** — run after all changes to scan for React diagnostics and lint issues.
- **`diagnose`** — if streaming corruption is observed during testing.

## References

- **ProseMirror Guide**: https://prosemirror.net/docs/guide/ — especially the "Data flow" section on `dispatchTransaction` and `updateState`.
- **Full audit**: Conversation `a6c31ac6-1b34-4f05-a193-52d5315d153b`, artifact `implementation_plan.md`.
- **Domain glossary**: `CONTEXT.md` in repo root — defines Artifact, Artifact Stream, Artifact Snapshot, Artifact Workspace.
- **Coding standards**: `AGENTS.md` in repo root.
