/**
 * JobShield AI Browser Extension — Content Script
 */
console.log("[JobShield] Content script initialized:", window.location.href);


interface JobData {
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string;
  recruiter: string;
  url: string;
  source: string;
}

function isVisibleElement(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.offsetWidth === 0 && el.offsetHeight === 0) {
    return false;
  }
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) {
      return false;
    }
  } catch (e) {}
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  const className = el.className || '';
  if (typeof className === 'string') {
    const classes = className.split(/\s+/);
    const hiddenPatterns = ['hidden', 'vjs-hidden', 'is-hidden', 'js-hidden', 'hide', 'd-none'];
    if (classes.some(c => hiddenPatterns.includes(c.toLowerCase()))) {
      return false;
    }
  }
  const text = el.textContent?.trim() || '';
  if (text.length === 0) {
    return false;
  }
  return true;
}

function scoreLinkedInDetailCandidate(el: Element): number {
  if (!el || !(el instanceof HTMLElement)) return -100;
  
  const className = el.className || '';
  const id = el.id || '';

  // -100 JobShield elements
  if (id === 'jobshield-inpage-badge' || el.querySelector('#jobshield-inpage-badge') || className.includes('jobshield')) {
    return -100;
  }

  // -100 vjs-hidden
  if (className.includes('vjs-hidden') || className.includes('hidden-helper')) {
    return -100;
  }

  // -80 left-side job list items or job-cards
  if (
    className.includes('job-card') ||
    className.includes('jobs-search-results__list-item') ||
    className.includes('job-card-list__item') ||
    className.includes('job-card-container')
  ) {
    return -80;
  }

  // -80 vjs-title-bar / navigation / header / settings
  if (className.includes('vjs-title-bar') || className.includes('nav') || className.includes('header') || className.includes('settings')) {
    return -80;
  }

  // -100 hidden (geometry or computed style)
  if (!isVisibleElement(el)) {
    return -100;
  }

  let score = 0;

  // +30 visible
  score += 30;

  // Bounding rect details
  const rect = el.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // +10 large container
  if (width > 200 && height > 200) {
    score += 10;
  }

  // +15 located predominantly on right side
  // Desktop detail pane starts past 1/3 viewport width
  if (rect.left > window.innerWidth / 3) {
    score += 15;
  }

  // +20 known LinkedIn detail class
  const isKnownClass = 
    className.includes('jobs-search-two-pane__details') ||
    className.includes('jobs-search__job-details--container') ||
    className.includes('jobs-search-results-list__detail-single-pane') ||
    className.includes('jobs-details') ||
    className.includes('jobs-search__job-details');
  if (isKnownClass) {
    score += 20;
  }

  // +25 contains valid job title
  const title = extractLinkedInTitle(el);
  if (title.length >= 3) {
    score += 25;
  }

  // +20 contains company link/text
  const company = extractLinkedInCompany(el);
  if (company.length >= 2) {
    score += 20;
  }

  // +30 description >= 100 chars
  const description = extractLinkedInDescription(el);
  if (description.length >= 100) {
    score += 30;
  }

  return score;
}

function extractLinkedInTitle(root: Element): string {
  const selectors = [
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    'a.job-details-jobs-unified-top-card__job-title-link',
    '.jobs-details__main-content h1',
    '.jobs-unified-top-card h1',
    '.jobs-search-two-pane__details h1',
    '.jobs-search__job-details h1',
    '.jobs-details h1',
    '.jobs-details h2',
    '[class*="job-title"]',
    'h1',
    'h2'
  ];

  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      if (isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (
          text.length >= 3 && 
          !lower.includes('notifications') && 
          !lower.includes('jobshield') && 
          !lower.includes('settings') &&
          !lower.includes('feedback') &&
          !lower.includes('linkedin') &&
          !lower.includes('search') &&
          !lower.includes('sign in') &&
          !lower.includes('join now')
        ) {
          return text;
        }
      }
    }
  }
  return '';
}

function extractLinkedInCompany(root: Element): string {
  const selectors = [
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.jobs-details__main-content a[href*="/company/"]',
    'a[href*="/company/"]',
    '[class*="company-name"]',
    '[class*="company"] a',
    '[class*="company"]'
  ];

  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      if (isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (
          text.length >= 2 && 
          !lower.includes('linkedin') && 
          !lower.includes('company') && 
          !lower.includes('jobshield') &&
          !lower.includes('careers')
        ) {
          return text;
        }
      }
    }
  }
  return '';
}

function extractLinkedInDescription(root: Element): string {
  const selectors = [
    '#job-details',
    '.jobs-description__content',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '.jobs-description',
    '[class*="jobs-description"]',
    '[class*="description"]',
    '[class*="job-desc"]',
    '[class*="job-description"]',
    'article',
    'main'
  ];

  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      if (isVisibleElement(el)) {
        if (el === document.body) continue;
        const text = el.textContent?.trim() || '';
        if (text.length >= 100) {
          return text;
        }
      }
    }
  }

  // Robust fallback: if none of the description selectors match or contain enough text,
  // find the child element with the longest visible text content that is not document.body.
  let longestText = '';
  const allDivs = root.querySelectorAll('div, section, article');
  for (const div of Array.from(allDivs)) {
    if (isVisibleElement(div)) {
      const text = div.textContent?.trim() || '';
      if (text.length > longestText.length && text.length >= 100 && div !== document.body && !div.id.includes('jobshield')) {
        if (text.length < (document.body.textContent?.length || 0) * 0.8) {
          longestText = text;
        }
      }
    }
  }
  return longestText;
}

