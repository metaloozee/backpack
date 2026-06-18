# Artifact Targeted Edit Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make artifact create, targeted update, targeted delete, and explicit rewrite behavior match the human editing model: create can stream a new document; update/delete identify relevant document regions and patch only those regions; rewrite is a separate explicit full-document operation; update/delete/rewrite hydrate the editor once with final content.

**Architecture:** Keep full artifact versions in the database, but stop treating every AI edit as a full-document stream. Add a server-side markdown section indexer and patch applier, use structured AI output for targeted edit/delete operations, add a separate rewrite tool for explicit full-document rewrites, stream progress/status events instead of replacement text for update/delete/rewrite, and only send the final full document on `finish`.

**Tech Stack:** Next.js 16, React 19, TypeScript, AI SDK (`streamText`, `generateObject`/structured output), Zod, Drizzle/Postgres, TanStack Query, ProseMirror, Streamdown, Bun test.

---

## Current Verified Problem

The update path currently sends the existing document, asks the model for a complete revised document, and appends streamed deltas to the existing snapshot:

- `src/lib/ai/tools/artifacts.ts:173` sends `content: latestVersion.content` on `open`.
- `src/artifacts/text/server.ts:72` prompts: `Return the complete revised artifact content.`
- `src/lib/artifacts/client-stream-state.ts:68` appends each streamed delta with `existing.content += event.delta`.

That means update streaming renders:

```txt
old document + new full replacement document streaming from scratch
```

This is the wrong backend contract for human-like editing.

---

## Target Behavior

### Create artifact

- Backend creates an empty artifact shell.
- Backend streams generated markdown into a read-only preview.
- Backend saves final complete markdown as version 1.
- Client hydrates ProseMirror only after `finish`.

### Update artifact

- Assistant only calls the update tool when the target and intent are clear.
- Clear target means at least one of: named section/heading, quoted/exact text, structural target such as “intro”/“conclusion”/“first paragraph”/“last bullet”, or another unambiguous locator.
- If the user says something broad like “make this better” and the target is not clear, the assistant asks whether they want a targeted patch or full rewrite before calling any artifact tool.
- Backend loads the latest full version.
- Backend builds a markdown section index and finds candidate target sections.
- Backend asks the model for structured patch operations against those sections.
- Backend applies patches deterministically to the original content.
- Backend saves the final full content as the next version.
- Client keeps current content visible while streaming status/progress.
- Client hydrates ProseMirror once from the final `finish.content`.

### Delete artifact content

- Delete means remove a targeted section/range inside the artifact, not delete the artifact database row.
- Assistant only calls the delete-content tool when the target is clear.
- Backend identifies the requested section/range.
- Backend generates or validates a structured delete operation.
- Backend applies deletion server-side and saves a new full version.
- Client shows the current artifact with “AI is deleting…” status until final hydration.

Whole-artifact deletion is intentionally out of scope for this plan because it is destructive and should use a separate explicit UI/API.

### Rewrite artifact

- Rewrite means explicitly regenerate the whole artifact document.
- It is only allowed when the user explicitly asks for a full rewrite/restructure or confirms that broad intent after the assistant asks.
- Rewrite uses a separate `rewrite_text_artifact` tool, not `update_text_artifact`.
- Client keeps the old document stable with “AI is rewriting…” status while the backend generates the new full document.
- Backend saves the rewritten full content as a new version automatically.
- Client hydrates ProseMirror once from `finish.content`.

---

## Files to Create or Modify

### Create

- `src/lib/artifacts/markdown-sections.ts`
  - Parse markdown into a root section plus ATX heading sections.
  - Produce stable per-request section IDs, heading paths, char offsets, and snippets.

- `src/lib/artifacts/text-patches.ts`
  - Define structured operations for update/delete.
  - Apply operations deterministically.
  - Validate operation targets and size limits.

- `src/artifacts/text/edit-server.ts`
  - Build candidate section context.
  - Call AI SDK structured output to generate patch operations.
  - Apply patches and return final content plus operation summary.

- `src/artifacts/text/rewrite-server.ts`
  - Generate explicit full-document rewrites without streaming replacement text to the client.
  - Return final content plus summary for finish hydration.

- `src/lib/artifacts/markdown-sections.test.ts`
  - Unit tests for markdown section indexing.

- `src/lib/artifacts/text-patches.test.ts`
  - Unit tests for patch application and failure cases.

- `src/lib/artifacts/client-stream-state.test.ts`
  - Unit tests for create/update/delete stream reducer behavior.

### Modify

- `src/lib/artifacts/types.ts`
  - Extend artifact stream event schema with operation kind and progress events.

- `src/lib/artifacts/client-stream-state.ts`
  - Track operation kind.
  - Append deltas only for create operations.
  - Preserve current content for update/delete while status is streaming.

- `src/components/artifacts/use-artifact-stream-state.ts`
  - Continue flushing deltas, but pass progress/update/delete events through immediately.

- `src/components/artifacts/artifact-workspace.tsx`
  - Pass operation/progress metadata to `TextArtifact`.

- `src/components/artifacts/text-artifact.tsx`
  - Render create streaming preview only for create.
  - Render read-only current content plus editing/deleting status for update/delete.

- `src/artifacts/text/server.ts`
  - Keep create streaming helper.
  - Remove full-document update prompt from the update path.

- `src/lib/ai/tools/artifacts.ts`
  - Update `updateTextArtifactTool` to call targeted edit server.
  - Add `deleteTextArtifactContentTool` for targeted content deletion.
  - Add `rewriteTextArtifactTool` for explicit whole-document rewrites.
  - Emit progress events for planning, patching, rewriting, saving.

- `src/lib/ai/prompts/agent.ts`
  - Explain when to use create/update/delete artifact tools.

