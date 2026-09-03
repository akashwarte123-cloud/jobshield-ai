/**
 * JobShield AI Browser Extension — Popup Component
 */
console.log("[JobShield] Popup script initialized");


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

// Elements state
let currentJob: JobData | null = null;
let scanResult: any = null;
let currentMode: 'main' | 'settings' = 'main';
let authUser: any = null;
let isScanning = false;
let scanningStep = 0;
let showSupportedSites = false;
let cachedData: any = null;
let showCacheScreen = false;
let scanError: string | null = null;

const scanSteps = [
  'Extracting job details...',
  'Processing description...',
  'Checking scam indicators...',
  'Running risk analysis...'
];

// Cache key normalization utilities matched from background.ts
function normalizeText(str: string): string {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    const params = new URLSearchParams(url.search);
    const keysToDelete: string[] = [];
    params.forEach((_, key) => {
      const k = key.toLowerCase();
      if (k.startsWith('utm_') || k === 'fbclid' || k === 'gclid' || k === 'src' || k === 'ref') {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => params.delete(key));

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

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await detectActiveTabJob();
  await checkCacheForJob();
  render();
});

async function checkAuth() {
  return new Promise<void>((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' }, (response) => {
        if (!chrome.runtime.lastError && response && response.success && response.user) {
          authUser = response.user;
          resolve();
          return;
        }

        // Active tab sync fallback: query open web app tabs directly
        try {
          chrome.tabs.query({}, (tabs) => {
            const webTab = (tabs || []).find(t => t.url && (t.url.includes('jobshield-ai-web.vercel.app') || t.url.includes('localhost:3000')));
            if (webTab && webTab.id) {
              chrome.scripting.executeScript({
                target: { tabId: webTab.id },
                func: () => localStorage.getItem('js_logged_in_user')
              }, (results) => {
                if (!chrome.runtime.lastError && results && results[0] && results[0].result) {
                  try {
                    const parsed = JSON.parse(results[0].result as string);
                    if (parsed && (parsed.user || parsed.token)) {
                      authUser = parsed.user || parsed;
                      chrome.runtime.sendMessage({ action: 'SYNC_AUTH', payload: parsed });
                    }
                  } catch (e) {}
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        } catch (e) {
          resolve();
        }
      });
    } catch (e) {
      resolve();
    }
  });
}

async function detectActiveTabJob() {
  return new Promise<void>((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        try {
          const activeTab = tabs[0];
          if (!activeTab || !activeTab.id) {
            resolve();
            return;
          }
          const tabId = activeTab.id;

          chrome.tabs.sendMessage(tabId, { action: 'GET_JOB_DATA' }, (response) => {
            if (chrome.runtime.lastError) {
              // Try auto-injecting content.js
              try {
                chrome.scripting.executeScript({
                  target: { tabId },
                  files: ['content.js']
                }, () => {
                  if (!chrome.runtime.lastError) {
                    setTimeout(() => {
                      chrome.tabs.sendMessage(tabId, { action: 'GET_JOB_DATA' }, (res2) => {
                        if (!chrome.runtime.lastError && res2 && res2.success && res2.data && res2.data.description) {
                          currentJob = res2.data;
                        }
                        resolve();
                      });
                    }, 300);
                  } else {
                    resolve();
                  }
                });
              } catch (e) {
                resolve();
              }
              return;
            }
            try {
              if (response && response.success && response.data && response.data.description) {
                currentJob = response.data;
              }
            } catch (e) {}
            resolve();
          });
        } catch (e) {
          resolve();
        }
      });
    } catch (e) {
      resolve();
    }
  });
}

async function checkCacheForJob() {
  if (!currentJob) return;
  return new Promise<void>((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: 'CHECK_CACHE', payload: currentJob }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("[JobShield] CHECK_CACHE message error:", chrome.runtime.lastError.message);
          resolve();
          return;
        }
        try {
          if (response && response.success && response.exists) {
            cachedData = response.data;
            showCacheScreen = true;
          }
        } catch (e) {}
        resolve();
      });
    } catch (e) {
      resolve();
    }
  });
}

