# MCP Tool Render Analysis: Conditions & Exclusions

## EXECUTIVE SUMMARY
Found **7 explicit rendering conditions** that prevent MCP tool parts from rendering in the UI. The primary filter `filter(Boolean)` eliminates all parts that return `null`.

---

## RENDERING FLOW OVERVIEW

### Main Entry Point: `renderMessagePart()` (line 483-576)
Located in: `src/components/chat/message.tsx`

**Call Chain:**
```
Message component (line 719-733)
  └─> message.parts.map(renderMessagePart)
      ├─> Type-specific render functions
      │   ├─ renderExtractTool
      │   ├─ renderSaveToMemoriesTool
      │   ├─ renderWebSearchTool
      │   ├─ renderKnowledgeSearchTool
      │   ├─ renderAcademicSearchTool
      │   ├─ renderFinanceSearchTool
      │   └─ renderMcpTool
      └─> .filter(Boolean)  ← CRITICAL: Filters out null returns
```

---

## CONDITION 1: Type-Based Routing Exclusions

### Location: Lines 514-575 in `renderMessagePart()`

**Condition Chain:**
```typescript
if (type === "reasoning" && messagePart.text?.trim().length > 0)       // Line 514
if (type === "text")                                                    // Line 524
if (type === "tool-extract")                                           // Line 528
if (type === "tool-save_to_memories")                                  // Line 532
if (type === "tool-web_search")                                        // Line 536
if (type === "tool-knowledge_search")                                  // Line 540
if (type === "tool-academic_search")                                   // Line 544
if (type === "tool-finance_search")                                    // Line 548
if (typeof type === "string" && type.startsWith("tool-mcp_"))          // Line 553
if (type === "tool-call" || "tool-result" || "tool-error")             // Line 558-561
  └─> if (toolName?.startsWith("mcp_"))                               // Line 564
return null;                                                            // Line 575
```

**EXCLUSION #1:** If type does NOT match any of the above patterns → **RETURNS NULL**

---

## CONDITION 2: MCP Tool Format Parsing

### Location: Lines 214-228 `parseMcpToolName()`

**Logic:**
```typescript
function parseMcpToolName(toolName: string) {
  const withoutPrefix = toolName.slice(4); // Remove "mcp_"
  const firstUnderscore = withoutPrefix.indexOf("_");
  
  if (firstUnderscore === -1) {
    // EXCLUSION #2: No underscore found after "mcp_"
    return { serverName: withoutPrefix, toolName: "" };
  }
  // EXCLUSION #3: toolName becomes empty string
  return { serverName, toolName: "" };
}
```

**EXCLUSION #2:** MCP tool name lacks required format `mcp_serverName_toolName`
- Empty `toolName` still renders but with invalid display

---

## CONDITION 3: MCP Tool State Resolution

### Location: Lines 233-266 `renderMcpTool()`

**State Logic:**
```typescript
const isError = state === "output-error";                    // Line 241
const isLoading = state === "input-streaming" 
                || state === "input-available";             // Line 242-243

const getResolvedState = (): McpToolResultProps["state"] => {
  if (isLoading) {
    return state;  // Return as-is: "input-streaming" or "input-available"
  }
  if (output) {
    return "output-available";  // Convert any output to this state
  }
  return state;  // Return original state
};
```

**EXCLUSION #3:** State values evaluated:
- ✅ `"input-streaming"` → renders as-is
- ✅ `"input-available"` → renders as-is  
- ✅ `"output-available"` → renders with output
- ✅ `"output-error"` → renders as error
- ❌ **OTHER** (e.g., `null`, `undefined`, `""`) → **No handling, potential crash**

**EXCLUSION #4:** Missing `output` property
- If `state` is not loading and no `output` prop → returns unknown state

---

## CONDITION 4: State-Based Rendering in Tool Components

### Patterns in Each Tool Renderer (extract, web_search, knowledge_search, etc.)

**Example: `renderExtractTool()` (lines 52-72)**
```typescript
if (state === "input-available") {
  const { input } = part;
  return <ExtractTool input={input} ... />;
}

if (state === "output-available") {
  const { output } = part;
  return <ExtractTool output={output?.results} ... />;
}

return null;  // EXCLUSION: Any other state
```

