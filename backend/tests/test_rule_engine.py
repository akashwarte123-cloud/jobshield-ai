import unittest
import sys
import os

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services import RuleEngine

class RuleEngineTestCase(unittest.TestCase):
    
    def test_upfront_payment(self):
        """Test Rule 1: upfront payment triggers CRITICAL flag and score."""
        job_data = {
            "title": "Data Entry Typist",
            "company": "TypeCorp Ltd",
            "description": (
                "We are looking for a typist to join our data services team. "
                "Responsibilities include entering text data from templates. "
                "Requirements: typing speed of 40 WPM. "
                "To start you must pay a registration fee of ₹2,500 for training software."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 50)
        self.assertEqual(len(res["flags"]), 1)
        self.assertEqual(res["flags"][0]["category"], "upfront_payment")
        self.assertEqual(res["flags"][0]["severity"], "critical")
        self.assertIn("registration fee", res["flags"][0]["evidence"])

    def test_financial_info_critical(self):
        """Test Rule 2: bank card CVV, PIN, or OTP requests trigger CRITICAL flag."""
        job_data = {
            "title": "Financial Clerk",
            "company": "Finance House",
            "description": (
                "Work as a records clerk in our database team. "
                "Responsibilities: maintain client accounts files. "
                "Requirements: accounting certificate. "
                "Please share your credit card security code CVV and banking card PIN for verification."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 50)
        self.assertEqual(res["flags"][0]["category"], "financial_info")
        self.assertEqual(res["flags"][0]["severity"], "critical")

    def test_financial_info_payroll_not_critical(self):
        """Test normal bank account / routing details request does NOT trigger CRITICAL financial_info."""
        job_data = {
            "title": "Software Developer",
            "company": "SoftCorp",
            "description": (
                "Build modern application features. "
                "Responsibilities: code and test features. "
                "Requirements: Java experience. "
                "Submit your bank account number and routing information for monthly salary payroll setup."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(len(res["flags"]), 0)

    def test_identity_docs_request_low(self):
        """Test Rule 3: normal identity documents request triggers LOW flag (weight 10)."""
        job_data = {
            "title": "Administrative Assistant",
            "company": "Office Helpers",
            "description": (
                "Support administrative teams in filing and records. "
                "Responsibilities include organizing meetings and schedules. "
                "Requirements: proficiency with Excel. "
                "Please email us a copy of your Aadhaar card or PAN card."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 10)
        self.assertEqual(res["flags"][0]["category"], "identity_docs")
        self.assertEqual(res["flags"][0]["severity"], "low")

    def test_identity_docs_suspicious_combination(self):
        """Test identity documents + upfront payment triggers combination D (+15)."""
        job_data = {
            "title": "Data Operator",
            "company": "Data Experts",
            "description": (
                "Perform daily data maintenance. "
                "Responsibilities: verify input files. "
                "Requirements: basic computer skills. "
                "Please submit your Aadhaar card scan and pay a registration fee of ₹500."
            )
        }
        res = RuleEngine.analyze(job_data)
        # base: identity_docs (10) + upfront_payment (50) = 60
        # combination: D (+15)
        # total: 75
        self.assertEqual(res["rule_score"], 75)
        categories = {f["category"] for f in res["flags"]}
        self.assertIn("identity_docs", categories)
        self.assertIn("upfront_payment", categories)

    def test_guaranteed_employment(self):
        """Test Rule 4: guaranteed placement triggers HIGH flag (weight 30)."""
        job_data = {
            "title": "Delivery Executive",
            "company": "Express Delivery Ltd",
            "description": (
                "Deliver packages to local clients. "
                "Responsibilities: safe package transport. "
                "Requirements: valid delivery permit. "
                "This is a 100% job guarantee with direct selection and no interview required."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 30)
        self.assertEqual(res["flags"][0]["category"], "guaranteed_job")
        self.assertEqual(res["flags"][0]["severity"], "high")

    def test_messaging_recruit_medium(self):
        """Test Rule 5: recruitment exclusively on messaging apps triggers MEDIUM flag (weight 15)."""
        job_data = {
            "title": "Virtual Assistant",
            "company": "Remote Solutions",
            "description": (
                "Manage online schedules for business executives. "
                "Responsibilities include organizing calendar meetings. "
                "Requirements: good communication skills. "
                "Contact recruiter exclusively on Telegram channel @JobShieldHelper to schedule your interview."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 15)
        self.assertEqual(res["flags"][0]["category"], "messaging_recruit")
        self.assertEqual(res["flags"][0]["severity"], "medium")

    def test_messaging_normal_mention_not_triggered(self):
        """Test that mere sharing links to Telegram/WhatsApp without exclusive recruitment context are ignored."""
        job_data = {
            "title": "HR Manager",
            "company": "Recruitment Firm",
            "description": (
                "Conduct full cycle recruitment activities. "
                "Responsibilities: screen and interview applicants. "
                "Requirements: 3 years of HR experience. "
                "Share this job listing on your network via t.me/share."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(len(res["flags"]), 0)

    def test_suspicious_contact_mismatch(self):
        """Test Rule 6: mismatch between claimed large company and generic email domain triggers MEDIUM (weight 15)."""
        job_data = {
            "company": "Google India Ltd",
            "email": "careers-google@gmail.com",
            "description": (
                "Google is looking for software engineers. "
                "Responsibilities include developing code features. "
                "Requirements: degree in computer science."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 15)
        self.assertEqual(res["flags"][0]["category"], "suspicious_contact")
        self.assertEqual(res["flags"][0]["severity"], "medium")

    def test_suspicious_contact_generic_alone_ignored(self):
        """Test that generic email domains like Gmail alone do NOT trigger suspicious contact without corporate mismatch."""
        job_data = {
            "company": "Local Startup",
            "email": "localstartup@gmail.com",
            "description": (
                "Design icons and graphic layouts. "
                "Responsibilities include delivering mockups. "
                "Requirements: portfolio in Figma."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(len(res["flags"]), 0)

    def test_suspicious_contact_mismatch_custom_domains(self):
        """Test mismatch of custom email domain vs stated company name triggers MEDIUM (weight 15)."""
        job_data = {
            "company": "Microsoft Corp",
            "email": "recruitment@google-careers.com",
            "description": (
                "Provide technical support to enterprise accounts. "
                "Responsibilities: diagnose and resolve client issues. "
                "Requirements: 2 years customer service experience."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 15)
        self.assertEqual(res["flags"][0]["category"], "suspicious_contact")
        self.assertIn("does not match", res["flags"][0]["message"])

    def test_unrealistic_salary(self):
        """Test Rule 7: guaranteed daily rate or low qualifications + high earnings triggers MEDIUM (weight 15)."""
        job_data = {
            "title": "Data Typist",
            "company": "Fast Typists Ltd",
            "description": (
                "Join our quick typing team. "
                "Responsibilities: transcribe document templates. "
                "Requirements: basic laptop availability. "
                "Earn ₹10,000 per day working from home with no experience required."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 15)
        self.assertEqual(res["flags"][0]["category"], "unrealistic_salary")
        self.assertEqual(res["flags"][0]["severity"], "medium")

    def test_normal_salary_ignored(self):
        """Test that standard job descriptions with typical salary numbers are ignored."""
        job_data = {
            "title": "Software Engineer",
            "company": "Tech Solutions",
            "description": (
                "Implement scalable cloud architectures. "
                "Responsibilities: build and deploy APIs. "
                "Requirements: AWS certificate. "
                "Annual compensation package is ₹12,0,000 per annum depending on experience."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 0)

    def test_urgency_pressure(self):
        """Test Rule 8: urgency pressure tactics trigger LOW flag (weight 5)."""
        job_data = {
            "title": "Graphic Designer",
            "company": "Design Studios",
            "description": (
                "Create layouts for web publications. "
                "Responsibilities: design assets on request. "
                "Requirements: skill in Photoshop. "
                "We are hiring immediately, act now, limited vacancies left!"
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 5)
        self.assertEqual(res["flags"][0]["category"], "urgency_pressure")
        self.assertEqual(res["flags"][0]["severity"], "low")

    def test_short_informative_description_ignored(self):
        """Test that a short but informative job description does NOT trigger vague_description."""
        job_data = {
            "title": "Junior Java Developer",
            "company": "Tech Solutions Ltd",
            "description": "Develop and maintain REST API endpoints. Required skills: Java, Spring Boot. B.Tech degree required."
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(len(res["flags"]), 0)

    def test_vague_description(self):
        """Test Rule 9: vague job descriptions lacking core details trigger LOW flag (weight 5)."""
        job_data = {
            "title": "Help Staff",
            "description": "Apply today for a generic position. Good daily pay."
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 5)
        self.assertEqual(res["flags"][0]["category"], "vague_description")
        self.assertEqual(res["flags"][0]["severity"], "low")

    def test_combination_messaging_recruit_and_suspicious_contact(self):
        """Test combination B: messaging_recruit (15) + suspicious_contact (15) + bonus (+10) = 40."""
        job_data = {
            "company": "Wipro Technologies",
            "email": "wipro-recruit@gmail.com",
            "description": (
                "Develop frontend solutions. "
                "Responsibilities: code pages. "
                "Requirements: React skill. "
                "Exclusively on Telegram @WiproJobs select your placement."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 40)
        categories = {f["category"] for f in res["flags"]}
        self.assertIn("messaging_recruit", categories)
        self.assertIn("suspicious_contact", categories)

    def test_duplicate_signal_handling(self):
        """Test that multiple triggers within the same category are deduplicated (only highest severity is counted)."""
        job_data = {
            "title": "Data Entry",
            "company": "Typing Co",
            "description": (
                "Perform text input. "
                "Responsibilities: update logs. "
                "Requirements: 30 wpm typing. "
                "Pay upfront training fee of ₹2000 and registration fee of ₹1000 caution deposit."
            )
        }
        res = RuleEngine.analyze(job_data)
        # Triggered multiple upfront payment indicators, should only charge base weight once (50)
        self.assertEqual(res["rule_score"], 50)
        # Should have only one flag recorded or counted in category
        self.assertEqual(len(res["flags"]), 1)

    def test_missing_fields_graceful_handling(self):
        """Test that missing optional keys are handled safely without crashing."""
        res = RuleEngine.analyze(None)
        self.assertEqual(res, {"rule_score": 0, "flags": []})

        res = RuleEngine.analyze({})
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(res["flags"], [])

    def test_legitimate_job_listing(self):
        """Test that a clean, legitimate job listing triggers 0 flags and score."""
        job_data = {
            "title": "Senior React Developer",
            "company": "Vite Engineering Ltd",
            "email": "careers@vite-eng.com",
            "description": "Build high-performance web applications. Require 5+ years of experience with React and TypeScript. Will collaborate with backend API developer team.",
            "salary": "₹15 - 20 LPA",
            "source_url": "https://careers.vite-eng.com/jobs/react-dev"
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(len(res["flags"]), 0)

    def test_rule_score_clamped_to_100(self):
        """Test that cumulative scores including combination bonuses never exceed 100."""
        # Trigger upfront_payment (50), financial_info (50), guaranteed_job (30), identity_docs (10), messaging_recruit (15)
        # plus multiple combination bonuses (A, C, D)
        job_data = {
            "title": "Typist",
            "company": "Fast Workers Inc",
            "description": (
                "Responsibilities: enter transaction documents. Requirements: none. "
                "Guaranteed selection direct selection! Pay upfront registration fee of ₹2,500. "
                "Share your bank card CVV code and Aadhaar card scan immediately. "
                "Contact recruiter on Telegram only."
            )
        }
        res = RuleEngine.analyze(job_data)
        self.assertEqual(res["rule_score"], 100)

if __name__ == '__main__':
    unittest.main()
