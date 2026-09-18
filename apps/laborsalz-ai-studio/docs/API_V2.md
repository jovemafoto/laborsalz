# LaborSalz AI Studio API v2

Base URL: `https://ai.laborsalz.com/api/v2`

## Public-to-studio endpoints

- `GET /` — endpoint map
- `GET /health` — runtime/storage/gateway health
- `GET /models` — model catalog and accepted parameters
- `GET /parameters/:modelId` — exact schema, media roles and resolved defaults for one model
- `GET /presets` — LaborSalz and Nuance preset catalog
- `GET /stats?days=31` — local telemetry summary
- `GET|PUT /history` — per-device persistent history
- `POST /upload` — local media upload
- `GET /media/<path>?exp=<unix>&sig=<hmac>` — signed input-media delivery
- `GET /results/<request>/<asset>` — locally archived completed outputs

The browser surface is expected to be protected by Cloudflare Access.

## Internal automation endpoints

These require:

`Authorization: Bearer <LABORSALZ_INTERNAL_API_TOKEN>`

### POST /generate

Body:

```json
{
  "model": "model-id",
  "prompt": { "text": "..." },
  "media": {},
  "settings": {}
}
```

Returns a queued provider request.

### GET /status/:requestId

Returns normalized generation status.

## Model parameter discovery

`GET /models` is the catalog-wide discovery endpoint. `GET /parameters/:modelId`
is the focused "get parameters v2" endpoint: it returns the model ID, surface,
accepted media roles, exact setting schema and resolved defaults for one model.
Clients should build controls from these responses instead of hardcoding provider
parameters.