async function triggerScan(forceRefresh = false) {
  if (!currentJob) return;
  isScanning = true;
  scanningStep = 0;
  scanError = null;
  render();

  const jobKeyVal = getCacheKey(currentJob);

  // Send update to page badge
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      try {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
          chrome.tabs.sendMessage(activeTab.id, { 
            action: 'INJECT_BADGE', 
            isAnalyzing: true,
            jobKey: jobKeyVal
          }, () => {
            if (chrome.runtime.lastError) {
              console.log("[JobShield] INJECT_BADGE start scan error:", chrome.runtime.lastError.message);
            }
          });
        }
      } catch (e) {}
    });
  } catch (e) {}

  // Progress animation
  const interval = setInterval(() => {
    scanningStep++;
    if (scanningStep >= scanSteps.length) {
      clearInterval(interval);
    } else {
      render();
    }
  }, 400);

  try {
    chrome.runtime.sendMessage({ action: 'SCAN_JOB', payload: currentJob, forceRefresh }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("[JobShield] SCAN_JOB service worker error:", chrome.runtime.lastError.message);
        clearInterval(interval);
        isScanning = false;
        render();
        return;
      }
      if (response && !response.success) {
        console.error("[JobShield] SCAN_JOB failed to start:", response.error);
        clearInterval(interval);
        isScanning = false;
        render();
      }
    });
  } catch (e) {
    clearInterval(interval);
    isScanning = false;
    render();
  }
}

function render() {
  const root = document.getElementById('popup-root');
  if (!root) return;

  root.innerHTML = '';

  // Check if we are showing offline fallback
  const isOfflineScreen = scanResult && scanResult.isOffline;

  // Render header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  `;
  
  // Real logo mark: use the extracted PNG from the original hero image.
  // chrome.runtime.getURL resolves extension-local asset paths correctly in popup context.
  const markUrl = chrome.runtime.getURL('assets/jobshield-mark.png');
  const SHIELD_IMG = `<img src="${markUrl}" width="30" height="34" style="flex-shrink:0;display:block;object-fit:contain;" alt="JobShield">`;


  // Settings gear SVG (Feather-style)
  const GEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

  if (isOfflineScreen) {
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 9px;">
        ${SHIELD_IMG}
        <span style="font-weight: 900; font-size: 15px; color: var(--text); letter-spacing: 0.04em; text-transform: uppercase;">JOB<span style="color: #3CFFD0;">SHIELD</span></span>
      </div>
    `;
  } else {
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 9px;">
        ${SHIELD_IMG}
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 900; font-size: 15px; color: var(--text); letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.2;">JOB<span style="color: #3CFFD0;">SHIELD</span></span>
          <span style="font-size: 10.5px; color: var(--text-secondary); font-weight: 500; margin-top: 1px;">AI Job Security Assistant</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button id="settings-btn" class="js-settings-btn" title="Settings">${GEAR_SVG}</button>
      </div>
    `;
  }
  root.appendChild(header);

  // Bind settings click
  if (!isOfflineScreen) {
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      currentMode = currentMode === 'settings' ? 'main' : 'settings';
      render();
    });
  }

  if (currentMode === 'settings') {
    renderSettings(root);
    return;
  }

  // If not logged in and no guest override (and no active unauthorized error screen to render)
  if (!authUser && scanError !== 'UNAUTHORIZED') {
    renderAuthRequired(root);
    return;
  }

  if (isScanning) {
    renderScanning(root);
    return;
  }

  if (scanError) {
    if (scanError === 'UNAUTHORIZED') {
      renderAuthRequired(root, true);
    } else if (scanError === 'UNAVAILABLE') {
      renderError(root, 'Backend Unavailable', 'The analysis server is currently unreachable or ML service is offline. Please try again later.');
    } else if (scanError === 'SERVER_ERROR') {
      renderError(root, 'Backend Error', 'An internal server error occurred while analyzing the job posting.');
    } else {
      renderError(root, 'Analysis Failed', 'Could not complete analysis for this job description. The input data might be invalid.');
    }
    return;
  }

  if (showCacheScreen && cachedData) {
    renderCachedScreen(root);
    return;
  }

  if (scanResult) {
    if (scanResult.isOffline) {
      renderOfflineFallback(root);
    } else {
      renderResult(root);
    }
  } else if (currentJob) {
    renderJobDetected(root);
  } else {
    renderNoJob(root);
  }
}

