# Cloudflare — LaborSalz AI Studio

## Target

`https://ai.laborsalz.com` → Cloudflare Tunnel → `http://127.0.0.1:3010`

The current LaborSalz service inventory lists the named `laborsalz-intel`
tunnel as the general LaborSalz Intel tunnel. Treat that as a candidate, not an
assumption: run `scripts/server-preflight.sh` and confirm the live LaunchDaemon,
tunnel list and config file before editing anything.

## DNS

`scripts/cloudflare-route-dns.sh` is dry-run by default. After confirming the
tunnel:

```bash
APPLY=1 TUNNEL_NAME=laborsalz-intel ./scripts/cloudflare-route-dns.sh
```

This only creates/updates the Cloudflare Tunnel DNS route. It deliberately does
not rewrite a production ingress configuration.

## Ingress

Copy `deploy/cloudflare/ingress-snippet.yml` immediately before the final
catch-all rule of the confirmed tunnel. Then validate using the cloudflared
version/config mode used by that host before restarting its LaunchDaemon.

## Cloudflare Access

Protect `ai.laborsalz.com/*` with LaborSalz identity policy.

Create one narrowly-scoped higher-priority bypass for:

`ai.laborsalz.com/api/v2/media/*`

That endpoint uses short-lived HMAC-signed URLs and must be readable by external
generation workers retrieving input media.

Do **not** bypass:

- `/api/v2/results/*`
- `/generations*`
- `/stats*`
- `/api/v2/generate`
- `/api/v2/status/*`

The internal generate/status API has a second Bearer-token boundary in addition
to Cloudflare Access.

## Why the bypass is narrow

Input image/video/audio URLs are handed to Higgsfield model workers. Those
workers cannot complete an interactive Cloudflare Access login. Finished
generation outputs are copied back into LaborSalz storage and remain protected.