- `src/lib/ai/prompts/ask.ts`
  - Same tool-selection guidance as agent prompt.

- `src/lib/ai/tools/index` or wherever chat tools are assembled
  - Register the delete-content and rewrite artifact tools.
  - Find exact file with `rg "createTextArtifactTool|updateTextArtifactTool" src` during implementation.

---

## Public Contracts

### Artifact operation kind

```ts
export type ArtifactOperationKind = "create" | "update" | "delete" | "rewrite";
```

### Artifact stream events

```ts
export type ArtifactStreamEvent =
  | {
      event: "open";
      artifactId: string;
      chatId: string;
      kind: ArtifactKind;
      title: string;
      versionNumber?: number;
      content: string;
      status: "streaming" | "idle";
      operation: ArtifactOperationKind;
    }
  | {
      event: "delta";
      artifactId: string;
      delta: string;
      target: "create-preview";
    }
  | {
      event: "progress";
      artifactId: string;
      phase: "planning" | "editing" | "deleting" | "rewriting" | "saving";
      message: string;
    }
  | {
      event: "finish";
      artifactId: string;
      versionId: string;
      versionNumber: number;
      content: string;
      summary?: string;
    }
  | {
      event: "error";
      artifactId?: string;
      message: string;
    };
```

### Patch operations

```ts
export type TextArtifactPatchOperation =
  | {
      type: "replace_section";
      sectionId: string;
      content: string;
    }
  | {
      type: "insert_before_section";
      sectionId: string;
      content: string;
    }
  | {
      type: "insert_after_section";
      sectionId: string;
      content: string;
    }
  | {
      type: "delete_section";
      sectionId: string;
    }
  | {
      type: "replace_text";
      sectionId: string;
      find: string;
      replace: string;
    };
```

Rules:

- `replace_section` replaces one whole section, including its heading.
- `delete_section` removes one whole section, including nested child sections.
- `replace_text` must find exactly one occurrence within the selected section.
- Ambiguous operations fail before saving.
- Invalid patch output fails closed: save nothing and ask the user for a more specific target.
- Maximum operation count is 6 for a single targeted update/delete request.
- Operations are applied from highest char offset to lowest char offset so earlier replacements do not shift later ranges.

---

## Task 1: Add Markdown Section Indexing

**Files:**

- Create: `src/lib/artifacts/markdown-sections.ts`
- Create: `src/lib/artifacts/markdown-sections.test.ts`

- [ ] **Step 1: Write failing tests for section parsing**

Create `src/lib/artifacts/markdown-sections.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { indexMarkdownSections } from "./markdown-sections";

describe("indexMarkdownSections", () => {
  test("indexes root and ATX heading sections with ranges", () => {
    const content = [
      "Intro paragraph.",
      "",
      "# Overview",
      "Overview body.",
      "",
      "## Details",
      "Details body.",
      "",
      "# Next",
      "Next body.",
    ].join("\n");

    const index = indexMarkdownSections(content);

    expect(index.sections.map((section) => section.headingPath)).toEqual([
      [],
      ["Overview"],
      ["Overview", "Details"],
      ["Next"],
    ]);
    expect(index.sections[1]?.content).toContain("# Overview");
    expect(index.sections[1]?.content).toContain("## Details");
    expect(index.sections[1]?.content).not.toContain("# Next");
    expect(index.sections[2]?.content).toBe("## Details\nDetails body.\n");
  });

  test("uses root section when a document has no headings", () => {
    const index = indexMarkdownSections("One paragraph.\nSecond paragraph.");

    expect(index.sections).toHaveLength(1);
    expect(index.sections[0]?.id).toBe("root");
    expect(index.sections[0]?.content).toBe("One paragraph.\nSecond paragraph.");
  });

  test("creates stable readable section ids", () => {
    const index = indexMarkdownSections("# API Design\nText\n## API Design\nNested");

    expect(index.sections.map((section) => section.id)).toEqual([
      "root",
      "h1-api-design",
      "h1-api-design/h2-api-design",
    ]);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
bun test src/lib/artifacts/markdown-sections.test.ts
```

Expected: fail because `markdown-sections.ts` does not exist.

- [ ] **Step 3: Implement markdown section indexer**

Create `src/lib/artifacts/markdown-sections.ts`:

