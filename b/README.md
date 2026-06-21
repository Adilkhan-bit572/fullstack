# Backend

A monolithic [FastAPI](https://fastapi.tiangolo.com/) backend for a small social/posting app. Users can register, authenticate, manage a short bio, and create text items ("posts"). All application code lives in a single module, `app.py`, organized into clearly labeled sections.

## Tech stack

- **FastAPI** — web framework
- **SQLModel** — ORM + Pydantic models over SQLite (`database.db`)
- **Uvicorn** — ASGI server
- **pwdlib** — password hashing (Argon2 primary, bcrypt fallback)

## Project layout

| File | Purpose |
|------|---------|
| `main.py` | Entrypoint — runs the app with Uvicorn |
| `app.py` | The entire application, split into sections: **Db**, **Models**, **Security**, **Auth**, **CRUD**, **App**, **Routes** |
| `pyproject.toml` | Project metadata and dependencies |

## Data model

- **User** — `id` (UUID), `created_at`, `name`, `bio`, `hashed_pwd`
- **Item** — `id` (UUID), `created_at`, `author_id` (FK → User), `title`, `text`

Validation rules:
- User `name`: 5–15 chars (must be unique)
- User `bio`: up to 2000 chars (optional)
- Password: min 8 chars
- Item `title`: 1–25 chars
- Item `text`: 1–2000 chars

## Authentication

OAuth2 password flow with bearer JWT tokens. Obtain a token from `POST /login/access-token`, then send it as `Authorization: Bearer <token>` on protected endpoints. Tokens expire after 30 minutes.

> **Note:** `SECRET_KEY` is generated fresh at process startup, so all tokens are invalidated whenever the server restarts.

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

Install dependencies and start the server:

```bash
# from the b/ directory
uv sync
uv run python main.py
```

The API will be available at `http://127.0.0.1:8000`, with interactive docs at `http://127.0.0.1:8000/docs`.

CORS is configured to allow requests from `http://localhost`, `http://localhost:8080`, and `http://localhost:5713`.

## Database lifecycle

On startup, all tables are created in `database.db`. **On shutdown, the database file is deleted** — data does not persist across server runs. This is suitable for development and demos, not production.
