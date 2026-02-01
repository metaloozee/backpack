# Complete Render Code Paths for MCP Tool Parts

## File: `src/components/chat/message.tsx`

---

## ENTRY POINT: `renderMessagePart()` Lines 483-576

```typescript
function renderMessagePart(messagePart, index, props): ReactNode {
  const { type } = messagePart;
  const key = `message-${message.id}-part-${index}`;

  // DEBUG LOG (Line 504-511)
  if (typeof type === "string" && type.startsWith("tool-")) {
    console.log("[renderMessagePart] Tool part:", {
      type,
      state: messagePart.state,
      toolCallId: messagePart.toolCallId,
      hasInput: !!messagePart.input,
      hasOutput: !!messagePart.output,
    });
  }

  // PATH 1: Reasoning (Line 514)
  if (type === "reasoning" && messagePart.text?.trim().length > 0) {
    return <MessageReasoning .../>
  }

  // PATH 2: Text (Line 524)
  if (type === "text") {
    return renderTextPart(messagePart, key, props);
  }

  // PATH 3: Built-in Tools
  
  // PATH 3A: Extract (Line 528)
  if (type === "tool-extract") {
    return renderExtractTool(messagePart, key);
    // → renderExtractTool returns null if state not in [input-available, output-available]
  }

  // PATH 3B: Save to Memories (Line 532)
  if (type === "tool-save_to_memories") {
    return renderSaveToMemoriesTool(messagePart, key);
    // → Returns null if state not in [input-available, output-available]
  }

  // PATH 3C: Web Search (Line 536)
  if (type === "tool-web_search") {
    return renderWebSearchTool(messagePart, key);
    // → Returns null if state not in [input-available, output-available]
  }

  // PATH 3D: Knowledge Search (Line 540)
  if (type === "tool-knowledge_search") {
    return renderKnowledgeSearchTool(messagePart, key);
    // → Returns null if state not in [input-available, output-available]
  }

  // PATH 3E: Academic Search (Line 544)
  if (type === "tool-academic_search") {
    return renderAcademicSearchTool(messagePart, key);
    // → Returns null if state not in [input-available, output-available]
  }

  // PATH 3F: Finance Search (Line 548)
  if (type === "tool-finance_search") {
    return renderFinanceSearchTool(messagePart, key);
    // → Returns null if state not in [input-available, output-available]
  }

  // PATH 4: MCP Tools - Format 1 (Line 553)
  if (typeof type === "string" && type.startsWith("tool-mcp_")) {
    return renderMcpTool({ ...messagePart, toolName: type }, key);
    // → Format: tool-mcp_serverName_toolName
    // → Always renders (unless renderMcpTool crashes)
  }

  // PATH 5: MCP Tools - Format 2 (Line 558-561)
  if (type === "tool-call" || type === "tool-result" || type === "tool-error") {
    const { toolName } = messagePart;
    
    if (toolName?.startsWith("mcp_")) {  // Line 564
      return renderMcpTool(
        { ...messagePart, toolName: `tool-${toolName}` },
        key
      );
      // → Format: mcp_serverName_toolName (gets prefixed with "tool-")
      // → Always renders
    }
    // → Falls through if toolName doesn't start with "mcp_"
  }

  // FINAL: No match (Line 575)
  return null;
}
```

**CRITICAL:** Line 733 filters results:
```typescript
{message.parts
  ?.map((messagePart, index) =>
    renderMessagePart(messagePart, index, { ... })
  )
  .filter(Boolean)}  // ← Removes ALL null returns
```

---

## PATH 3A: `renderExtractTool()` Lines 52-72

```typescript
function renderExtractTool(part, key): ReactNode {
  const { toolCallId, state } = part;

  // BRANCH 1: Input Available (Line 55)
  if (state === "input-available") {
    const { input } = part;
    return <ExtractTool input={input} key={key} toolCallId={toolCallId} />;
  }

  // BRANCH 2: Output Available (Line 60)
  if (state === "output-available") {
    const { output } = part;
    return (
      <ExtractTool
        key={key}
        output={output?.results}  // ← Property path: output.results
        toolCallId={toolCallId}
      />
    );
  }

  // FALLBACK (Line 71)
  return null;  // ❌ States not handled: input-streaming, output-error, etc.
}
```

---