```ts
const ATX_HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/gm;
const NON_SLUG_CHAR_PATTERN = /[^a-z0-9]+/g;
const EDGE_DASH_PATTERN = /^-+|-+$/g;
const SNIPPET_LENGTH = 1200;

export interface MarkdownSection {
  content: string;
  end: number;
  heading?: string;
  headingPath: string[];
  id: string;
  level: number;
  snippet: string;
  start: number;
}

export interface MarkdownSectionIndex {
  content: string;
  outline: Array<Pick<MarkdownSection, "id" | "heading" | "headingPath" | "level">>;
  sections: MarkdownSection[];
}

interface HeadingMatch {
  heading: string;
  level: number;
  start: number;
}

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(NON_SLUG_CHAR_PATTERN, "-")
    .replace(EDGE_DASH_PATTERN, "");

  return slug || "section";
};

const createSnippet = (content: string): string => {
  if (content.length <= SNIPPET_LENGTH) {
    return content;
  }

  return `${content.slice(0, SNIPPET_LENGTH).trimEnd()}…`;
};

const collectHeadings = (content: string): HeadingMatch[] => {
  const headings: HeadingMatch[] = [];

  for (const match of content.matchAll(ATX_HEADING_PATTERN)) {
    const marker = match[1];
    const rawHeading = match[2];
    if (!(marker && rawHeading)) {
      continue;
    }

    headings.push({
      heading: rawHeading.trim(),
      level: marker.length,
      start: match.index ?? 0,
    });
  }

  return headings;
};

const findSectionEnd = ({
  headings,
  index,
  contentLength,
}: {
  headings: HeadingMatch[];
  index: number;
  contentLength: number;
}): number => {
  const current = headings[index];
  if (!current) {
    return contentLength;
  }

  const nextPeerOrAncestor = headings
    .slice(index + 1)
    .find((heading) => heading.level <= current.level);

  return nextPeerOrAncestor?.start ?? contentLength;
};

export const indexMarkdownSections = (content: string): MarkdownSectionIndex => {
  const headings = collectHeadings(content);
  const sections: MarkdownSection[] = [
    {
      id: "root",
      level: 0,
      headingPath: [],
      start: 0,
      end: content.length,
      content,
      snippet: createSnippet(content),
    },
  ];

  if (headings.length === 0) {
    return {
      content,
      sections,
      outline: sections.map(({ id, heading, headingPath, level }) => ({
        id,
        heading,
        headingPath,
        level,
      })),
    };
  }

  const pathByLevel: string[] = [];
  const idByLevel: string[] = [];

  headings.forEach((heading, index) => {
    pathByLevel.length = heading.level - 1;
    idByLevel.length = heading.level - 1;
    pathByLevel[heading.level - 1] = heading.heading;
    idByLevel[heading.level - 1] = `h${heading.level}-${slugify(heading.heading)}`;

    const end = findSectionEnd({
      headings,
      index,
      contentLength: content.length,
    });
    const sectionContent = content.slice(heading.start, end);

    sections.push({
      id: idByLevel.filter(Boolean).join("/"),
      level: heading.level,
      heading: heading.heading,
      headingPath: pathByLevel.filter(Boolean),
      start: heading.start,
      end,
      content: sectionContent,
      snippet: createSnippet(sectionContent),
    });
  });

  return {
    content,
    sections,
    outline: sections.map(({ id, heading, headingPath, level }) => ({
      id,
      heading,
      headingPath,
      level,
    })),
  };
};
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```bash
bun test src/lib/artifacts/markdown-sections.test.ts
```

Expected: pass.

---

## Task 2: Add Deterministic Patch Application

**Files:**

- Create: `src/lib/artifacts/text-patches.ts`
- Create: `src/lib/artifacts/text-patches.test.ts`

- [ ] **Step 1: Write failing tests for patch application**

Create `src/lib/artifacts/text-patches.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { indexMarkdownSections } from "./markdown-sections";
import { applyTextArtifactPatchOperations } from "./text-patches";

const documentContent = [
  "# Intro",
  "Keep this.",
  "",
  "# Pricing",
  "Old pricing copy.",
  "",
  "# FAQ",
  "Keep FAQ.",
].join("\n");

