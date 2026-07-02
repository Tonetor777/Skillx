# Skilix Frontend

This is the Vite React frontend for Skilix.

## Stack

- Vite
- React 19
- React Router
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

## Environment

Set `VITE_API_URL` to the Django API base URL.

```bash
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK_API=false
```

Set `VITE_USE_MOCK_API=true` only for local demos without Django.

## Run Locally

```bash
npm ci
npm run dev
```

The app runs on `http://localhost:3000`.

## Validate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