// Site specific extraction adapters
const LinkedInAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      return (host.includes('linkedin.com') && url.pathname.toLowerCase().startsWith('/jobs/'));
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    let container: Element | null = null;
    
    // Robust layout detection: if a right-side job details column/pane exists, use it.
    // Otherwise, fall back to document.body (direct single-job view page).
    const candidateList = Array.from(new Set(document.querySelectorAll(
      '.jobs-search-two-pane__details, ' +
      '.jobs-search__job-details--container, ' +
      '.jobs-search-results-list__detail-single-pane, ' +
      '.jobs-details, ' +
      '[class*="jobs-search__job-details"], ' +
      '[class*="jobs-details"], ' +
      '[class*="detail-pane"], ' +
      '[class*="details-pane"], ' +
      '[class*="job-details"], ' +
      '#main [class*="detail"], ' +
      '#main [class*="pane"], ' +
      '#main [class*="content"], ' +
      '.jobs-search-two-pane__right-column, ' +
      '.two-pane-layout__right-column, ' +
      '[class*="two-pane"] [class*="right"]'
    )));

    let bestScore = 0;
    let bestCandidate: Element | null = null;

    for (const cand of candidateList) {
      if (cand === document.body) continue;
      const score = scoreLinkedInDetailCandidate(cand);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    if (bestCandidate && bestScore >= 50) {
      container = bestCandidate;
      if (lastDetectionState !== 'job') {
        lastDetectionState = 'job';
        console.log(`[JobShield] LinkedIn detailPane resolved: true (Score: ${bestScore})`);
      }
    } else {
      // Fallback to document.body (direct job view)
      container = document.body;
      if (lastDetectionState !== 'job') {
        lastDetectionState = 'job';
        console.log("[JobShield] LinkedIn direct view extraction mode (using document.body)");
      }
    }

    // Parse location from container
    const locationEl = container ? container.querySelector(
      '.job-details-jobs-unified-top-card__bullet, ' +
      '.jobs-unified-top-card__bullet, ' +
      '[class*="company-wrapper"] [class*="bullet"], ' +
      '[class*="bullet"], ' +
      '.jobs-details__main-content [class*="bullet"]'
    ) : null;

    // Construct canonical URL using currentJobId param
    let jobUrl = window.location.href;
    try {
      const url = new URL(window.location.href);
      const currentJobId = url.searchParams.get('currentJobId');
      if (currentJobId) {
        jobUrl = `https://www.linkedin.com/jobs/view/${currentJobId}`;
      } else {
        const directViewMatch = url.pathname.match(/\/jobs\/view\/(\d+)/);
        if (directViewMatch) {
          jobUrl = `https://www.linkedin.com/jobs/view/${directViewMatch[1]}`;
        }
      }
    } catch (e) {}

    if (!container) {
      return {
        title: '',
        company: '',
        location: '',
        description: '',
        url: jobUrl,
        source: 'LinkedIn'
      };
    }

    const title = extractLinkedInTitle(container);
    const company = extractLinkedInCompany(container);
    const description = extractLinkedInDescription(container);

    console.log(`[JobShield] LinkedIn job candidate detected (Container tag: ${container.tagName})`);
    console.log(`[JobShield] Job title extracted: "${title}"`);
    console.log(`[JobShield] Company extracted: "${company}"`);
    console.log(`[JobShield] Description extracted length: ${description.length} chars`);

    if (title && company && description.length >= 100) {
      console.log("[JobShield] Job extraction successful");
    }

    const result = {
      title,
      company,
      location: locationEl?.textContent?.trim() || '',
      description,
      url: jobUrl,
      source: 'LinkedIn'
    };

    return result;
  }
};

interface JSONLDJobPosting {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
}

function extractJSONLDJobPosting(): JSONLDJobPosting | null {
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      let text = script.textContent?.trim();
      if (!text) continue;
      
      // Strip CDATA and Javascript block/inline comments
      text = text.replace(/\/\*<!\[CDATA\[\*\//g, '');
      text = text.replace(/\/\*\]\]>\*\//g, '');
      text = text.replace(/<!\[CDATA\[/g, '');
      text = text.replace(/\]\]>/g, '');
      text = text.replace(/^\s*\/\/.*/gm, ''); // strip single-line comments

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        continue;
      }

      // Recursive/deep search helper to find any JobPosting node (handles nested graphs, namespaces like http://schema.org/JobPosting)
      const findJobPostingNode = (val: any): any => {
        if (!val || typeof val !== 'object') return null;
        
        const typeVal = val['@type'] || val['type'];
        if (typeof typeVal === 'string' && typeVal.includes('JobPosting')) {
          return val;
        }
        
        if (val['@graph'] && Array.isArray(val['@graph'])) {
          for (const item of val['@graph']) {
            const found = findJobPostingNode(item);
            if (found) return found;
          }
        }
        
        if (Array.isArray(val)) {
          for (const item of val) {
            const found = findJobPostingNode(item);
            if (found) return found;
          }
        }
        
        for (const key of Object.keys(val)) {
          if (typeof val[key] === 'object') {
            const found = findJobPostingNode(val[key]);
            if (found) return found;
          }
        }
        return null;
      };

      const obj = findJobPostingNode(data);
      if (obj) {
        const title = obj.title || '';
        let company = '';
        if (obj.hiringOrganization) {
          company = typeof obj.hiringOrganization === 'string' ? obj.hiringOrganization : (obj.hiringOrganization.name || '');
        }
        
        let location = '';
        if (obj.jobLocation) {
          if (typeof obj.jobLocation === 'string') {
            location = obj.jobLocation;
          } else if (obj.jobLocation.address) {
            const addr = obj.jobLocation.address;
            location = typeof addr === 'string' ? addr : ([addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', '));
          }
        }

        let description = obj.description || '';
        if (description && (description.includes('<') && description.includes('>'))) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = description;
          description = tempDiv.textContent || tempDiv.innerText || description;
        }

        return {
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          description: description.trim(),
          url: obj.url || ''
        };
      }
    }
  } catch (e) {
    console.error("[JobShield] JSON-LD extraction error:", e);
  }
  return null;
}

function extractNextDataJobPosting(): JSONLDJobPosting | null {
  try {
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      const text = nextScript.textContent?.trim();
      if (text) {
        const data = JSON.parse(text);
        let title = '';
        let company = '';
        let location = '';
        let description = '';
        
        const searchProps = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          
          if (obj.jobTitle && typeof obj.jobTitle === 'string') title = obj.jobTitle;
          else if (obj.title && typeof obj.title === 'string' && !title) {
            const low = obj.title.toLowerCase();
            if (low.length > 3 && !low.includes('glassdoor') && !low.includes('job details')) {
              title = obj.title;
            }
          }
          
          if (obj.companyName && typeof obj.companyName === 'string') company = obj.companyName;
          else if (obj.company && typeof obj.company === 'string' && !company) company = obj.company;
          else if (obj.employerName && typeof obj.employerName === 'string') company = obj.employerName;
          
          if (obj.locationName && typeof obj.locationName === 'string') location = obj.locationName;
          else if (obj.location && typeof obj.location === 'string') location = obj.location;
          
          if (obj.jobDescription && typeof obj.jobDescription === 'string') description = obj.jobDescription;
          else if (obj.description && typeof obj.description === 'string' && description.length < 100) description = obj.description;
          
          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object') {
              searchProps(obj[key]);
            }
          }
        };
        
        searchProps(data);
        
        if (title && (company || description)) {
          if (description && (description.includes('<') && description.includes('>'))) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = description;
            description = tempDiv.textContent || tempDiv.innerText || description;
          }
          return {
            title: title.trim(),
            company: company.replace(/\d+\.?\d*\s*★/, '').trim(),
            location: location.trim(),
            description: description.trim()
          };
        }
      }
    }
  } catch (e) {
    console.error("[JobShield] __NEXT_DATA__ parsing error:", e);
  }
  return null;
}

