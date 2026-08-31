/**
 * JobShield AI Chrome Extension — Background Service Worker
 */

interface CacheEntry {
  score: number | null;
  level: string;
  confidence: number | null;
  verdict: string;
  signals: any[];
  analyzedAt: string;
  isOffline?: boolean;
  reasons?: string[];
}

// In-memory cache and history cache
let cache: Record<string, CacheEntry> = {};
let authenticatedUser: any = null;

// Initialize auth state from storage on startup
try {
  chrome.storage.local.get(['authenticatedUser'], (result) => {
    if (!chrome.runtime.lastError && result.authenticatedUser) {
      authenticatedUser = result.authenticatedUser;
    }
  });
} catch (e) {}

try {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    const action = request.action;

    if (action === 'SYNC_AUTH') {
      authenticatedUser = request.payload;
      try {
        chrome.storage.local.set({ authenticatedUser }, () => {
          if (chrome.runtime.lastError) {
            // ignore
          }
        });
      } catch (e) {}
      sendResponse({ success: true });
      return false;
    }

    if (action === 'CHECK_CACHE') {
      try {
        const cacheKey = getCacheKey(request.payload);
        const cached = cache[cacheKey];
        if (cached) {
          sendResponse({ success: true, exists: true, data: cached });
        } else {
          sendResponse({ success: true, exists: false });
        }
      } catch (e) {
        sendResponse({ success: false, error: String(e) });
      }
      return false;
    }

    if (action === 'GET_AUTH_STATUS') {
      try {
        chrome.storage.local.get(['authenticatedUser'], (result) => {
          const user = (result && result.authenticatedUser) || authenticatedUser;
          if (user) {
            authenticatedUser = user;
          }
          sendResponse({ success: true, user });
        });
      } catch (e) {
        sendResponse({ success: true, user: authenticatedUser });
      }
      return true; // asynchronous response
    }

    if (action === 'SIGN_OUT') {
      authenticatedUser = null;
      try {
        chrome.storage.local.remove(['authenticatedUser'], () => {
          if (chrome.runtime.lastError) {}
        });
      } catch (e) {}
      sendResponse({ success: true });
      return false;
    }

    if (action === 'SCAN_JOB') {
      const { title, company, description, url } = request.payload;
      const forceRefresh = request.forceRefresh || false;
      const cacheKey = getCacheKey(request.payload);

      if (!forceRefresh && cache[cacheKey]) {
        sendResponse({ success: true, status: 'cached' });
        // Immediately broadcast cached result
        try {
          chrome.runtime.sendMessage({ action: 'SCAN_RESULT', success: true, data: cache[cacheKey], cacheKey });
        } catch (e) {}
        return false;
      }

      // Synchronously respond that scan has started
      sendResponse({ success: true, status: 'started' });

      // Run fetch asynchronously in the background
      (async () => {
        console.log("[JobShield] Scan started");
        let timeoutId: any = null;
        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 8000);

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          if (authenticatedUser && authenticatedUser.token) {
            headers['Authorization'] = `Bearer ${authenticatedUser.token}`;
          }

          const apiPayload = {
            title: request.payload.title || '',
            company: request.payload.company || '',
            location: request.payload.location || '',
            description: request.payload.description || '',
            salary: request.payload.salary || '',
            employment_type: request.payload.employment_type || '',
            source: request.payload.source || '',
            source_url: request.payload.url || '',
            email: request.payload.recruiter || ''
          };

          let apiBaseUrl = '__JOBSHIELD_API_URL__';
          if (!apiBaseUrl || apiBaseUrl.startsWith('/') || apiBaseUrl === '__JOBSHIELD_API_URL__') {
            apiBaseUrl = 'https://jobshield-ai-backend-6v0b.onrender.com/api/v1';
          }
          const targetEndpoint = `${apiBaseUrl.replace(/\/+$/, '')}/analyze`;

          const res = await fetch(targetEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(apiPayload),
            signal: controller.signal
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (res.status === 401) {
            authenticatedUser = null;
            try {
              chrome.storage.local.remove(['authenticatedUser']);
            } catch (e) {}
            // Reset in-page badge to Not Analyzed state
            sendBadgeUpdate(cacheKey, undefined, undefined, false);
            try {
              chrome.runtime.sendMessage({
                action: 'SCAN_RESULT',
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Your session has expired. Please log in to the web application again.',
                cacheKey
              });
            } catch (e) {}
            return;
          }

          if (res.status === 400) {
            // Reset in-page badge to Not Analyzed state
            sendBadgeUpdate(cacheKey, undefined, undefined, false);
            try {
              chrome.runtime.sendMessage({
                action: 'SCAN_RESULT',
                success: false,
                error: 'BAD_REQUEST',
                message: 'Invalid job data or validation failure.',
                cacheKey
              });
            } catch (e) {}
            return;
          }

          if (res.status === 503) {
            // Reset in-page badge to Not Analyzed state
            sendBadgeUpdate(cacheKey, undefined, undefined, false);
            try {
              chrome.runtime.sendMessage({
                action: 'SCAN_RESULT',
                success: false,
                error: 'SERVICE_UNAVAILABLE',
                message: 'ML Service is currently unavailable.',
                cacheKey
              });
            } catch (e) {}
            return;
          }

          if (res.status >= 500) {
            // Reset in-page badge to Not Analyzed state
            sendBadgeUpdate(cacheKey, undefined, undefined, false);
            try {
              chrome.runtime.sendMessage({
                action: 'SCAN_RESULT',
                success: false,
                error: 'SERVER_ERROR',
                message: 'Internal server error.',
                cacheKey
              });
            } catch (e) {}
            return;
          }

          if (!res.ok) {
            throw new Error(`Server returned code ${res.status}`);
          }

          const response = await res.json();
          if (response.success && response.data) {
            const result = response.data.analysis;
            const entry: CacheEntry = {
              score: result.final_score,
              level: result.risk_level,
              confidence: result.confidence,
              verdict: result.prediction,
              signals: (result.flags || []).map((f: any) => ({
                label: f.message,
                severity: f.severity,
                evidence: f.evidence
              })),
              analyzedAt: result.analyzed_at
            };
            cache[cacheKey] = entry;

            try {
              chrome.storage.local.get(['scanHistory'], (data) => {
                if (!chrome.runtime.lastError) {
                  const history = data.scanHistory || [];
                  const historyItem = {
                    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
                    title,
                    company,
                    domain: url ? new URL(url).hostname : 'unverified.com',
                    recruiterEmail: request.payload.recruiter || 'not-provided@corp.com',
                    verdict: result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL' ? 'SCAM' : (result.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SAFE'),
                    date: new Date(result.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    time: new Date(result.analyzed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    score: result.final_score,
                    details: result.prediction,
                    flags: (result.flags || []).filter((s: any) => s.severity !== 'passed').map((s: any) => `⚠️ ${s.message}`)
                  };
                  history.unshift(historyItem);
                  chrome.storage.local.set({ scanHistory: history.slice(0, 50) });
                }
              });
            } catch (e) {}

            console.log("[JobShield] Scan completed");

            // Broadcast complete to popup
            try {
              chrome.runtime.sendMessage({ action: 'SCAN_RESULT', success: true, data: entry, cacheKey });
            } catch (e) {}

            // Send injection badge command to page tab
            sendBadgeUpdate(cacheKey, entry.score, entry.level, entry.isOffline);
          } else {
            try {
              chrome.runtime.sendMessage({ action: 'SCAN_RESULT', success: false, error: (response.error && response.error.message) || 'Failed to scan', cacheKey });
            } catch (e) {}
          }
        } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
          console.log("[JobShield] Limited Analysis");
          const mockResult = runLocalFallback(description || '');
          cache[cacheKey] = mockResult;

          // Broadcast fallback scanning completed
          try {
            chrome.runtime.sendMessage({ action: 'SCAN_RESULT', success: true, data: mockResult, cacheKey });
          } catch (e) {}

          // Send injection badge command to page tab
          sendBadgeUpdate(cacheKey, mockResult.score, mockResult.level, mockResult.isOffline);
        }
      })();

      return false; // synchronous listener
    }

    sendResponse({ success: false, error: 'Unhandled action in background script' });
    return false;
  });
} catch (e) {
  // ignore
}

