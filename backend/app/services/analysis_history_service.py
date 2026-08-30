import re
from sqlalchemy.orm import joinedload, selectinload
from app.extensions import db
from app.models import Analysis, Job, AnalysisFlag

class AnalysisHistoryService:
    """Handles querying, filtering, pagination, and fetching of user's past job scan records."""

    @staticmethod
    def resolve_domain(job, flags=None):
        """
        Resolves normalized domain from job source, source_url, or analysis flags.
        """
        if not job:
            return ""

        # 1. From job.source if it looks like a domain or hostname
        if job.source and "." in job.source and not job.source.startswith("http"):
            d = re.sub(r'^https?://', '', job.source.strip(), flags=re.IGNORECASE)
            d = re.sub(r'^www\.', '', d, flags=re.IGNORECASE)
            d = re.split(r'[/?#:]', d)[0].strip().lower()
            if d:
                return d

        # 2. From job.source_url
        if job.source_url:
            d = re.sub(r'^https?://', '', job.source_url.strip(), flags=re.IGNORECASE)
            d = re.sub(r'^www\.', '', d, flags=re.IGNORECASE)
            d = re.split(r'[/?#:]', d)[0].strip().lower()
            if d:
                return d

        # 3. From flags (e.g. unverified_domain flag: "The employer's domain (@technovasolutions.example) is unverified...")
        if flags:
            for f in flags:
                msg = getattr(f, 'message', '') or (f.get('message', '') if isinstance(f, dict) else '')
                match = re.search(r'\(@([^)]+)\)', msg)
                if match:
                    d = match.group(1).strip().lower()
                    d = re.sub(r'^https?://', '', d, flags=re.IGNORECASE)
                    d = re.sub(r'^www\.', '', d, flags=re.IGNORECASE)
                    d = re.split(r'[/?#:]', d)[0].strip().lower()
                    if d:
                        return d

        # 4. Fallback from job.source
        if job.source:
            return job.source.strip().lower()

        return ""

    @classmethod
    def get_history(cls, user_id, page=1, limit=20, risk_level=None):
        """
        Retrieves a paginated list of analysis records belonging to the user.
        Validates page, limit, and risk_level parameters.
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

        # Build query
        query = db.session.query(Analysis).filter_by(user_id=user_id)

        # Apply risk_level filter if supplied
        if risk_level:
            upper_risk = risk_level.upper()
            if upper_risk not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                raise ValueError("Invalid risk level filter.")
            query = query.filter(Analysis.risk_level == upper_risk)

        # Apply eager loading to avoid N+1 query loading Job records individually
        query = query.options(joinedload(Analysis.job), selectinload(Analysis.flags))
        query = query.order_by(Analysis.analyzed_at.desc())

        # Count total records matching criteria
        total = query.count()

        # Calculate pages count
        pages = (total + limit - 1) // limit if total > 0 else 0

        # Fetch matching records
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()

        # Serialize list summary fields (omits descriptions/flags)
        serialized_items = []
        for item in items:
            domain = cls.resolve_domain(item.job, item.flags)
            salary = item.job.salary
            if not salary and item.job.description:
                from app.services.analysis_service import AnalysisService
                salary = AnalysisService.extract_salary(item.job.description)
            serialized_items.append({
                "analysis_id": item.id,
                "job": {
                    "id": item.job.id,
                    "title": item.job.title,
                    "company": item.job.company,
                    "location": item.job.location,
                    "salary": salary or None,
                    "domain": domain or None
                },
                "analysis": {
                    "prediction": item.prediction,
                    "ml_score": item.ml_score,
                    "rule_score": item.rule_score,
                    "final_score": item.final_score,
                    "risk_level": item.risk_level,
                    "domain": domain or None,
                    "analyzed_at": item.analyzed_at.isoformat()
                }
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

    @classmethod
    def get_analysis_detail(cls, user_id, analysis_id):
        """
        Retrieves complete detail of a single analysis with eager-loaded Job and flags.
        Returns None if not found or if the analysis belongs to another user.
        """
        analysis = db.session.query(Analysis)\
            .options(joinedload(Analysis.job), selectinload(Analysis.flags))\
            .filter_by(id=analysis_id, user_id=user_id)\
            .first()

        if not analysis:
            return None

        # Build flags payload
        flags_data = []
        for flag in analysis.flags:
            flags_data.append({
                "category": flag.category,
                "severity": flag.severity,
                "message": flag.message,
                "evidence": flag.evidence
            })

        domain = cls.resolve_domain(analysis.job, analysis.flags)

        salary = analysis.job.salary
        if not salary and analysis.job.description:
            from app.services.analysis_service import AnalysisService
            salary = AnalysisService.extract_salary(analysis.job.description)

        employment_type = analysis.job.employment_type
        if not employment_type and analysis.job.description:
            from app.services.analysis_service import AnalysisService
            employment_type = AnalysisService.extract_employment_type(analysis.job.description)

        return {
            "analysis_id": analysis.id,
            "job": {
                "id": analysis.job.id,
                "title": analysis.job.title,
                "company": analysis.job.company,
                "location": analysis.job.location,
                "description": analysis.job.description,
                "salary": salary or None,
                "employment_type": employment_type or "Full-time",
                "source": analysis.job.source,
                "source_url": analysis.job.source_url,
                "domain": domain or None,
                "posted_date": analysis.job.posted_date.isoformat() if analysis.job.posted_date else None,
                "created_at": analysis.job.created_at.isoformat()
            },
            "analysis": {
                "prediction": analysis.prediction,
                "ml_score": analysis.ml_score,
                "rule_score": analysis.rule_score,
                "final_score": analysis.final_score,
                "risk_level": analysis.risk_level,
                "confidence": None,  # Preserved null per specification
                "model_version": None,  # Preserved null per specification
                "explanation": analysis.explanation,
                "flags": flags_data,
                "domain": domain or None,
                "analyzed_at": analysis.analyzed_at.isoformat()
            }
        }
