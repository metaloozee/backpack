# Context Glossary

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