function renderCachedScreen(root: HTMLElement) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  `;

  const elapsedMs = new Date().getTime() - new Date(cachedData.analyzedAt).getTime();
  const elapsedMins = Math.max(1, Math.round(elapsedMs / 60000));
  const elapsedText = elapsedMins === 1 ? '1 min ago' : `${elapsedMins} min ago`;

  card.innerHTML = `
    <div style="font-size: 11px; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; font-family: var(--font-mono);">Already Analyzed</div>
    <h3 style="margin: 0 0 2px; font-size: 15px; font-weight: 800; color: var(--text);">${currentJob?.title}</h3>
    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">${currentJob?.company}</div>

    <div style="font-size: 28px; font-weight: 900; color: ${cachedData.score !== null ? 'var(--text)' : 'var(--warning)'}; margin-bottom: 4px; font-family: var(--font-mono);">
      ${cachedData.score !== null ? `${cachedData.score} <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">/ 100</span>` : 'OFFLINE'}
    </div>
    <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 16px;">
      Analyzed ${elapsedText}
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
      <button id="view-cached-btn" class="js-btn-primary">
        View Result
      </button>
      <button id="analyze-again-btn" class="js-btn-secondary">
        Analyze Again
      </button>
    </div>
  `;
  root.appendChild(card);

  document.getElementById('view-cached-btn')?.addEventListener('click', () => {
    scanResult = cachedData;
    showCacheScreen = false;
    render();
  });

  document.getElementById('analyze-again-btn')?.addEventListener('click', () => {
    showCacheScreen = false;
    triggerScan(true); // force refresh!
  });
}

function renderOfflineFallback(root: HTMLElement) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  `;

  let reasonsHtml = '';
  if (scanResult.reasons && scanResult.reasons.length > 0) {
    scanResult.reasons.forEach((r: string) => {
      reasonsHtml += `<div style="text-align: left; font-size: 12.5px; color: var(--warning); margin-bottom: 6px; padding-left: 8px; font-weight: 500;">• ${r}</div>`;
    });
  }

  card.innerHTML = `
    <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--warning-dim); border: 1px solid rgba(245, 158, 11, 0.25); padding: 6px 14px; border-radius: 6px; color: var(--warning); font-weight: 800; font-size: 11px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--font-mono);">
      <span>⚠</span>
      <span>LIMITED ANALYSIS</span>
    </div>

    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 16px; text-align: left; font-weight: 500;">
      Full AI analysis is currently unavailable.
    </p>

    <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
      <div style="text-align: left; font-size: 10px; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-family: var(--font-mono);">Local checks detected:</div>
      ${reasonsHtml}
    </div>

    <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin: 0 0 20px; text-align: left; font-style: italic; font-weight: 500;">
      These checks cannot determine whether the job is legitimate.
    </p>

    <button id="retry-analysis-btn" class="js-btn-primary">
      Retry Analysis
    </button>
  `;
  root.appendChild(card);

  document.getElementById('retry-analysis-btn')?.addEventListener('click', () => {
    triggerScan(true);
  });
}

