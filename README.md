# Job Portal API

**Recruitment management backend built with Python, FastAPI, and PostgreSQL.**

This project models a job portal where job seekers can browse jobs and submit applications, while employers manage job listings. It is currently a development project.

## Features

- User registration and login
- Job listing and management endpoints
- Job application workflows
- Role-based permissions for employers and job seekers
- PostgreSQL persistence through SQLAlchemy
- Request validation with Pydantic
- Interactive API documentation through FastAPI
- A basic HTML, CSS, and JavaScript interface served by the application

## Technology stack

Python · FastAPI · PostgreSQL · SQLAlchemy · Pydantic · Uvicorn · HTML · CSS · JavaScript

## Project structure

```text
app/
├── routers/
│   ├── auth.py
│   ├── users.py
│   ├── jobs.py
│   └── applications.py
├── static/
├── auth.py
├── database.py
├── dependencies.py
├── main.py
├── models.py
└── schemas.py
.env.example
requirements.txt
```

## Run locally

### 1. Clone and install

```bash
git clone https://github.com/kirubanandhan016/job-portal-api.git
cd job-portal-api
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux**
```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

### 2. Configure secrets

Copy `.env.example` to `.env`, then set your local PostgreSQL credentials and a strong, unique `SECRET_KEY`. The application requires database credentials to be configured; do not use real credentials in source code.

Never commit `.env` or publish tokens, passwords, or signing keys.

### 3. Prepare PostgreSQL

Install and start PostgreSQL, then create the database and user matching your local environment settings. Confirm the host, port, database name, username, and password are consistent.

### 4. Start the API

```bash
python -m uvicorn app.main:app --reload
```

When the server starts, open:

- Web interface: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## What to verify

Before using a deployment demo, test the complete workflow: registration, login, job listing, employer job management, application submission, and application status handling. Verify that users cannot modify resources owned by other users or roles.

## Project status

**In development.** This repository is intended as a learning and portfolio project. Do not treat it as a production recruitment system without additional security review, automated tests, operational configuration, and deployment verification.

## Author

**Kirubanandhan V** · [GitHub](https://github.com/kirubanandhan016) · [Portfolio](https://kirubanandhan016.github.io/) · [LinkedIn](https://www.linkedin.com/in/kirubanandhan-v-98bb83443/)
