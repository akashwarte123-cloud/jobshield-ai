import unittest
import sys
import os

# Adjust path so test runner can find app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services import RiskEngine

class RiskEngineTestCase(unittest.TestCase):
    
    def test_risk_ml_0_rules_0(self):
        """Test final risk score with zero ML and zero rule scores."""
        ml_res = {"prediction": "SAFE", "ml_score": 0, "confidence": None, "model_version": None}
        rule_res = {"rule_score": 0, "flags": []}
        
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["ml_score"], 0)
        self.assertEqual(res["rule_score"], 0)
        self.assertEqual(res["final_score"], 0)
        self.assertEqual(res["risk_level"], "LOW")
        self.assertEqual(res["prediction"], "SAFE")
        self.assertEqual(res["flags"], [])

    def test_risk_ml_100_rules_100(self):
        """Test final risk score with maximum ML and rule scores."""
        ml_res = {"prediction": "DANGER", "ml_score": 100, "confidence": None, "model_version": None}
        rule_res = {
            "rule_score": 100,
            "flags": [{"category": "upfront_payment", "severity": "critical", "message": "Fee requested", "evidence": "fee"}]
        }
        
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["ml_score"], 100)
        self.assertEqual(res["rule_score"], 100)
        self.assertEqual(res["final_score"], 100)
        self.assertEqual(res["risk_level"], "CRITICAL")
        self.assertEqual(res["prediction"], "DANGER")
        self.assertEqual(len(res["flags"]), 1)

    def test_risk_ml_only_scoring(self):
        """Test score calculation when rules are zero."""
        ml_res = {"prediction": "DANGER", "ml_score": 80, "confidence": None, "model_version": None}
        rule_res = {"rule_score": 0, "flags": []}
        
        # final = 80 * 0.60 + 0 * 0.40 = 48 -> MEDIUM
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 48)
        self.assertEqual(res["risk_level"], "MEDIUM")
        self.assertEqual(res["prediction"], "DANGER")  # ML prediction preserved separately

    def test_risk_rules_only_scoring(self):
        """Test score calculation when ML score is zero."""
        ml_res = {"prediction": "SAFE", "ml_score": 0, "confidence": None, "model_version": None}
        rule_res = {"rule_score": 70, "flags": []}
        
        # final = 0 * 0.60 + 70 * 0.40 = 28 -> LOW
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 28)
        self.assertEqual(res["risk_level"], "LOW")

    def test_risk_correct_weighting_60_40(self):
        """Test the 60/40 weighted formula calculation explicitly."""
        ml_res = {"prediction": "CAUTION", "ml_score": 50, "confidence": None, "model_version": None}
        rule_res = {"rule_score": 80, "flags": []}
        
        # final = 50 * 0.60 + 80 * 0.40 = 30 + 32 = 62 -> HIGH
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 62)
        self.assertEqual(res["risk_level"], "HIGH")

    def test_risk_score_rounding(self):
        """Test rounding logic for non-integer weighted result (e.g. .5 rounds up)."""
        # Case A: final = 50 * 0.60 + 51 * 0.40 = 30 + 20.4 = 50.4 -> rounds to 50
        ml_res = {"ml_score": 50}
        rule_res = {"rule_score": 51}
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 50)
        
        # Case B: final = 50 * 0.60 + 52 * 0.40 = 30 + 20.8 = 50.8 -> rounds to 51
        ml_res = {"ml_score": 50}
        rule_res = {"rule_score": 52}
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 51)

        # Case C: final = 50 * 0.60 + 51.25 * 0.40 = 30 + 20.5 = 50.5 -> rounds to 51
        ml_res = {"ml_score": 50}
        rule_res = {"rule_score": 51.25} # float
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 51)

    def test_risk_score_clamping(self):
        """Test clamping ensures score is bound within [0, 100]."""
        ml_res = {"ml_score": -10}
        rule_res = {"rule_score": -20}
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 0)

        ml_res = {"ml_score": 150}
        rule_res = {"rule_score": 120}
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["final_score"], 100)

    def test_risk_level_boundaries(self):
        """Test mapping correctly maps boundary scores to LOW, MEDIUM, HIGH, CRITICAL."""
        # LOW Boundary: 0 - 29 (final 29 -> LOW)
        ml_res = {"ml_score": 20}
        rule_res = {"rule_score": 42.5} # 20*0.60 + 42.5*0.40 = 12 + 17 = 29
        self.assertEqual(RiskEngine.calculate(ml_res, rule_res)["risk_level"], "LOW")
        
        # MEDIUM Boundary: 30 - 59 (final 30 -> MEDIUM, final 59 -> MEDIUM)
        ml_res = {"ml_score": 30}
        rule_res = {"rule_score": 30} # final = 30
        self.assertEqual(RiskEngine.calculate(ml_res, rule_res)["risk_level"], "MEDIUM")
        
        ml_res = {"ml_score": 50}
        rule_res = {"rule_score": 72.5} # 30 + 29 = 59
        self.assertEqual(RiskEngine.calculate(ml_res, rule_res)["risk_level"], "MEDIUM")
        
        # HIGH Boundary: 60 - 79 (final 60 -> HIGH, final 79 -> HIGH)
        ml_res = {"ml_score": 60}
        rule_res = {"rule_score": 60} # final = 60
        self.assertEqual(RiskEngine.calculate(ml_res, rule_res)["risk_level"], "HIGH")
        
        ml_res = {"ml_score": 70}
        rule_res = {"rule_score": 92.5} # 42 + 37 = 79
        self.assertEqual(RiskEngine.calculate(ml_res, rule_res)["risk_level"], "HIGH")
        
        # CRITICAL Boundary: 80 - 100 (final 80 -> CRITICAL, final 100 -> CRITICAL)
        ml_res = {"ml_score": 80}
        rule_res = {"rule_score": 80} # final = 80
        self.assertEqual(RiskEngine.calculate(ml_res, rule_res)["risk_level"], "CRITICAL")

    def test_risk_ml_prediction_preserved_independently(self):
        """Test ML prediction and combined risk_level are calculated independently."""
        # Case where ML says DANGER but rule score is extremely low, pushing final score to LOW
        ml_res = {"prediction": "DANGER", "ml_score": 40}
        rule_res = {"rule_score": 10}
        # final = 24 + 4 = 28 -> LOW
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["risk_level"], "LOW")
        self.assertEqual(res["prediction"], "DANGER")

        # Case where ML says SAFE but rules say critical danger, pushing final score to HIGH
        ml_res = {"prediction": "SAFE", "ml_score": 10}
        rule_res = {"rule_score": 90}
        # final = 6 + 36 = 42 -> MEDIUM
        res = RiskEngine.calculate(ml_res, rule_res)
        self.assertEqual(res["risk_level"], "MEDIUM")
        self.assertEqual(res["prediction"], "SAFE")

if __name__ == '__main__':
    unittest.main()