function renderAuthRequired(root: HTMLElement, isExpired = false) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  `;

  const alertHtml = isExpired ? `
    <div style="background: var(--danger-dim); border: 1px solid rgba(239, 68, 68, 0.25); padding: 8px; border-radius: 6px; color: var(--danger); font-size: 11.5px; margin-bottom: 16px; font-weight: 600; text-align: left;">
      ⚠️ Session expired or invalid. Please sign in to the web application again.
    </div>
  ` : '';

  card.innerHTML = `
    ${alertHtml}
    <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 800;">Sign in to JobShield</h3>
    <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 20px; line-height: 1.5;">
      Scan job applications and save them directly to your security history.
    </p>
    <button id="go-to-auth-btn" style="
      width: 100%;
      padding: 10px;
      background: var(--primary);
      border: none;
      border-radius: 8px;
      color: #040712;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 12px;
      box-shadow: 0 4px 10px rgba(56, 189, 248, 0.2);
    ">
      Sign In / Create Account
    </button>
    <button id="continue-guest-btn" style="
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 12px;
      text-decoration: underline;
      cursor: pointer;
    ">
      Continue as Guest
    </button>
  `;
  root.appendChild(card);

  document.getElementById('go-to-auth-btn')?.addEventListener('click', () => {
    const authUrl = 'https://jobshield-ai-web.vercel.app/?view=AUTH';
    try {
      chrome.tabs.query({}, (tabs) => {
        const existingTab = (tabs || []).find(t => t.url && (t.url.includes('jobshield-ai-web.vercel.app') || t.url.includes('localhost:3000')));
        if (existingTab && existingTab.id) {
          chrome.tabs.update(existingTab.id, { active: true });
          if (existingTab.windowId) {
            chrome.windows.update(existingTab.windowId, { focused: true });
          }
        } else {
          chrome.tabs.create({ url: authUrl });
        }
      });
    } catch (e) {
      chrome.tabs.create({ url: authUrl });
    }
  });

  document.getElementById('continue-guest-btn')?.addEventListener('click', () => {
    authUser = { name: 'Guest User', role: 'guest' };
    scanError = null;
    render();
  });
}

function renderScanning(root: HTMLElement) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
  `;

  let stepsHtml = '';
  scanSteps.forEach((step, idx) => {
    const isDone = idx < scanningStep;
    const isCurrent = idx === scanningStep;
    const color = isDone ? 'var(--success)' : (isCurrent ? 'var(--primary)' : 'var(--text-muted)');
    const prefix = isDone ? '✓' : (isCurrent ? '→' : '○');
    stepsHtml += `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12.5px; color: ${color}; font-weight: ${isCurrent ? 700 : 500};">
        <span style="font-family: var(--font-mono);">${prefix}</span>
        <span>${step}</span>
      </div>
    `;
  });

  card.innerHTML = `
    <div style="font-size: 14px; font-weight: 800; margin-bottom: 16px; color: var(--primary);">Analyzing job posting...</div>
    <div style="display: flex; flex-direction: column; align-items: flex-start; padding-left: 16px; margin-bottom: 8px;">
      ${stepsHtml}
    </div>
  `;
  root.appendChild(card);
}