function findIndeedJobContainer(): Element {
  const selectors = [
    '#jobsearch-ViewJobLayout-innerContent',
    '.jobsearch-ViewJobLayout-innerContent',
    '.jobsearch-RightPane',
    '#vjs-container',
    '.jobsearch-JobComponent',
    'main',
    'article',
    '[class*="jobsearch-JobComponent"]',
    '[class*="ViewJobLayout"]',
    '[class*="RightPane"]',
    '#jobDescriptionText'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      if (isVisibleElement(el)) {
        const className = el.className || '';
        if (
          !className.includes('job-card') &&
          !className.includes('result') &&
          !className.includes('list-item') &&
          el !== document.body
        ) {
          if (selector === '#jobDescriptionText') {
            return el.closest('div, section, article') || el;
          }
          return el;
        }
      }
    }
  }

  // Fallback: search for any large visible container on the right half containing the description
  const allContainers = document.querySelectorAll('div, section, article');
  let bestCandidate: Element | null = null;
  let maxArea = 0;

  for (const container of Array.from(allContainers)) {
    if (isVisibleElement(container) && container !== document.body) {
      const rect = container.getBoundingClientRect();
      const isRightSide = rect.left > window.innerWidth / 3;
      const hasDescription = container.querySelector('#jobDescriptionText, [class*="jobDescription"], [class*="description"]');
      
      if (isRightSide && hasDescription) {
        const area = rect.width * rect.height;
        if (area > maxArea && rect.width > 200 && rect.height > 200) {
          maxArea = area;
          bestCandidate = container;
        }
      }
    }
  }

  return bestCandidate || document.body;
}

const IndeedAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      
      if (!host.includes('indeed.com')) {
        return false;
      }

      if (url.searchParams.has('jk') || url.searchParams.has('vjk')) {
        return true;
      }

      if (path.includes('/viewjob') || path.includes('/rc/clk')) {
        return true;
      }

      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === 'jobs') {
        const firstSub = pathParts[1];
        if (firstSub !== 'search' && firstSub !== 'browse' && firstSub !== 'collections') {
          return true;
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    const container = findIndeedJobContainer();
    
    let title = '';
    const titleSelectors = [
      'h1.jobsearch-JobInfoHeader-title',
      'h2.jobsearch-JobInfoHeader-title',
      '.jobsearch-JobInfoHeader-title',
      'h1[class*="JobInfoHeader"]',
      'h1[class*="title"]',
      'h2[class*="title"]',
      '[class*="jobsearch-JobInfoHeader"] h1',
      '[class*="jobsearch-JobInfoHeader"] h2',
      'h1',
      'h2'
    ];
    for (const s of titleSelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (
          text.length >= 3 &&
          !lower.includes('jobs for you') &&
          !lower.includes('job details') &&
          !lower.includes('job description') &&
          !lower.includes('indeed') &&
          !lower.includes('sign in')
        ) {
          title = text;
          break;
        }
      }
    }

    let company = '';
    const companySelectors = [
      'div.jobsearch-CompanyInfoContainer a',
      'div.jobsearch-InlineCompanyRating',
      '[class*="InlineCompanyRating"] a',
      '[class*="InlineCompanyRating"]',
      '[class*="CompanyInfoContainer"] a',
      '[class*="CompanyInfoContainer"]',
      'a[href*="/cmp/"]',
      'a[href*="/company/"]',
      '[class*="company"]',
      '[class*="employer"]'
    ];
    for (const s of companySelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (
          text.length >= 2 &&
          !lower.includes('indeed') &&
          !lower.includes('company') &&
          !lower.includes('employer')
        ) {
          company = text;
          break;
        }
      }
    }

    let location = '';
    const locationSelectors = [
      '.jobsearch-JobInfoHeader-subtitle div:last-child',
      '[class*="jobsearch-JobInfoHeader-subtitle"] > div',
      '[class*="JobInfoHeader-subtitle"]',
      '[class*="companyLocation"]',
      '[class*="location"]',
      '[class*="jobsearch-JobMetadataHeader"]'
    ];
    for (const s of locationSelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        if (text.length >= 2) {
          location = text;
          break;
        }
      }
    }

    let description = '';
    const descSelectors = [
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '[class*="jobDescriptionText"]',
      '[class*="description"]',
      '[class*="job-details"]'
    ];
    for (const s of descSelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        if (text.length >= 100) {
          description = text;
          break;
        }
      }
    }

    const hasValidDOM = title.length >= 3 && company.length >= 2 && description.length >= 100;
    if (!hasValidDOM) {
      const jsonld = extractJSONLDJobPosting();
      if (jsonld) {
        if (!title && jsonld.title) title = jsonld.title;
        if (!company && jsonld.company) company = jsonld.company;
        if (!location && jsonld.location) location = jsonld.location;
        if (!description && jsonld.description) description = jsonld.description;
      }
    }

    if (description.length < 100) {
      let longestText = '';
      const allDivs = container.querySelectorAll('div, section, article');
      for (const div of Array.from(allDivs)) {
        if (isVisibleElement(div)) {
          const text = div.textContent?.trim() || '';
          if (text.length > longestText.length && text.length >= 100 && div !== document.body && !div.id.includes('jobshield')) {
            if (text.length < (document.body.textContent?.length || 0) * 0.8) {
              longestText = text;
            }
          }
        }
      }
      description = longestText;
    }

    let jobUrl = window.location.href;
    try {
      const url = new URL(window.location.href);
      const jk = url.searchParams.get('jk') || url.searchParams.get('vjk');
      if (jk) {
        jobUrl = `https://www.indeed.com/viewjob?jk=${jk}`;
      }
    } catch (e) {}

    console.log(`[JobShield] Indeed adapter detected (Container tag: ${container.tagName})`);
    console.log(`[JobShield] Indeed job container found`);
    console.log(`[JobShield] Indeed title extracted: "${title}"`);
    console.log(`[JobShield] Indeed company extracted: "${company}"`);
    console.log(`[JobShield] Indeed description length: ${description.length}`);

    if (title && company && description.length >= 100) {
      console.log("[JobShield] Indeed job extraction successful");
    } else {
      let failFields = [];
      if (title.length < 3) failFields.push('title');
      if (company.length < 2) failFields.push('company');
      if (description.length < 100) failFields.push('description');
      console.log(`[JobShield] Indeed extraction failed (failed fields: ${failFields.join(', ')})`);
    }

    return {
      title,
      company,
      location,
      salary: '',
      description,
      requirements: '',
      recruiter: '',
      url: jobUrl,
      source: 'Indeed'
    };
  }
};

