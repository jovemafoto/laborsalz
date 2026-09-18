# LaborSalz AI Studio

Internal LaborSalz image and video generation workspace.

This branch adapts the OpenHiggsfield studio architecture for the LaborSalz
server: local media storage, server-managed provider credentials, persistent
history, API v2, presets, telemetry, Docker deployment and Cloudflare Tunnel
integration.

## Runtime target

- URL: `https://ai.laborsalz.com`
- localhost origin: `127.0.0.1:3010`
- project root: `/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio`
- runtime data: `04. Assets/runtime`

## Local development

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

## Server deployment

See `docs/DEPLOYMENT.md` and `scripts/bootstrap-server.sh`.

## API v2

See `docs/API_V2.md`.

## Upstream licensing checkpoint

Read `UPSTREAM.md` before merging or releasing this branch. The upstream
repository did not declare an explicit software license when this integration
work began.

## Validation

Pull requests run the GitHub Actions `AI Studio CI` build. The server bootstrap also performs a full Docker/Next.js build before replacing the running container.
