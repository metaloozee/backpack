# Context Glossary

## User

A person authenticated into Backpack who owns Chats, Spaces, Memories, and MCP
Server configurations.

## Chat

A user-owned conversation with the assistant.

## Message

A saved entry in a Chat, such as a user prompt, assistant response, system
message, or tool-data message.

## Vote

A user feedback marker attached to a Message within a Chat.

## Space

A user-owned research workspace that groups Chats and Knowledge around a shared
topic or project.

## Knowledge

A source document or webpage added to a Space so the assistant can search and
reference it.

## Memory

A user-owned saved fact or preference that can be recalled across Chats.

## MCP Server

A user-configured external Model Context Protocol server that can provide tools
to the assistant.

## Artifact

A persistent, chat-owned workspace item for long-form user-visible content.

## Text Artifact

An Artifact whose content is markdown or plain text.

## Artifact Version

An immutable saved snapshot of an Artifact's content.

## Open Artifact

The Artifact currently displayed in the workspace and used as the default target
for ambiguous edit requests.

## Artifact Stream

The ordered stream of events that opens, updates, finishes, or errors an
Artifact while an assistant tool is running.

## Artifact Snapshot

A transient client-side view of an Artifact while it is streaming or before the
latest saved Artifact Version has been refetched.

## Artifact Workspace

The UI region that displays the Open Artifact and supports editing, previewing,
saving, restoring, and comparing Artifact Versions.
