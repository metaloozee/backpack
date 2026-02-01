# UIMessageStream Message Parts Analysis - Complete Documentation

## Overview
Complete trace of how message parts flow from AI SDK generation through database storage to frontend rendering, with focus on MCP tool parts.

## 📋 Documentation Index

### 1. **ANALYSIS_COMPLETE.txt** - Executive Summary
Quick overview of all findings and key takeaways.
- ✓ All 3 requirements met
- Message part shape documentation
- Transformations identified
- Debugging entry points

### 2. **MESSAGE_PARTS_FLOW_ANALYSIS.md** - Detailed Flow (330 lines)
Complete end-to-end trace from useChat to rendered output.

**Sections:**
- Data flow: useChat → ChatMessages → Message component
- API endpoint stream processing
- Database storage schema
- Message retrieval & conversion
- ChatMessages component
- Message component parts rendering
- All message part types with examples
- Transformations & filters
- McpToolResult component

**Best for:** Understanding the complete architecture

### 3. **TRACING_SUMMARY.md** - Code-Focused Reference
Maps flows and types with exact file locations and line numbers.

**Sections:**
- Quick reference data flow path
- Message.parts shape at each layer
- All part types enumerated with renderers
- Critical transformations
- MCP tool name parsing logic
- Format normalization
- State resolution
- Backend generation point
- Filtering logic
- Debugging & logging locations
- File references table

**Best for:** Finding specific code locations and functionality

### 4. **QUICK_REFERENCE_MCP_PARTS.md** - MCP-Focused Guide
Concentrated documentation for MCP tool parts specifically.

**Sections:**
- Both MCP part formats documented
- renderMcpTool() normalization function with code
- MCP tool name parsing algorithm
- Rendering path visualization
- Debug logging locations
- Common issues checklist
- Data flow visualization
- Expected database format examples
- Type system chain

**Best for:** Debugging MCP tool rendering issues

## 🎯 Quick Navigation

### Need to understand...

**"How do message parts flow through the system?"**
→ Read: MESSAGE_PARTS_FLOW_ANALYSIS.md (Main flow sections 1-6)

**"What exact transformations happen to message.parts?"**
→ Read: TRACING_SUMMARY.md (Section: CRITICAL TRANSFORMATIONS)

**"Where is MCP tool rendering happening?"**
→ Read: QUICK_REFERENCE_MCP_PARTS.md (Rendering Path section)

**"What part types are supported?"**
→ Read: TRACING_SUMMARY.md (Section: ALL MESSAGE PART TYPES)

**"How do I debug MCP parts not rendering?"**
→ Read: QUICK_REFERENCE_MCP_PARTS.md (Debug Logging + Common Issues sections)

**"What's stored in the database?"**
→ Read: MESSAGE_PARTS_FLOW_ANALYSIS.md (Section 3: Message Parts Storage)

## 🔍 Key Findings Summary

### Message Part Shape
```typescript
{
  type: string,           // "text" | "file" | "tool-*" | "reasoning"
  toolCallId?: string,    // For tool parts
  toolName?: string,      // For MCP: "mcp_serverName_toolName"
  state?: string,         // Tool state: input-streaming|available|output-*|error
  text?: string,          // Text part content
  input?: object,         // Tool input
  output?: object,        // Tool output
  args?: object,          // Tool arguments
  result?: unknown,       // Tool result
  error?: object,         // Error info
}
```

### No Transformations at Render
- Parts stored as-is in JSONB
- Retrieved with type casting only
- Rendered based on type detection
- MCP tool name parsed (only transformation)
- State resolved (not transformed)

### MCP Tool Detection (2 Formats Supported)
**Format 1 (Streaming):**
```typescript
type: "tool-mcp_serverName_toolName"
```

**Format 2 (UIMessageStream):**
```typescript
type: "tool-call" | "tool-result" | "tool-error"
toolName: "mcp_serverName_toolName"
```

## 📂 File References

| File | Purpose | Key Section |
|------|---------|-------------|
| `src/components/chat.tsx` | useChat hook | Line 154 |
| `src/components/chat/messages.tsx` | ChatMessages renderer | Line 18-78 |
| `src/components/chat/message.tsx` | Message & part renderers | Line 483-576 |
| `src/components/mcp-tool-result.tsx` | MCP UI component | Line 28-90 |
| `src/lib/ai/types.ts` | ChatMessage type | Line 53-57 |
| `src/lib/ai/utils.ts` | convertToUIMessages | Line 32-41 |
| `src/lib/db/schema/app.ts` | Message table schema | Line 225-259 |
| `src/app/api/chat/route.ts` | Backend stream | Line 272-413 |

## 🐛 Debugging Checklist

For MCP tool parts not rendering:

- [ ] Check browser console for "[renderMessagePart] Tool part:" logs (line 504-512)
- [ ] Check database: `SELECT parts FROM message WHERE id = '...'`
- [ ] Verify part format (streaming vs UIMessageStream)
- [ ] Check `toolName` starts with "mcp_" (not "tool-mcp_")
- [ ] Verify `state` is set
- [ ] Verify `toolCallId` is present
- [ ] Check `input` or `output` data is present

## 📝 Document Statistics

| Document | Lines | Focus |
|----------|-------|-------|
| MESSAGE_PARTS_FLOW_ANALYSIS.md | 330 | Complete architecture |
| TRACING_SUMMARY.md | ~250 | Code locations |
| QUICK_REFERENCE_MCP_PARTS.md | ~180 | MCP tools |
| ANALYSIS_COMPLETE.txt | ~150 | Executive summary |

## ✅ Verification

All three requirements verified:

1. ✅ **LOCATED**: UIMessageStream parts shape and shaping
   - Files: route.ts:394, message.tsx:483-576
   - Type from AI SDK: UIMessagePart<CustomUIDataTypes, ChatTools>

2. ✅ **IDENTIFIED**: Transformations/filters before Message component
   - Storage: No transformation (raw JSONB)
   - Retrieval: Type cast only
   - Rendering: Type dispatch + MCP name parsing

3. ✅ **TRACED**: Path from useChat → ChatMessages → Message
   - Complete flow documented with line numbers
   - Both streaming and UIMessageStream formats supported
   - MCP tools handled by renderMcpTool() normalization

## 🚀 Next Steps

To apply these findings:

1. Check browser console logs to see actual part shapes
2. Query database to verify stored format
3. Add console logs if debugging specific cases
4. Reference QUICK_REFERENCE_MCP_PARTS.md for MCP-specific issues
5. Check expected database format examples for validation

---

**Created:** February 1, 2025
**Status:** Complete
**Scope:** UIMessageStream message parts flow analysis
**Requirements Met:** ✓ All 3

