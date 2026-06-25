# Backend

A monolithic [FastAPI](https://fastapi.tiangolo.com/) backend for a small social/posting app. Users can register, authenticate, manage a short bio, and create text items ("posts"). All application code lives in a single module, `app.py`, organized into clearly labeled sections.

## Tech stack

- **FastAPI** — web framework
- **SQLModel** — ORM + Pydantic models over **PostgreSQL**
- **Uvicorn** — ASGI server
- **pwdlib** — password hashing (Argon2 primary, bcrypt fallback)
- **PyJWT** — JWT access tokens

## Project layout

| File | Purpose |
|------|---------|
| `main.py` | Entrypoint — runs the app with Uvicorn on `0.0.0.0:8000` |
| `app.py` | The entire application, split into sections: **Db**, **Models**, **Security**, **Auth**, **CRUD**, **App**, **Routes** |
| `pyproject.toml` | Project metadata and dependencies (managed with `uv`) |
| `Dockerfile` | Container image (used by the root `compose.yaml`) |

## Configuration

The backend reads the following environment variables (provided via the repo-root `.env`, see `../.env.example`):

| Variable | Purpose |
|----------|---------|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | Postgres connection |
| `SECRET_KEY` | Key used to sign JWTs |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime |
| `DEBUG` | When `"True"`, deletes a local `database.db` on shutdown (legacy cleanup) |

> **Note:** the database URL in `app.py` is built against the host `db` — the Postgres service
> name from the root `compose.yaml`. The backend therefore expects to run **inside** Docker
> Compose, where that hostname resolves. See the [root README](../README.md).

## Data model

- **User** — `id` (UUID), `created_at`, `name`, `bio`, `hashed_pwd`
- **Item** — `id` (UUID), `created_at`, `author_id` (FK → User), `title`, `text`

Validation rules:
- User `name`: 5–15 chars (must be unique)
- User `bio`: up to 2000 chars (optional)
- Password: min 8 chars
- Item `title`: 1–50 chars
- Item `text`: 1–2000 chars

## Authentication

OAuth2 password flow with bearer JWT tokens (HS256). Obtain a token from `POST /login/access-token`, then send it as `Authorization: Bearer <token>` on protected endpoints. Tokens are signed with `SECRET_KEY` and expire after `ACCESS_TOKEN_EXPIRE_MINUTES` minutes.

## API endpoints

### Login
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/login/access-token` | — | Exchange username/password (form data) for an access token |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/user/` | — | Register a new user |
| `GET` | `/user/me` | ✅ | Get the current authenticated user |
| `GET` | `/user/{id}` | — | Get a user by id |
| `PUT` | `/user/` | ✅ | Update the current user's bio |
| `GET` | `/user/{id}/items/` | — | List a user's items (paginated via `offset` / `limit`) |

### Items
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/item/` | ✅ | Create an item authored by the current user |
| `GET` | `/item/{id}` | — | Get an item by id |

## Running

The backend is normally run via Docker Compose from the repo root (it needs the `db` Postgres
service). See the [root README](../README.md):

```bash
docker compose up --build
```

Inside Compose the API is exposed on the host at `http://127.0.0.1:8080` (mapped to container
port `8000`), with interactive docs at `http://127.0.0.1:8080/docs`.

To work on dependencies locally:

```bash
# from the b/ directory
uv sync
uv run main.py   # serves on :8000, but needs a reachable Postgres at host `db`
```

CORS is currently configured to allow **all** origins (`*`).

## Database lifecycle

On startup, all tables are created in the configured Postgres database. When `DEBUG="True"`,
a local `database.db` file (legacy SQLite artifact) is removed on shutdown.
