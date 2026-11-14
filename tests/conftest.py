import os

# Use isolated test-only values before importing the application's database module.
os.environ["DB_PASSWORD"] = "job-portal-test-db-password"
os.environ["DATABASE_URL"] = "postgresql+psycopg://test:test@localhost:5432/job_portal_test"
os.environ["SECRET_KEY"] = "job-portal-test-only-signing-secret-never-use-in-production"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401 - register all SQLAlchemy models
from app.database import Base


@pytest.fixture
def db_session():
    test_database_url = os.getenv("TEST_DATABASE_URL")
    if test_database_url:
        # CI exercises the same PostgreSQL dialect used by the application.
        engine = create_engine(test_database_url, pool_pre_ping=True)
    else:
        # Keep local tests isolated and fast with an in-memory SQLite database.
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