function findNaukriJobContainer(): Element {
  const selectors = [
    '.jd-container',
    '#jd-container',
    '.main-container',
    'main',
    'article',
    '[class*="jd-header"]',
    '[class*="job-desc"]',
    '.job-desc',
    '.jd-desc'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      if (isVisibleElement(el)) {
        const className = el.className || '';
        if (
          !className.includes('job-card') &&
          !className.includes('result') &&
          !className.includes('list-item') &&
          el !== document.body
        ) {
          if (selector === '.job-desc' || selector === '.jd-desc') {
            return el.closest('div, section, article') || el;
          }
          return el;
        }
      }
    }
  }
  return document.body;
}

const NaukriAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      return host.includes('naukri.com') && (
        path.includes('/job-listings') || 
        path.includes('/description') ||
        path.includes('-jd-') ||
        path.includes('/jobs-')
      );
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    const container = findNaukriJobContainer();
    
    let title = '';
    const titleSelectors = [
      '.jd-header-title',
      'h1.job-title',
      'h1.jd-title',
      '[class*="jd-header-title"]',
      '[class*="job-title"]',
      'h1',
      'h2'
    ];
    for (const s of titleSelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (
          text.length >= 3 &&
          !lower.includes('settings') &&
          !lower.includes('notifications') &&
          !lower.includes('feedback') &&
          !lower.includes('jobshield')
        ) {
          title = text;
          break;
        }
      }
    }

    let company = '';
    const companySelectors = [
      '.jd-header-comp-name a',
      '.jd-header-comp-name',
      '.company-name a',
      '.company-name',
      'a.pad-rt-0',
      '[class*="comp-name"]',
      '[class*="companyName"]',
      '[class*="company-name"]',
      '[class*="company"] a',
      '[class*="company"]'
    ];
    for (const s of companySelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (
          text.length >= 2 &&
          !lower.includes('indeed') &&
          !lower.includes('linkedin') &&
          !lower.includes('company') &&
          !lower.includes('employer')
        ) {
          company = text;
          break;
        }
      }
    }

    let location = '';
    const locationSelectors = [
      '.location a',
      '.location',
      '.loc span',
      '.loc',
      '[class*="location"]',
      '[class*="loc-wrapper"]'
    ];
    for (const s of locationSelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        if (text.length >= 2) {
          location = text;
          break;
        }
      }
    }

    let description = '';
    const descSelectors = [
      '.job-desc',
      '.jd-desc',
      '[class*="job-desc"]',
      '[class*="jobDescription"]',
      '[class*="description"]',
      'article',
      'main'
    ];
    for (const s of descSelectors) {
      const el = container.querySelector(s);
      if (el && isVisibleElement(el)) {
        const text = el.textContent?.trim() || '';
        if (text.length >= 100) {
          description = text;
          break;
        }
      }
    }

    const hasValidDOM = title.length >= 3 && company.length >= 2 && description.length >= 100;
    if (!hasValidDOM) {
      const jsonld = extractJSONLDJobPosting();
      if (jsonld) {
        if (!title && jsonld.title) title = jsonld.title;
        if (!company && jsonld.company) company = jsonld.company;
        if (!location && jsonld.location) location = jsonld.location;
        if (!description && jsonld.description) description = jsonld.description;
      }
    }

    if (description.length < 100) {
      let longestText = '';
      const allDivs = container.querySelectorAll('div, section, article');
      for (const div of Array.from(allDivs)) {
        if (isVisibleElement(div)) {
          const text = div.textContent?.trim() || '';
          if (text.length > longestText.length && text.length >= 100 && div !== document.body && !div.id.includes('jobshield')) {
            if (text.length < (document.body.textContent?.length || 0) * 0.8) {
              longestText = text;
            }
          }
        }
      }
      description = longestText;
    }

    console.log(`[JobShield] Naukri adapter detected (Container tag: ${container.tagName})`);
    console.log(`[JobShield] Naukri job container found`);
    console.log(`[JobShield] Naukri title extracted: "${title}"`);
    console.log(`[JobShield] Naukri company extracted: "${company}"`);
    console.log(`[JobShield] Naukri description length: ${description.length}`);

    if (title && company && description.length >= 100) {
      console.log("[JobShield] Naukri job extraction successful");
    } else {
      let failFields = [];
      if (title.length < 3) failFields.push('title');
      if (company.length < 2) failFields.push('company');
      if (description.length < 100) failFields.push('description');
      console.log(`[JobShield] Naukri extraction failed (failed fields: ${failFields.join(', ')})`);
    }

    return {
      title,
      company,
      location,
      salary: '',
      description,
      requirements: '',
      recruiter: '',
      url: window.location.href,
      source: 'Naukri'
    };
  }
};

const InternshalaAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      return host.includes('internshala.com') && (path.includes('/internship/detail/') || path.includes('/job/detail/'));
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    const titleEl = document.querySelector('.heading_title_container h1, .profile');
    const companyEl = document.querySelector('.heading_title_container a.company_name, .company_name');
    const locationEl = document.querySelector('#location_names, .location');
    const descEl = document.querySelector('.internship_details, .job_details');

    return {
      title: titleEl?.textContent?.trim() || '',
      company: companyEl?.textContent?.trim() || '',
      location: locationEl?.textContent?.trim() || '',
      description: descEl?.textContent?.trim() || '',
      source: 'Internshala'
    };
  }
};

function findGlassdoorJobContainer(): Element {
  const selectors = [
    '[class*="JobDetails_jobDetailsContainer"]',
    '[class*="JobDetails_jobDetails"]',
    '[class*="jobDetailsContainer"]',
    '[class*="JobDetailsContainer"]',
    '[class*="jobDetails"]',
    '[class*="JobDetails"]',
    '#JobDescriptionContainer',
    '.job-details',
    'main',
    'article'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of Array.from(elements)) {
      if (isVisibleElement(el)) {
        const className = el.className || '';
        if (
          !className.includes('job-card') &&
          !className.includes('result') &&
          !className.includes('list-item') &&
          el !== document.body
        ) {
          if (selector === '#JobDescriptionContainer') {
            return el.closest('div, section, article') || el;
          }
          return el;
        }
      }
    }
  }

  const allContainers = document.querySelectorAll('div, section, article');
  let bestCandidate: Element | null = null;
  let maxArea = 0;

  for (const container of Array.from(allContainers)) {
    if (isVisibleElement(container) && container !== document.body) {
      const rect = container.getBoundingClientRect();
      const isRightSide = rect.left > window.innerWidth / 3;
      const hasDescription = container.querySelector('#JobDescriptionContainer, [class*="jobDescription"], [class*="JobDescription"], [class*="description"]');
      
      if (isRightSide && hasDescription) {
        const area = rect.width * rect.height;
        if (area > maxArea && rect.width > 200 && rect.height > 200) {
          maxArea = area;
          bestCandidate = container;
        }
      }
    }
  }

  return bestCandidate || document.body;
}

const GlassdoorAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      
      const isHost = host.includes('glassdoor.');
      console.log(`[JobShield][Glassdoor] Host detected: ${host} (Result: ${isHost})`);
      
      const isUrlMatch = path.includes('/job/') || 
                         path.includes('/job-listing') ||
                         path.includes('/job-listing/') ||
                         url.searchParams.has('jl');
      console.log(`[JobShield][Glassdoor] URL detected: ${path} (Result: ${isUrlMatch})`);
      
      const isGlassdoor = isHost && isUrlMatch;
      console.log("[JobShield] Glassdoor detected:", isGlassdoor);
      return isGlassdoor;
    } catch (e) {
      console.error("[JobShield][Glassdoor] Detect error:", e);
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    let title = '';
    let company = '';
    let location = '';
    let salary = '';
    let description = '';
    
    // 1. Try JSON-LD recursive parser first (Primary source)
    const jsonld = extractJSONLDJobPosting();
    if (jsonld) {
      if (jsonld.title) title = jsonld.title;
      if (jsonld.company) company = jsonld.company;
      if (jsonld.location) location = jsonld.location;
      if (jsonld.description) description = jsonld.description;
    }

    // 2. Try __NEXT_DATA__ second (Secondary source)
    const hasValidJSONLD = title.length >= 3 && company.length >= 2 && description.length >= 100;
    if (!hasValidJSONLD) {
      const nextData = extractNextDataJobPosting();
      if (nextData) {
        if (!title && nextData.title) title = nextData.title;
        if (!company && nextData.company) company = nextData.company;
        if (!location && nextData.location) location = nextData.location;
        if (!description && nextData.description) description = nextData.description;
      }
    }

    // 3. Resilient DOM extraction (Final fallback)
    const hasValidJSON = title.length >= 3 && company.length >= 2 && description.length >= 100;
    const container = findGlassdoorJobContainer();
    console.log(`[JobShield][Glassdoor] Job container found: ${container ? container.tagName + '.' + container.className : 'null'}`);
    
    if (!hasValidJSON) {
      // DOM extraction for Title
      if (!title) {
        const titleSelectors = [
          '[class*="JobDetails_jobTitle"]',
          '[class*="jobTitle"]',
          '[class*="JobTitle"]',
          '[class*="JobHeader_jobTitle"]',
          'h1',
          'h2',
          '[class*="title"]'
        ];
        for (const s of titleSelectors) {
          const el = container.querySelector(s);
          if (el && isVisibleElement(el)) {
            const text = el.textContent?.trim() || '';
            const lower = text.toLowerCase();
            if (
              text.length >= 3 &&
              !lower.includes('settings') &&
              !lower.includes('notifications') &&
              !lower.includes('feedback') &&
              !lower.includes('jobshield')
            ) {
              title = text;
              break;
            }
          }
        }
      }
      console.log(`[JobShield][Glassdoor] Title: ${title || 'FAILED'}`);

      // DOM extraction for Company
      if (!company) {
        const companySelectors = [
          '[class*="JobDetails_companyName"]',
          '[class*="employerName"]',
          '[class*="JobHeader_companyName"]',
          '[class*="companyName"]',
          '[class*="CompanyName"]',
          '[class*="employer"]',
          '[class*="company"]'
        ];
        for (const s of companySelectors) {
          const el = container.querySelector(s);
          if (el && isVisibleElement(el)) {
            const text = el.textContent?.replace(/\d+\.?\d*\s*★/, '')?.trim() || ''; // Strip ratings like "4.2 ★"
            const lower = text.toLowerCase();
            if (
              text.length >= 2 &&
              !lower.includes('indeed') &&
              !lower.includes('linkedin') &&
              !lower.includes('company') &&
              !lower.includes('employer')
            ) {
              company = text;
              break;
            }
          }
        }
      }
      console.log(`[JobShield][Glassdoor] Company: ${company || 'FAILED'}`);

      // DOM extraction for Location
      if (!location) {
        const locationSelectors = [
          '[class*="JobDetails_location"]',
          '[class*="location"]',
          '[class*="JobHeader_location"]',
          '[class*="Location"]'
        ];
        for (const s of locationSelectors) {
          const el = container.querySelector(s);
          if (el && isVisibleElement(el)) {
            const text = el.textContent?.trim() || '';
            if (text.length >= 2) {
              location = text;
              break;
            }
          }
        }
      }
      console.log(`[JobShield][Glassdoor] Location: ${location || 'FAILED'}`);

      // DOM extraction for Description
      if (description.length < 100) {
        const descSelectors = [
          '[class*="JobDetails_jobDescription"]',
          '#JobDescriptionContainer',
          '[class*="jobDescription"]',
          '[class*="JobDescription"]',
          '[class*="description"]',
          'article',
          'main'
        ];
        for (const s of descSelectors) {
          const el = container.querySelector(s);
          if (el && isVisibleElement(el)) {
            const text = el.textContent?.trim() || '';
            if (text.length >= 100) {
              description = text;
              break;
            }
          }
        }
      }

      // Longest descriptive block last-resort fallback:
      // Only use it if container is a scoped job-detail container (not document.body) to prevent false positives.
      if (description.length < 100 && container !== document.body) {
        let longestText = '';
        const allDivs = container.querySelectorAll('div, section, article');
        for (const div of Array.from(allDivs)) {
          if (isVisibleElement(div)) {
            const text = div.textContent?.trim() || '';
            if (text.length > longestText.length && text.length >= 100 && div !== document.body && !div.id.includes('jobshield')) {
              if (text.length < (document.body.textContent?.length || 0) * 0.8) {
                longestText = text;
              }
            }
          }
        }
        description = longestText;
      }
    }

    // Always attempt to get Salary from DOM if not present
    if (!salary) {
      const salarySelectors = [
        '[class*="JobDetails_salary"]',
        '[class*="salary"]',
        '[class*="Salary"]',
        '[class*="payPeriod"]',
        '[class*="compensation"]'
      ];
      for (const s of salarySelectors) {
        const el = container.querySelector(s);
        if (el && isVisibleElement(el)) {
          const text = el.textContent?.trim() || '';
          if (text.length >= 2) {
            salary = text;
            break;
          }
        }
      }
    }

    let jsonldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    console.log(`[JobShield][Glassdoor] JSON-LD script tags count: ${jsonldScripts.length}`);
    console.log(`[JobShield][Glassdoor] JSON-LD JobPosting parsing result: ${jsonld ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`[JobShield][Glassdoor] Description length: ${description.length}`);

    let jobUrl = window.location.href;
    try {
      const url = new URL(window.location.href);
      const jl = url.searchParams.get('jl');
      if (jl) {
        jobUrl = `${url.origin}${url.pathname}?jl=${jl}`;
      }
    } catch (e) {}

    const result = {
      title: title.trim(),
      company: company.replace(/\d+\.?\d*\s*★/, '').trim(),
      location: location.trim(),
      salary,
      description: description.trim(),
      requirements: '',
      recruiter: '',
      url: jobUrl,
      source: 'Glassdoor'
    };

    console.log(`[JobShield][Glassdoor] Extraction result: ${JSON.stringify({ title: result.title, company: result.company, location: result.location, descLength: result.description.length })}`);
    const isValid = result.title.length >= 3 && result.company.length >= 2 && result.description.length >= 100;
    console.log(`[JobShield][Glassdoor] Validation result: ${isValid ? 'PASS' : 'FAIL'}`);

    if (isValid) {
      console.log("[JobShield] Glassdoor job extraction successful");
    } else {
      let failFields = [];
      if (result.title.length < 3) failFields.push('title');
      if (result.company.length < 2) failFields.push('company');
      if (result.description.length < 100) failFields.push('description');
      console.log(`[JobShield] Glassdoor extraction failed (failed fields: ${failFields.join(', ')})`);
    }

    return result;
  }
};

const FounditAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      return (host.includes('foundit.in') || host.includes('foundit.my') || host.includes('foundit.sg') || host.includes('monstergulf.com')) &&
             (path.includes('/job/') || path.includes('/jobs/') || path.includes('-jd'));
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    const titleEl = document.querySelector('.jobTitle, .title, h1');
    const companyEl = document.querySelector('.companyName, .company, [class*="company"]');
    const descEl = document.querySelector('.jobDescription, .description, [class*="description"]');

    return {
      title: titleEl?.textContent?.trim() || '',
      company: companyEl?.textContent?.trim() || '',
      location: '',
      description: descEl?.textContent?.trim() || '',
      source: 'Foundit'
    };
  }
};

const GoogleJobsAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      return host === 'jobs.google.com' || (host.includes('google.com') && path.startsWith('/search') && url.search.includes('ibp=ht'));
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    const titleEl = document.querySelector('[role="main"] h1, h1, [class*="title"]');
    const companyEl = document.querySelector('[class*="company"], [class*="employer"]');
    const descEl = document.querySelector('[class*="description"], [class*="detail"]');

    return {
      title: titleEl?.textContent?.trim() || '',
      company: companyEl?.textContent?.trim() || '',
      location: '',
      description: descEl?.textContent?.trim() || '',
      source: 'Google Jobs'
    };
  }
};

const GenericAdapter = {
  detect: (urlString: string) => {
    try {
      const url = new URL(urlString);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      
      const exclusions = [
        'localhost',
        '127.0.0.1',
        'github.com',
        'youtube.com',
        'gmail.com',
        'google.com/mail',
        'google.com/search'
      ];
      if (exclusions.some(ex => host.includes(ex) || path.includes(ex))) {
        return false;
      }

      const careerPatterns = [
        '/careers/',
        '/jobs/',
        '/careers-at-',
        '/careers.',
        'career.',
        'careers-list',
        '/job-detail/'
      ];
      return careerPatterns.some(p => path.includes(p) || host.startsWith('career.') || host.startsWith('careers.'));
    } catch (e) {
      return false;
    }
  },
  extract: (): Partial<JobData> => {
    const titleEl = document.querySelector('h1, [class*="title"], [id*="title"]');
    const companyEl = document.querySelector('[class*="company"], [id*="company"], [class*="employer"]');
    const descEl = document.querySelector('[class*="description"], [id*="description"], article, main');

    return {
      title: titleEl?.textContent?.trim() || document.title,
      company: companyEl?.textContent?.trim() || '',
      location: '',
      description: descEl?.textContent?.trim() || document.body?.innerText?.slice(0, 1000) || '',
      source: 'Web Page'
    };
  }
};

const ADAPTERS = [
  LinkedInAdapter,
  IndeedAdapter,
  NaukriAdapter,
  InternshalaAdapter,
  GlassdoorAdapter,
  FounditAdapter,
  GoogleJobsAdapter,
  GenericAdapter
];

function getActiveAdapter(): any {
  const url = window.location.href;
  try {
    const matched = ADAPTERS.find(a => {
      if (a === GenericAdapter) return false;
      return a.detect(url);
    });
    if (matched) return matched;
    
    if (GenericAdapter.detect(url)) {
      return GenericAdapter;
    }
  } catch (e) {
    // Ignore URL errors
  }
  return null;
}

function extractJobData(adapter: any): Partial<JobData> | null {
  try {
    const data = adapter.extract();
    const title = data.title?.trim() || '';
    const company = data.company?.trim() || '';
    const description = data.description?.trim() || '';

    const validated = (title.length >= 3 && company.length >= 2 && description.length >= 100);


    if (!validated) {
      return null;
    }

    return {
      title,
      company,
      location: data.location?.trim() || '',
      salary: '',
      description,
      requirements: '',
      recruiter: '',
      url: data.url || window.location.href,
      source: data.source || 'Web Page'
    };
  } catch (e) {
    console.error("[JobShield] extractJobData crash error:", e);
    return null;
  }
}

// Global scan state & session race protection
let activeScanId = '';
let lastUrl = '';
let lastJobKey = '';
let checkTimeout: any = null;
let retryCount = 0;
const MAX_RETRIES = 6; // Polling dynamic DOM details up to 3 seconds

let detailObserver: MutationObserver | null = null;
let isTerminated = false;
let lastDetectionState: 'none' | 'job' = 'none';

function isExtensionContextValid(): boolean {
  if (isTerminated) return false;
  try {
    return Boolean(
      chrome &&
      chrome.runtime &&
      chrome.runtime.id &&
      chrome.runtime.getManifest()
    );
  } catch {
    return false;
  }
}

function terminateContentScript() {
  if (isTerminated) return;
  isTerminated = true;
  console.log("[JobShield] Extension context invalidated. Terminating content script.");
  try {
    removeBadge();
  } catch (e) {}
  try {
    if (detailObserver) {
      detailObserver.disconnect();
    }
  } catch (e) {}
  try {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }
  } catch (e) {}
  activeScanId = '';
  lastJobKey = '';
}

// Safe Chrome API wrapper
function safeChromeCall(fn: () => void) {
  if (!isExtensionContextValid()) {
    terminateContentScript();
    return;
  }
  try {
    fn();
  } catch (e) {
    terminateContentScript();
  }
}

// In-Page Badge overlay
function injectBadge(riskScore?: number | null, riskLevel?: string, isOffline?: boolean, isAnalyzing?: boolean) {
  if (!document.body) return;

  const existing = document.getElementById('jobshield-inpage-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'jobshield-inpage-badge';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    background: #0A0F1D;
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #F8FAFC;
    font-size: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  badge.onmouseenter = () => {
    badge.style.borderColor = '#38BDF8';
    badge.style.transform = 'translateY(-1px)';
  };
  badge.onmouseleave = () => {
    badge.style.borderColor = 'rgba(56, 189, 248, 0.25)';
    badge.style.transform = 'translateY(0)';
  };

  if (isAnalyzing) {
    badge.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 50 50" style="animation: js-spin 1s linear infinite; width: 14px; height: 14px;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(56, 189, 248, 0.2)" stroke-width="5"></circle>
        <circle cx="25" cy="25" r="20" fill="none" stroke="#38BDF8" stroke-width="5" stroke-dasharray="80" stroke-dashoffset="60"></circle>
      </svg>
      <style>
        @keyframes js-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <span style="font-weight: 700; color: #94A3B8;">JobShield:</span>
      <span style="font-weight: 800; color: #38BDF8;">Analyzing...</span>
    `;
  } else if (isOffline) {
    badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    badge.innerHTML = `
      <span style="font-size: 14px;">⚠</span>
      <span style="font-weight: 700; color: #94A3B8;">JobShield:</span>
      <span style="font-weight: 800; color: #F59E0B;">Limited Analysis</span>
    `;
  } else if (riskScore !== undefined && riskScore !== null) {
    const isHigh = riskLevel === 'HIGH';
    const isMedium = riskLevel === 'MEDIUM';
    const color = isHigh ? '#EF4444' : (isMedium ? '#F59E0B' : '#10B981');
    const label = isHigh ? 'High Risk' : (isMedium ? 'Medium Risk' : 'Low Risk');
    badge.style.borderColor = isHigh ? 'rgba(239, 68, 68, 0.3)' : (isMedium ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)');

    badge.innerHTML = `
      <span style="font-size: 14px;">🛡️</span>
      <span style="font-weight: 700; color: #94A3B8;">JobShield:</span>
      <span style="font-weight: 800; color: ${color}">
        ${label} · ${riskScore}/100
      </span>
    `;
  } else {
    badge.innerHTML = `
      <span style="font-size: 14px;">🛡️</span>
      <span style="font-weight: 700; color: #94A3B8;">JobShield:</span>
      <span style="font-weight: 800; color: #38BDF8;">Not analyzed</span>
    `;
  }

  badge.onclick = () => {
    alert('Please click the JobShield browser extension icon in your toolbar to scan or view details.');
  };

  document.body.appendChild(badge);
}

