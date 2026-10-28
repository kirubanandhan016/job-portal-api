# Job Portal

A Python, FastAPI, and PostgreSQL job portal with a browser-based frontend.

## Run locally on Windows

1. Make sure PostgreSQL is running and create a database named `job_portal`.
2. In PowerShell, open this folder and install the Python packages:

   ```powershell
   cd "C:\Users\KIRUBANANDHAN V\OneDrive\Desktop\project1\job-portal-api"
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env`, then set your PostgreSQL username/password and a private random `SECRET_KEY`. Do not share or commit `.env`.

   ```powershell
   Copy-Item .env.example .env
   py -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

4. Start the server from the project folder:

   ```powershell
   uvicorn app.main:app --reload
   ```

   On startup, the app creates the database tables if they do not already exist. Keep this terminal open while you use the app.

Open **http://127.0.0.1:8000** for the frontend, **http://127.0.0.1:8000/docs** for API documentation, or **http://127.0.0.1:8000/health** to check the server.

## Included features

- Job listings with keyword, location, employment type, and salary filters.
- Job seeker and employer registration and login.
- Employer job posting and listing management.
- Job applications, status tracking, and pending-application withdrawal.
- Role checks so users can only manage their own listings and applications.

Use the **Create account** button and choose whether you are a job seeker or employer. To stop Uvicorn, press **Ctrl+C** in PowerShell.
