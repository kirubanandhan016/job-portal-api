from datetime import datetime, timedelta, timezone

from jose import jwt
from pwdlib import PasswordHash

from app.database import settings

ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()
_DUMMY_PASSWORD_HASH = password_hash.hash("not-a-real-user-password")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def burn_password_verification(plain_password: str) -> None:
    """Perform a password hash check for unknown accounts to reduce timing clues."""
    password_hash.verify(plain_password, _DUMMY_PASSWORD_HASH)


def create_access_token(subject: str) -> str:
    if len(settings.secret_key) < 32:
        raise RuntimeError(
            "SECRET_KEY must be a unique random value of at least 32 characters."
        )
    if settings.access_token_expire_minutes <= 0:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be positive.")

    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {
            "sub": str(subject),
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
        },
        settings.secret_key,
        algorithm=ALGORITHM,
    )
