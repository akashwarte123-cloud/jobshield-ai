import re
from datetime import datetime, timezone
from app.extensions import db
from app.models import Job, Analysis, AnalysisFlag
from app.services.ml_service import MLService, MLIntegrationError
from app.services.rule_engine import RuleEngine
from app.services.risk_engine import RiskEngine
from app.services.verification_service import VerificationService

class AnalysisService:
    """Orchestrates request validation, ML/rule risk predictions, and atomic database persistence."""

    EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    URL_REGEX = r'^https?://.+$'

    @classmethod
    def validate_and_normalize(cls, job_data):
        """Validates input fields, types, formats, and returns cleaned strings."""
        if not job_data:
            raise ValueError("Request body is missing or empty.")

        # Validate required fields presence
        if "title" not in job_data or not job_data["title"]:
            raise ValueError("Missing required field: 'title'.")
        if "description" not in job_data or not job_data["description"]:
            raise ValueError("Missing required field: 'description'.")

        # Validate types and check lengths
        validated = {}
        string_fields_limit = {
            "title": 255,
            "company": 255,
            "location": 255,
            "salary": 255,
            "employment_type": 255,
            "source": 255,
            "email": 255,
            "source_url": 2048,
            "description": 65535
        }

        for field, max_len in string_fields_limit.items():
            val = job_data.get(field)
            if val is not None:
                if not isinstance(val, str):
                    raise ValueError(f"Field '{field}' must be a string type.")
                if len(val) > max_len:
                    raise ValueError(f"Field '{field}' exceeds the maximum allowed length of {max_len} characters.")
                validated[field] = val.strip()
            else:
                validated[field] = ""

        # Run URL format check if provided
        source_url = validated["source_url"]
        if source_url and not re.match(cls.URL_REGEX, source_url):
            raise ValueError("Invalid URL format. Stated 'source_url' must begin with 'http://' or 'https://'.")

        # Run email format check if provided
        email = validated["email"]
        if email and not re.match(cls.EMAIL_REGEX, email):
            raise ValueError("Invalid email address format.")

        # Company/Location separation guard:
        # If the company field contains an embedded "Location:" substring (from copy-paste),
        # split it and move the trailing portion to the location field.
        company_val = validated.get("company", "")
        location_val = validated.get("location", "")
        if company_val:
            loc_match = re.split(r'[\s,\-]+location\s*:\s*', company_val, maxsplit=1, flags=re.IGNORECASE)
            if len(loc_match) == 2:
                clean_company = loc_match[0].strip().rstrip(' ,-')
                extracted_location = loc_match[1].strip()
                if clean_company:
                    validated["company"] = clean_company
                if extracted_location and (not location_val or location_val.strip().lower() == "remote"):
                    validated["location"] = extracted_location

        # Map posted_date if provided
        if "posted_date" in job_data and job_data["posted_date"] is not None:
            posted_date_val = job_data["posted_date"]
            if not isinstance(posted_date_val, str):
                raise ValueError("Field 'posted_date' must be a ISO-8601 formatted string.")
            validated["posted_date"] = posted_date_val.strip()
        else:
            validated["posted_date"] = None

        # Extract salary from description if not explicitly provided
        if not validated.get("salary") and validated.get("description"):
            extracted_salary = cls.extract_salary(validated["description"])
            if extracted_salary:
                validated["salary"] = extracted_salary

        # Extract employment_type from description if not explicitly provided
        if not validated.get("employment_type") and validated.get("description"):
            extracted_emp = cls.extract_employment_type(validated["description"])
            if extracted_emp:
                validated["employment_type"] = extracted_emp

        return validated

    @staticmethod
    def extract_salary(text):
        """
        Extracts salary/compensation from job description text or input.
        Supports:
        - ₹4.5–7 LPA, 4.5-7 LPA, ₹5 LPA, INR 5 LPA, 5 lakhs per annum, 5 Lacs P.A.
        - ₹50,000/month, INR 40,000 per month
        - CTC: 6–8 LPA, Salary: ₹4.5–7 LPA, Compensation: ...
        - $120,000 - $140,000 / yr, $80,000/yr, $50/hr
        Avoids false positives from experience (years), dates (2024), employee counts (500+).
        """
        if not text or not isinstance(text, str):
            return ""

        clean_text = text.strip()

        # 1. Tier 1: Explicit labeled lines/segments first
        label_pattern = re.compile(
            r'(?i)(?:^|[\r\n•\-\*|])\s*(?:base\s*pay|salary\s*offered|salary\s*range|salary|ctc|compensation|remuneration|stipend|pay\s*package|annual\s*package|pay)\s*[:=\-–—]\s*([^\r\n;]+)',
            re.MULTILINE
        )
        for match in label_pattern.finditer(clean_text):
            raw_val = match.group(1).strip()
            raw_val = re.sub(r'^[•\-\*:\s]+', '', raw_val)
            if len(raw_val) < 100:
                # First check if raw_val contains an explicit salary pattern to extract just the salary component
                for pat in (
                    re.compile(r'(?i)(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?(?:\s*(?:per\s*annum|/year|p\.a\.?|pa))?|lac(?:s)?(?:\s*(?:per\s*annum|/year|p\.a\.?|pa))?)'),
                    re.compile(r'(?i)(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?\s*(?:per\s*annum|/year|p\.a\.?|pa)|lac(?:s)?\s*(?:per\s*annum|/year|p\.a\.?|pa))'),
                    re.compile(r'(?i)(?:₹|rs\.?|inr)\s*\d+(?:\.\d+)?\s*(?:lakhs?|lac(?:s)?)'),
                    re.compile(r'(?i)(?:₹|rs\.?|inr)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(?:/\s*(?:month|mo|hr|hour|year|yr|annum)|per\s*(?:month|mo|hr|hour|year|yr|annum)|p\.m\.|p\.a\.)'),
                    re.compile(r'(?i)(?:₹|rs\.?|inr)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(?:/\s*(?:month|mo|hr|hour|year|yr|annum)|per\s*(?:month|mo|hr|hour|year|yr|annum)|p\.m\.|p\.a\.)'),
                    re.compile(r'(?i)(?:\$|€|£)\s*\d{1,3}(?:,\d{3})*(?:k)?\s*(?:[-–—]|to)\s*(?:\$|€|£)?\s*\d{1,3}(?:,\d{3})*(?:k)?\s*(?:/\s*(?:yr|year|month|mo|hr|hour|wk|week)|per\s*(?:year|yr|month|mo|hr|hour|week|wk)|annually)'),
                    re.compile(r'(?i)(?:\$|€|£)\s*\d{1,3}(?:,\d{3})*(?:k)?\s*(?:/\s*(?:yr|year|month|mo|hr|hour|wk|week)|per\s*(?:year|yr|month|mo|hr|hour|week|wk)|annually)')
                ):
                    sub_m = pat.search(raw_val)
                    if sub_m:
                        return sub_m.group(0).strip()

                if re.search(r'(?i)(?:₹|rs\.?|inr|\$|€|£|lpa|l\.p\.a|lakh|lac|per\s*(?:month|mo|annum|year)|/\s*(?:month|mo|hr|yr|year)|p\.m\.|p\.a\.)', raw_val):
                    cleaned = re.sub(r'[\.\s,;]+$', '', raw_val)
                    cleaned = re.sub(r'\s*\([^)]*(?:exp|interview|candidate|do[eE]|performance)[^)]*\)', '', cleaned).strip()
                    if cleaned:
                        return cleaned

        # 2. Tier 2: Inline patterns
        # LPA / Lakh ranges
        lpa_range_pattern = re.compile(
            r'(?i)(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?(?:\s*(?:per\s*annum|/year|p\.a\.?|pa))?|lac(?:s)?(?:\s*(?:per\s*annum|/year|p\.a\.?|pa))?)'
        )
        m = lpa_range_pattern.search(clean_text)
        if m:
            return m.group(0).strip()

        # Single figure LPA / Lakhs
        single_lpa_pattern = re.compile(
            r'(?i)(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?\s*(?:per\s*annum|/year|p\.a\.?|pa)|lac(?:s)?\s*(?:per\s*annum|/year|p\.a\.?|pa))'
        )
        m = single_lpa_pattern.search(clean_text)
        if m:
            return m.group(0).strip()

        # Currency + amount + lakhs
        curr_lakh_pattern = re.compile(
            r'(?i)(?:₹|rs\.?|inr)\s*\d+(?:\.\d+)?\s*(?:lakhs?|lac(?:s)?)'
        )
        m = curr_lakh_pattern.search(clean_text)
        if m:
            return m.group(0).strip()

        # Rupee with frequency
        rupee_range_freq = re.compile(
            r'(?i)(?:₹|rs\.?|inr)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(?:/\s*(?:month|mo|hr|hour|year|yr|annum)|per\s*(?:month|mo|hr|hour|year|yr|annum)|p\.m\.|p\.a\.)'
        )
        m = rupee_range_freq.search(clean_text)
        if m:
            return m.group(0).strip()

        single_rupee_freq = re.compile(
            r'(?i)(?:₹|rs\.?|inr)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\s*(?:/\s*(?:month|mo|hr|hour|year|yr|annum)|per\s*(?:month|mo|hr|hour|year|yr|annum)|p\.m\.|p\.a\.)'
        )
        m = single_rupee_freq.search(clean_text)
        if m:
            return m.group(0).strip()

        # Western currencies
        western_range = re.compile(
            r'(?i)(?:\$|€|£)\s*\d{1,3}(?:,\d{3})*(?:k)?\s*(?:[-–—]|to)\s*(?:\$|€|£)?\s*\d{1,3}(?:,\d{3})*(?:k)?\s*(?:/\s*(?:yr|year|month|mo|hr|hour|wk|week)|per\s*(?:year|yr|month|mo|hr|hour|week|wk)|annually)'
        )
        m = western_range.search(clean_text)
        if m:
            return m.group(0).strip()

        single_western = re.compile(
            r'(?i)(?:\$|€|£)\s*\d{1,3}(?:,\d{3})*(?:k)?\s*(?:/\s*(?:yr|year|month|mo|hr|hour|wk|week)|per\s*(?:year|yr|month|mo|hr|hour|week|wk)|annually)'
        )
        m = single_western.search(clean_text)
        if m:
            return m.group(0).strip()

        return ""

    @staticmethod
    def extract_employment_type(text):
        """Extracts employment type (Full-time, Part-time, Contract, Internship)."""
        if not text or not isinstance(text, str):
            return ""
        m = re.search(r'(?i)(?:^|[\r\n•\-\*|])\s*(?:job\s*type|employment\s*type)\s*[:=\-–—]\s*([a-zA-Z\-/ ]+)', text)
        if m:
            val = m.group(1).strip()
            if len(val) <= 40 and re.match(r'^(?:full[- ]time|part[- ]time|contract|internship|temporary|freelance)', val, re.IGNORECASE):
                return val
        return ""

    @staticmethod
    def extract_domain(email="", url=""):
        """
        Normalizes and extracts domain from email or URL:
        - lowercase
        - removes protocol (http://, https://)
        - removes www. prefix
        - removes paths, query params, ports
        - strips email username
        """
        domain = ""
        if email and "@" in email:
            domain = email.split("@")[-1].strip()
        elif url:
            domain = url.strip()
        if not domain:
            return ""

        domain = re.sub(r'^https?://', '', domain, flags=re.IGNORECASE)
        if "@" in domain:
            domain = domain.split("@")[-1]
        domain = re.split(r'[/?#:]', domain)[0].strip()
        domain = re.sub(r'^www\.', '', domain, flags=re.IGNORECASE)
        return domain.lower()

    @classmethod
    def analyze(cls, job_data, user=None):
        """
        Runs the complete JobShield analysis pipeline on validated job data.

        Returns a dictionary representing the analysis payload.
        """
        # 1. Validation & normalization
        clean_data = cls.validate_and_normalize(job_data)

        # 2. Employer/Domain Verification Check (Real async check proxy)
        verification_result = VerificationService.verify(
            company_name=clean_data.get("company", ""),
            email=clean_data.get("email", ""),
            url=clean_data.get("source_url", "")
        )

        extracted_domain = cls.extract_domain(
            email=clean_data.get("email", ""),
            url=clean_data.get("source_url", "")
        )
        domain = (verification_result.get("domain") if verification_result else "") or extracted_domain

        # 3. ML Prediction (Bridge to Node ML Ensemble)
        ml_result = MLService.predict(clean_data)

        # 4. Rule Heuristics Analysis (Incorporate verification checks)
        rule_result = RuleEngine.analyze(clean_data, verification_result)

        # 5. Risk fusion combining ML, Rules, and Domain Verification
        risk_result = RiskEngine.calculate(ml_result, rule_result, verification_result)

        risk_level = risk_result["risk_level"]
        flags = risk_result["flags"]

        # 5. Build accurate forensic summary from scores and indicators
        ml_score = risk_result.get("ml_score", 0)
        rule_score = risk_result.get("rule_score", 0)
        final_score = risk_result.get("final_score", 0)

        if flags:
            reasons = []
            for f in flags:
                msg = f["message"].strip()
                if not msg.endswith("."):
                    msg += "."
                if msg not in reasons:
                    reasons.append(msg)
            explanation = f"{risk_level.capitalize()} risk ({final_score}/100): " + " ".join(reasons[:2])
        elif ml_score >= 50 or final_score >= 30:
            explanation = f"{risk_level.capitalize()} risk ({final_score}/100): Statistical ML model detected structural risk patterns (ML Score: {ml_score}/100), though no deterministic rule flags were triggered."
        else:
            explanation = "Low risk (0/100): Standard legitimate job listing patterns. No rule-based or statistical threat indicators detected."

        # 6. Database Transaction persistence
        try:
            # Check for existing job by matching source_url (only if provided)
            source_url = clean_data["source_url"]
            job = None
            if source_url:
                job = Job.query.filter_by(source_url=source_url).first()

            if job is None:
                # Create a new Job instance
                job = Job(
                    title=clean_data["title"],
                    company=clean_data["company"],
                    location=clean_data["location"],
                    description=clean_data["description"],
                    salary=clean_data["salary"],
                    employment_type=clean_data["employment_type"],
                    source=clean_data["source"] or domain,
                    source_url=source_url,
                    posted_date=clean_data["posted_date"]
                )
                db.session.add(job)
                db.session.flush() # Get generated job.id

            # Create Analysis
            analysis = Analysis(
                job_id=job.id,
                user_id=user.id if user else None,
                ml_score=risk_result["ml_score"],
                rule_score=risk_result["rule_score"],
                final_score=risk_result["final_score"],
                risk_level=risk_level,
                prediction=risk_result["prediction"],
                confidence=0.0,  # Safe default to satisfy non-nullable DB schema constraint
                explanation=explanation,
                model_version="unknown"  # Safe default to satisfy non-nullable DB schema constraint
            )
            db.session.add(analysis)
            db.session.flush() # Get generated analysis.id

            # Create AnalysisFlag records
            for flag in flags:
                db_flag = AnalysisFlag(
                    analysis_id=analysis.id,
                    category=flag["category"],
                    severity=flag["severity"],
                    message=flag["message"],
                    evidence=flag["evidence"]
                )
                db.session.add(db_flag)

            # Commit all inserts atomically
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            raise e

        # Return consolidated structured output dictionary
        return {
            "analysis_id": analysis.id,
            "job": {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "salary": job.salary or None,
                "employment_type": job.employment_type or "Full-time",
                "domain": domain or None,
                "source": job.source,
                "source_url": job.source_url
            },
            "analysis": {
                "prediction": risk_result["prediction"],
                "ml_score": risk_result["ml_score"],
                "rule_score": risk_result["rule_score"],
                "final_score": risk_result["final_score"],
                "risk_level": risk_level,
                "confidence": risk_result["confidence"],
                "model_version": risk_result["model_version"],
                "explanation": explanation,
                "flags": flags,
                "red_flags_found": len(flags),
                "domain": domain or None,
                "employer_verification": verification_result,
                "analyzed_at": analysis.analyzed_at.isoformat()
            }
        }
