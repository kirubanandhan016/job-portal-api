from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.auth import ALGORITHM
from app.database import SessionLocal, settings
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if len(settings.secret_key) < 32:
        raise RuntimeError(
            "SECRET_KEY must be configured with at least 32 characters."
        )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        issued_at = payload.get("iat")
        expires_at = payload.get("exp")
        if not isinstance(subject, str) or not subject.isdigit():
            raise unauthorized
        if isinstance(issued_at, bool) or not isinstance(issued_at, int):
            raise unauthorized
        if isinstance(expires_at, bool) or not isinstance(expires_at, int):
            raise unauthorized
        if expires_at <= issued_at:
            raise unauthorized
        user_id = int(subject)
    except (JWTError, AttributeError, TypeError, ValueError):
        raise unauthorized from None

    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


def require_role(role: str):
    def role_dependency(user: User = Depends(get_current_user)) -> User:
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{role.replace('_', ' ').title()} role required",
            )
        return user

    return role_dependency
