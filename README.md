# 💼 Job Portal API

### A Simple Job Portal Built with Python, FastAPI & PostgreSQL

A web-based job portal where users can register, log in, explore job listings, post jobs, and apply for opportunities. Built with a Python backend and a PostgreSQL database.

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Status-In%20Development-orange" alt="Project Status">
</p>

---

## ✨ Features

- 🔐 **User Authentication** — Register and log in securely.
- 💼 **Job Listings** — Browse available job opportunities.
- 📝 **Job Management** — Create, update, and manage job postings.
- 📄 **Job Applications** — Apply for jobs and manage applications.
- 👤 **User Management** — Manage user information.
- 🔑 **Role-Based Access** — Separate permissions for employers and job seekers.
- ⚡ **REST API** — Access backend functionality through API endpoints.
- 🌐 **Web Interface** — Simple frontend built with HTML, CSS, and JavaScript.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API framework |
| PostgreSQL | Relational database |
| SQLAlchemy | Database ORM |
| Pydantic | Data validation |
| HTML | Web page structure |
| CSS | Styling and layout |
| JavaScript | Frontend interactions |
| Uvicorn | ASGI server |

## 📁 Project Structure

```text
job-portal-api/
│
├── app/
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── jobs.py
│   │   └── applications.py
│   │
│   ├── static/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   │
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── dependencies.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/kirubanandhan016/job-portal-api.git
cd job-portal-api
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate the Virtual Environment

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```bash
python -m pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a template.

Configure your PostgreSQL database credentials and generate a secure `SECRET_KEY`.

**Important:** Never commit your `.env` file or expose your database password or secret key.

### 6. Set Up PostgreSQL

Make sure PostgreSQL is installed and running.

Create the database and user according to your `.env` configuration. Ensure the database name, username, password, host, and port match the application's settings.

### 7. Run the Application

```bash
python -m uvicorn app.main:app --reload
```

## 🌐 Access the Application

After the server starts, open the following addresses:

| Resource | URL |
|---|---|
| Web Application | http://127.0.0.1:8000/ |
| Interactive API Docs | http://127.0.0.1:8000/docs |
| Alternative API Docs | http://127.0.0.1:8000/redoc |

The web application URL assumes the frontend is served from the root route.

## 🔌 API Modules

| Module | Description |
|---|---|
| Authentication | User registration and login |
| Users | User-related operations |
| Jobs | Job listing and job management |
| Applications | Job application management |

For available endpoints, request schemas, and response examples, start the application and visit `/docs`.

## 🔒 Security

- Store secrets and credentials in environment variables.
- Keep `.env` out of version control.
- Use strong, unique database passwords.
- Protect authenticated endpoints with appropriate authorization.
- Never publish access tokens or private credentials.

## 🎯 Project Goal

The goal of this project is to build a practical job portal while developing backend engineering skills with Python, FastAPI, REST APIs, authentication, and PostgreSQL.

## 👨‍💻 Author

**Kirubanandhan**

GitHub: [@kirubanandhan016](https://github.com/kirubanandhan016)

---

<p align="center">
  <b>Built with Python ❤️</b><br>
  Learning, building, and improving one project at a time.
</p>