describe("applyTextArtifactPatchOperations", () => {
  test("replaces one section without touching sibling sections", () => {
    const index = indexMarkdownSections(documentContent);
    const result = applyTextArtifactPatchOperations({
      content: documentContent,
      index,
      operations: [
        {
          type: "replace_section",
          sectionId: "h1-pricing",
          content: "# Pricing\nNew pricing copy.\n",
        },
      ],
    });

    expect(result.content).toContain("# Intro\nKeep this.");
    expect(result.content).toContain("# Pricing\nNew pricing copy.");
    expect(result.content).toContain("# FAQ\nKeep FAQ.");
    expect(result.summary).toBe("Replaced Pricing");
  });

  test("deletes one section without deleting siblings", () => {
    const index = indexMarkdownSections(documentContent);
    const result = applyTextArtifactPatchOperations({
      content: documentContent,
      index,
      operations: [{ type: "delete_section", sectionId: "h1-pricing" }],
    });

    expect(result.content).toContain("# Intro");
    expect(result.content).not.toContain("# Pricing");
    expect(result.content).toContain("# FAQ");
  });

  test("rejects ambiguous replace_text operations", () => {
    const content = "# Notes\nRepeat\nRepeat\n";
    const index = indexMarkdownSections(content);

    expect(() =>
      applyTextArtifactPatchOperations({
        content,
        index,
        operations: [
          {
            type: "replace_text",
            sectionId: "h1-notes",
            find: "Repeat",
            replace: "Changed",
          },
        ],
      })
    ).toThrow("Patch find text matched 2 times");
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
bun test src/lib/artifacts/text-patches.test.ts
```

Expected: fail because `text-patches.ts` does not exist.

- [ ] **Step 3: Implement patch types and applier**

Create `src/lib/artifacts/text-patches.ts`:

```ts
import type { MarkdownSection, MarkdownSectionIndex } from "./markdown-sections";

export type TextArtifactPatchOperation =
  | {
      type: "replace_section";
      sectionId: string;
      content: string;
    }
  | {
      type: "insert_before_section";
      sectionId: string;
      content: string;
    }
  | {
      type: "insert_after_section";
      sectionId: string;
      content: string;
    }
  | {
      type: "delete_section";
      sectionId: string;
    }
  | {
      type: "replace_text";
      sectionId: string;
      find: string;
      replace: string;
    };

interface Replacement {
  end: number;
  label: string;
  start: number;
  value: string;
}

export interface ApplyTextArtifactPatchOperationsResult {
  content: string;
  summary: string;
}

const getSectionLabel = (section: MarkdownSection): string =>
  section.heading ?? "document";

const ensureTrailingNewline = (value: string): string =>
  value.endsWith("\n") ? value : `${value}\n`;

const countOccurrences = (value: string, search: string): number => {
  if (!search) {
    return 0;
  }

  let count = 0;
  let position = value.indexOf(search);
  while (position !== -1) {
    count++;
    position = value.indexOf(search, position + search.length);
  }

  return count;
};

const getSection = ({
  index,
  sectionId,
}: {
  index: MarkdownSectionIndex;
  sectionId: string;
}): MarkdownSection => {
  const section = index.sections.find((item) => item.id === sectionId);
  if (!section) {
    throw new Error(`Patch target section not found: ${sectionId}`);
  }

  return section;
};

const operationToReplacement = ({
  index,
  operation,
}: {
  index: MarkdownSectionIndex;
  operation: TextArtifactPatchOperation;
}): Replacement => {
  const section = getSection({ index, sectionId: operation.sectionId });
  const label = getSectionLabel(section);

  switch (operation.type) {
    case "replace_section":
      return {
        start: section.start,
        end: section.end,
        value: ensureTrailingNewline(operation.content),
        label: `Replaced ${label}`,
      };
    case "insert_before_section":
      return {
        start: section.start,
        end: section.start,
        value: ensureTrailingNewline(operation.content),
        label: `Inserted before ${label}`,
      };
    case "insert_after_section":
      return {
        start: section.end,
        end: section.end,
        value: ensureTrailingNewline(operation.content),
        label: `Inserted after ${label}`,
      };
    case "delete_section":
      return {
        start: section.start,
        end: section.end,
        value: "",
        label: `Deleted ${label}`,
      };
    case "replace_text": {
      const occurrences = countOccurrences(section.content, operation.find);
      if (occurrences !== 1) {
        throw new Error(
          `Patch find text matched ${occurrences} times in ${label}`
        );
      }

      const relativeStart = section.content.indexOf(operation.find);
      const start = section.start + relativeStart;
      return {
        start,
        end: start + operation.find.length,
        value: operation.replace,
        label: `Updated ${label}`,
      };
    }
    default:
      throw new Error("Unsupported patch operation");
  }
};

const assertNoOverlaps = (replacements: Replacement[]) => {
  const sorted = replacements.toSorted((a, b) => a.start - b.start);
  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous && current && previous.end > current.start) {
      throw new Error("Patch operations overlap");
    }
  }
};

export const applyTextArtifactPatchOperations = ({
  content,
  index,
  operations,
}: {
  content: string;
  index: MarkdownSectionIndex;
  operations: TextArtifactPatchOperation[];
}): ApplyTextArtifactPatchOperationsResult => {
  if (operations.length === 0) {
    throw new Error("At least one patch operation is required");
  }

  const replacements = operations.map((operation) =>
    operationToReplacement({ index, operation })
  );
  assertNoOverlaps(replacements);

  let nextContent = content;
  for (const replacement of replacements.toSorted((a, b) => b.start - a.start)) {
    nextContent = `${nextContent.slice(0, replacement.start)}${replacement.value}${nextContent.slice(replacement.end)}`;
  }

  return {
    content: nextContent.trimEnd(),
    summary: replacements.map((replacement) => replacement.label).join("; "),
  };
};
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```bash
bun test src/lib/artifacts/markdown-sections.test.ts src/lib/artifacts/text-patches.test.ts
```

Expected: pass.

---

## Task 3: Extend Stream Event Types and Reducer

**Files:**

- Modify: `src/lib/artifacts/types.ts`
- Modify: `src/lib/artifacts/client-stream-state.ts`
- Create: `src/lib/artifacts/client-stream-state.test.ts`

- [ ] **Step 1: Write reducer tests for create/update/delete streaming**

Create `src/lib/artifacts/client-stream-state.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  createInitialArtifactStreamState,
  reduceArtifactStreamEvents,
} from "./client-stream-state";

describe("reduceArtifactStreamEvents", () => {
  test("appends create deltas to an empty preview", () => {
    const result = reduceArtifactStreamEvents({
      state: createInitialArtifactStreamState(),
      events: [
        {
          event: "open",
          artifactId: "artifact-1",
          chatId: "chat-1",
          kind: "text",
          title: "Draft",
          content: "",
          status: "streaming",
          operation: "create",
        },
        {
          event: "delta",
          artifactId: "artifact-1",
          delta: "Hello",
          target: "create-preview",
        },
      ],
    });

    expect(result.state.snapshots["artifact-1"]?.content).toBe("Hello");
    expect(result.state.snapshots["artifact-1"]?.operation).toBe("create");
  });

  test("does not append deltas while updating existing content", () => {
    const result = reduceArtifactStreamEvents({
      state: createInitialArtifactStreamState(),
      events: [
        {
          event: "open",
          artifactId: "artifact-1",
          chatId: "chat-1",
          kind: "text",
          title: "Draft",
          content: "Existing",
          status: "streaming",
          operation: "update",
        },
        {
          event: "delta",
          artifactId: "artifact-1",
          delta: "Replacement full document",
          target: "create-preview",
        },
      ],
    });

    expect(result.state.snapshots["artifact-1"]?.content).toBe("Existing");
  });

  test("finish replaces content once for update", () => {
    const result = reduceArtifactStreamEvents({
      state: createInitialArtifactStreamState(),
      events: [
        {
          event: "open",
          artifactId: "artifact-1",
          chatId: "chat-1",
          kind: "text",
          title: "Draft",
          content: "Existing",
          status: "streaming",
          operation: "update",
        },
        {
          event: "progress",
          artifactId: "artifact-1",
          phase: "editing",
          message: "Updating Pricing",
        },
        {
          event: "finish",
          artifactId: "artifact-1",
          versionId: "version-2",
          versionNumber: 2,
          content: "Changed",
          summary: "Updated Pricing",
        },
      ],
    });

    expect(result.state.snapshots["artifact-1"]?.content).toBe("Changed");
    expect(result.state.snapshots["artifact-1"]?.status).toBe("idle");
    expect(result.state.snapshots["artifact-1"]?.progressMessage).toBe(
      "Updated Pricing"
    );
  });
});
```

- [ ] **Step 2: Extend artifact stream types**

Modify `src/lib/artifacts/types.ts` so `ArtifactStreamEvent` includes `operation` on `open`, `target` on `delta`, and a new `progress` event. Add:

```ts
export type ArtifactOperationKind = "create" | "update" | "delete" | "rewrite";
export type ArtifactStreamPhase = "planning" | "editing" | "deleting" | "rewriting" | "saving";
```

Use the event contract shown in the “Public Contracts” section.

- [ ] **Step 3: Update client stream snapshot shape**

Modify `src/lib/artifacts/client-stream-state.ts`:

```ts
import type {
  ArtifactOperationKind,
  ArtifactStreamEvent,
  ArtifactStreamPhase,
} from "@/lib/artifacts/types";

export interface ArtifactSnapshot {
  artifactId: string;
  chatId: string;
  content: string;
  kind: "text";
  operation: ArtifactOperationKind;
  progressMessage?: string;
  progressPhase?: ArtifactStreamPhase;
  status: "idle" | "streaming";
  title: string;
  versionNumber?: number;
}
```

Then update reducer behavior:

```ts
case "open": {
  draft.openArtifactId = event.artifactId;
  draft.snapshots[event.artifactId] = {
    artifactId: event.artifactId,
    chatId: event.chatId,
    kind: event.kind,
    title: event.title,
    content: event.content,
    status: event.status,
    operation: event.operation,
    versionNumber: event.versionNumber,
  };
  break;
}
case "delta": {
  const existing = draft.snapshots[event.artifactId];
  if (!existing) {
    break;
  }

  if (existing.operation === "create") {
    existing.content += event.delta;
  }
  existing.status = "streaming";
  break;
}
case "progress": {
  const existing = draft.snapshots[event.artifactId];
  if (!existing) {
    break;
  }

  existing.progressPhase = event.phase;
  existing.progressMessage = event.message;
  existing.status = "streaming";
  break;
}
case "finish": {
  const existing = draft.snapshots[event.artifactId];
  if (!existing) {
    break;
  }

  existing.content = event.content;
  existing.status = "idle";
  existing.versionNumber = event.versionNumber;
  existing.progressMessage = event.summary;
  finishedArtifactIds.push(event.artifactId);
  break;
}
```

- [ ] **Step 4: Run reducer tests**

Run:

```bash
bun test src/lib/artifacts/client-stream-state.test.ts
```

Expected: pass.

---

## Task 4: Implement Targeted Edit Server

**Files:**

- Create: `src/artifacts/text/edit-server.ts`
- Modify: `src/artifacts/text/server.ts`

- [ ] **Step 1: Add structured edit schema**

Create `src/artifacts/text/edit-server.ts` with this schema and exported function shape:

```ts
import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import { indexMarkdownSections } from "@/lib/artifacts/markdown-sections";
import {
  applyTextArtifactPatchOperations,
  type TextArtifactPatchOperation,
} from "@/lib/artifacts/text-patches";
import { MAX_ARTIFACT_CONTENT_LENGTH } from "@/lib/artifacts/types";

const patchOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("replace_section"),
    sectionId: z.string().min(1),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("insert_before_section"),
    sectionId: z.string().min(1),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("insert_after_section"),
    sectionId: z.string().min(1),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("delete_section"),
    sectionId: z.string().min(1),
  }),
  z.object({
    type: z.literal("replace_text"),
    sectionId: z.string().min(1),
    find: z.string().min(1),
    replace: z.string(),
  }),
]);

const editResultSchema = z.object({
  summary: z.string().min(1).max(500),
  operations: z.array(patchOperationSchema).min(1).max(6),
});

export type TargetedArtifactOperation = "update" | "delete";

export interface EditTextArtifactResult {
  content: string;
  summary: string;
}
```

- [ ] **Step 2: Add candidate-section selection**

Add this helper in the same file:

```ts
const KEYWORD_PATTERN = /[a-z0-9]{3,}/g;
const MAX_CANDIDATE_SECTIONS = 6;

const extractKeywords = (value: string): Set<string> =>
  new Set(value.toLowerCase().match(KEYWORD_PATTERN) ?? []);

const scoreSection = ({
  instructions,
  headingPath,
  snippet,
}: {
  instructions: string;
  headingPath: string[];
  snippet: string;
}): number => {
  const instructionKeywords = extractKeywords(instructions);
  const targetText = `${headingPath.join(" ")} ${snippet}`.toLowerCase();

  let score = 0;
  for (const keyword of instructionKeywords) {
    if (targetText.includes(keyword)) {
      score++;
    }
  }

  return score;
};

const selectCandidateSections = ({
  content,
  instructions,
}: {
  content: string;
  instructions: string;
}) => {
  const index = indexMarkdownSections(content);
  const candidates = index.sections
    .filter((section) => section.id !== "root")
    .map((section) => ({
      ...section,
      score: scoreSection({
        instructions,
        headingPath: section.headingPath,
        snippet: section.snippet,
      }),
    }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATE_SECTIONS);

  return {
    index,
    candidates: candidates.length > 0 ? candidates : index.sections.slice(0, 1),
  };
};
```

- [ ] **Step 3: Add targeted edit function**

Add:

```ts
export const editTextArtifact = async ({
  model,
  currentContent,
  instructions,
  operation,
  onProgress,
}: {
  model: LanguageModel;
  currentContent: string;
  instructions: string;
  operation: TargetedArtifactOperation;
  onProgress: (message: string) => void;
}): Promise<EditTextArtifactResult> => {
  onProgress("Finding the relevant section");
  const { index, candidates } = selectCandidateSections({
    content: currentContent,
    instructions,
  });

  onProgress(operation === "delete" ? "Planning deletion" : "Planning edit");
  const { object } = await generateObject({
    model,
    schemaName: "TextArtifactPatchPlan",
    schemaDescription:
      "A small set of deterministic patch operations against markdown section ids.",
    schema: editResultSchema,
    system: `You edit markdown artifacts by producing targeted patch operations. Do not rewrite the whole document unless the user asks for a whole-document rewrite. Preserve all unrelated sections. Use only provided section ids. For delete requests, prefer delete_section when the user names a section and replace_text when the user names smaller content.`,
    prompt: `Operation: ${operation}

User instructions:
${instructions}

Document outline:
${JSON.stringify(index.outline, null, 2)}

Candidate sections:
${JSON.stringify(
  candidates.map((section) => ({
    id: section.id,
    headingPath: section.headingPath,
    content: section.content,
  })),
  null,
  2
)}

Return patch operations only. Do not include unrelated sections in replacement content.`,
  });

  onProgress(operation === "delete" ? "Deleting selected content" : "Applying edit");
  const result = applyTextArtifactPatchOperations({
    content: currentContent,
    index,
    operations: object.operations as TextArtifactPatchOperation[],
  });

  if (result.content.length > MAX_ARTIFACT_CONTENT_LENGTH) {
    throw new Error("Artifact content is too large to save");
  }

  return {
    content: result.content,
    summary: object.summary || result.summary,
  };
};
```

- [ ] **Step 4: Keep create streaming in `server.ts`**

Do not remove `streamTextArtifact`, `createTextArtifactPrompt`, or `writeArtifactData`. Remove `updateTextArtifactPrompt` only after `artifacts.ts` no longer imports it.

- [ ] **Step 5: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: pass after imports are wired in later tasks; at this step, expected failure is acceptable if `editTextArtifact` is not yet used.

---

## Task 5: Update AI Tools Backend Contract

**Files:**

- Modify: `src/lib/ai/tools/artifacts.ts`
- Modify: tool registry file found by `rg "createTextArtifactTool|updateTextArtifactTool" src`

- [ ] **Step 1: Emit `operation: "create"` for artifact creation**

In `createTextArtifactTool`, change the `open` event to include:

```ts
operation: "create",
```

Change delta events to include:

```ts
target: "create-preview",
```

- [ ] **Step 2: Replace full-document update streaming with targeted editing**

In `updateTextArtifactTool`, remove the `streamTextArtifact({ prompt: updateTextArtifactPrompt(...) })` call. Import:

```ts
import { editTextArtifact } from "@/artifacts/text/edit-server";
```

Use this flow inside the `try` block:

```ts
const result = await editTextArtifact({
  model,
  currentContent: latestVersion.content,
  instructions,
  operation: "update",
  onProgress: (message) => {
    writeArtifactData(dataStream, {
      event: "progress",
      artifactId: selectedArtifact.id,
      phase: "editing",
      message,
    });
  },
});

assertContentWithinLimit(result.content);

const version = await appendArtifactVersion({
  artifactId: selectedArtifact.id,
  userId,
  content: result.content,
  source: "assistant",
});

writeArtifactData(dataStream, {
  event: "finish",
  artifactId: selectedArtifact.id,
  versionId: version.id,
  versionNumber: version.versionNumber,
  content: result.content,
  summary: result.summary,
});
```

Change the update `open` event to:

```ts
writeArtifactData(dataStream, {
  event: "open",
  artifactId: selectedArtifact.id,
  chatId,
  kind: "text",
  title: selectedArtifact.title,
  versionNumber: latestVersion.versionNumber,
  content: latestVersion.content,
  status: "streaming",
  operation: "update",
});
```

- [ ] **Step 3: Add delete-content tool**

Add a new export in `src/lib/ai/tools/artifacts.ts`:

```ts
export const deleteTextArtifactContentTool = ({
  userId,
  chatId,
  model,
  dataStream,
  activeArtifactId,
}: {
  userId: string;
  chatId: string;
  model: LanguageModel;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  activeArtifactId?: string;
}) =>
  tool({
    description:
      "Delete a targeted section, paragraph, list item, or other content inside the currently open text artifact. This does not delete the artifact itself.",
    inputSchema: z.object({
      artifactId: z.string().uuid().optional(),
      instructions: z.string().min(1).max(8000),
    }),
    execute: async ({ artifactId, instructions }, { toolCallId }) => {
      const targetArtifactId = artifactId ?? activeArtifactId;
      if (!targetArtifactId) {
        throw new Error("No open artifact is available to edit");
      }

      const selectedArtifact = await assertArtifactBelongsToChat({
        artifactId: targetArtifactId,
        chatId,
        userId,
      });
      const latestVersion = await getLatestArtifactVersion({
        artifactId: selectedArtifact.id,
        userId,
      });
      if (!latestVersion) {
        throw new Error("Artifact has no saved content to edit");
      }

      writeArtifactData(dataStream, {
        event: "open",
        artifactId: selectedArtifact.id,
        chatId,
        kind: "text",
        title: selectedArtifact.title,
        versionNumber: latestVersion.versionNumber,
        content: latestVersion.content,
        status: "streaming",
        operation: "delete",
      });

      const result = await editTextArtifact({
        model,
        currentContent: latestVersion.content,
        instructions,
        operation: "delete",
        onProgress: (message) => {
          writeArtifactData(dataStream, {
            event: "progress",
            artifactId: selectedArtifact.id,
            phase: "deleting",
            message,
          });
        },
      });

      assertContentWithinLimit(result.content);
      const version = await appendArtifactVersion({
        artifactId: selectedArtifact.id,
        userId,
        content: result.content,
        source: "assistant",
      });

      writeArtifactData(dataStream, {
        event: "finish",
        artifactId: selectedArtifact.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        content: result.content,
        summary: result.summary,
      });

      return {
        artifactId: selectedArtifact.id,
        kind: "text" as const,
        title: selectedArtifact.title,
        versionNumber: version.versionNumber,
        toolCallId,
      };
    },
  });
```

- [ ] **Step 4: Register delete-content tool**

Run:

```bash
rg "createTextArtifactTool|updateTextArtifactTool" src
```

In the tool assembly file, import `deleteTextArtifactContentTool` and register it as `delete_text_artifact_content` with the same `userId`, `chatId`, `model`, `dataStream`, and `activeArtifactId` values used for `updateTextArtifactTool`.

- [ ] **Step 5: Remove obsolete full update prompt**

In `src/artifacts/text/server.ts`, remove `updateTextArtifactPrompt` if it has no references:

```bash
rg "updateTextArtifactPrompt" src
```

Expected: no references after removal.

---

## Task 6: Add Explicit Rewrite Tool

**Files:**

- Create: `src/artifacts/text/rewrite-server.ts`
- Modify: `src/lib/ai/tools/artifacts.ts`
- Modify: tool registry file found by `rg "createTextArtifactTool|updateTextArtifactTool" src`

- [ ] **Step 1: Create non-streaming rewrite server helper**

Create `src/artifacts/text/rewrite-server.ts`:

```ts
import { generateText, type LanguageModel } from "ai";
import { MAX_ARTIFACT_CONTENT_LENGTH } from "@/lib/artifacts/types";

export interface RewriteTextArtifactResult {
  content: string;
  summary: string;
}

export const rewriteTextArtifact = async ({
  model,
  currentContent,
  instructions,
  onProgress,
}: {
  model: LanguageModel;
  currentContent: string;
  instructions: string;
  onProgress: (message: string) => void;
}): Promise<RewriteTextArtifactResult> => {
  onProgress("Rewriting the document");

  const { text } = await generateText({
    model,
    system:
      "You rewrite complete markdown artifacts. Return only the rewritten artifact content. Do not include a preface, summary, or code fence.",
    prompt: `User rewrite instructions:
${instructions}

Current artifact content:
${currentContent}

Return the complete rewritten artifact content.`,
  });

  const content = text.trim();
  if (content.length === 0) {
    throw new Error("Rewrite produced empty artifact content");
  }
  if (content.length > MAX_ARTIFACT_CONTENT_LENGTH) {
    throw new Error("Artifact content is too large to save");
  }

  return {
    content,
    summary: "Rewrote the artifact",
  };
};
```

- [ ] **Step 2: Add `rewriteTextArtifactTool`**

In `src/lib/ai/tools/artifacts.ts`, add a tool that mirrors `updateTextArtifactTool` ownership/version checks, emits an `open` event with `operation: "rewrite"`, calls `rewriteTextArtifact`, emits `progress` with `phase: "rewriting"`, saves a new assistant version, and emits `finish` with final content. Do not stream rewrite deltas to the client.

- [ ] **Step 3: Register rewrite tool**

Run:

```bash
rg "createTextArtifactTool|updateTextArtifactTool" src
```

In the tool assembly file, import `rewriteTextArtifactTool` and register it as `rewrite_text_artifact`.

- [ ] **Step 4: Add prompt guard for rewrite**

Update prompts so `rewrite_text_artifact` is used only when the user explicitly requests a full rewrite/restructure or confirms that broad intent after the assistant asks.

---

## Task 7: Update Artifact Client UX for Operation-Aware Streaming

**Files:**

- Modify: `src/components/artifacts/artifact-workspace.tsx`
- Modify: `src/components/artifacts/text-artifact.tsx`

- [ ] **Step 1: Pass operation metadata into `TextArtifact`**

Add these props to `TextArtifactProps`:

```ts
operation: "create" | "update" | "delete" | "rewrite";
progressMessage?: string;
```

In `ArtifactWorkspaceSession`, derive:

```ts
const operation =
  snapshot?.artifactId === openArtifactId ? snapshot.operation : "update";
const progressMessage =
  snapshot?.artifactId === openArtifactId ? snapshot.progressMessage : undefined;
```

Pass both into `<TextArtifact />`.

- [ ] **Step 2: Split streaming preview behavior**

In `TextArtifact`, replace:

```tsx
{isStreaming ? (
  <StreamingArtifactPreview content={content} />
) : (
  <RichTextEditor ... />
)}
```

with:

```tsx
{isStreaming ? (
  <StreamingArtifactPreview
    content={content}
    operation={operation}
    progressMessage={progressMessage}
  />
) : (
  <RichTextEditor
    content={content}
    onChangeContent={onChangeContent}
    status={status}
  />
)}
```

- [ ] **Step 3: Make streaming preview operation-aware**

Change `StreamingArtifactPreview` signature:

```tsx
function StreamingArtifactPreview({
  content,
  operation,
  progressMessage,
}: {
  content: string;
  operation: "create" | "update" | "delete" | "rewrite";
  progressMessage?: string;
}) {
  const statusLabel =
    operation === "delete"
      ? "AI is deleting"
      : operation === "rewrite"
        ? "AI is rewriting"
        : operation === "update"
          ? "AI is editing"
          : "AI is drafting";

  const helperText =
    operation === "create"
      ? "Previewing the draft as it is written."
      : "Keeping the current document stable until the change is ready.";

  return (
    <section
      aria-busy="true"
      aria-label={statusLabel}
      className="flex h-full min-h-0 flex-col overflow-hidden bg-card dark:bg-neutral-900"
    >
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b bg-card px-4 text-muted-foreground text-sm dark:bg-neutral-900">
        <motion.span
          animate="pulse"
          aria-hidden="true"
          className="size-2 rounded-full bg-primary"
          variants={loadingVariants}
        />
        <span>{statusLabel}</span>
        <span className="text-muted-foreground/70">·</span>
        <span>{progressMessage ?? helperText}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        <MessageResponse className="max-w-none text-pretty text-sm leading-7">
          {content}
        </MessageResponse>
      </div>
    </section>
  );
}
```

Expected UX:

- Create: content grows in preview.
- Update/delete: current content remains stable; status line changes as backend progresses; final content appears once after finish.

---

## Task 8: Update Tool Selection Prompts

**Files:**

- Modify: `src/lib/ai/prompts/agent.ts`
- Modify: `src/lib/ai/prompts/ask.ts`

- [ ] **Step 1: Replace artifact tool guidance**

Use this language in both prompt files where artifact tools are described:

```txt
- Use create_text_artifact when the user asks for a new substantial long-form draft, document, plan, spec, essay, or email.
- Use update_text_artifact when the user asks to revise, shorten, expand, insert, or otherwise modify clearly targeted content in the currently open artifact.
- Use delete_text_artifact_content when the user asks to remove a clear section, paragraph, bullet, or other content target from the currently open artifact. This removes content inside the artifact; it does not delete the artifact record.
- Use rewrite_text_artifact only when the user explicitly asks for a full rewrite/restructure, or after the assistant asks and the user confirms full rewrite intent.
- For broad ambiguous requests like “make this better,” ask whether the user wants a targeted patch or full rewrite before calling any artifact tool.
- For updates and deletes, preserve unrelated sections. Target the relevant section/range rather than regenerating the whole document.
- After creating, updating, deleting, or rewriting artifact content, summarize what changed briefly in chat. Do not duplicate the full artifact content in chat.
```

- [ ] **Step 2: Verify prompt references**

Run:

```bash
rg "rewrite_text_artifact|delete_text_artifact_content|update_text_artifact|create_text_artifact" src/lib/ai/prompts src/lib/ai/tools
```

Expected: all four tools are named consistently.

---

## Task 9: Validation and Regression Checks

**Files:**

- No new source files unless a failing check reveals a bug.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
bun test src/lib/artifacts/markdown-sections.test.ts src/lib/artifacts/text-patches.test.ts src/lib/artifacts/client-stream-state.test.ts
```

Expected: pass.

- [ ] **Step 2: Run lint**

Run:

```bash
bun run lint
```

Expected: pass. If Ultracite reports formatting issues, run:

```bash
bun run lint:fix
```

Then re-run lint.

- [ ] **Step 3: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: pass.

- [ ] **Step 4: Run production build**

Run:

```bash
bun run build
```

Expected: pass.

- [ ] **Step 5: Manual create regression**

Run the app:

```bash
bun run dev
```

In the browser:

1. Ask for a new artifact, e.g. “Create a launch plan artifact for a notes app.”
2. Verify the artifact opens immediately.
3. Verify the read-only preview streams from empty content.
4. Verify ProseMirror editor appears after finish.
5. Verify version 1 is saved.

- [ ] **Step 6: Manual update regression**

In the same chat:

1. Ask: “Rewrite only the pricing section to be more concise.”
2. Verify the existing document remains visible and does not duplicate itself.
3. Verify status says “AI is editing” and progress text changes.
4. Verify final content appears once.
5. Verify unrelated sections are unchanged.
6. Open diff view and verify the diff is localized.

- [ ] **Step 7: Manual delete regression**

In the same chat:

1. Ask: “Remove the FAQ section from the artifact.”
2. Verify the existing document remains visible while streaming.
3. Verify status says “AI is deleting”.
4. Verify final content appears once.
5. Verify only the requested section is removed.
6. Open diff view and verify the deletion is localized.

---

## Risk Controls

- Do not silently stream full replacements for update/delete/rewrite.
- Do not save if patch application fails.
- Do not save if generated final content exceeds `MAX_ARTIFACT_CONTENT_LENGTH`.
- Do not delete artifact database rows in `delete_text_artifact_content`.
- If the model picks an invalid section ID, fail closed: throw a tool error, save nothing, and show the existing artifact unchanged.
- If `replace_text` matches zero or multiple occurrences, fail closed: throw a tool error, save nothing, and show the existing artifact unchanged.
- If a user request is broad/ambiguous, ask a clarifying question before tool call. Do not use the tool as a clarification state machine.
- Do not use `update_text_artifact` for full rewrites; use `rewrite_text_artifact` only after explicit rewrite intent.
- Keep full database versions so users can diff/restore every AI edit.

---

## Future Improvements Not Required for This Plan

- Persist section IDs in artifact metadata.
- Add a visual pending diff before applying an AI edit.
- Add a user approval step before saving AI patches.
- Add whole-artifact delete/archive UI.
- Add token-budget-aware chunking for very large artifacts.
- Add embeddings or semantic search for better target-section selection.

---

## Self-Review

- **Spec coverage:** Create, update, and delete-content workflows are covered. The known duplicate-streaming bug is covered by reducer tests and operation-aware client rendering.
- **Placeholder scan:** No implementation steps depend on undefined TODOs. The only discovery step is locating the existing tool registry via `rg`, because the exact registry file is not shown in the currently inspected files.
- **Type consistency:** Operation names are consistently `"create" | "update" | "delete" | "rewrite"`; progress phases are consistently `"planning" | "editing" | "deleting" | "rewriting" | "saving"`.
- **Scope:** Whole-artifact deletion is explicitly out of scope; delete means targeted content deletion inside an artifact.
