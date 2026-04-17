// AdBlockX - Background Service Worker v1.3 [Merged & Restored]

const SOCIAL_DOMAINS = [
  'connect.facebook.net', 'facebook.com/plugins', 'facebook.net',
  'platform.twitter.com', 'twimg.com/widgets',
  'platform.linkedin.com', 'linkedin.com/count-',
  'apis.google.com/js/platform.js', 'redditstatic.com/button',
  'stumbleupon.com/badge', 'bufferapp.com/js'
];

const FINGERPRINT_DOMAINS = [
  'fingerprintjs.com', 'clientjs.org', 'cdn.jsdelivr.net/npm/fingerprintjs',
  'browserleaks.com', 'panopticlick.eff.org', 'amiunique.org'
];

// ─── Install / First Run ─────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isEnabled', 'adsBlockedTotal', 'usageHistory'], (result) => {
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({
        isEnabled: true,
        stealthModeEnabled: false,
        adsBlockedTotal: 0,
        whitelist: [],
        blockSocial: false,
        blockCookies: false,
        antiFingerprint: false,
        httpsEverywhere: false,
        usageHistory: [0, 0, 0, 0, 0, 0, 0],
        lastAnalyticsDay: new Date().toISOString().split('T')[0]
      });
    }
  });

  // Create Context Menus
  chrome.contextMenus.create({ id: "block-element-domain", title: "Block element on this site", contexts: ["all"] });
  chrome.contextMenus.create({ id: "block-element-global", title: "Block element everywhere", contexts: ["all"] });

  updatePrivacyRules();
  fetchRemoteBlocklist();
});

// ─── Startup ─────────────────────────────────────────────────────────────────
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ adsBlockedSession: 0 });
  fetchRemoteBlocklist();
  updatePrivacyRules();
});

// Initial session counter
chrome.storage.local.set({ adsBlockedSession: 0 });

// ─── Context Menu Handler ───────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "block-element-domain" || info.menuItemId === "block-element-global") {
    const scope = info.menuItemId === "block-element-domain" ? "domain" : "global";
    chrome.tabs.sendMessage(tab.id, { type: 'BLOCK_CUSTOM_ELEMENT', scope: scope });
  }
});

// ─── Tab-Specific Tracking (Badge) ──────────────────────────────────────────
const tabBlockedCounts = new Map();

function updateBadge(tabId) {
  const count = tabBlockedCounts.get(tabId) || 0;
  const displayCount = count > 0 ? (count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString()) : '';
  chrome.action.setBadgeText({ tabId, text: displayCount });
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#6366f1' });
}

// ─── Stat Accumulator ────────────────────────────────────────────────────────
let pendingTotal = 0;
let pendingSession = 0;

async function flushStats() {
  if (pendingTotal === 0 && pendingSession === 0) return;
  const t = pendingTotal; const s = pendingSession;
  pendingTotal = 0; pendingSession = 0;

  chrome.storage.local.get(['adsBlockedTotal', 'adsBlockedSession', 'usageHistory', 'lastAnalyticsDay'], (res) => {
    const today = new Date().toISOString().split('T')[0];
    let history = res.usageHistory || [0, 0, 0, 0, 0, 0, 0];

    if (res.lastAnalyticsDay !== today) {
      history.shift();
      history.push(0);
    }
    history[history.length - 1] += t;

    chrome.storage.local.set({
      adsBlockedTotal: (res.adsBlockedTotal || 0) + t,
      adsBlockedSession: (res.adsBlockedSession || 0) + s,
      usageHistory: history,
      lastAnalyticsDay: today
    });
  });
}
setInterval(flushStats, 1000);

// ─── Power Toggle ────────────────────────────────────────────────────────────
chrome.storage.onChanged.addListener((changes, ns) => {
  if (ns === 'local' && changes.isEnabled) {
    const en = changes.isEnabled.newValue !== false;
    chrome.declarativeNetRequest.updateEnabledRulesets({ [en ? 'enableRulesetIds' : 'disableRulesetIds']: ['ruleset_1'] });
  }
});

