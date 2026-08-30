export const SCAM_GUIDES = [
  {
    id: 'fake-check-equipment',
    title: 'The Fake Check & Equipment Purchase Trap',
    severity: 'CRITICAL',
    icon: '💵',
    summary: 'Scammers promise to send a check to purchase home office laptops/supplies from a specific vendor.',
    mechanics: `1. You receive a realistic-looking check via email or priority mail.
2. The "employer" instructs you to deposit it into your personal bank account.
3. You are told to immediately wire a portion (e.g. $2,000) to an "approved equipment vendor".
4. Days later, your bank discovers the check is fraudulent. Your bank reverses the deposit, leaving you down $2,000 of your own money plus bank overdraft fees.`,
    prevention: 'NEVER deposit a check from an employer with instructions to send money to a third party or vendor. Real employers purchase and ship equipment directly to you.'
  },
  {
    id: 'telegram-whatsapp-interviews',
    title: 'Instant Messaging App Interviews',
    severity: 'HIGH',
    icon: '📱',
    summary: 'Interviews conducted exclusively over Telegram, WhatsApp, or Signal with no face-to-face video or phone call.',
    mechanics: `1. You apply online or receive an unsolicited text message offering an interview.
2. You are directed to download Telegram/WhatsApp and message a specific "HR Hiring Manager".
3. The interview consists of standard questionnaire text messages.
4. You receive an instant job offer within minutes without ever speaking to a human being.`,
    prevention: 'Insist on a legitimate video call (Zoom, Google Meet, Teams) or a verified corporate phone call. Legitimate HR teams do not conduct entire interviews over chat apps.'
  },
  {
    id: 'package-reshipping',
    title: 'Package Reshipping & Money Muling',
    severity: 'CRITICAL',
    icon: '📦',
    summary: 'Offered positions as a "Quality Control Inspector" to receive, inspect, and reship packages from home.',
    mechanics: `1. Goods (electronics, designer apparel) bought with stolen credit cards are shipped to your address.
2. You are asked to re-package them and ship them overseas.
3. When law enforcement investigates the credit card fraud, the trail leads straight to your doorstep.`,
    prevention: 'Never agree to receive and reship packages from your personal address for an unknown company.'
  },
  {
    id: 'identity-theft-phishing',
    title: 'Identity & SSN Theft Phishing',
    severity: 'HIGH',
    icon: '🪪',
    summary: 'Job listings designed to steal SSN, credit scores, driver licenses, or banking info under the guise of background checks.',
    mechanics: `1. Scammers request your SSN, banking details, or force you to complete a paid "credit report check" via an unverified link before an interview.
2. They use your sensitive information to open fraudulent credit cards or take out loans in your name.`,
    prevention: 'Only provide SSN and tax forms AFTER receiving a formal, signed offer letter through an official background check portal (e.g., Checkr, Sterling).'
  }
];

export const REGULATORY_LINKS = {
  ftc: 'https://reportfraud.ftc.gov/',
  ic3: 'https://www.ic3.gov/',
  eoc: 'https://www.eeoc.gov/filing-charge-discrimination'
};
