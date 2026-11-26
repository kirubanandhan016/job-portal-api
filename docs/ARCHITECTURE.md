# Job Portal API — Architecture

```mermaid
flowchart TD
  Client[Browser / API client] --> App[FastAPI application]
  App --> UI[Static HTML / CSS / JavaScript]
  App --> Router[Auth / users / jobs / applications]
  Router --> Guard[JWT, role and ownership dependencies]
  Router --> ORM[SQLAlchemy models]
  ORM --> DB[(PostgreSQL)]
  Tests[Pytest] --> Router
  Migrations[Alembic migration tooling] -. schema management status to verify .-> DB
```

Public routes expose job search and registration. Authenticated routes apply role and ownership checks before reading or changing job and application records. The static interface is served by the same FastAPI application.
