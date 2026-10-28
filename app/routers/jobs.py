from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models import Job, User
from app.schemas import JobCreate, JobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobResponse])
def list_jobs(
    search: str | None = Query(default=None, min_length=1, max_length=200),
    location: str | None = Query(default=None, min_length=1, max_length=150),
    employment_type: Literal["full_time", "part_time", "contract", "internship"] | None = None,
    salary_min: int | None = Query(default=None, ge=0),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Job]:
    query = select(Job)
    if search:
        query = query.where(Job.title.ilike(f"%{search}%"))
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if employment_type:
        query = query.where(Job.employment_type == employment_type)
    if salary_min is not None:
        query = query.where(Job.salary_max.is_(None) | (Job.salary_max >= salary_min))
    query = query.order_by(Job.created_at.desc(), Job.id.desc()).offset(offset).limit(limit)
    return list(db.scalars(query))


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    employer: User = Depends(require_role("employer")),
    db: Session = Depends(get_db),
) -> Job:
    job = Job(**payload.model_dump(), employer_id=employer.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobCreate,
    employer: User = Depends(require_role("employer")),
    db: Session = Depends(get_db),
) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != employer.id:
        raise HTTPException(status_code=403, detail="You can only manage your own job listings")
    for field, value in payload.model_dump().items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    employer: User = Depends(require_role("employer")),
    db: Session = Depends(get_db),
) -> None:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != employer.id:
        raise HTTPException(status_code=403, detail="You can only manage your own job listings")
    db.delete(job)
    db.commit()
