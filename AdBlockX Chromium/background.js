// AdBlockX - Background Service Worker

// ─── Install / First Run ─────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isEnabled', 'stealthModeEnabled', 'adsBlockedTotal', 'whitelist'], (result) => {
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({
        isEnabled: true,
        stealthModeEnabled: false,
        adsBlockedTotal: 0,
        whitelist: []
      });
    }
  });

  // Create Context Menus
  chrome.contextMenus.create({
    id: "block-element-domain",
    title: "Block element on this site",
    contexts: ["all"]
  });
  chrome.contextMenus.create({
    id: "block-element-global",
    title: "Block element everywhere",
    contexts: ["all"]
  });

  // Fetch remote blocklist on first install
  fetchRemoteBlocklist();
});

// ─── Startup ─────────────────────────────────────────────────────────────────
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ adsBlockedSession: 0 });
  fetchRemoteBlocklist();
});

// Initial session counter
chrome.storage.local.set({ adsBlockedSession: 0 });

// ─── Context Menu Clicks ─────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "block-element-domain" || info.menuItemId === "block-element-global") {
    const scope = info.menuItemId === "block-element-domain" ? "domain" : "global";
    chrome.tabs.sendMessage(tab.id, {
      type: 'BLOCK_CUSTOM_ELEMENT',
      scope: scope
    });
  }
});

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AD_REMOVED') {
    const count = message.count || 1;
    chrome.storage.local.get(['adsBlockedTotal', 'adsBlockedSession'], (result) => {
      const newTotal = (result.adsBlockedTotal || 0) + count;
      const newSession = (result.adsBlockedSession || 0) + count;

      chrome.storage.local.set({
        adsBlockedTotal: newTotal,
        adsBlockedSession: newSession
      });

      const displayCount = newTotal > 999 ? (newTotal / 1000).toFixed(1) + 'k' : newTotal.toString();
      chrome.action.setBadgeText({ text: displayCount });
      chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    });

  } else if (message.type === 'ADD_DYNAMIC_RULE') {
    const domain = message.domain;
    if (!domain) return;

    chrome.storage.local.get(['lastDynamicRuleId'], (res) => {
      let nextId = (res.lastDynamicRuleId || 10000) + 1;

      const rule = {
        id: nextId,
        priority: 2,
        action: { type: "block" },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame", "ping", "media", "websocket", "other"]
        }
      };

      chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] }, () => {
        if (chrome.runtime.lastError) {
          console.error('AdBlockX: Dynamic rule error:', chrome.runtime.lastError);
          return;
        }
        console.log(`AdBlockX: Dynamic block added for ${domain} (ID ${nextId})`);
        chrome.storage.local.set({ lastDynamicRuleId: nextId });
      });
    });
  }
});

// ─── Remote Blocklist Syncing ─────────────────────────────────────────────────
// jsDelivr CDN: free, no traffic limits, global CDN — built for open source at scale
const REMOTE_BLOCKLIST_URL = 'https://cdn.jsdelivr.net/gh/wikicrafter/adblock@main/scripts/blocklist.json';
const SYNC_INTERVAL_HOURS = 24;

// ─── Safety: domains that must NEVER be blocked ───────────────────────────────
const DOMAIN_ALLOWLIST = new Set([
  'google.com', 'googleapis.com', 'gstatic.com',
  'youtube.com', 'ytimg.com',
  'github.com', 'githubusercontent.com', 'jsdelivr.net',
  'cloudflare.com', 'chrome.google.com',
  'microsoft.com', 'windows.com',
  'apple.com', 'icloud.com',
  'amazon.com', 'amazonaws.com',
  'mozilla.org', 'firefox.com'
]);

// ─── Strict domain format validator ──────────────────────────────────────────
// Accepts: "sub.domain.com", "domain.co.uk" — rejects IPs, wildcards, paths
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function isValidDomain(domain) {
  if (typeof domain !== 'string') return false;
  if (domain.length > 253) return false;                  // RFC max length
  if (!DOMAIN_REGEX.test(domain)) return false;           // must be valid format
  if (DOMAIN_ALLOWLIST.has(domain)) return false;         // never block safe domains
  // Check no segment is blacklisted safety domain
  const isSubOfAllowlisted = [...DOMAIN_ALLOWLIST].some(safe => domain.endsWith('.' + safe));
  if (isSubOfAllowlisted) return false;
  return true;
}

async function fetchRemoteBlocklist() {
  try {
    // Rate limit: only sync once every 24 hours
    const stored = await chrome.storage.local.get(['lastRemoteSync']);
    const lastSync = stored.lastRemoteSync || 0;
    const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);

    if (hoursSinceSync < SYNC_INTERVAL_HOURS) {
      console.log(`AdBlockX: Skipping remote sync (last synced ${hoursSinceSync.toFixed(1)}h ago)`);
      return;
    }

    console.log('AdBlockX: Fetching remote blocklist...');
    const res = await fetch(REMOTE_BLOCKLIST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // ✅ Security: enforce content-type is JSON
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json') && !contentType.includes('text')) {
      throw new Error(`Unexpected content-type: ${contentType}`);
    }

    const raw = await res.json();

    // ✅ Security: must be an array
    if (!Array.isArray(raw)) throw new Error('Blocklist is not a JSON array');

    // ✅ Security: cap size to prevent abuse (max 5000 entries)
    if (raw.length > 5000) throw new Error(`Blocklist too large: ${raw.length} entries`);

    // ✅ Security: validate every single domain strictly
    const domains = raw.filter(d => {
      if (!isValidDomain(d)) {
        console.warn(`AdBlockX: Skipping invalid/unsafe domain: "${d}"`);
        return false;
      }
      return true;
    });

    if (domains.length === 0) {
      console.log('AdBlockX: No valid new domains in remote blocklist.');
      chrome.storage.local.set({ lastRemoteSync: Date.now() });
      return;
    }

    // Get current dynamic rules to avoid inserting duplicates
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingFilters = new Set(existingRules.map(r => r.condition.urlFilter));

    let nextId = (await chrome.storage.local.get(['lastDynamicRuleId'])).lastDynamicRuleId || 10000;
    const newRules = [];

    for (const domain of domains) {
      const filter = `||${domain}`;
      if (!existingFilters.has(filter)) {
        nextId++;
        newRules.push({
          id: nextId,
          priority: 2,
          action: { type: 'block' },
          condition: {
            urlFilter: filter,
            resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'ping', 'media', 'websocket', 'other']
          }
        });
      }
    }

    if (newRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ addRules: newRules });
      chrome.storage.local.set({ lastDynamicRuleId: nextId });
      console.log(`AdBlockX: Added ${newRules.length} new rules from remote blocklist.`);
    } else {
      console.log('AdBlockX: Remote blocklist is up-to-date.');
    }

    chrome.storage.local.set({ lastRemoteSync: Date.now() });

  } catch (error) {
    console.error('AdBlockX: Failed to fetch remote blocklist:', error.message);
  }
}

