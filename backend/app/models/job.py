import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db

def get_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=get_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    salary: Mapped[str] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(100), nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=True)
    source_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    posted_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    
    # Relationships
    saved_jobs = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="job", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_jobs_company', 'company'),
        Index('idx_jobs_title', 'title'),
        Index('idx_jobs_created_at', 'created_at'),
        Index('idx_jobs_employment_type', 'employment_type'),
    )

class SavedJob(db.Model):
    __tablename__ = 'saved_jobs'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=get_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    
    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_jobs")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='uq_user_job_saved'),
    )
