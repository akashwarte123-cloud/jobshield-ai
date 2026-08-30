import math

class RiskEngine:
    """Consolidates machine learning score, rule-based score, and domain verification to compute risk levels."""

    @staticmethod
    def calculate(ml_result, rule_result, verification_result=None):
        """
        Calculates the combined risk level using a weighted fusion of ML, Rules, and Domain Verification.
        """
        if not ml_result:
            ml_result = {
                "prediction": "SAFE",
                "ml_score": 0,
                "confidence": None,
                "model_version": None
            }

        if not rule_result:
            rule_result = {
                "rule_score": 0,
                "flags": []
            }

        ml_score = ml_result.get("ml_score", 0)
        rule_score = rule_result.get("rule_score", 0)
        flags = rule_result.get("flags", [])

        # Baseline weighted score using the legacy 60/40 rule engine weighting
        weighted_score = (ml_score * 0.60) + (rule_score * 0.40)
        final_score = int(math.floor(weighted_score + 0.5))

        # Check for unverified domain state
        is_unverified = False
        domain_value = ""
        trust_score = 100

        if verification_result:
            domain_value = verification_result.get("domain", "")
            trust_score = verification_result.get("trust_score", 100)
            if domain_value:
                is_unverified = not verification_result.get("is_verified_employer", False)

        # Elevate final score to at least MEDIUM (30) if domain is unverified/non-production
        if is_unverified:
            if final_score < 30:
                final_score = 30

        # Multi-indicator compounding:
        # Multiple independent scam indicators compound into the final risk score
        if flags and len(flags) >= 3:
            compounding_boost = (len(flags) - 2) * 5
            final_score = min(100, final_score + compounding_boost)
            
            categories = {f.get("category") for f in flags}
            has_high_severity = "upfront_payment" in categories or "equipment_purchase" in categories or "financial_info" in categories
            
            if has_high_severity and len(flags) >= 4:
                final_score = max(final_score, rule_score, 85)
            elif len(flags) >= 3 and has_high_severity:
                final_score = max(final_score, 75)

        # Clamp final score between [0, 100]
        final_score = max(0, min(100, final_score))

        # Classification mapping
        if final_score >= 80:
            risk_level = "CRITICAL"
        elif final_score >= 60:
            risk_level = "HIGH"
        elif final_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Calculate model/evidence agreement confidence (float between 0.0 and 1.0)
        confidence = 0.95
        if domain_value:
            verify_risk = 100.0 - float(trust_score)
            scores = [float(ml_score), float(rule_score), float(verify_risk)]
            mean = sum(scores) / len(scores)
            variance = sum((s - mean) ** 2 for s in scores) / len(scores)
            std_dev = math.sqrt(variance)
            confidence = max(70.0, min(99.0, round(100.0 - std_dev * 0.4, 1))) / 100.0

        # Preserve ML prediction independently as expected by API contracts and tests
        prediction = ml_result.get("prediction") or "SAFE"

        return {
            "ml_score": ml_score,
            "rule_score": rule_score,
            "final_score": final_score,
            "risk_level": risk_level,
            "prediction": prediction,
            "confidence": confidence,
            "model_version": ml_result.get("model_version") or "v1.4.2",
            "flags": flags
        }