function renderNoJob(root: HTMLElement) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  `;
  card.innerHTML = `
    <div style="font-size: 28px; margin-bottom: 12px;">🔍</div>
    <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 8px;">No job posting detected</h3>
    <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 16px; line-height: 1.5;">
      Open a supported job listing and we'll analyze it.
    </p>
    <button id="show-sites-btn" style="
      background: none;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 12px;
      color: var(--text-secondary);
      font-size: 11.5px;
      cursor: pointer;
    ">
      Supported Websites
    </button>
    
    ${showSupportedSites ? `
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
        <span style="background: var(--primary-dim); border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700;">LinkedIn</span>
        <span style="background: var(--primary-dim); border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700;">Indeed</span>
        <span style="background: var(--primary-dim); border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700;">Naukri</span>
        <span style="background: var(--primary-dim); border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700;">Internshala</span>
        <span style="background: var(--primary-dim); border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700;">Glassdoor</span>
      </div>
    ` : ''}
  `;
  root.appendChild(card);

  document.getElementById('show-sites-btn')?.addEventListener('click', () => {
    showSupportedSites = !showSupportedSites;
    render();
  });
}

function renderJobDetected(root: HTMLElement) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  `;
  card.innerHTML = `
    <div style="font-size: 11px; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; font-family: var(--font-mono);">Job Detected</div>
    <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: var(--text);">${currentJob?.title}</h3>
    <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${currentJob?.company}</div>
    ${currentJob?.location ? `<div style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">📍 ${currentJob.location}</div>` : ''}

    <button id="analyze-btn" class="js-btn-primary">
      Analyze Job
    </button>
  `;
  root.appendChild(card);

  document.getElementById('analyze-btn')?.addEventListener('click', () => {
    triggerScan(false);
  });
}

function renderResult(root: HTMLElement) {
  const isHigh = scanResult.level === 'HIGH';
  const isMedium = scanResult.level === 'MEDIUM';
  const color = isHigh ? 'var(--danger)' : (isMedium ? 'var(--warning)' : 'var(--success)');
  const levelLabel = isHigh ? '🔴 HIGH RISK' : (isMedium ? '🟡 MEDIUM RISK' : '🟢 LOW RISK');

  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  // 1. Score section card
  const scoreCard = document.createElement('div');
  scoreCard.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  `;
  const rawConfidence = Number(scanResult.confidence);
  const confidenceText = Number.isFinite(rawConfidence)
    ? `AI confidence ${(rawConfidence <= 1.0 ? rawConfidence * 100 : rawConfidence).toFixed(1)}%`
    : 'AI confidence N/A';

  scoreCard.innerHTML = `
    <div style="font-size: 13px; font-weight: 800; color: ${color}; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px;">
      ${levelLabel}
    </div>
    <div style="font-size: 34px; font-weight: 900; color: var(--text); line-height: 1; margin-bottom: 6px; font-family: var(--font-mono);">
      ${scanResult.score} <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">/ 100</span>
    </div>
    <div style="font-size: 11.5px; color: var(--text-secondary); font-weight: 500;">
      ${confidenceText}
    </div>
  `;
  container.appendChild(scoreCard);

  // 2. Job Details Card
  const detailsCard = document.createElement('div');
  detailsCard.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    text-align: left;
  `;
  detailsCard.innerHTML = `
    <div style="font-size: 10px; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-family: var(--font-mono);">Job Details</div>
    <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.3;">${currentJob?.title}</h3>
    <div style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">${currentJob?.company}</div>
    <div style="font-size: 11px; color: var(--text-muted); font-weight: 500;">
      ${currentJob?.location || 'Remote'} · ${currentJob?.source || 'LinkedIn'}
    </div>
  `;
  container.appendChild(detailsCard);

  // 3. Why Flagged / Analysis Summary Card
  const whyCard = document.createElement('div');
  whyCard.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    text-align: left;
  `;

  let whyHtml = '';
  const warningSignals = scanResult.signals.filter((s: any) => s.severity === 'critical' || s.severity === 'warning');

  if (isHigh || isMedium) {
    whyHtml += `
      <div style="font-size: 10px; color: var(--warning); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; font-family: var(--font-mono); display: flex; align-items: center; gap: 6px;">
        <span>⚠️</span> <span>Why this was flagged</span>
      </div>
    `;
    warningSignals.slice(0, 3).forEach((sig: any) => {
      const emoji = sig.severity === 'critical' ? '🔴' : '🟡';
      whyHtml += `
        <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; margin-bottom: 8px; color: var(--text-secondary); line-height: 1.4;">
          <span style="font-size: 12px; line-height: 1.2;">${emoji}</span>
          <span style="font-weight: 500;">${sig.label}</span>
        </div>
      `;
    });
  } else {
    whyHtml += `
      <div style="font-size: 10px; color: var(--success); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; font-family: var(--font-mono);">Analysis Summary</div>
    `;
    scanResult.signals.slice(0, 3).forEach((sig: any) => {
      const isPass = sig.severity === 'passed';
      const icon = isPass ? '✓' : '✕';
      const iconColor = isPass ? 'var(--success)' : 'var(--danger)';
      whyHtml += `
        <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; margin-bottom: 8px; color: var(--text-secondary); line-height: 1.4;">
          <span style="color: ${iconColor}; font-weight: 800; font-family: var(--font-mono); font-size: 13px; line-height: 1.2;">${icon}</span>
          <span style="font-weight: 500;">${sig.label}</span>
        </div>
      `;
    });
  }
  whyCard.innerHTML = whyHtml;
  container.appendChild(whyCard);

  // 4. Actions card
  const actionsCard = document.createElement('div');
  actionsCard.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  // Serialize report details for full dashboard rendering (fixed encoding typo '伤' to '⚠️')
  const reportData = encodeURIComponent(JSON.stringify({
    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    title: currentJob?.title,
    company: currentJob?.company,
    domain: currentJob?.url ? new URL(currentJob.url).hostname : 'unverified.com',
    recruiterEmail: currentJob?.recruiter || 'not-provided@corp.com',
    verdict: isHigh ? 'SCAM' : (isMedium ? 'SUSPICIOUS' : 'SAFE'),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    score: scanResult.score,
    details: scanResult.verdict,
    flags: scanResult.signals.filter((s: any) => s.severity !== 'passed').map((s: any) => `⚠️ ${s.label}`)
  }));

  actionsCard.innerHTML = `
    <button id="view-full-btn" class="js-btn-primary">
      <span>View Full Analysis</span>
      <span style="font-size: 14px; font-weight: 600; line-height: 1;">→</span>
    </button>
    <button id="scan-again-btn" class="js-btn-secondary">
      Analyze Again
    </button>
  `;
  container.appendChild(actionsCard);
  root.appendChild(container);

  document.getElementById('view-full-btn')?.addEventListener('click', () => {
    const analysisId = scanResult?.analysis_id || scanResult?.data?.analysis_id || scanResult?.id || '';
    const targetUrl = analysisId 
      ? `https://jobshield-ai-web.vercel.app/app/reports?view=REPORTS&analysisId=${analysisId}`
      : `https://jobshield-ai-web.vercel.app/app/reports?view=REPORTS&reportData=${reportData}`;
    chrome.tabs.create({ url: targetUrl });
  });

  document.getElementById('scan-again-btn')?.addEventListener('click', () => {
    scanResult = null;
    triggerScan(true);
  });
}

