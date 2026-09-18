# LaborSalz AI Studio — Architecture v0.1

## Purpose

Internal LaborSalz surface for image and video generation based on the OpenHiggsfield
UI/catalog architecture, with LaborSalz-owned runtime storage, server-managed
credentials, persistent generation history, API v2 endpoints, presets and local telemetry.

## Server placement

Project root:

`/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio/`

Runtime code:

`03. Development/repository/apps/laborsalz-ai-studio/`

Persistent runtime data:

`04. Assets/runtime/`

Runtime logs:

`07. Logs/runtime/`

This keeps the project in the official `03. Projects` hierarchy while secrets,
media state and runtime data remain outside Git.

## Runtime flow

Browser
→ Cloudflare Access
→ `ai.laborsalz.com`
→ existing Cloudflare Tunnel
→ `127.0.0.1:3010`
→ Docker container
→ Next.js server
→ generation provider API

Uploads are stored locally under `/data/uploads`, then exposed to generation
providers through expiring HMAC-signed `/api/v2/media/*` URLs.

## Persistence

- uploads: `/data/uploads/<device>/`
- results: `/data/results/<request-id>/`
- history: `/data/history/<device>.json`
- events: `/data/events/YYYY-MM-DD.ndjson`

The first version deliberately avoids introducing another database dependency.
A later migration can move history/events to the existing LaborSalz Postgres
without changing the public API v2 contract.

## Security boundary

- Generation provider key: server environment only when
  `LABORSALZ_AI_API_KEY` is set.
- Internal API: Bearer token via `LABORSALZ_INTERNAL_API_TOKEN`.
- Browser surface: Cloudflare Access.
- Provider-readable input media: signed expiring URLs. Only `/api/v2/media/*`
  should bypass interactive Access.
- Archived outputs under `/api/v2/results/*` stay behind Cloudflare Access.
- Repository: no secrets, generated media or client-private assets.

## Recovery

Docker uses `restart: unless-stopped`. Runtime state lives on
`/Volumes/LaborSalz-Data`, outside the container, so replacing/rebuilding the
container does not delete history, uploads or archived results.
