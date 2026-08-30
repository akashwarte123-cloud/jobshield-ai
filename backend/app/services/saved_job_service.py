from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models import SavedJob, Job

class SavedJobService:
    """Handles adding, removing, and listing saved job postings for authenticated users."""

    @staticmethod
    def save_job(user_id, job_id):
        """
        Saves a job posting for a user.
        Raises ValueError if the target job does not exist.
        Idempotent: returns existing record if already saved.
        """
        # Verify Job exists
        job = db.session.query(Job).filter_by(id=job_id).first()
        if not job:
            raise ValueError("Target job posting does not exist.")

        # Check unique constraint violation prevention (idempotent lookup)
        existing = db.session.query(SavedJob).filter_by(user_id=user_id, job_id=job_id).first()
        if existing:
            return existing

        # Create new SavedJob association
        saved_job = SavedJob(user_id=user_id, job_id=job_id)
        db.session.add(saved_job)
        db.session.commit()
        return saved_job

    @staticmethod
    def unsave_job(user_id, job_id):
        """
        Unsaves a job posting for a user.
        Idempotent: returns success even if association did not exist.
        """
        saved_job = db.session.query(SavedJob).filter_by(user_id=user_id, job_id=job_id).first()
        if saved_job:
            db.session.delete(saved_job)
            db.session.commit()
        return True

    @staticmethod
    def get_saved_jobs(user_id, page=1, limit=20):
        """
        Retrieves a paginated list of saved jobs with eager loaded Job objects.
        Validates page and limit parameter boundaries.
        """
        try:
            page = int(page)
            limit = int(limit)
        except (TypeError, ValueError):
            raise ValueError("Pagination parameters 'page' and 'limit' must be integers.")

        if page < 1 or limit < 1:
            raise ValueError("Pagination page and limit must be >= 1.")
        if limit > 100:
            raise ValueError("Pagination limit cannot exceed 100.")

        # Query with eager loading to prevent N+1 queries when loading job fields
        query = db.session.query(SavedJob)\
            .options(joinedload(SavedJob.job).joinedload(Job.analyses))\
            .filter_by(user_id=user_id)\
            .order_by(SavedJob.saved_at.desc())

        total = query.count()
        pages = (total + limit - 1) // limit if total > 0 else 0

        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()

        serialized_items = []
        for item in items:
            latest_analysis = None
            if item.job.analyses:
                latest_analysis = sorted(item.job.analyses, key=lambda a: a.analyzed_at, reverse=True)[0]
                
            serialized_items.append({
                "job": {
                    "id": item.job.id,
                    "title": item.job.title,
                    "company": item.job.company,
                    "location": item.job.location,
                    "source": item.job.source,
                    "source_url": item.job.source_url,
                    "latest_analysis": {
                        "final_score": latest_analysis.final_score,
                        "risk_level": latest_analysis.risk_level,
                        "prediction": latest_analysis.prediction
                    } if latest_analysis else None
                },
                "saved_at": item.saved_at.isoformat()
            })

        return {
            "items": serialized_items,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        }
