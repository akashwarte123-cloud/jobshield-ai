import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, ForeignKey, CheckConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db

def get_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Analysis(db.Model):
    __tablename__ = 'analyses'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=get_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    ml_score: Mapped[int] = mapped_column(Integer, nullable=False)
    rule_score: Mapped[int] = mapped_column(Integer, nullable=False)
    final_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False) # LOW | MEDIUM | HIGH | CRITICAL
    prediction: Mapped[str] = mapped_column(String(50), nullable=False) # SAFE | CAUTION | DANGER
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    
    # Relationships
    job = relationship("Job", back_populates="analyses")
    user = relationship("User", back_populates="analyses")
    flags = relationship("AnalysisFlag", back_populates="analysis", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('ml_score >= 0 AND ml_score <= 100', name='check_ml_score_range'),
        CheckConstraint('rule_score >= 0 AND rule_score <= 100', name='check_rule_score_range'),
        CheckConstraint('final_score >= 0 AND final_score <= 100', name='check_final_score_range'),
        CheckConstraint('confidence >= 0.0 AND confidence <= 1.0', name='check_confidence_range'),
    )

class AnalysisFlag(db.Model):
    __tablename__ = 'analysis_flags'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=get_uuid)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False) # LOW | MEDIUM | HIGH | CRITICAL
    message: Mapped[str] = mapped_column(String(512), nullable=False)
    evidence: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships
    analysis = relationship("Analysis", back_populates="flags")