// ─── Privacy Rules Logic ─────────────────────────────────────────────────────
async function updatePrivacyRules() {
  const settings = await chrome.storage.local.get(['blockSocial', 'antiFingerprint', 'httpsEverywhere']);
  const removeRuleIds = [];
  for (let i = 20000; i < 23000; i++) removeRuleIds.push(i);

  const addRules = [];
  
  if (settings.httpsEverywhere) {
    addRules.push({
      id: 22000, priority: 1, action: { type: 'upgradeScheme' },
      condition: { urlFilter: '||http://', resourceTypes: ['main_frame', 'sub_frame'] }
    });
  }
  
  if (settings.blockSocial) {
    SOCIAL_DOMAINS.forEach((d, i) => {
      addRules.push({
        id: 20000 + i, priority: 2, action: { type: 'block' },
        condition: { urlFilter: `||${d}`, resourceTypes: ['script', 'sub_frame', 'image', 'other'] }
      });
    });
  }
  if (settings.antiFingerprint) {
    FINGERPRINT_DOMAINS.forEach((d, i) => {
      addRules.push({
        id: 21000 + i, priority: 2, action: { type: 'block' },
        condition: { urlFilter: `||${d}`, resourceTypes: ['script', 'xmlhttprequest', 'other'] }
      });
    });
  }
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

// ─── Network Monitoring ──────────────────────────────────────────────────────
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    const tabId = info.tabId;
    if (tabId && tabId !== -1) {
      chrome.storage.local.get(['isEnabled'], (res) => {
        if (res.isEnabled === false) return;
        const currentCount = (tabBlockedCounts.get(tabId) || 0) + 1;
        tabBlockedCounts.set(tabId, currentCount);
        updateBadge(tabId);
        pendingTotal += 1;
        pendingSession += 1;
      });
    }
  });
}

// Reset badge on navigation
chrome.webNavigation.onBeforeNavigate.addListener((d) => {
  if (d.frameId === 0) { tabBlockedCounts.set(d.tabId, 0); updateBadge(d.tabId); }
});

chrome.tabs.onRemoved.addListener((tabId) => tabBlockedCounts.delete(tabId));

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AD_REMOVED') {
    const count = message.count || 1;
    pendingTotal += count; pendingSession += count;
    const tabId = sender.tab?.id;
    if (tabId) {
      const currentTabCount = (tabBlockedCounts.get(tabId) || 0) + count;
      tabBlockedCounts.set(tabId, currentTabCount);
      updateBadge(tabId);
    }
  } else if (message.type === 'ADD_DYNAMIC_RULE') {
    const d = message.domain; if (!d) return;
    if (!DOMAIN_REGEX.test(d)) return;
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      const maxId = rules.filter(r => r.id < 20000).reduce((m, r) => Math.max(m, r.id), 10000);
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          id: maxId + 1, priority: 2, action: { type: "block" },
          condition: { urlFilter: `||${d}`, resourceTypes: ["main_frame", "script", "image", "xmlhttprequest", "sub_frame", "ping", "media", "websocket", "other"] }
        }]
      });
    });
  } else if (message.type === 'FORCE_SYNC') {
    fetchRemoteBlocklist(true).then(() => sendResponse({ success: true }));
    return true;
  } else if (message.type === 'UPDATE_PRIVACY_RULES') {
    updatePrivacyRules();
  }
});

// ─── Remote Blocklist Syncing ─────────────────────────────────────────────────
const REMOTE_BLOCKLIST_URL = 'https://cdn.jsdelivr.net/gh/wikicrafter/adblock@main/scripts/blocklist.json';
const DOMAIN_ALLOWLIST = new Set([
  'google.com', 'googleapis.com', 'gstatic.com', 'youtube.com', 'ytimg.com',
  'github.com', 'githubusercontent.com', 'jsdelivr.net', 'cloudflare.com',
  'microsoft.com', 'windows.com', 'apple.com', 'icloud.com', 'amazon.com',
  'amazonaws.com', 'mozilla.org', 'firefox.com'
]);

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function isValidDomain(domain) {
  if (!DOMAIN_REGEX.test(domain)) return false;
  if (DOMAIN_ALLOWLIST.has(domain)) return false;
  return ![...DOMAIN_ALLOWLIST].some(safe => domain.endsWith('.' + safe));
}

async function fetchRemoteBlocklist(force = false) {
  try {
    const stored = await chrome.storage.local.get(['lastRemoteSync']);
    // Monthly interval (2592000000ms = 30 days)
    if (!force && (Date.now() - (stored.lastRemoteSync || 0)) < 2592000000) return;

    const res = await fetch(REMOTE_BLOCKLIST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const domains = Array.isArray(raw) ? raw.slice(0, 5000).filter(isValidDomain) : [];

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingFilters = new Set(existingRules.map(r => r.condition.urlFilter));
    let nextId = existingRules.filter(r => r.id < 20000).reduce((m, r) => Math.max(m, r.id), 10000);
    const newRules = [];

    for (const domain of domains) {
      if (!existingFilters.has(`||${domain}`)) {
        nextId++;
        newRules.push({
          id: nextId, priority: 2, action: { type: 'block' },
          condition: { urlFilter: `||${domain}`, resourceTypes: ['main_frame', 'script', 'image', 'sub_frame', 'other'] }
        });
      }
    }
    if (newRules.length > 0) await chrome.declarativeNetRequest.updateDynamicRules({ addRules: newRules });
    chrome.storage.local.set({ lastRemoteSync: Date.now() });
  } catch (e) { console.error('AdBlockX: Sync failed', e.message); }
}
