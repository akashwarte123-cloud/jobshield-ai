/**
 * JobShield AI E2E Integration and Scoring Verification Test Suite
 */

const http = require('http');

const TEST_CASES = [
  {
    name: "Legitimate LinkedIn Job (Google Software Engineer)",
    payload: {
      title: "Software Engineer",
      company: "Google LLC",
      recruiter: "jobs@google.com",
      url: "https://www.linkedin.com/jobs/view/123456789/?refId=abc&trackingId=xyz",
      description: "We are looking for a Software Engineer to join our Google Cloud team. Requires BS in Computer Science and 3+ years experience with TS, React, Node.js."
    },
    validate: (res) => {
      console.log(`   - Risk Level: ${res.data.riskLevel} (Expected: LOW or MEDIUM)`);
      console.log(`   - Risk Score: ${res.data.riskScore} / 100`);
      console.log(`   - Confidence: ${res.data.confidence}%`);
      const hasCritical = res.data.signals.some(s => s.severity === 'critical');
      console.log(`   - Has Critical Signals: ${hasCritical} (Expected: false)`);
      if (hasCritical) throw new Error("Legitimate job should not have critical signals!");
    }
  },
  {
    name: "Fake LinkedIn Job (Telegram Recruitment)",
    payload: {
      title: "Remote Data Entry Clerk",
      company: "Apex Logistics LLC",
      recruiter: "careers@apex-logistics.com",
      url: "https://www.linkedin.com/jobs/view/987654321/?utm_source=feed&fbclid=123",
      description: "Apex Logistics is seeking a remote data entry operator. Flexible hours. The interview will be conducted exclusively via Telegram chat app. Download Telegram to contact us."
    },
    validate: (res) => {
      console.log(`   - Risk Level: ${res.data.riskLevel} (Expected: HIGH)`);
      console.log(`   - Risk Score: ${res.data.riskScore} / 100 (Expected: >= 65)`);
      console.log(`   - Confidence: ${res.data.confidence}%`);
      const telegramSignal = res.data.signals.find(s => s.label.includes("Telegram"));
      console.log(`   - Telegram Signal: ${telegramSignal ? telegramSignal.severity : 'None'} (Expected: critical)`);
      if (!telegramSignal || telegramSignal.severity !== 'critical') {
        throw new Error("Telegram recruitment should have critical severity signal!");
      }
      if (res.data.riskScore < 65) {
        throw new Error("Telegram critical signal did not elevate overall risk score to DANGER threshold!");
      }
    }
  },
  {
    name: "Fake LinkedIn Job (Upfront Equipment Purchase / Check)",
    payload: {
      title: "Administrative Assistant",
      company: "Global Logistics Inc",
      recruiter: "recruiting@global-logistics.com",
      url: "https://www.linkedin.com/jobs/view/555111222/",
      description: "We will send you a check to purchase your home office equipment and laptop from our certified vendor. Deposit the check and wire funds immediately."
    },
    validate: (res) => {
      console.log(`   - Risk Level: ${res.data.riskLevel} (Expected: HIGH)`);
      console.log(`   - Risk Score: ${res.data.riskScore} / 100 (Expected: >= 65)`);
      const checkSignal = res.data.signals.find(s => s.label.includes("check") || s.label.includes("Wire"));
      console.log(`   - Check/Wire Signal: ${checkSignal ? checkSignal.severity : 'None'} (Expected: critical)`);
      if (!checkSignal || checkSignal.severity !== 'critical') {
        throw new Error("Check/wire purchase scam should have critical severity signal!");
      }
      if (res.data.riskScore < 65) {
        throw new Error("Critical check signal did not elevate overall risk score to DANGER threshold!");
      }
    }
  },
  {
    name: "Suspicious Gmail Recruiter Check",
    payload: {
      title: "Data Analyst",
      company: "Meta Platforms",
      recruiter: "meta.careers.recruiting@gmail.com",
      url: "https://www.linkedin.com/jobs/view/444555666",
      description: "Meta is hiring a remote data analyst. Please apply by contacting us."
    },
    validate: (res) => {
      console.log(`   - Risk Level: ${res.data.riskLevel}`);
      console.log(`   - Risk Score: ${res.data.riskScore} / 100`);
      const emailSignal = res.data.signals.find(s => s.label.includes("recruiter email"));
      console.log(`   - Recruiter Email Signal: ${emailSignal ? emailSignal.severity : 'None'} (Expected: critical)`);
      if (!emailSignal || emailSignal.severity !== 'critical') {
        throw new Error("Free email domain for official company recruiting should be flagged critical!");
      }
    }
  },
  {
    name: "Missing Salary and Company Check (Should Not Crash)",
    payload: {
      title: "Customer Support Executive",
      description: "No details on company, no recruiter email, no salary details provided."
    },
    validate: (res) => {
      console.log(`   - Status: Success`);
      console.log(`   - Risk Level: ${res.data.riskLevel}`);
      console.log(`   - Risk Score: ${res.data.riskScore} / 100`);
      const companySignal = res.data.signals.find(s => s.label.includes("company"));
      const salarySignal = res.data.signals.find(s => s.label.includes("Salary"));
      console.log(`   - Company Signal Severity: ${companySignal ? companySignal.severity : 'None'} (Expected: warning)`);
      console.log(`   - Salary Signal Severity: ${salarySignal ? salarySignal.severity : 'None'} (Expected: warning)`);
      if (!companySignal || companySignal.severity !== 'warning') {
        throw new Error("Missing company should trigger warning signal!");
      }
      if (!salarySignal || salarySignal.severity !== 'warning') {
        throw new Error("Missing salary should trigger warning signal!");
      }
    }
  }
];

function postRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse JSON response: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("  JOBSHIELD E2E INTEGRATION & SCORING TEST SUITE ");
  console.log("=================================================\n");

  let passed = 0;
  for (const tc of TEST_CASES) {
    console.log(`▶ Running: ${tc.name}`);
    try {
      const res = await postRequest('/api/v1/jobs/scan', tc.payload);
      if (!res.success) {
        throw new Error(`API returned success: false. Error: ${res.error}`);
      }
      tc.validate(res);
      console.log(`✅ Passed\n`);
      passed++;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}\n`);
    }
  }

  console.log("-------------------------------------------------");
  console.log(`Result: ${passed} / ${TEST_CASES.length} cases passed successfully.`);
  console.log("=================================================");
}

runTests();
