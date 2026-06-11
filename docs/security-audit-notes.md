# Security Audit Notes

Last checked: 2026-06-11

`bun audit` still exits non-zero after compatible dependency updates and direct
package remediation. The remaining advisories are transitive and should be
tracked with their upstream packages.

## Resolved Direct Advisories

- `better-auth` updated to the patched compatible release.
- `drizzle-orm` updated to `0.45.2`.
- `next` updated to `16.2.9`.
- `postcss` direct dependency updated to `8.5.15`, with an override for nested
  copies.
- `ws` direct dependency updated to `8.21.0`, with an override for nested copies.
- `js-cookie` updated to the patched compatible release.

## Remaining Transitive Clusters

- MCP SDK stack: `@hono/node-server`, `hono`, `express-rate-limit`,
  `path-to-regexp`, `fast-uri`, `ip-address`, `ajv`, and `qs`.
- Workflow stack: `undici`, `path-to-regexp`, `qs`, `picomatch`,
  `brace-expansion`, and `esbuild`.
- Streamdown/Mermaid stack: `dompurify`, `mermaid`, `lodash-es`, and `uuid`.
- Tavily/Axios stack: `axios` and `follow-redirects`.
- Dev tooling stack: `ultracite`, `react-doctor`, `drizzle-kit`, and their
  transitive glob/build dependencies.

## Current Policy

- Do not suppress `bun audit`.
- Keep `bun run audit` available so the residual advisories stay visible.
- Prefer compatible package updates first.
- Use overrides only when typecheck, lint, build, and local verification scripts
  stay green.
