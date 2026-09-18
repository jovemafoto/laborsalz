# Generation persistence and database path

## Current runtime

The first deploy persists generation history as atomic JSON and events as NDJSON
under the project runtime volume. This keeps the initial deployment isolated from
the existing production database and removes a database dependency from the UI.

## Prepared Postgres schema

`deploy/postgres/001_ai_studio.sql` prepares a future `ai_studio` schema with:

- generation requests
- output assets
- event records
- indexes for model/time reporting

The migration is intentionally not applied automatically. The LaborSalz server
already has a production Postgres container, so the migration should only be run
after the server connection, backup and database name are confirmed from the
live host.

The API v2 contract is designed so the storage implementation can move from
JSON/NDJSON to Postgres without changing clients.