function removeBadge() {
  try {
    const existing = document.getElementById('jobshield-inpage-badge');
    if (existing) existing.remove();
  } catch (e) {
    // Ignore errors
  }
}

// Message dispatcher wrapper with safe context boundaries
try {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (!isExtensionContextValid()) {
      terminateContentScript();
      sendResponse({ success: false, error: 'Extension context invalidated' });
      return false;
    }

    try {
      if (request.action === 'GET_JOB_DATA') {
        const adapter = getActiveAdapter();
        if (!adapter) {
          sendResponse({ success: false, error: 'Not on a job page' });
          return false;
        }
        const data = extractJobData(adapter);
        if (!data) {
          sendResponse({ success: false, error: 'Job details not rendered' });
          return false;
        }
        sendResponse({ success: true, data });
        return false;
      }

      if (request.action === 'INJECT_BADGE') {
        // Validate that badge updates correspond to the active job
        const adapter = getActiveAdapter();
        const jobData = adapter ? extractJobData(adapter) : null;
        const currentKey = jobData ? getCacheKey(jobData) : '';
        if (request.jobKey && request.jobKey !== currentKey) {
          sendResponse({ success: false, error: 'Stale job key' });
          return false;
        }

        if (request.isAnalyzing) {
          injectBadge(undefined, undefined, false, true);
        } else {
          injectBadge(request.score, request.level, request.isOffline, false);
        }
        sendResponse({ success: true });
        return false;
      }

      sendResponse({ success: false, error: 'Unknown action in content script' });
      return false;
    } catch (err) {
      console.error("[JobShield] Error in content script message handler:", err);
      sendResponse({ success: false, error: String(err) });
      return false;
    }
  });
} catch (e) {
  // Silent termination of older content scripts on reloads
  removeBadge();
}