**EXCLUSION #5:** Tool renderers only handle TWO states
- ✅ `"input-available"`
- ✅ `"output-available"`
- ❌ **ALL OTHER states** (including "input-streaming", "output-error") → **RETURNS NULL**

**State Coverage by Tool:**

| Tool | input-available | output-available | input-streaming | output-error |
|------|-----------------|------------------|-----------------|--------------|
| extract | ✅ | ✅ | ❌ | ❌ |
| save_to_memories | ✅ | ✅ | ❌ | ❌ |
| web_search | ✅ | ✅ | ❌ | ❌ |
| knowledge_search | ✅ | ✅ | ❌ | ❌ |
| academic_search | ✅ | ✅ | ❌ | ❌ |
| finance_search | ✅ | ✅ | ❌ | ❌ |
| **mcp_tool** (McpToolResult) | ✅ | ✅ | ✅ | ✅ |

---

## CONDITION 5: Falsy Content Values

### Location: Lines 240-250 in `renderMcpTool()` and McpToolResult

**Content Chain:**
```typescript
const content = output ?? input ?? {};  // Line 240
// Falls back to empty object if both undefined
```

**In McpToolResult (lines 38-41):**
```typescript
const formattedContent = 
  typeof content === "string"
    ? content
    : JSON.stringify(content, null, 2);
```

**EXCLUSION #6:** Empty object `{}` renders but displays as valid JSON
- Not technically an exclusion, but potentially invisible output

---

## CONDITION 6: Output Property Path Expectations

### Property Extraction Patterns:

**Extract Tool (line 65):**
```typescript
output={output?.results}  // Expects output.results
```

**Academic Search Tool (line 175):**
```typescript
output={output?.results}  // Expects output.results
```

**Web Search Tool, Knowledge Search Tool, Finance Search Tool:**
```typescript
output={output || undefined}  // Accepts output directly
```

**EXCLUSION #7:** Incorrect nested property structure
- Extract & Academic tools expect `output.results`
- If missing, passes `undefined` to component

---

## CONDITION 7: Filter(Boolean) Final Gate

### Location: Line 733 in Message component

```typescript
{message.parts
  ?.map((messagePart, index) =>
    renderMessagePart(messagePart, index, { ... })
  )
  .filter(Boolean)}  // ← CRITICAL FILTER
```

**This filter removes:**
- ❌ `null` (explicit returns on line 71, 101, 122, 151, 181, 211, 575)
- ❌ `undefined`
- ❌ `false`
- ❌ `0`
- ❌ `""` (empty string)

**EXCLUSION #8:** Any part that doesn't explicitly return a JSX element

---

## RENDERING BRANCHES DECISION TREE

```
Tool Part Detected
├─ Type Check
│  ├─ type === "text"                         → renderTextPart()
│  ├─ type === "tool-extract"                 → renderExtractTool()
│  │  ├─ state === "input-available"          → ✅ Render
│  │  ├─ state === "output-available"         → ✅ Render
│  │  └─ OTHER                                 → ❌ return null
│  ├─ type === "tool-save_to_memories"        → renderSaveToMemoriesTool()
│  │  ├─ state === "input-available"          → ✅ Render
│  │  ├─ state === "output-available"         → ✅ Render
│  │  └─ OTHER                                 → ❌ return null
│  ├─ type === "tool-web_search"              → renderWebSearchTool()
│  │  └─ ... [same pattern as extract]
│  ├─ type === "tool-knowledge_search"        → renderKnowledgeSearchTool()
│  │  └─ ... [same pattern as extract]
│  ├─ type === "tool-academic_search"         → renderAcademicSearchTool()
│  │  └─ ... [same pattern as extract]
│  ├─ type === "tool-finance_search"          → renderFinanceSearchTool()
│  │  └─ ... [same pattern as extract]
│  ├─ type.startsWith("tool-mcp_")            → renderMcpTool()
│  │  └─ McpToolResult (handles all states)
│  ├─ type IN ["tool-call","tool-result","tool-error"]
│  │  └─ toolName?.startsWith("mcp_")         → renderMcpTool()
│  │     └─ McpToolResult (handles all states)
│  └─ OTHER                                    → ❌ return null
└─ filter(Boolean)                             → Remove nulls
```

---

## SUMMARY: EXCLUSION CONDITIONS CHECKLIST

| # | Condition | Impact | Severity |
|---|-----------|-------
