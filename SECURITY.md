# Security Policy

SpecDock is a local-first API contract workspace. Imported contracts, auth
profiles, request preferences, and generated previews stay in the user's
browser unless the user exports or sends them.

For the full security model, deployment guidance, proxy rules, and sensitive
data handling notes, see [docs/SECURITY.md](docs/SECURITY.md).

## Reporting Vulnerabilities

Please do not report suspected security vulnerabilities in public issues.

Use GitHub's private vulnerability reporting flow for this repository when it
is available. If that flow is unavailable, contact the maintainer through the
GitHub profile linked from the repository owner account.

Include:

- affected version or commit
- clear reproduction steps
- expected and actual behavior
- impact assessment
- any relevant logs with secrets removed

SpecDock does not currently run a paid bug bounty program.

## Security Expectations

- Public demo deployments must keep `PROXY_ENABLED=false`.
- Self-hosted proxy mode must use explicit allowed hosts and SSRF protections.
- Do not log or persist Authorization headers, Cookie headers, API keys,
  tokens, request bodies, or response bodies.
- Treat OpenAPI specs, cURL input, URL input, localStorage, and network
  responses as untrusted input.
