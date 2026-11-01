# Job Portal API

A role-aware recruitment REST API built with Python, FastAPI, SQLAlchemy, and PostgreSQL. The application supports job seekers, employers, job listings, and applications, with a small static frontend served by FastAPI.

## Features

- User registration and token-based authentication
- Public job listing, search, and filtering
- Employer-only job creation, updating, and deletion
- Job-seeker application submission and withdrawal
- Employer application review and status updates
- Role and resource-ownership checks
- SQLAlchemy relational models and Pydantic request/response schemas
- Static HTML, CSS, and JavaScript frontend

**Account provisioning:** Public registration always creates a `job_seeker` account. Employer accounts must be provisioned by a trusted operator; a public request cannot grant itself employer permissions.

## Technology stack

- Python 3.10+
- FastAPI and Uvicorn
- SQLAlchemy 2.x
- PostgreSQL with psycopg 3
- Pydantic and Pydantic Settings
- JWT using python-jose
- Argon2 password hashing using pwdlib
- pytest and HTTPX for tests

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/kirubanandhan016/job-portal-api.git
cd job-portal-api
```

### 2. Create a virtual environment

Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Configure PostgreSQL and environment variables

Create a PostgreSQL database and user, then copy the example environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` to your local database values. Generate a unique signing key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Set the generated value as `SECRET_KEY`. Do not commit `.env` or real credentials.

### 5. Run the application

```bash
python -m uvicorn app.main:app --reload
```

The current application creates its SQLAlchemy tables during startup. A migration workflow should be added before production use; the project does not currently contain Alembic migrations.

- Frontend: http://127.0.0.1:8000/
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health check: http://127.0.0.1:8000/health

## API reference

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a job-seeker account |
| POST | `/auth/token` | Public | Obtain an access token using form fields `username` and `password` |

### Users

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | Authenticated | Read the current user's profile |
| PATCH | `/users/me` | Authenticated | Update the current user's name |

### Jobs

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/jobs` | Public | List and filter jobs; supports search, location, employment type, salary floor, offset, and limit |
| GET | `/jobs/{job_id}` | Public | Read one job |
| POST | `/jobs` | Employer | Create a job |
| PUT | `/jobs/{job_id}` | Owning employer | Replace a job listing |
| DELETE | `/jobs/{job_id}` | Owning employer | Delete a job listing |

### Applications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/applications` | Job seeker | Apply to a job |
| GET | `/applications` | Authenticated | List applications visible to the current user |
| GET | `/applications/{application_id}` | Applicant or owning employer | Read one application |
| PATCH | `/applications/{application_id}` | Owning employer | Set status to reviewed, accepted, or rejected |
| DELETE | `/applications/{application_id}` | Owning applicant | Withdraw a pending application |

Protected endpoints require an `Authorization: Bearer <access_token>` header. The full request and response schemas are available from Swagger UI at `/docs`.

## Tests

The test suite uses an isolated in-memory SQLite database and does not require a running PostgreSQL server:

```bash
python -m pytest -v
```

GitHub Actions runs the same tests on pushes and pull requests.

## Known limitations and next engineering steps

- The application currently calls `Base.metadata.create_all()` at startup instead of applying versioned Alembic migrations.
- Public registration creates job-seeker accounts only; employer onboarding is an operator-controlled task.
- PostgreSQL integration should be verified against a real PostgreSQL service before deployment.
- Add pagination metadata, structured logging, migration-based schema management, and broader authorization tests before production use.
- This is a portfolio project and is not intended to process real candidate or employer data without further security review.

## Author

**Kirubanandhan V**

- GitHub: https://github.com/kirubanandhan016
- LinkedIn: https://www.linkedin.com/in/kirubanandhan-v-98bb83443/
