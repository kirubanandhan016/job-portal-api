from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=150)
    role: Literal["job_seeker", "employer"] = "job_seeker"


class UserUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    company: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=150)
    employment_type: Literal["full_time", "part_time", "contract", "internship"] = "full_time"
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_salary_range(self) -> "JobCreate":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot exceed salary_max")
        return self


class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    company: str
    location: str
    employment_type: str
    salary_min: int | None
    salary_max: int | None
    created_at: datetime
    employer_id: int

    model_config = ConfigDict(from_attributes=True)


class ApplicationCreate(BaseModel):
    job_id: int = Field(gt=0)
    cover_letter: str | None = Field(default=None, max_length=10000)


class ApplicationStatusUpdate(BaseModel):
    status: Literal["reviewed", "accepted", "rejected"]


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    applicant_id: int
    cover_letter: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
