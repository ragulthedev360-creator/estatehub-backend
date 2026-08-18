# EstateHub — Backend

REST API for EstateHub, a full-stack real estate listing platform inspired by 99acres and NoBroker. Built with Node.js, Express, and PostgreSQL. Serves the [EstateHub frontend](https://github.com/ragulthedev360-creator/estatehub-frontend).

## Features

- **JWT Authentication** — Short-lived access tokens + rotating, hashed refresh tokens stored in HttpOnly cookies, with reuse detection
- **Property Listings** — Full CRUD with ownership enforcement, multi-image upload via Multer
- **Search & Filtering** — City, budget, property type, bedroom filters with sorting, backed by composite and full-text search indexes
- **Cursor-Based Pagination** — Scales efficiently to 50,000+ records, avoiding the performance cost of offset-based pagination
- **Similar Properties** — Rule-based recommendation engine (city, type, price band, bedroom match)
- **Lead / Inquiry System** — Duplicate prevention via DB constraint, honeypot spam field, IP-based rate limiting
- **API Documentation** — Full Swagger/OpenAPI docs at `/api-docs`, generated from route-level JSDoc annotations

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | Zod |
| File Uploads | Multer |
| Rate Limiting | express-rate-limit |
| API Docs | swagger-jsdoc + swagger-ui-express |

## Project Structure

```
src/
├── config/              # Database pool, Swagger config
├── modules/
│   ├── auth/            # Register, login, refresh, logout
│   ├── properties/      # CRUD, search/filter, similar properties
│   └── inquiries/       # Lead capture, spam protection
├── middleware/           # authenticate, upload, errorHandler
├── db/
│   └── migrations/      # SQL migration files
├── utils/                # JWT helpers
├── app.js
└── server.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (required for generated columns used in full-text search)

### Installation

```bash
git clone https://github.com/ragulthedev360-creator/estatehub-backend.git
cd estatehub-backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/estatehub
JWT_ACCESS_SECRET=replace_with_a_long_random_string
JWT_ACCESS_EXPIRY=15m
REFRESH_TOKEN_EXPIRY_DAYS=7
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Database Setup

Run the migration files in `src/db/migrations/` in order against your PostgreSQL database:

```bash
psql "$DATABASE_URL" -f src/db/migrations/001_create_users.sql
psql "$DATABASE_URL" -f src/db/migrations/002_create_properties.sql
psql "$DATABASE_URL" -f src/db/migrations/003_search_indexes.sql
psql "$DATABASE_URL" -f src/db/migrations/004_create_inquiries.sql
```

### Run the server

```bash
npm run dev
```

The API runs at `http://localhost:5000`.
Interactive API documentation is available at `http://localhost:5000/api-docs`.

## API Overview

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Log in |
| POST | `/api/auth/refresh` | Cookie | Rotate refresh token, issue new access token |
| POST | `/api/auth/logout` | Cookie | Revoke refresh token |
| GET | `/api/properties` | No | Search/filter/paginate listings |
| GET | `/api/properties/:slug` | No | Get property details |
| POST | `/api/properties` | Yes | Create a listing |
| PATCH | `/api/properties/:id` | Yes (owner) | Update a listing |
| DELETE | `/api/properties/:id` | Yes (owner) | Delete a listing |
| GET | `/api/properties/:id/similar` | No | Get similar property recommendations |
| POST | `/api/properties/:id/inquiries` | No | Send an inquiry to the owner |
| GET | `/api/inquiries/mine` | Yes | View inquiries received on your listings |
| GET | `/api-docs` | No | Swagger UI |

Full request/response schemas are available in the Swagger docs once the server is running.

## Key Design Decisions

- **Refresh token rotation with reuse detection** — every refresh issues a new token and revokes the old one; if a revoked token is presented again, the entire session family is revoked as a compromise signal.
- **Ownership enforced at the service layer**, not just route middleware — every update/delete re-checks `owner_id` immediately before the mutation.
- **Cursor (keyset) pagination**, not `OFFSET` — constant-time page retrieval regardless of how deep the user paginates, essential at the 50,000+ record scale this system is designed for.
- **Composite index** `(city, status, property_type, price)` covers the most common filter+sort query pattern in a single index scan.
- **Duplicate inquiry prevention** enforced at the database level (`UNIQUE (property_id, email)`), not just in application code — correct even under concurrent requests.

## Related Repository

Frontend: [estatehub-frontend](https://github.com/ragulthedev360-creator/estatehub-frontend)

## License

This project was built as a technical assignment.