## PATH 3B-3F: Built-in Tools (Similar Pattern)

### `renderSaveToMemoriesTool()` Lines 76-102
```typescript
// Handles: input-available, output-available
// Passes: input directly, output directly
```

### `renderWebSearchTool()` Lines 105-123
```typescript
// Handles: input-available, output-available
// Passes: input directly, output directly
```

### `renderKnowledgeSearchTool()` Lines 126-152
```typescript
// Handles: input-available, output-available
// Passes: input directly, output || undefined
```

### `renderAcademicSearchTool()` Lines 156-182
```typescript
// Handles: input-available, output-available
// Passes: input directly, output?.results
```

### `renderFinanceSearchTool()` Lines 186-212
```typescript
// Handles: input-available, output-available
// Passes: input directly, output || undefined
```

---

## PATH 4 & 5: `renderMcpTool()` Lines 233-266

```typescript
function renderMcpTool(part, key): ReactNode {
  const { toolCallId, state, toolName: fullToolName, input, output } = part;
  
  // Parse tool name (Line 235-237)
  const { serverName, toolName } = parseMcpToolName(
    fullToolName.replace("tool-", "")
  );
  // → parseMcpToolName("mcp_serverName_toolName")
  // → Returns: { serverName: "serverName", toolName: "toolName" }
  // → If format invalid: { serverName: <whole>, toolName: "" }

  // Content resolution (Line 240)
  const content = output ?? input ?? {};
  // Falls back to empty object

  // Error detection (Line 241)
  const isError = state === "output-error";

  // Loading detection (Line 242-243)
  const isLoading =
    state === "input-streaming" || state === "input-available";

  // State resolution (Line 245-253)
  const getResolvedState = (): McpToolResultProps["state"] => {
    if (isLoading) {
      return state;  // "input-streaming" or "input-available"
    }
    if (output) {
      return "output-available";
    }
    return state;  // Original state (could be undefined)
  };

  // Render (Line 255-265)
  return (
    <McpToolResult
      content={content}
      isError={isError}
      key={key}
      serverName={serverName}
      state={getResolvedState()}
      toolCallId={toolCallId}
      toolName={toolName}
    />
  );
  // ✅ Always returns JSX, never null
}
```

---

## Supporting Function: `parseMcpToolName()` Lines 215-229

```typescript
function parseMcpToolName(toolName: string): {
  serverName: string;
  toolName: string;
} {
  // Expects format: "mcp_serverName_toolName"
  
  // Step 1: Remove "mcp_" prefix (Line 220)
  const withoutPrefix = toolName.slice(4);
  // "serverName_toolName"

  // Step 2: Find first underscore (Line 221)
  const firstUnderscore = withoutPrefix.indexOf("_");

  // BRANCH 1: No underscore found (Line 222)
  if (firstUnderscore === -1) {
    return { 
      serverName: withoutPrefix,  // Everything becomes server name
      toolName: ""                 // ❌ Empty tool name
    };
  }

  // BRANCH 2: Underscore found (Line 225-228)
  return {
    serverName: withoutPrefix.slice(0, firstUnderscore),
    toolName: withoutPrefix.slice(firstUnderscore + 1),
  };
}

// Examples:
// Input: "mcp_github_listRepos"
// Output: { serverName: "github", toolName: "listRepos" }

// Input: "mcp_github"
// Output: { serverName: "github", toolName: "" }  ❌ Empty

// Input: "mcp"
// Output: { serverName: "", toolName: "" }  ❌ Both empty
```

---

## UI Component: `McpToolResult()` Lines 28-90

### File: `src/components/mcp-tool-result.tsx`

```typescript
export function McpToolResult({
  serverName,
  toolName,
  content,
  isError = false,
  state,
  toolCallId,
}: McpToolResultProps) {
  // Loading state detection (Line 36-37)
  const isLoading =
    state === "input-streaming" || state === "input-available";

  // Content formatting (Line 38-41)
  const formattedContent =
    typeof content === "string"
      ? content
      : JSON.stringify(content, null, 2);

  // BRANCH 1: Loading (Line 43-51)
  if (isLoading) {
    return (
      <div className="flex h-10 w-full items-center gap-2 rounded-md border bg-neutral-900 px-4 text-xs">
        <Loader size="sm" />
        <span className="text-muted-for