function sendBadgeUpdate(cacheKey: string, score: number | null | undefined, level: string | undefined, isOffline: boolean | undefined) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        const tabId = activeTab.id;
        const msg = { action: 'INJECT_BADGE', score, level, isOffline, jobKey: cacheKey };
        
        chrome.tabs.sendMessage(tabId, msg, () => {
          if (chrome.runtime.lastError) {
            // Auto-inject content.js if context was invalidated or missing
            try {
              chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
              }, () => {
                if (!chrome.runtime.lastError) {
                  setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, msg, () => {
                      if (chrome.runtime.lastError) {}
                    });
                  }, 300);
                }
              });
            } catch (e) {}
          }
        });
      }
    });
  } catch (e) {}
}

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

function getCacheKey(payload: { title?: string; company?: string; description?: string; url?: string }): string {
  const t = normalizeText(payload.title || '');
  const c = normalizeText(payload.company || '');
  const d = normalizeText(payload.description || '');
  const u = normalizeUrl(payload.url || '');
  return hashString(`${t}|${c}|${d}|${u}`);
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

function runLocalFallback(description: string): CacheEntry {
  const desc = description.toLowerCase();
  const hasCheck = desc.includes('check') || desc.includes('wire') || desc.includes('payment');
  const hasTelegram = desc.includes('telegram') || desc.includes('whatsapp') || desc.includes('signal') || desc.includes('chat app');
  
  const reasons: string[] = [];
  if (hasTelegram) {
    reasons.push('Telegram-related language');
  }
  if (hasCheck) {
    reasons.push('Check-cashing language');
  }

  return {
    score: null, // explicit null for offline fallback
    level: 'UNKNOWN',
    confidence: 0,
    verdict: 'Full JobShield AI analysis is unavailable.',
    signals: [],
    reasons: reasons.length > 0 ? reasons : ['No obvious local scan indicators found'],
    analyzedAt: new Date().toISOString(),
    isOffline: true
  };
}
