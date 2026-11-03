from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from jose import jwt
from pydantic import ValidationError

from app.auth import ALGORITHM, create_access_token, hash_password
from app.database import settings
from app.dependencies import get_current_user, require_role
from app.models import User
from app.routers.auth import register
from app.schemas import UserCreate


def test_public_registration_always_creates_job_seeker(db_session):
    payload = UserCreate(
        email="candidate@example.com",
        full_name="Job Candidate",
        password="a-secure-password",
    )

    user = register(payload, db_session)

    assert user.role == "job_seeker"
    assert user.email == "candidate@example.com"


def test_registration_rejects_client_supplied_employer_role():
    with pytest.raises(ValidationError):
        UserCreate.model_validate(
            {
                "email": "attacker@example.com",
                "full_name": "Untrusted User",
                "password": "a-secure-password",
                "role": "employer",
            }
        )


def test_job_seeker_is_denied_employer_permission(db_session):
    user = User(
        email="candidate@example.com",
        full_name="Job Candidate",
        hashed_password=hash_password("a-secure-password"),
        role="job_seeker",
    )
    db_session.add(user)
    db_session.commit()

    employer_only = require_role("employer")
    with pytest.raises(HTTPException) as error:
        employer_only(user=user)

    assert error.value.status_code == 403


def test_valid_token_resolves_existing_user(db_session):
    user = User(
        email="candidate@example.com",
        full_name="Job Candidate",
        hashed_password=hash_password("a-secure-password"),
        role="job_seeker",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(str(user.id))
    authenticated_user = get_current_user(token=token, db=db_session)

    assert authenticated_user.id == user.id
    assert authenticated_user.role == "job_seeker"


@pytest.mark.parametrize(
    "claims",
    [
        {"sub": "1"},
        {"exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp())},
        {
            "sub": "not-an-id",
            "iat": int(datetime.now(timezone.utc).timestamp()),
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        },
    ],
)
def test_token_with_missing_or_invalid_required_claims_is_rejected(
    db_session, claims
):
    token = jwt.encode(claims, settings.secret_key, algorithm=ALGORITHM)

    with pytest.raises(HTTPException) as error:
        get_current_user(token=token, db=db_session)

    assert error.value.status_code == 401


def test_expired_access_token_is_rejected(db_session):
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": "1",
            "iat": int((now - timedelta(minutes=10)).timestamp()),
            "exp": int((now - timedelta(minutes=5)).timestamp()),
        },
        settings.secret_key,
        algorithm=ALGORITHM,
    )

    with pytest.raises(HTTPException) as error:
        get_current_user(token=token, db=db_session)

    assert error.value.status_code == 401
