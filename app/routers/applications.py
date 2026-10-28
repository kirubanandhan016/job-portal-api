from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_role
from app.models import Application, Job, User
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    payload: ApplicationCreate,
    applicant: User = Depends(require_role("job_seeker")),
    db: Session = Depends(get_db),
) -> Application:
    job = db.get(Job, payload.job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id == applicant.id:
        raise HTTPException(status_code=400, detail="You cannot apply to your own job listing")
    existing = db.scalar(
        select(Application).where(
            Application.job_id == job.id,
            Application.applicant_id == applicant.id,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="You have already applied to this job")

    application = Application(
        job_id=job.id,
        applicant_id=applicant.id,
        cover_letter=payload.cover_letter,
    )
    db.add(application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already applied to this job")
    db.refresh(application)
    return application


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Application]:
    query = select(Application)
    if user.role == "job_seeker":
        query = query.where(Application.applicant_id == user.id)
    else:
        query = query.join(Job).where(Job.employer_id == user.id)
    query = query.order_by(Application.created_at.desc(), Application.id.desc())
    query = query.offset(offset).limit(limit)
    return list(db.scalars(query))


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    is_applicant = application.applicant_id == user.id
    is_employer = user.role == "employer" and application.job.employer_id == user.id
    if not (is_applicant or is_employer):
        raise HTTPException(status_code=403, detail="You cannot view this application")
    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    employer: User = Depends(require_role("employer")),
    db: Session = Depends(get_db),
) -> Application:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.job.employer_id != employer.id:
        raise HTTPException(status_code=403, detail="You can only update applications to your jobs")
    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_application(
    application_id: int,
    applicant: User = Depends(require_role("job_seeker")),
    db: Session = Depends(get_db),
) -> None:
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.applicant_id != applicant.id:
        raise HTTPException(status_code=403, detail="You can only withdraw your own application")
    if application.status != "pending":
        raise HTTPException(status_code=409, detail="Only pending applications can be withdrawn")
    db.delete(application)
    db.commit()
