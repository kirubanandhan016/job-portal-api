# Job Portal API — API Examples

Start the service and use [Swagger UI](http://127.0.0.1:8000/docs) for exact request schemas.

## Register a job seeker
```http
POST /auth/register
Content-Type: application/json

{"email":"candidate@example.com","full_name":"Job Candidate","password":"ChangeThisPassword123"}
```

Public registration creates a job-seeker account; clients cannot self-assign employer privileges.

## Obtain a token
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=candidate%40example.com&password=ChangeThisPassword123
```

## Search jobs
```http
GET /jobs?title=Python&location=Remote
```

## Apply for a job
```http
POST /applications
Authorization: Bearer <access_token>
Content-Type: application/json

{"job_id":1,"cover_letter":"I am interested in this role."}
```

Examples are illustrative. Check the running OpenAPI schema for supported filters and required application fields.
