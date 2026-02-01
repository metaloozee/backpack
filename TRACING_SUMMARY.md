# Message Parts Tracing Summary

## TASK COMPLETED: Traced UIMessageStream Parts Flow

### Quick Reference: Data Flow Path
```
useChat (chat.tsx:154)
    ↓
useChat hook initializes with messages from previous sessions
    ↓
ChatMessages (messages.tsx:18-78)
    ↓
Maps messages.map((message) => <PreviewMessage message={message} />)
    ↓
Message/PreviewMessage (message.tsx:644-765)
    ↓
renderMessagePart() for each message.parts[index]
    ↓
Dispatches to specific renderer based on part.type
    ↓
McpToolResult or specialized tool components render the part
```

---

## KEY FINDING: Message.parts Shape

### Storage Layer (Database)
**Location**: `src/lib/db/schema/app.ts:238`
```typescript
parts: jsonb("parts").notNull(),  // Stored as raw JSONB
```

### Type Definition
**Location**: `src/lib/ai/types.ts:53-57`
```typescript
export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;
```

### Retrieval Transformation
**Location**: `src/lib/ai/utils.ts:32-41`
```typescript
export function convertToUIMessages(messages: Message[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: { createdAt: formatISO(message.createdAt) },
  }));
}
```

---

## ALL MESSAGE PART TYPES (ENUMERATED)

### 1. Text Parts
```typescript
{ type: "text", text: string }
```
Renderer: `renderTextPart()` (lines 268-481)

### 2. File Parts
```typescript
{
  type: "file",
  mediaType: "image/jpeg" | "image/png",
  filename: string,
  url: string
}
```
Rendered as attachments (lines 700-717)

### 3. Reasoning Parts
```typescript
{ type: "reasoning", text: string }
```
Renderer: `MessageReasoning()` (lines 514-521, 578-642)

### 4. Built-in Tool Parts (AI SDK Format)
```typescript
{
  type: "tool-extract" | "tool-web_search" | "tool-knowledge_search" | 
        "tool-academic_search" | "tool-finance_search" | "tool-save_to_memories",
  toolCallId: string,
  state: "input-available" | "output-available" | "input-streaming",
  input?: object,
  output?: object,
}
```
Renderers:
- `renderExtractTool()` (lines 50-72)
- `renderWebSearchTool()` (lines 105-123)
- `renderKnowledgeSearchTool()` (lines 126-152)
- `renderAcademicSearchTool()` (lines 156-182)
- `renderFinanceSearchTool()` (lines 186-212)
- `renderSaveToMemoriesTool()` (lines 76-102)

### 5. MCP Tool Parts - Streaming Format
```typescript
{
  type: "tool-mcp_serverName_toolName",  // e.g., "tool-mcp_fetch_get_url"
  toolCallId: string,
  state: "input-available" | "output-available" | "input-streaming" | "output-error",
  input?: object,
  output?: object,
}
```
Renderer: `renderMcpTool()` (lines 233-266)
Detection: Line 553

### 6. MCP Tool Parts - UIMessageStream Format
```typescript
{
  type: "tool-call" | "tool-result" | "tool-error",
  toolCallId: string,
  toolName: "mcp_serverName_toolName",  // Without "tool-" prefix
  args?: object,        // For tool-call
  result?: unknown,     // For tool-result
  error?: { message: string },  // For tool-error
}
```
Renderer: `renderMcpTool()` (lines 233-266)
Detection: Lines 558-572

---

## CRITICAL TRANSFORMATIONS (NONE AT RENDER TIME)

### 1. **MCP Tool Name Parsing** (lines 215-228)
```typescript
function parseMcpToolName(toolName: string): {
  serverName: string;
  toolName: string;
} {
  const withoutPrefix = toolName.slice(4); // Remove "mcp_"
  const firstUnderscore = withoutPrefix.indexOf("_");
  return {
    serverName: withoutPrefix.slice(0, firstUnderscore),
    toolName: withoutPrefix.slice(firstUnderscore + 1),
  };
}
```
**Usage**: Line 235 - splits "mcp_serverName_toolName" into components

### 2. **Format Normalization** (lines 232-265)
Input format varies:
- Streaming: `type: "tool-mcp_serverName_toolName"`
- UIMessageStream: `type: "tool-call" | "tool-result" | "tool-error"` + `toolName: "mcp_serverName_toolName"`

Both converted to common renderMcpTool() format:
```typescript
{
  toolCallId,
  state,     // Resolved from actual state or output presence
  content,   // output ?? input ?? {}
  isError,
  serverName,
  toolName,
}
```

### 3. **State Resolution** (lines 245-252)
```typescript
const getResolvedState = (): McpToolResultProps["state"] => {
  if (isLoading) {
    return state;
  }
  if (output) {
    return "output-available";
  }
  return state;
};
```

---

## GENERATION POINT: Backend Stream

**Location**: `src/app/api/chat/route.ts:394`

```typescript
result.toUIMessageStream({ sendReasoning: true })
```

- This AI SDK method converts the streamText result to UIMessageStream format
- Generates tool-call/tool-result/tool-error parts
- Parts are stored as-is in database JSONB column
- No transformation during storage/retrieval (only type casting)

---

## FILTERING & FILTERING LOGIC

**Location**: `src/components/chat/message.tsx:719-733`

```typescript
{message.parts
  ?.map((messagePart, index) =>
    renderMessagePart(messagePart, index, {...})
  )
  .filter(Boolean)}  // ← Filters out null/undefined renderers
```

Only recognized part types render. Unknown types return `null`.

---

## DEBUGGING & LOGGING

### Console Logs for Tool Parts (lines 504-512)
```typescript
if (typeof type === "string" && type.startsWith("tool-")) {
  console.log("[renderMessagePart] Tool part:", {
    type,
    state: messagePart.state,
    toolCallId: messagePart.toolCallId,
    hasInput: !!messagePart.input,
    hasOutput: !!messagePart.output,
  });
}
```

### All Message Parts Log (line 686)
```typescript
{message.role === "assistant" && (
  <>{console.log("[message.parts]", message.parts)}</>
)}
```

---

## ISSUES & NOTES

### Potential MCP Tool Rendering Issues:
1. **Missing toolName in tool-call parts** - won't detect as MCP tool (line 564 requires toolName?.startsWith("mcp_"))
2. **Incorrect format** - must be either:
   - `type: "tool-mcp_serverName_toolName"` (streaming)
   - `type: "tool-call" | "tool-result" | "tool-error"` + `toolName: "mcp_serverName_toolName"` (UIMessageStream)
3. **Missing state field** - tool parts should have `state` to show loading/output status
4. **Missing toolCallId** - required for rendering

### Part Shape Validation:
- No validation at render time - relies on AI SDK producing correct shapes
- Database stores raw JSONB - no schema validation
- Type casting only happens at retrieval (utils.ts:36)

---

## FILE REFERENCES

| File | Purpose |
|------|---------|
| src/components/chat.tsx | useChat hook initialization |
| src/components/chat/messages.tsx | ChatMessages renderer |
| src/components/chat/message.tsx | Message component & part renderers |
| src/components/mcp-tool-result.tsx | MCP tool UI component |
| src/lib/ai/types.ts | ChatMessage type definition |
| src/lib/ai/utils.ts | convertToUIMessages transformation |
| src/lib/db/schema/app.ts | Message table & parts column |
| src/app/api/chat/route.ts | Backend stream & storage |
| src/components/data-stream-provider.tsx | DataStream context |

