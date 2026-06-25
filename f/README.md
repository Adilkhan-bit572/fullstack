# fullstack — Frontend

The web client for **Konoha**: a small social app where users sign up, post items, and manage a profile. Built with React 19, Vite, TanStack Router/Query, and a type-safe API client generated from the backend's OpenAPI schema.

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | [Vite](https://vite.dev) |
| UI library | React 19 |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based, auto code-splitting) |
| Server state | [TanStack Query](https://tanstack.com/query) |
| Forms | react-hook-form + [Zod](https://zod.dev) validation |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) components |
| API client | [@hey-api/openapi-ts](https://heyapi.dev) with the axios client |
| Toasts | [sonner](https://sonner.emilkowal.ski) |

## Prerequisites

- Node.js 20+ and pnpm
- The [backend](../b) reachable at `http://127.0.0.1:8080` (the port the root `compose.yaml` maps the backend to). The API client is generated from, and points at, that address.

## Getting started

```bash
cd f
pnpm install
pnpm run dev
```

The dev server prints a local URL (Vite default `http://localhost:5173`). The app talks to the backend at `http://127.0.0.1:8080` — make sure it's up first. For the full stack in one command, use Docker Compose from the repo root (see the [root README](../README.md)).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start the Vite dev server with HMR |
| `pnpm run build` | Type-check (`tsc -b`) and build for production |
| `pnpm run preview` | Serve the production build locally |
| `pnpm run lint` | Run ESLint over the project |
| `pnpm run gen-cli` | Regenerate the API client from the backend's OpenAPI schema |

## Project structure

```
src/
├── main.tsx              # App entry: router + react-query providers, auth interceptors
├── routeTree.gen.ts      # Auto-generated route tree (do not edit by hand)
├── routes/               # File-based routes
│   ├── __root.tsx        # Root layout
│   ├── index.tsx         # Home feed
│   ├── login.tsx         # Login
│   ├── signup.tsx        # Sign up
│   ├── myprofile.tsx     # Current user's profile (auth-guarded)
│   └── profile/$user_id.tsx  # Public profile by id
├── components/
│   ├── items/            # Items
│   ├── profile/          # Profile card, update-bio menu, error display
│   └── ui/               # shadcn/ui primitives
├── hooks/
│   └── Authhook.ts       # useAuth: current user, login/signup/logout
├── client/               # Generated API client (see "API client" below)
├── lib/utils.ts          # cn()
└── index.css             # Tailwind entry
```

The `@` alias maps to `src/` (configured in `vite.config.ts` and `tsconfig`).

## Authentication

Auth is token-based:

- On login, the JWT is stored in `localStorage` under `access_token`.
- A request interceptor in `main.tsx` attaches `Authorization: Bearer <token>` to every request.
- A response interceptor clears the token and redirects to `/login` on `401`/`403`.
- `isLoggedIn()` and the `useAuth()` hook (`src/hooks/Authhook.ts`) expose the current user and the login/signup/logout flows.
- Protected routes (e.g. `/myprofile`) redirect to `/login` in their `beforeLoad` guard.

## API client

The `src/client/` directory is **auto-generated** by `@hey-api/openapi-ts` from the backend's OpenAPI document — don't edit it by hand. Each endpoint becomes a typed function (e.g. `getUsersItemsUserIdItemsGet`, `createItemItemPost`, `updateBioUserPut`) along with request/response types.

To regenerate after the backend API changes (with the backend running):

```bash
pnpm run gen-cli
```

This reads `http://127.0.0.1:8080/openapi.json` and writes the client into `src/client`. The base URL lives in `src/client/client.gen.ts`.

## Data fetching conventions

- Reads use `useQuery`; the current user is cached under the `["me"]` query key.
- Writes use `useMutation`, calling the generated client functions and invalidating the relevant query keys on success (e.g. updating the bio invalidates `["me"]`, creating an item invalidates `["items"]`).
- Forms are built with react-hook-form + a Zod schema via `zodResolver`, surfacing success/error feedback through sonner toasts.
