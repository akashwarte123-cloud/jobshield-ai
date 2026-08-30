import re

class RuleEngine:
    """Deterministic rule-based scam detection and explainability layer for JobShield."""

    # Base rule category scores
    CATEGORY_WEIGHTS = {
        "upfront_payment": 50,
        "equipment_purchase": 45,
        "financial_info": 50,
        "identity_docs": 10,
        "guaranteed_job": 30,
        "messaging_recruit": 15,
        "suspicious_contact": 15,
        "unrealistic_salary": 15,
        "urgency_pressure": 5,
        "vague_description": 5,
        "unverified_domain": 20
    }

    # Free email providers list
    FREE_EMAIL_DOMAINS = {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", 
        "aol.com", "protonmail.com", "proton.me", "icloud.com", "mail.com", "zoho.com"
    }

    # Well-known large organizations for mismatch checking
    WELL_KNOWN_BRANDS = {
        "google", "microsoft", "amazon", "meta", "facebook", "apple", "netflix", 
        "tcs", "infosys", "wipro", "ibm", "intel", "goldman sachs", "reliance", 
        "accenture", "cognizant", "capgemini", "deloitte", "ey", "kpmg", "pwc"
    }

    @classmethod
    def analyze(cls, job_data, verification_result=None):
        """
        Analyzes job listing data against deterministic scam rules.

        Expects job_data:
        {
            "title": "...",
            "company": "...",
            "description": "...",
            "salary": "...",
            "employment_type": "...",
            "source": "...",
            "source_url": "...",
            "email": "..."
        }

        Returns:
        {
            "rule_score": 0 - 100,
            "flags": [
                {
                    "category": "...",
                    "severity": "...",
                    "message": "...",
                    "evidence": "..."
                }
            ]
        }
        """
        if not job_data:
            return {"rule_score": 0, "flags": []}

        flags = []
        triggered_categories = {}

        # 1. Normalize fields safely
        title = (job_data.get("title") or "").strip().lower()
        company = (job_data.get("company") or "").strip().lower()
        description = (job_data.get("description") or "").strip().lower()
        email = (job_data.get("email") or "").strip().lower()
        salary = (job_data.get("salary") or "").strip().lower()
        source_url = (job_data.get("source_url") or "").strip().lower()

        # Concatenated full text for general search
        full_text = f"{title} {company} {description} {salary}"

        # Helper to add flags and track category triggers
        def add_flag(category, severity, message, evidence):
            flag = {
                "category": category,
                "severity": severity.lower(),
                "message": message,
                "evidence": evidence
            }
            flags.append(flag)
            # Track highest severity weight for this category
            weight = cls.CATEGORY_WEIGHTS.get(category, 0)
            if category not in triggered_categories or weight > triggered_categories[category]:
                triggered_categories[category] = weight

        # =====================================================================
        # RULE 1: upfront_payment (CRITICAL, Weight: 50)
        # =====================================================================
        payment_patterns = [
            (r'(?:registration|verification|application|processing|training|onboarding|account\s+activation|background\s+check)\s*(?:and\s*\w+\s*)?fee', 'fee request'),
            (r'refundable\s*(?:(?:₹|rs\.?|inr|\$)\s*[\d,]+\s*)?(?:registration|verification|security|application|deposit|fee)', 'deposit request'),
            (r'pay\s+(?:a\s+)?(?:refundable\s+)?(?:(?:₹|rs\.?|inr|\$)\s*[\d,]+\s*)?(?:registration|verification|security|deposit|fee)', 'upfront pay demand'),
            (r'fee\s+before\s+(?:your\s+)?(?:interview|joining|start|onboarding)', 'fee required before interview'),
            (r'pay\s+(?:before\s+joining|before\s+your\s+interview|upfront|to\s+activate|to\s+verify)', 'upfront pay demand'),
            (r'registration fee|application fee|processing fee|training fee', 'fee request'),
            (r'security deposit|refundable deposit|caution deposit', 'deposit request'),
            (r'pay before joining|pay upfront', 'upfront pay demand')
        ]
        for pattern, label in payment_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="upfront_payment",
                    severity="CRITICAL",
                    message="The listing requests an upfront payment or fee before employment starts.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break  # Trigger only once per category

        # =====================================================================
        # RULE 2: equipment_purchase (HIGH, Weight: 45)
        # =====================================================================
        equipment_patterns = [
            (r'(?:need\s+to\s+|must\s+|required\s+to\s+)?purchase\s+(?:a\s+)?(?:company[- ]approved\s+)?(?:laptop|equipment|software|hardware|tools|supplies|package|computer)', 'mandatory equipment/software purchase'),
            (r'(?:purchase|buy|order)\s+(?:.*?\s+)?through\s+our\s+designated\s+(?:supplier|vendor|partner)', 'purchase through designated supplier/vendor'),
            (r'(?:designated|approved)\s+(?:supplier|vendor|partner)', 'designated equipment vendor requirement'),
            (r'buy\s+(?:your\s+own\s+)?(?:equipment|laptop|software|tools)', 'buy own equipment or software'),
            (r'purchase.*laptop.*reimburse|buy.*laptop.*reimburse', 'equipment purchase scheme'),
            (r'mandatory\s+(?:equipment|software|laptop|hardware)\s+purchase', 'mandatory equipment purchase')
        ]
        for pattern, label in equipment_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="equipment_purchase",
                    severity="HIGH",
                    message="The listing mandates purchasing equipment or software through a designated supplier.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 3: financial_info (CRITICAL, Weight: 50)
        # =====================================================================
        financial_patterns = [
            (r'\bcvv\b|\bcvv2\b', 'card cvv code'),
            (r'\bpin\b|\bcard pin\b', 'card security pin'),
            (r'\botp\b|one-time password|one time password', 'one-time password access'),
            (r'transfer money|wire money|wire.*funds|deposit.*check.*send.*back', 'money transfer request')
        ]
        for pattern, label in financial_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="financial_info",
                    severity="CRITICAL",
                    message="The listing requests highly sensitive financial credentials or money transfer operations.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 4: identity_docs (LOW, Weight: 10)
        # =====================================================================
        # Normal identity docs request is low severity
        identity_patterns = [
            (r'\baadhaar\b|\bpan card\b|\bpassport scan\b|\bdriver\'s license\b|\bdriving license\b', 'government id request'),
            (r'\bssn\b|social security number|social security card', 'social security id request')
        ]
        for pattern, label in identity_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="identity_docs",
                    severity="LOW",
                    message="The listing requests sensitive identity or government documentation before formal onboarding.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 5: guaranteed_job (HIGH, Weight: 30)
        # =====================================================================
        guaranteed_patterns = [
            (r'100% job guarantee|100% guaranteed selection|guaranteed placement|guaranteed selection', 'selection guarantee'),
            (r'no interview required.*guaranteed|skip interview.*guaranteed|direct selection.*no interview', 'no-interview selection claim'),
            (r'guaranteed employment|instant selection|instant hiring and placement', 'instant job promise')
        ]
        for pattern, label in guaranteed_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="guaranteed_job",
                    severity="HIGH",
                    message="The listing promises guaranteed employment or selection with no standard interview process.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 6: messaging_recruit (MEDIUM, Weight: 15)
        # =====================================================================
        messaging_patterns = [
            (r'(?:contact|interview|reach\s+out|message|chat|connect|speak\s+with)\s+(?:.*?\s+)?(?:through|via|on)\s+(?:telegram|whatsapp|signal|wire|skype|viber)', 'messaging app interview requirement'),
            (r'(?:telegram|whatsapp|signal|wire)\s+(?:to\s+schedule|interview|contact|channel|account|only|manager|recruiter)', 'telegram interview/contact'),
            (r'telegram:\s*@\w+|t\.me/\w+|whatsapp:\s*[\+\d]+', 'telegram/whatsapp handle for contact'),
            (r'contact\s+(?:our\s+)?(?:hiring\s+manager|recruiter|team)\s+(?:through|via|on)\s+telegram', 'contact hiring manager on telegram'),
            (r'telegram only|telegram channel|contact.*telegram.*recruiter', 'telegram contact channel'),
            (r'whatsapp only|whatsapp contact.*apply|interview.*whatsapp.*channel', 'whatsapp contact channel'),
            (r'exclusively on telegram|contact recruiter on telegram|message.*whatsapp.*interview', 'messaging app requirement')
        ]
        for pattern, label in messaging_patterns:
            match = re.search(pattern, full_text)
            if match:
                # Exclude case where it's a generic share link
                if "t.me/share" in full_text or "api.whatsapp.com/send" in full_text:
                    continue
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="messaging_recruit",
                    severity="MEDIUM",
                    message="The listing requires conducting recruitment and interviews exclusively via messaging platforms.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 7: suspicious_contact (MEDIUM, Weight: 15)
        # =====================================================================
        # Detect domain mismatches (company claimed is large but domain is generic/mismatched)
        if email and company:
            email_parts = email.split('@')
            if len(email_parts) == 2:
                email_domain = email_parts[1]
                email_domain_name = email_domain.split('.')[0]
                
                # Check for large brand vs generic email domain mismatch
                is_well_known = any(brand in company for brand in cls.WELL_KNOWN_BRANDS)
                is_free_provider = email_domain in cls.FREE_EMAIL_DOMAINS
                
                if is_well_known and is_free_provider:
                    add_flag(
                        category="suspicious_contact",
                        severity="MEDIUM",
                        message=f"The listing claims to recruit for a major brand ({job_data['company']}) but uses a generic public email domain (@{email_domain}).",
                        evidence=f"company: '{job_data['company']}', email: '{job_data['email']}'"
                    )
                # Check custom domain mismatch (e.g. company 'Microsoft', email domain 'google.com')
                elif not is_free_provider:
                    # Clean company name and get individual alphanumeric words
                    company_words = [w for w in re.findall(r'[a-z0-9]+', company) if w not in {
                        'corp', 'inc', 'co', 'ltd', 'limited', 'services', 'solutions', 
                        'india', 'gmbh', 'technologies', 'technology', 'group', 'pvt', 'private'
                    }]
                    
                    # If any word from company name is in the email domain or vice versa, it's a match!
                    has_match = False
                    for word in company_words:
                        if len(word) >= 3:
                            if word in email_domain_name or email_domain_name in word:
                                has_match = True
                                break
                    
                    if not has_match and len(company_words) > 0:
                        add_flag(
                            category="suspicious_contact",
                            severity="MEDIUM",
                            message=f"Recruiter email domain (@{email_domain}) does not match or align with the stated company name ({job_data['company']}).",
                            evidence=f"company: '{job_data['company']}', email: '{job_data['email']}'"
                        )

        # =====================================================================
        # RULE 8: unrealistic_salary (MEDIUM, Weight: 15)
        # =====================================================================
        salary_patterns = [
            (r'(?:₹|\$)\s*(?:[5-9]\d|[1-9]\d{2,})\s*(?:per\s*hour|/\s*hour|/\s*hr|per\s*hr)', 'unrealistic hourly compensation rate'),
            (r'earn (?:₹|\$)\d+(?:,\d+)*(?:\s*(?:per|a)\s*day|/day)', 'daily rate claim'),
            (r'guaranteed (?:₹|\$)\d+(?:,\d+)*\s*weekly|guaranteed weekly income', 'weekly guaranteed income'),
            (r'no experience required.*(?:₹|\$)\d+(?:,\d+)*\s*(?:per\s*month|/month|/\s*hour|/day)', 'no experience high salary combination'),
            (r'earn weekly thousands|guaranteed selection.*earn.*(?:day|week|month)', 'earnings exaggeration')
        ]
        for pattern, label in salary_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="unrealistic_salary",
                    severity="MEDIUM",
                    message="The listing promises unrealistically high daily/weekly earnings or guaranteed income with minimal qualification constraints.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 9: urgency_pressure (LOW, Weight: 5)
        # =====================================================================
        urgency_patterns = [
            (r'positions\s+are\s+limited|limited\s+positions|limited\s+vacancies|limited\s+slots|limited\s+seats', 'limited positions scarcity language'),
            (r'apply immediately|act now|limited vacancies|only today|instant hiring|immediate payment required|extreme pressure', 'urgency indicators'),
            (r'secure\s+your\s+position|urgently\s+hiring|start\s+immediately|immediate\s+start', 'urgency language')
        ]
        for pattern, label in urgency_patterns:
            match = re.search(pattern, full_text)
            if match:
                evidence_text = full_text[max(0, match.start() - 30): min(len(full_text), match.end() + 30)]
                add_flag(
                    category="urgency_pressure",
                    severity="LOW",
                    message="The listing uses urgency, pressure tactics, or artificial scarcity to prompt immediate candidate action.",
                    evidence=f"...{evidence_text.strip()}..."
                )
                break

        # =====================================================================
        # RULE 10: vague_description (LOW, Weight: 5)
        # =====================================================================
        missing_count = 0
        reasons = []

        has_resp = any(k in description for k in ["responsibility", "responsibilities", "tasks", "duties", "develop", "manage", "execute", "design", "role"])
        if not has_resp:
            missing_count += 1
            reasons.append("lacks role responsibilities details")

        has_qual = any(k in description for k in ["qualification", "qualifications", "requirements", "skills", "experience", "degree", "criteria"])
        if not has_qual:
            missing_count += 1
            reasons.append("lacks candidate requirements or qualifications specifications")

        has_company = bool(company) or any(k in description for k in ["about us", "founded", "our company", "our profile", "established"])
        if not has_company:
            missing_count += 1
            reasons.append("lacks company background context")

        if len(description) < 150 and missing_count >= 3:
            add_flag(
                category="vague_description",
                severity="LOW",
                message="The job listing contains an extremely vague description, missing standard role details, responsibilities, or company profile.",
                evidence=", ".join(reasons)
            )

        # =====================================================================
        # RULE 11: unverified_domain (Weight: 20)
        # =====================================================================
        if verification_result and verification_result.get("domain"):
            trust_score = verification_result.get("trust_score")
            if trust_score is None:
                trust_score = verification_result.get("trustScore", 100)
            is_verified = verification_result.get("is_verified_employer")
            if is_verified is None:
                is_verified = verification_result.get("isVerifiedEmployer", False)
            if not is_verified or trust_score < 70:
                add_flag(
                    category="unverified_domain",
                    severity="MEDIUM",
                    message=f"The employer's domain (@{verification_result.get('domain', '')}) is unverified or has low trust scores.",
                    evidence=f"trust score: {trust_score}, verified: {is_verified}"
                )

        # =====================================================================
        # COMBINATION LOGIC
        # =====================================================================
        combination_bonus = 0
        categories_triggered = set(triggered_categories.keys())

        # A: messaging_recruit + upfront_payment -> +15
        if "messaging_recruit" in categories_triggered and "upfront_payment" in categories_triggered:
            combination_bonus += 15

        # B: messaging_recruit + suspicious_contact -> +10
        if "messaging_recruit" in categories_triggered and "suspicious_contact" in categories_triggered:
            combination_bonus += 10

        # C: identity_docs + financial_info -> +15
        if "identity_docs" in categories_triggered and "financial_info" in categories_triggered:
            combination_bonus += 15

        # D: identity_docs + upfront_payment -> +15
        if "identity_docs" in categories_triggered and "upfront_payment" in categories_triggered:
            combination_bonus += 15

        # E: unrealistic_salary + guaranteed_job -> +15
        if "unrealistic_salary" in categories_triggered and "guaranteed_job" in categories_triggered:
            combination_bonus += 15

        # F: urgency_pressure + upfront_payment -> +10
        if "urgency_pressure" in categories_triggered and "upfront_payment" in categories_triggered:
            combination_bonus += 10

        # G: upfront_payment + equipment_purchase -> +15
        if "upfront_payment" in categories_triggered and "equipment_purchase" in categories_triggered:
            combination_bonus += 15

        # H: equipment_purchase + messaging_recruit -> +15
        if "equipment_purchase" in categories_triggered and "messaging_recruit" in categories_triggered:
            combination_bonus += 15

        # I: unrealistic_salary + upfront_payment -> +10
        if "unrealistic_salary" in categories_triggered and "upfront_payment" in categories_triggered:
            combination_bonus += 10

        # J: unrealistic_salary + equipment_purchase -> +10
        if "unrealistic_salary" in categories_triggered and "equipment_purchase" in categories_triggered:
            combination_bonus += 10

        # Calculate final base score (sum of maximum severity weights per triggered category)
        base_score = sum(triggered_categories.values())

        # Total rule score clamped between 0 and 100
        rule_score = min(base_score + combination_bonus, 100)

        return {
            "rule_score": rule_score,
            "flags": flags
        }
