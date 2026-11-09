import pytest
from fastapi import HTTPException

from app.models import User
from app.routers.applications import (
    apply_for_job,
    get_application,
    list_applications,
    update_application_status,
    withdraw_application,
)
from app.routers.jobs import create_job, delete_job, list_jobs, update_job
from app.schemas import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    JobCreate,
)


def make_user(db_session, email: str, role: str) -> User:
    user = User(
        email=email,
        full_name=email.split("@")[0],
        hashed_password="test-only-hash",
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def make_job(db_session, employer: User, *, title="Python API Developer", location="Bengaluru"):
    payload = JobCreate(
        title=title,
        description="Build and maintain backend APIs.",
        company="Example Systems",
        location=location,
        employment_type="full_time",
        salary_min=500000,
        salary_max=900000,
    )
    return create_job(payload, employer, db_session)


def test_job_search_filters_and_salary_floor(db_session):
    employer = make_user(db_session, "employer@example.com", "employer")
    make_job(db_session, employer)
    make_job(db_session, employer, title="SQL Analyst", location="Chennai")

    results = list_jobs(
        search="Python",
        location="Bengaluru",
        employment_type="full_time",
        salary_min=600000,
        offset=0,
        limit=20,
        db=db_session,
    )

    assert len(results) == 1
    assert results[0].title == "Python API Developer"


def test_employer_cannot_update_or_delete_another_employers_job(db_session):
    owner = make_user(db_session, "owner@example.com", "employer")
    other_employer = make_user(db_session, "other-employer@example.com", "employer")
    job = make_job(db_session, owner)
    payload = JobCreate(
        title="Changed title",
        description="Changed description",
        company="Example Systems",
        location="Bengaluru",
        employment_type="full_time",
        salary_min=500000,
        salary_max=900000,
    )

    with pytest.raises(HTTPException) as update_error:
        update_job(job.id, payload, other_employer, db_session)
    with pytest.raises(HTTPException) as delete_error:
        delete_job(job.id, other_employer, db_session)

    assert update_error.value.status_code == 403
    assert delete_error.value.status_code == 403


def test_job_seeker_can_apply_list_and_withdraw_own_application(db_session):
    employer = make_user(db_session, "employer@example.com", "employer")
    applicant = make_user(db_session, "candidate@example.com", "job_seeker")
    job = make_job(db_session, employer)
    payload = ApplicationCreate(job_id=job.id, cover_letter="I have FastAPI experience.")

    application = apply_for_job(payload, applicant, db_session)
    assert application.status == "pending"
    assert application.applicant_id == applicant.id

    listed = list_applications(0, 20, applicant, db_session)
    assert [item.id for item in listed] == [application.id]
    assert get_application(application.id, applicant, db_session).id == application.id

    with pytest.raises(HTTPException) as duplicate_error:
        apply_for_job(payload, applicant, db_session)
    assert duplicate_error.value.status_code == 409

    withdraw_application(application.id, applicant, db_session)
    with pytest.raises(HTTPException) as not_found:
        get_application(application.id, applicant, db_session)
    assert not_found.value.status_code == 404


def test_employer_can_review_only_applications_to_their_jobs(db_session):
    employer = make_user(db_session, "employer@example.com", "employer")
    other_employer = make_user(db_session, "other@example.com", "employer")
    applicant = make_user(db_session, "candidate@example.com", "job_seeker")
    job = make_job(db_session, employer)
    application = apply_for_job(
        ApplicationCreate(job_id=job.id),
        applicant,
        db_session,
    )

    with pytest.raises(HTTPException) as forbidden:
        update_application_status(
            application.id,
            ApplicationStatusUpdate(status="accepted"),
            other_employer,
            db_session,
        )
    assert forbidden.value.status_code == 403

    updated = update_application_status(
        application.id,
        ApplicationStatusUpdate(status="accepted"),
        employer,
        db_session,
    )
    assert updated.status == "accepted"

    employer_view = list_applications(0, 20, employer, db_session)
    assert [item.id for item in employer_view] == [application.id]


def test_applicant_cannot_read_another_users_application(db_session):
    employer = make_user(db_session, "employer@example.com", "employer")
    applicant = make_user(db_session, "candidate@example.com", "job_seeker")
    other_applicant = make_user(db_session, "other-candidate@example.com", "job_seeker")
    job = make_job(db_session, employer)
    application = apply_for_job(ApplicationCreate(job_id=job.id), applicant, db_session)

    with pytest.raises(HTTPException) as forbidden:
        get_application(application.id, other_applicant, db_session)
    assert forbidden.value.status_code == 403
