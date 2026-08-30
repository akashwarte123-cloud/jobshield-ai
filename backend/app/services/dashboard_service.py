from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models import Analysis, Job

class DashboardService:
    """Handles SQL-driven aggregation metrics for the user risk summary dashboard."""

    @staticmethod
    def get_summary(user_id):
        """
        Derives summary statistics (totals, distributions, averages, recent lists)
        directly using SQL aggregate queries for scalability.
        """
        # 1. SQL Count total analyses
        total_analyses = db.session.query(db.func.count(Analysis.id))\
            .filter_by(user_id=user_id)\
            .scalar() or 0

        # 2. SQL Group-by count for risk distribution
        distribution = {
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0
        }
        
        distribution_rows = db.session.query(
            Analysis.risk_level,
            db.func.count(Analysis.id)
        ).filter_by(user_id=user_id).group_by(Analysis.risk_level).all()

        for risk_level, count in distribution_rows:
            key = risk_level.lower()
            if key in distribution:
                distribution[key] = count

        # 3. SQL Average score calculation
        avg_score = db.session.query(db.func.avg(Analysis.final_score))\
            .filter_by(user_id=user_id)\
            .scalar()
            
        average_score = round(float(avg_score), 1) if avg_score is not None else 0.0

        # 4. Fetch 5 most recent analyses with eager loaded Jobs
        recent_items = db.session.query(Analysis)\
            .options(joinedload(Analysis.job))\
            .filter_by(user_id=user_id)\
            .order_by(Analysis.analyzed_at.desc())\
            .limit(5)\
            .all()

        recent_serialized = []
        for item in recent_items:
            recent_serialized.append({
                "analysis_id": item.id,
                "job": {
                    "id": item.job.id,
                    "title": item.job.title,
                    "company": item.job.company,
                    "location": item.job.location
                },
                "analysis": {
                    "prediction": item.prediction,
                    "ml_score": item.ml_score,
                    "rule_score": item.rule_score,
                    "final_score": item.final_score,
                    "risk_level": item.risk_level,
                    "analyzed_at": item.analyzed_at.isoformat()
                }
            })

        # 5. Calculate last 7 days weekly scans and threats
        from datetime import datetime, timezone, timedelta
        today = datetime.now(timezone.utc).date()
        days_list = [today - timedelta(days=i) for i in range(6, -1, -1)]
        start_date = datetime.combine(days_list[0], datetime.min.time(), tzinfo=timezone.utc)
        
        rows = db.session.query(Analysis.analyzed_at, Analysis.risk_level)\
            .filter(Analysis.user_id == user_id, Analysis.analyzed_at >= start_date)\
            .all()
            
        daily_stats = {d: {"scans": 0, "threats": 0} for d in days_list}
        for analyzed_at, risk_level in rows:
            dt = analyzed_at.date()
            if dt in daily_stats:
                daily_stats[dt]["scans"] += 1
                if risk_level in ['HIGH', 'CRITICAL']:
                    daily_stats[dt]["threats"] += 1
                    
        weekly_trends = []
        for d in days_list:
            weekly_trends.append({
                "day": d.strftime('%a'),
                "scans": daily_stats[d]["scans"],
                "threats": daily_stats[d]["threats"]
            })

        return {
            "total_analyses": total_analyses,
            "risk_distribution": distribution,
            "average_score": average_score,
            "weekly_trends": weekly_trends,
            "recent_analyses": recent_serialized
        }
