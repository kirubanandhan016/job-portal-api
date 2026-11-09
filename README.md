# Job Portal API

[![Job Portal tests](https://github.com/kirubanandhan016/job-portal-api/actions/workflows/tests.yml/badge.svg)](https://github.com/kirubanandhan016/job-portal-api/actions/workflows/tests.yml)

Recruitment management backend built with Python, FastAPI, SQLAlchemy, and PostgreSQL.

The project models job seekers, employer-managed job listings, and applications. It includes a small static web interface served by FastAPI.

## Features

- Public job-seeker registration and token-based login
- Employer-only job creation, modification, and deletion
- Job search by title, location, employment type, and minimum salary
- Job application submission and withdrawal
- Employer review and status updates for applications
- Role and resource-ownership checks
- PostgreSQL persistence through SQLAlchemy
- Pydantic request validation and interactive OpenAPI documentation
- Static HTML, CSS, and JavaScript interface

## Technology

Python · FastAPI · SQLAlchemy · PostgreSQL · Pydantic · python-jose · pwdlib/Argon2 · Uvicorn · Pytest

## Project structure

```text
app/
├── routers/
│   ├── auth.py
│   ├── users.py
│   ├── jobs.py
│   └── applications.py
├── static/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── auth.py
├── database.py
├── dependencies.py
├── main.py
├── models.py
└── schemas.py
tests/
├── conftest.py
└── test_auth_security.py
.env.example
requirements.txt
```

## Local setup

Clone the repository and create a virtual environment:

```bash
git clone https://github.com/kirubanandhan016/job-portal-api.git
cd job-portal-api
python -m venv .venv
```

Activate it:

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

## Environment configuration

Copy `.env.example` to `.env`. Set the PostgreSQL host, port, database, username, and password.

Generate a unique JWT signing secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put the generated value in `SECRET_KEY`. The application refuses to start when the signing secret is shorter than 32 characters. Keep `.env` out of version control. Do not use the example file's empty values as production credentials.

You may supply `DATABASE_URL` instead of the individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` values.

## PostgreSQL setup

Create a PostgreSQL database and a dedicated application user. Grant that user only the permissions required by the application. Configure the same connection values in `.env`.

The application creates the current SQLAlchemy metadata during startup. This repository does not currently include Alembic migrations; use a controlled schema migration process before evolving a production database.

## Run the application

```bash
python -m uvicorn app.main:app --reload
```

- Web interface: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

## Authentication and employer approval

### Public registration

`POST /auth/register` accepts JSON:

```json
{
  "email": "candidate@example.com",
  "full_name": "Job Candidate",
  "password": "a-secure-password"
}
```

Public registration always creates a `job_seeker`. The schema rejects extra fields, including a client-supplied `role`. Users cannot grant themselves employer access.

### Login

Login is `POST /auth/token` (OAuth2 password form), not `/auth/login`.

Form fields:

- `username`: registered email address
- `password`: account password

The response contains an `access_token` and `token_type: bearer`. Send the token as `Authorization: Bearer <access_token>` to protected endpoints.

Passwords are hashed using the recommended Argon2 implementation from pwdlib. JWTs are signed with HS256 and contain `sub`, `iat`, and `exp` claims. Protected requests validate the signature, expiry, required claim types, and corresponding user record.

### Trusted employer approval

There is no public employer self-registration or role-upgrade endpoint. Employer access must be granted by a trusted database administrator only after independently verifying the organization and requester. The administrator should follow the organization's audited access-change procedure and execute a parameterized update, for example:

```sql
UPDATE users
SET role = 'employer'
WHERE email = :verified_email
  AND role = 'job_seeker';
```

Confirm exactly one intended account was changed and retain an approval record outside this application. Do not run this update using public application credentials or accept an approval decision supplied by the requester. An in-application employer-request queue and administrator approval UI are future work, not current features.

## API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a job seeker |
| POST | `/auth/token` | Public | Exchange credentials for a bearer token |
| GET | `/users/me` | Authenticated | Read the current profile |
| PATCH | `/users/me` | Authenticated | Update the current profile |
| GET | `/jobs` | Public | Search and paginate job listings |
| GET | `/jobs/{job_id}` | Public | Read a job |
| POST | `/jobs` | Employer | Create a job |
| PUT | `/jobs/{job_id}` | Owning employer | Update a job |
| DELETE | `/jobs/{job_id}` | Owning employer | Delete a job |
| POST | `/applications` | Job seeker | Apply for a job |
| GET | `/applications` | Authenticated | List own applications or applications to own jobs |
| GET | `/applications/{application_id}` | Owner / relevant employer | Read an application |
| PATCH | `/applications/{application_id}` | Owning employer | Update application status |
| DELETE | `/applications/{application_id}` | Owning job seeker | Withdraw a pending application |
| GET | `/health` | Public | Health check |

Check the generated OpenAPI schema for exact request and response fields.

## Error handling and authorization

The API uses HTTP 401 for invalid authentication, 403 for authenticated users without the required role or resource ownership, 404 for missing resources, 409 for duplicate registration/application conflicts, and 422 for schema validation errors where applicable.

Employer permissions are enforced by role dependencies. Job and application operations also check ownership so one employer cannot manage another employer's listings or applications.

## Tests

Run:

```bash
python -m pytest -v
```

The test suite uses an isolated SQLite database and covers:

- Registration security, including rejection of client-supplied employer roles
- JWT validation, malformed claims, and expired tokens
- Job search filters and minimum-salary filtering
- Employer ownership checks for updating and deleting job listings
- Application submission, duplicate-application conflicts, and withdrawal
- Employer review permissions and applicant-level resource isolation

The tests exercise the route-handler functions with SQLAlchemy sessions; they are not full HTTP-client end-to-end tests.

GitHub Actions runs the test suite on pushes and pull requests, then verifies PostgreSQL 16 connectivity and creates the users, jobs, and applications tables. The PostgreSQL step is a schema/connectivity smoke check, not a full application workflow test against PostgreSQL. Schema creation currently uses SQLAlchemy `Base.metadata.create_all`; Alembic migrations are not yet implemented.

## Project status and limitations

This is a learning and portfolio project, not a production recruitment service. The employer approval process is currently a trusted, out-of-band database-administrator operation. An application-managed approval queue, audit trail, rate limiting, token revocation, PostgreSQL integration testing, schema migrations, and deployment hardening remain future work.

## Author

**Kirubanandhan V**

- GitHub: [@kirubanandhan016](https://github.com/kirubanandhan016)
- Portfolio: [kirubanandhan016.github.io](https://kirubanandhan016.github.io/)
- LinkedIn: [Kirubanandhan V](https://www.linkedin.com/in/kirubanandhan-v-98bb83443/)
