# fullstack — Konoha

A small full-stack social/posting app. Users sign up, authenticate, manage a short bio, and
create text items ("posts").

This is a monorepo with two services orchestrated by Docker Compose:

| Path | Service | Stack |
| --- | --- | --- |
| [`b/`](./b) | Backend API | FastAPI + SQLModel + PostgreSQL (Python 3.14, `uv`) |
| [`f/`](./f) | Web frontend | React 19 + Vite + TanStack Router/Query (`pnpm`) |

The frontend's typed API client is generated from the backend's OpenAPI schema, so the backend
is the source of truth for API types.

## Quick start (Docker Compose)

This is the recommended way to run the whole stack — the backend connects to Postgres via the
`db` service hostname, which only resolves inside the Compose network.

1. Create a `.env` in the repo root. Use `.env.example` as a starting point, but the backend and
   compose actually need these keys:

   ```dotenv
   POSTGRES_DB=konoha
   POSTGRES_USER=konoha
   POSTGRES_PASSWORD=change-me
   POSTGRES_PORT=5432

   SECRET_KEY=<random-secret>
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   DEBUG=False
   ```

2. Build and start everything:

   ```bash
   docker compose up --build
   ```

This brings up three containers:

| Service | Host port | Notes |
| --- | --- | --- |
| `db` | `${POSTGRES_PORT}` → 5432 | Postgres 18, with a healthcheck the backend waits on |
| `backend` | `8080` → 8000 | FastAPI; docs at http://127.0.0.1:8080/docs |
| `frontend` | `5173` → 5173 | Vite production preview |

Open the app at **http://localhost:5173**. The frontend calls the backend at
`http://127.0.0.1:8080` (configured in `f/src/client/client.gen.ts`).

## Local development

You can also run each service directly. See each service's README for details:

- Backend: [`b/README.md`](./b/README.md) — `uv sync && uv run main.py` (needs a reachable Postgres at host `db`)
- Frontend: [`f/README.md`](./f/README.md) — `pnpm install && pnpm run dev`

When the backend's routes or models change, regenerate the frontend client (with the backend
running): `cd f && pnpm run gen-cli`.

## Configuration & notes

- All services read configuration from the repo-root `.env` (git-ignored).
- CORS on the backend currently allows all origins (`*`).
- JWTs are signed with `SECRET_KEY`; auth tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES`.

## License

See [LICENSE](./LICENSE).
