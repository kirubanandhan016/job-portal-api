"""Enforce non-negative and ordered job salary ranges.

Revision ID: 0002_job_salary_checks
Revises: 0001_initial
"""
from alembic import op

revision = "0002_job_salary_checks"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_jobs_salary_min_non_negative",
        "jobs",
        "salary_min IS NULL OR salary_min >= 0",
    )
    op.create_check_constraint(
        "ck_jobs_salary_max_non_negative",
        "jobs",
        "salary_max IS NULL OR salary_max >= 0",
    )
    op.create_check_constraint(
        "ck_jobs_salary_range",
        "jobs",
        "salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max",
    )


def downgrade() -> None:
    op.drop_constraint("ck_jobs_salary_range", "jobs", type_="check")
    op.drop_constraint("ck_jobs_salary_max_non_negative", "jobs", type_="check")
    op.drop_constraint("ck_jobs_salary_min_non_negative", "jobs", type_="check")