function renderSettings(root: HTMLElement) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  `;
  
  card.innerHTML = `
    <h3 style="margin: 0 0 16px; font-size: 15px; font-weight: 800; color: var(--text);">Extension Settings</h3>

    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12.5px; color: var(--text-secondary);">Show badge on job pages</span>
        <input type="checkbox" id="show-badge-check" checked style="cursor: pointer;" />
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12.5px; color: var(--text-secondary);">Ask before analyzing</span>
        <input type="checkbox" id="ask-analyze-check" checked style="cursor: pointer;" />
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
        <span style="font-size: 12.5px; color: var(--text-secondary);">Theme</span>
        <select style="background: var(--bg-base); border: 1px solid var(--border); color: var(--text); padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
          <option>System</option>
          <option>Dark</option>
          <option>Light</option>
        </select>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 10px; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--font-mono);">Account</div>
        <div style="font-size: 12.5px; color: var(--text-secondary);">${authUser ? authUser.email || authUser.name : 'Not signed in'}</div>
      </div>

      <button id="sign-out-btn" style="
        margin-top: 8px;
        width: 100%;
        padding: 8px;
        background: var(--danger-dim);
        border: 1px solid rgba(239,68,68,0.2);
        border-radius: 6px;
        color: var(--danger);
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      ">
        Sign Out
      </button>

      <button id="dashboard-link-btn" style="
        width: 100%;
        padding: 8px;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--primary);
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      ">
        Open JobShield Dashboard
      </button>
    </div>
  `;
  root.appendChild(card);

  document.getElementById('sign-out-btn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'SIGN_OUT' }, () => {
      if (chrome.runtime.lastError) {
        console.log("[JobShield] SIGN_OUT background error:", chrome.runtime.lastError.message);
      }
      authUser = null;
      currentMode = 'main';
      render();
    });
  });

  document.getElementById('dashboard-link-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://jobshield-ai-web.vercel.app/' });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (chrome.runtime.lastError) {}

  if (message.action === 'SCAN_RESULT') {
    if (currentJob && getCacheKey(currentJob) === message.cacheKey) {
      isScanning = false;
      if (message.success) {
        scanResult = message.data;
        cachedData = message.data;
        scanError = null;
      } else {
        scanResult = null;
        if (message.error === 'UNAUTHORIZED') {
          scanError = 'UNAUTHORIZED';
        } else if (message.error === 'SERVICE_UNAVAILABLE') {
          scanError = 'UNAVAILABLE';
        } else if (message.error === 'BAD_REQUEST') {
          scanError = 'FAILED';
        } else {
          scanError = 'SERVER_ERROR';
        }
      }
      render();
    }
    sendResponse({ success: true });
    return false;
  }
  return false;
});

function renderError(root: HTMLElement, title: string, message: string) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  `;
  card.innerHTML = `
    <div style="font-size: 28px; margin-bottom: 12px;">❌</div>
    <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 800; color: var(--text);">${title}</h3>
    <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 20px; line-height: 1.5;">
      ${message}
    </p>
    <button id="retry-error-btn" class="js-btn-primary">
      Retry
    </button>
  `;
  root.appendChild(card);

  document.getElementById('retry-error-btn')?.addEventListener('click', () => {
    scanError = null;
    triggerScan(true);
  });
}
