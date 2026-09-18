# Deployment — LaborSalz Server

## Known host baseline

The current LaborSalz server map places production infrastructure on the Mac mini
and persistent data on `/Volumes/LaborSalz-Data`. Existing production services
already use Docker, native ports and Cloudflare Tunnel, so AI Studio is isolated
on localhost port 3010 by default.

## One-command bootstrap

From Terminal on the Mac mini:

```bash
curl -fsSL https://raw.githubusercontent.com/jovemafoto/laborsalz/feature/laborsalz-ai-studio/apps/laborsalz-ai-studio/scripts/bootstrap-server.sh | bash
```

The script is additive. It creates the official project folder structure, clones
or fast-forwards the feature branch, creates a private `.env` only when missing,
builds the container, starts it and verifies `/api/v2/health`.

## Cloudflare

Do not blindly overwrite the existing tunnel configuration. Run:

```bash
bash "/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio/03. Development/repository/apps/laborsalz-ai-studio/scripts/cloudflare-plan.sh"
```

Then add `ai.laborsalz.com -> http://localhost:3010` to the existing production
tunnel.

Protect the studio with Cloudflare Access. The only planned Access bypass is
`/api/v2/media/*`, because generation providers must fetch signed input media.

## Backups

Back up the project runtime directory:

`/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio/04. Assets/runtime/`

The Git repository is not the backup for generated media or history.