// Authentication synchronizer
let lastAuthStr = '';

function checkAndSyncAuth() {
  safeChromeCall(() => {
    if (window.location.origin === 'http://localhost:3000') {
      const loggedInUser = localStorage.getItem('js_logged_in_user') || '';
      if (loggedInUser !== lastAuthStr) {
        lastAuthStr = loggedInUser;
        try {
          if (loggedInUser) {
            chrome.runtime.sendMessage({
              action: 'SYNC_AUTH',
              payload: JSON.parse(loggedInUser)
            }, () => {
              if (chrome.runtime.lastError) {
                // Silently ignore context invalidation errors
              }
            });
          } else {
            chrome.runtime.sendMessage({
              action: 'SIGN_OUT'
            }, () => {
              if (chrome.runtime.lastError) {
                // Silently ignore context invalidation errors
              }
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }
  });
}

// Cache key utilities
function normalizeText(str: string): string {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    // Remove unnecessary tracking parameters
    const params = new URLSearchParams(url.search);
    const keysToDelete: string[] = [];
    params.forEach((_, key) => {
      const k = key.toLowerCase();
      if (k.startsWith('utm_') || k === 'fbclid' || k === 'gclid' || k === 'src' || k === 'ref') {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => params.delete(key));

    // Reconstruct URL path without trailing slash
    let pathname = url.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    const searchStr = params.toString();
    return `${url.protocol}//${hostname}${pathname}${searchStr ? '?' + searchStr : ''}`;
  } catch (e) {
    return urlString.toLowerCase().trim();
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

function getCacheKey(payload: { title?: string; company?: string; description?: string; url?: string }): string {
  const t = normalizeText(payload.title || '');
  const c = normalizeText(payload.company || '');
  const d = normalizeText(payload.description || '');
  const u = normalizeUrl(payload.url || '');
  return hashString(`${t}|${c}|${d}|${u}`);
}

let observerTarget: Element | null = null;

function setupLinkedInObserver() {
  const isLinkedIn = window.location.href.includes('linkedin.com');
  if (!isLinkedIn) {
    if (detailObserver) {
      detailObserver.disconnect();
      detailObserver = null;
      observerTarget = null;
    }
    return;
  }

  // Locate candidate detail pane container or fall back to main content section
  let target: Element | null = null;
  const isSearchResults = window.location.href.includes('/jobs/search-results') || window.location.href.includes('/jobs/search');

  if (isSearchResults) {
    const candidates = Array.from(document.querySelectorAll(
      '.jobs-search-two-pane__details, ' +
      '.jobs-search__job-details--container, ' +
      '.jobs-search-results-list__detail-single-pane, ' +
      '.jobs-details, ' +
      '[class*="jobs-search__job-details"], ' +
      '[class*="jobs-details"]'
    ));

    let bestScore = 0;
    let bestCandidate: Element | null = null;

    for (const cand of candidates) {
      const score = scoreLinkedInDetailCandidate(cand);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }
    target = bestCandidate;
  }

  if (!target) {
    target = document.getElementById('main') || document.body;
  }

  if (target === observerTarget) return; // Already watching this element

  if (detailObserver) {
    detailObserver.disconnect();
  }

  observerTarget = target;
  detailObserver = new MutationObserver((mutations) => {
    if (!isExtensionContextValid()) {
      terminateContentScript();
      return;
    }
    // Ignore mutations caused by our own inpage badge injection to avoid infinite loops
    const hasSelfMutation = mutations.some(m => {
      const targetNode = m.target as HTMLElement;
      if (
        targetNode.id === 'jobshield-inpage-badge' || 
        targetNode.closest?.('#jobshield-inpage-badge') ||
        (m.addedNodes && Array.from(m.addedNodes).some(node => (node as HTMLElement).id === 'jobshield-inpage-badge' || (node as HTMLElement).querySelector?.('#jobshield-inpage-badge'))) ||
        (m.removedNodes && Array.from(m.removedNodes).some(node => (node as HTMLElement).id === 'jobshield-inpage-badge' || (node as HTMLElement).querySelector?.('#jobshield-inpage-badge')))
      ) {
        return true;
      }
      return false;
    });

    if (hasSelfMutation) return;

    if (checkTimeout) clearTimeout(checkTimeout);
    checkTimeout = setTimeout(() => {
      handlePageChange(false);
      setupLinkedInObserver(); // Update targets if elements shifted in SPA routing
    }, 400);
  });

  detailObserver.observe(target, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Page change transition handler
function handlePageChange(resetRetry = true) {
  console.log("[JobShield] handlePageChange() executed, URL:", window.location.href);
  if (resetRetry) {
    retryCount = 0;
  }

  const adapter = getActiveAdapter();
  if (!adapter) {
    removeBadge();
    lastJobKey = '';
    return;
  }

  const jobData = extractJobData(adapter);
  if (jobData) {
    const jobKey = getCacheKey(jobData);
    if (jobKey === lastJobKey) {
      return;
    }

    if (lastJobKey) {
      console.log("[JobShield] Job changed");
    }
    console.log(`[JobShield] Job detected: ${jobData.title} / ${jobData.company}`);

    lastJobKey = jobKey;
    activeScanId = Math.random().toString(36).substring(2);

    // Inject standard Not Analyzed state
    injectBadge();

    const currentScanId = activeScanId;
    safeChromeCall(() => {
      chrome.runtime.sendMessage({ action: 'CHECK_CACHE', payload: jobData }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("[JobShield] CHECK_CACHE content script error:", chrome.runtime.lastError.message);
          return;
        }
        try {
          if (currentScanId !== activeScanId) return; // Stale session, ignore
          if (response && response.success && response.exists && response.data) {
            const cached = response.data;
            injectBadge(cached.score, cached.level, cached.isOffline, false);
          }
        } catch (e) {
          removeBadge();
        }
      });
    });
  } else {
    // Retry polling if URL matches and contains a selected job ID, but DOM components are not loaded yet
    const url = new URL(window.location.href);
    const isLinkedInJob = url.searchParams.get('currentJobId') || url.pathname.includes('/jobs/view/');
    const isIndeedJob = url.hostname.includes('indeed.com') && (url.searchParams.has('jk') || url.searchParams.has('vjk') || url.pathname.includes('/viewjob'));
    const isNaukriJob = url.hostname.includes('naukri.com') && (url.pathname.includes('/job-listings') || url.pathname.includes('/description') || url.pathname.includes('-jd-') || url.pathname.includes('/jobs-'));
    const isGlassdoorJob = url.hostname.includes('glassdoor.') && (url.pathname.includes('/job') || url.pathname.includes('/job-listing') || url.searchParams.has('jl'));
    
    const shouldRetry = isLinkedInJob || isIndeedJob || isNaukriJob || isGlassdoorJob;
    if (shouldRetry && retryCount < MAX_RETRIES) {
      retryCount++;
      if (checkTimeout) clearTimeout(checkTimeout);
      checkTimeout = setTimeout(() => handlePageChange(false), 500);
    } else {
      removeBadge();
      lastJobKey = '';
    }
  }

  // Hook up observer target to the detail panel
  setupLinkedInObserver();
}

// Initial navigation hookup & SPA URL change observers
let isInitialized = false;

function init() {
  if (isInitialized) return;
  
  safeChromeCall(() => {
    if (!isExtensionContextValid()) {
      terminateContentScript();
      return;
    }
    isInitialized = true;
    
    // Align lastUrl to prevent duplicate scan on first interval tick
    lastUrl = window.location.href;
    
    handlePageChange(true);
    checkAndSyncAuth();

    window.addEventListener('popstate', () => {
      if (!isExtensionContextValid()) {
        terminateContentScript();
        return;
      }
      handlePageChange(true);
    });
    
    window.addEventListener('hashchange', () => {
      if (!isExtensionContextValid()) {
        terminateContentScript();
        return;
      }
      handlePageChange(true);
    });

    // Polling observation for SPA URL changes and auth synchronizations
    setInterval(() => {
      if (!isExtensionContextValid()) {
        terminateContentScript();
        return;
      }
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        handlePageChange(true);
      }
      checkAndSyncAuth();
    }, 1000);
  });
}

// Initialize only after the page has fully loaded to prevent React hydration mismatches
if (document.readyState === 'complete') {
  setTimeout(init, 500);
} else {
  window.addEventListener('load', () => {
    setTimeout(init, 500);
  });
}
