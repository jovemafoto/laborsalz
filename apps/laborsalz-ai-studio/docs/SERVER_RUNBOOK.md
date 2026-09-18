# LaborSalz AI Studio — Server runbook

## Safe execution order

1. Run `scripts/server-preflight.sh`.
2. Review the generated report under `07. Logs/runtime`.
3. Run `scripts/bootstrap-server.sh`.
4. Confirm `scripts/health-check.sh`.
5. Add the Cloudflare Tunnel hostname only after the local endpoint is healthy.
6. Configure Cloudflare Access.
7. Publish n8n monitoring only after the service is reachable.
8. Keep the GitHub PR in draft until the upstream license checkpoint is resolved.

## Resource budget

The AI Studio container is intentionally capped for the current 8 GB Mac mini:

- 768 MB RAM
- 1.5 CPU
- 256 PIDs
- Docker log rotation: 3 x 10 MB

These are runtime limits, not generation limits: model inference happens on the
remote generation API rather than on the Mac mini.

## Maintenance

Health:

```bash
./scripts/health-check.sh
```

Safe fast-forward update:

```bash
./scripts/update-server.sh
```

Metadata backup:

```bash
./scripts/backup-runtime.sh
```

Full local-media backup, only when enough disk space is available:

```bash
FULL_MEDIA=1 ./scripts/backup-runtime.sh
```

No script in this runbook recursively changes permissions on production trees.
