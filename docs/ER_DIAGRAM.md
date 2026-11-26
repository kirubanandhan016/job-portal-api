# Job Portal API — Database ER Diagram

```mermaid
erDiagram
  USERS ||--o{ JOBS : posts
  USERS ||--o{ APPLICATIONS : submits
  JOBS ||--o{ APPLICATIONS : receives
  USERS {
    int id PK
    string email UK
    string role
    string hashed_password
  }
  JOBS {
    int id PK
    int employer_id FK
    string title
    string location
    numeric salary
  }
  APPLICATIONS {
    int id PK
    int job_id FK
    int applicant_id FK
    string status
  }
```

Conceptual model based on the documented domain. Confirm exact column names, nullability, and constraints against `app/models.py` and the live database schema.
