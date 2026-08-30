const { ScamClassifier } = require('../../dist/index.js');

const input = {
  title: "Remote Data Entry Clerk",
  company: "Apex Logistics LLC",
  email: "careers@apex-logistics.com",
  url: "https://www.linkedin.com/jobs/view/987654321/?utm_source=feed&fbclid=123",
  description: "Apex Logistics is seeking a remote data entry operator. Flexible hours. The interview will be conducted exclusively via Telegram chat app. Download Telegram to contact us."
};

const result = ScamClassifier.classify(input);
console.log(JSON.stringify(result, null, 2));
