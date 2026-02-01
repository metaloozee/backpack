# Quick Reference: MCP Tool Render Conditions

## All Rendering Branches for Tool Parts

### ✅ CONDITIONS THAT ALLOW RENDERING

**1. Built-in Tools (Extract, Web Search, Knowledge Search, Academic, Finance)**
- State: `"input-available"` → Renders with input
- State: `"output-available"` → Renders with output

**2. MCP Tools (via renderMcpTool)**
- State: `"input-streaming"` → Loading state
- State: `"input-available"` → Input available
- State: `"output-available"` → Output available  
- State: `"output-error"` → Error state with red styling

**3. Special Cases**
- type: `"reasoning"` → MessageReasoning component (if text.trim().length > 0)
- type: `"text"` → renderTextPart

---

### ❌ CONDITIONS THAT PREVENT RENDERING

#### Category A: Type Mismatch
```
if (type !== recognizedType) → return null
```
- Part type not in: reasoning, text, tool-*, tool-mcp_*, tool-call, tool-result, tool-error

#### Category B: State Not Recognized (Built-in Tools)
```
// For: extract, save_to_memories, web_search, knowledge_search, academic_search, finance_search
if (state !== "input-available" && state !== "output-available") → return null
```
- ⚠️ "input-streaming" NOT handled → returns null
- ⚠️ "output-error" NOT handled → returns null

#### Category C: State Not Recognized (MCP Tools)
```
if (!isLoading && !output && state not in recognized) → return unknown state
```
- Less likely due to fallback logic

#### Category D: Format/Parsing Failure
```
parseMcpToolName("mcp_serverName") // no underscore
→ { serverName: "serverName", toolName: "" }
```
- Tool renders but with empty toolName display

#### Category E: Content/Property Mismatch
```
Extract: output?.results = undefined → passes undefined to component
AcademicSearch: output?.results = undefined → passes undefined to component
```

#### Category F: Post-Rendering Filter
```
.filter(Boolean) → removes any:
- null (explicit returns)
- undefined
- false
- 0
- ""
```

---

## State Comparison Table

| State | Built-in Tools | MCP Tools |
|-------|---|---|
| `"input-available"` | ✅ Renders | ✅ Renders |
| `"input-streaming"` | ❌ NULL | ✅ Loading UI |
| `"output-available"` | ✅ Renders | ✅ Renders |
| `"output-error"` | ❌ NULL | ✅ Error UI |
| Other | ❌ NULL | ⚠️ Unknown |

---

## File References

**Main Component:** `src/components/chat/message.tsx`
- Line 483-576: `renderMessagePart()` - Main dispatcher
- Line 233-266: `renderMcpTool()` - MCP handler
- Line 52-212: Tool-specific renderers (extract, web_search, etc.)
- Line 719-733: Render loop with filter(Boolean)

**UI Component:** `src/components/mcp-tool-result.tsx`
- Line 28-90: `McpToolResult()` - Displays MCP tool results

---

## Debugging Checklist

- [ ] Part type in console log? (line 505-511)
- [ ] Part state value correct?
- [ ] MCP format: tool-mcp_serverName_toolName?
- [ ] Built-in tool: state in [input-available, output-available]?
- [ ] Output/input properties exist?
- [ ] Extract/Academic: output.results available?
- [ ] Component returns JSX, not null?

