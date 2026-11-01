def test_registration_always_creates_job_seeker_even_if_employer_role_is_submitted(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "self-promoted@example.com",
            "password": "strong-password",
            "full_name": "Self Promoted",
            "role": "employer",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "job_seeker"


def test_registered_job_seeker_cannot_create_job(client):
    registration = client.post(
        "/auth/register",
        json={
            "email": "seeker@example.com",
            "password": "strong-password",
            "full_name": "Job Seeker",
            "role": "employer",
        },
    )
    assert registration.status_code == 201

    login = client.post(
        "/auth/token",
        data={
            "username": "seeker@example.com",
            "password": "strong-password",
        },
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.post(
        "/jobs",
        json={
            "title": "Python Backend Developer",
            "description": "Entry-level backend role",
            "company": "Example Ltd",
            "location": "Chennai",
        },
        headers=headers,
    )

    assert response.status_code == 403
