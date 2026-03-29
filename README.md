# 🎟️ Promocode service

REST API for a promocode system built with **Node.js**, **TypeScript**, **Fastify**, **Drizzle ORM**, and **PostgreSQL**.

## Features

- create a promocode
- get a promocode by id
- list promocodes with pagination
- activate a promocode by email
- prevent duplicate activation of the same promocode by the same email
- prevent activation beyond the configured limit
- prevent activation of expired promocodes

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/promocodes` | List promocodes with pagination support. |
| `GET` | `/promocodes/:id` | Get a single promocode by its UUID. |
| `POST` | `/promocodes` | Create a new promocode. |
| `POST` | `/promocodes/:code/activate` | Activate a promocode for an email address. |

<img src=".github/demo/image.png" alt="Swagger UI screenshot" width="900">

## Tech stack

- Node.JS
- TypeScript
- Fastify
- Drizzle 
- PostgreSQL

### 1. Install dependencies
```bash
pnpm install
```

### 2. Create .env 

```bash
cp .env.example .env
```

You can fill it using examples
```env
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/promocode_service
```


### 4. Apply migrations

```bash
pnpm db:migrate
```

### 5. Start the application

```bash
pnpm dev
```

## Testing

E2E tests use:
- **Vitest**
- **Testcontainers**
- a real **PostgreSQL** instance started specifically for tests

This means tests do not rely on mocks or in-memory databases for critical persistence and concurrency behavior.

### Running tests

```bash
pnpm test:e2e
```
