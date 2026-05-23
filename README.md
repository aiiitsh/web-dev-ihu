# Movies Platform School Project

This project replaces the old PHP/MySQL exercise files with a JavaScript stack:

- `backend`: Node.js + Express API with seeded in-memory data.
- `frontend`: React Native app built with Expo.

The old MySQL tables are represented as arrays in the backend: `personnel`, `movies`, `directs`, and `acts`. The API enforces the same relationship behavior in code, including cascade-style deletion for movie relationships.

## Features

- Login using the old credentials: `examino` / `prodef`
- Locked API routes using a bearer token
- Red cinema-themed React Native interface with faded film-pattern background details
- Movie library dashboard with counts, top-rated highlights, refresh, and delete actions
- Movie titles starting with `M`
- Add new movie form
- Search movie by title
- Artists born from 1940 onwards
- Artist and movie selection lists
- Save director/movie links into `directs`
- Project tab with project purpose, live data counts, features, properties, stack, data model, backend routes, session-locking explanation, and ON DELETE CASCADE demo

## Project Tab Maintenance

The React Native app keeps Project tab content in the `projectDetails` object near the top of `frontend/App.js`. Whenever new screens, routes, validation rules, storage behavior, or UI features are added, update `projectDetails` in the same change so the Project tab remains accurate.

## Run

Install dependencies:

```bash
npm run install:all
```

Start the backend:

```bash
npm run backend
```

Start the React Native app in another terminal:

```bash
npm run frontend
```

The backend runs at `http://localhost:3001` by default. For a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN URL before starting Expo, for example:

```bash
$env:EXPO_PUBLIC_API_URL="http://192.168.1.50:3001"; npm run frontend
```

## Main API Routes

- `POST /api/auth/login`
- `GET /api/movies`
- `GET /api/movies?startsWith=M`
- `GET /api/movies?search=matrix`
- `POST /api/movies`
- `PUT /api/movies/:mid`
- `DELETE /api/movies/:mid`
- `GET /api/personnel?bornFrom=1940`
- `GET /api/options`
- `POST /api/directs`
- `POST /api/demo/cascade`
- `POST /api/reset`

## ER Diagram

```text
personnel 1..n directs n..1 movie
personnel 1..n acts    n..1 movie
```

`directs` stores which personnel directed which movie. `acts` stores which personnel acted in which movie and includes `role_name`.

## ON DELETE CASCADE

In the original SQL, `ON DELETE CASCADE` means that when a referenced parent row is deleted, child rows referencing it are automatically deleted too. For example, deleting `movie.mid = 2` also removes rows in `directs` and `acts` where `mid = 2`.

This project has no MySQL server, so the backend implements the same behavior in `deleteMovieWithCascade()` and exposes a safe cloned-data test at `POST /api/demo/cascade`.
