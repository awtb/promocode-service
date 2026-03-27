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


## Tech stack


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

Swagger UI available at: `/docs`

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