// AdBlockX - Content Script v1.2

let isBlockingEnabled = true;
let stealthModeEnabled = false;

// ─── Custom Right-Click Blocking ──────────────────────────────────────────────
let lastRightClickedElement = null;
let customSelectors = [];

document.addEventListener('contextmenu', (e) => {
  lastRightClickedElement = e.target;
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BLOCK_CUSTOM_ELEMENT' && lastRightClickedElement) {
    blockCustomElement(lastRightClickedElement, message.scope);
  }
});

function generateSelector(el) {
  if (!el || el.tagName === 'BODY' || el.tagName === 'HTML') return null;
  if (el.id) return `#${el.id}`;

  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':')).map(c => `.${c}`).join('');
    if (classes) {
      try {
        if (document.querySelectorAll(classes).length === 1) return classes;
      } catch(e) {}
    }
  }

  let path = [];
  let current = el;
  while (current && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }
    let sibling = current;
    let nth = 1;
    while (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      if (sibling.tagName === current.tagName) nth++;
    }
    if (nth > 1) selector += `:nth-of-type(${nth})`;
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}

function blockCustomElement(element, scope) {
  const selector = generateSelector(element);
  if (!selector) return;

  element.remove();

  const host = window.location.hostname;
  const storageKey = scope === 'domain' ? `custom_blocks_${host}` : 'custom_blocks_global';

  chrome.storage.local.get([storageKey], (result) => {
    let blocks = result[storageKey] || [];
    if (!blocks.includes(selector)) {
      blocks.push(selector);
      chrome.storage.local.set({ [storageKey]: blocks });
      customSelectors.push(selector);
    }
  });
}

// ─── Blocking Status Check ────────────────────────────────────────────────────
async function checkBlockingStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isEnabled', 'whitelist', 'stealthModeEnabled'], (result) => {
      const isEnabled = result.isEnabled !== false;
      stealthModeEnabled = result.stealthModeEnabled === true;
      const whitelist = result.whitelist || [];
      const currentHost = window.location.hostname;

      const isWhitelisted = whitelist.some(domain =>
        currentHost === domain || currentHost.endsWith('.' + domain)
      );

      isBlockingEnabled = isEnabled && !isWhitelisted;
      resolve(isBlockingEnabled);
    });
  });
}

// ─── Stealth Mode (Upgraded) ──────────────────────────────────────────────────
function injectStealthPayload() {
  if (!stealthModeEnabled) return;

  const script = document.createElement('script');
  script.textContent = `
    (function() {
      try {
        // 1. Mock well-known anti-adblock global flags
        const noop = () => {};
        const fakeABD = { onDetected: noop, onNotDetected: noop, check: noop };
        ['blockAdBlock','FuckAdBlock','adblockDetector','BlockAdBlock','AdBlockDetector'].forEach(name => {
          try { Object.defineProperty(window, name, { value: fakeABD, writable: false, configurable: true }); } catch(e) {}
        });
        window.isAdBlockActive = false;
        window.adblock = false;
        window.adblocker = false;
        window.hasAdBlocker = false;
        window.adBlockDetected = false;

        // 2. Bait-element detection bypass:
        //    Sites inject a hidden div.adsbox and check offsetHeight.
        //    If CSS hides it (height:0), the site knows an adblocker is running.
        //    We override offsetHeight/offsetWidth so bait elements report realistic values.
        const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
        const originalOffsetWidth  = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
        const originalOffsetParent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');

        const AD_BAIT_CLASSES = /adsbox|ad-banner|banner_ad|ad-unit|ad-wrapper|adsbygoogle|ad-slot/i;

        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
          get() {
            if (this.className && AD_BAIT_CLASSES.test(this.className)) return 250;
            return originalOffsetHeight.get.call(this);
          }
        });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
          get() {
            if (this.className && AD_BAIT_CLASSES.test(this.className)) return 300;
            return originalOffsetWidth.get.call(this);
          }
        });
        Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
          get() {
            if (this.className && AD_BAIT_CLASSES.test(this.className)) return document.body;
            return originalOffsetParent.get.call(this);
          }
        });

        // 3. Intercept Google Funding Choices / Admiral detection
        window.googlefc = window.googlefc || {};
        window.googlefc.callbackQueue = window.googlefc.callbackQueue || { push: () => {} };
        window.__tcfapi = window.__tcfapi || function(cmd, v, cb) { if (cb) cb({}, true); };
        window.__cmp = window.__cmp || function(cmd, arg, cb) { if (cb) cb({consentData: ''}, true); };

      } catch(e) {}
    })();
  `;
  (document.head || document.documentElement).prepend(script);
  script.remove();
}

// ─── Custom Selectors Loader ───────────────────────────────────────────────────
function loadCustomSelectors() {
  const host = window.location.hostname;
  chrome.storage.local.get([`custom_blocks_${host}`, 'custom_blocks_global'], (result) => {
    customSelectors = (result[`custom_blocks_${host}`] || []).concat(result['custom_blocks_global'] || []);
    if (customSelectors.length > 0) removeAds();
  });
}

// ─── Core Ad Removal ─────────────────────────────────────────────────────────
function removeAds() {
  if (!isBlockingEnabled) return;

  const adSelectors = [
    // Generic class patterns
    ".ad-banner", ".ad-container", ".ad-wrapper", ".ad-popup", ".ad-native",
    ".ad-slot", ".ad-unit", ".ad-zone", ".ad-block", ".ad-area", ".ad-box",
    ".ad-leaderboard", ".ad-sidebar", ".ad-overlay", ".ad-interstitial",
    ".ad-label", ".ad-text", ".ad-row", ".ad-col", ".ad-frame",
    // Google/programmatic
    ".google-auto-placed", ".adsbygoogle",
    "div[id^='google_ads_']", "div[id^='div-gpt-ad']",
    "ins.adsbygoogle", "iframe[src*='doubleclick']",
    "iframe[src*='adservice']", "iframe[src*='googlesyndication']",
    // Generic site patterns
    ".top-ads-container", ".sidebar-ads", ".banner-ads",
    "[class*='sponsored']", "[id*='sponsored']",
    "[data-ad]", "[data-ad-unit]", "[data-ad-slot]", "[data-ad-client]",
    "[data-adunit]", "[data-advertisement]",
    // Common id patterns
    "#ad-container", "#ad-wrapper", "#ad-banner", "#ads-container",
    "#adBar", "#adSlot", "#adBox",
    // Affiliate / native advertising
    ".taboola-widget", "[id*='taboola']", "[id*='outbrain']",
    "[class*='taboola']", "[class*='outbrain']",
    // Popunder / pop-up layers
    ".popup-ad", ".popunder", ".overlay-ad", ".fullscreen-ad",
    // Social tracking pixels (hidden)
    "img[src*='facebook.com/tr']", "img[src*='pixel.']",
    "img[width='1'][height='1']", "img[width='0'][height='0']"
  ];

  const selectorString = adSelectors.join(", ");
  let removedCount = 0;

  try {
    document.querySelectorAll(selectorString).forEach(ad => {
      ad.remove();
      removedCount++;
    });
  } catch(e) {}

  // Apply user custom selectors
  if (customSelectors.length > 0) {
    try {
      document.querySelectorAll(customSelectors.join(", ")).forEach(el => {
        el.remove();
        removedCount++;
      });
    } catch (e) { console.warn("AdBlockX: Invalid custom selector", e); }
  }

  // Platform-specific
  if (window.location.hostname.includes("youtube.com")) {
    removedCount += removeYouTubeAds();
  } else {
    removedCount += removeGenericVideoAds();
  }

  // Cookie/GDPR banner dismissal
  removedCount += dismissCookieBanners();

  if (removedCount > 0) {
    chrome.runtime.sendMessage({ type: 'AD_REMOVED', count: removedCount });
  }
}

// ─── GDPR / Cookie Banner Auto-Dismissal ─────────────────────────────────────
function dismissCookieBanners() {
  let count = 0;

  // 1. Try clicking "Reject All" / "Decline" buttons first (privacy-first)
  const rejectPatterns = [
    'reject all', 'decline all', 'reject cookies', 'decline',
    'no thanks', 'do not sell', 'opt out', 'refuse all'
  ];
  document.querySelectorAll('button, a[role="button"]').forEach(btn => {
    const text = (btn.innerText || btn.textContent || btn.value || '').toLowerCase().trim();
    if (rejectPatterns.some(p => text.includes(p))) {
      if (btn.offsetParent !== null) { // visible
        btn.click();
        count++;
      }
    }
  });

  // 2. Remove known GDPR overlay containers
  const bannerSelectors = [
    '#onetrust-banner-sdk', '#onetrust-consent-sdk',
    '#cookie-banner', '.cookie-banner', '.cookie-notice',
    '.cookie-consent', '#cookie-consent', '.gdpr-banner',
    '#gdpr-banner', '.consent-banner', '#consent-banner',
    '.cc-window', '.cc-banner', '.js-cookie-banner',
    '#CybotCookiebotDialog', '.cookiealert', '.cookies-eu-banner',
    '[class*="cookie-bar"]', '[id*="cookie-notification"]',
    '[class*="consent-modal"]', '[class*="privacy-banner"]',
    '.fc-ab-root', '.fc-dialog', // Funding Choices (Google)
    '#sp-cc', '#sp-cc-root'      // Sourcepoint CMP
  ];

  bannerSelectors.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(el => {
        el.remove();
        count++;
      });
    } catch(e) {}
  });

  // 3. Remove fixed/sticky overlays that look like consent walls
  document.querySelectorAll('div[class*="modal"], div[class*="overlay"]').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 9000) {
      const text = (el.innerText || '').toLowerCase();
      if (text.includes('cookie') || text.includes('consent') || text.includes('privacy') || text.includes('gdpr')) {
        el.remove();
        count++;
        // Also try removing the scroll-lock on body
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    }
  });

  return count;
}

// ─── Generic Video Ad Removal ─────────────────────────────────────────────────
function removeGenericVideoAds() {
  let count = 0;

  const skipSelectors = [
    '.skip-ad', '.skip_ad', '.video-skip', '.ad-skip',
    '[aria-label="Skip Ad"]', '[class*="skip-button"]',
    '.close-ad', '.ad-close', '.close_ad'
  ];

  document.querySelectorAll(skipSelectors.join(', ')).forEach(btn => {
    if (btn.offsetParent !== null) {
      btn.click();
      count++;
    }
  });

  // High z-index ad overlays
  document.querySelectorAll('div[style*="z-index"], div[class*="overlay"], div[class*="modal"]').forEach(overlay => {
    const style = window.getComputedStyle(overlay);
    const zIndex = parseInt(style.zIndex);
    if (!isNaN(zIndex) && zIndex > 1000) {
      const cls = overlay.className || '';
      const id  = overlay.id || '';
      const txt = (overlay.innerText || '').toLowerCase();
      if (overlay.querySelector('iframe') || cls.includes('ad') || id.includes('ad') || txt.includes('advertisement')) {
        overlay.remove();
        count++;
      }
    }
  });

  return count;
}

// ─── YouTube-Specific Ad Removal ──────────────────────────────────────────────
let ytAdMuted = false;

function removeYouTubeAds() {
  let count = 0;

  const video = document.querySelector('video');
  const adShowing = document.querySelector('.ad-showing, .ad-interrupting');

  const skipSelectors = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.videoAdUiSkipButton',
    '.ytp-skip-ad-button',
    '[id^="skip-button:"]',
    '.ytp-ad-text.ytp-ad-skip-button-text'
  ];
  const skipButtons = document.querySelectorAll(skipSelectors.join(', '));

  if (adShowing && video) {
    // ✅ FIX: Mute during ad to avoid hearing audio burst
    if (!ytAdMuted) {
      ytAdMuted = true;
      video.muted = true;
    }

    // Fast-forward to end of ad
    if (!isNaN(video.duration) && video.duration > 0) {
      video.currentTime = video.duration;
    }
    video.playbackRate = 16.0;

  } else if (!adShowing && video) {
    // ✅ FIX: Reset playback rate and unmute once ad is gone
    if (ytAdMuted) {
      ytAdMuted = false;
      video.muted = false;
    }
    if (video.playbackRate !== 1.0) {
      video.playbackRate = 1.0;
    }
  }

  // Click skip buttons
  skipButtons.forEach(btn => {
    btn.click();
    count++;
  });

  // Close overlay ads
  document.querySelectorAll('.ytp-ad-overlay-close-button').forEach(btn => {
    btn.click();
    count++;
  });

  // Remove sidebar/feed ad containers
  const adContainerSels = [
    'ytd-ad-slot-renderer', 'ytd-promoted-sparkles-web-renderer',
    'ytd-display-ad-renderer', 'ytd-banner-promoted-video-renderer',
    'ytd-in-feed-ad-layout-renderer', 'ytd-statement-banner-renderer',
    'ytd-promoted-sparkles-text-search-renderer', 'ytd-compact-promoted-video-renderer',
    'ytd-video-masthead-ad-v3-renderer'
  ];
  document.querySelectorAll(adContainerSels.join(', ')).forEach(container => {
    container.remove();
    count++;
  });

  // Remove sponsored feed items
  document.querySelectorAll([
    'ytd-rich-item-renderer', 'ytd-compact-video-renderer',
    'ytd-video-renderer', 'ytd-rich-section-renderer', '.ytd-rich-grid-row'
  ].join(', ')).forEach(item => {
    const text = item.innerText || '';
    if (
      text.includes('Sponsored') ||
      text.includes('Ad ·') ||
      item.querySelector('.ytd-badge-supported-renderer[aria-label="Sponsored"]') ||
      item.querySelector('#ad-badge') ||
      item.querySelector('.badge-shape-wiz--ad')
    ) {
      if (item.tagName === 'YTD-RICH-SECTION-RENDERER' || item.tagName === 'YTD-RICH-ITEM-RENDERER') {
        item.remove();
      } else {
        item.style.display = 'none';
      }
      count++;
    }
  });

  return count;
}

// ─── Debounce ─────────────────────────────────────────────────────────────────
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const debouncedRemoveAds = debounce(removeAds, 500);
const fastRemoveAds      = debounce(removeAds, 50);

// ─── MutationObserver ─────────────────────────────────────────────────────────
const observer = new MutationObserver((mutations) => {
  let shouldRun = false;
  for (const mutation of mutations) {
    // Watch for new nodes OR attribute changes (some ads show via class changes)
    if (mutation.addedNodes.length > 0 || mutation.type === 'attributes') {
      shouldRun = true;
      break;
    }
  }
  if (shouldRun) {
    window.location.hostname.includes("youtube.com") ? fastRemoveAds() : debouncedRemoveAds();
  }
});

function startObserving() {
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    removeAds();
  } else {
    new MutationObserver((mutations, obs) => {
      if (document.body) {
        obs.disconnect();
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        removeAds();
      }
    }).observe(document.documentElement, { childList: true });
  }
}

// ─── Initialize ───────────────────────────────────────────────────────────────
checkBlockingStatus().then(enabled => {
  if (enabled) {
    injectStealthPayload();
    loadCustomSelectors();
    startObserving();
  }
});

// Re-check on YouTube SPA navigation
window.addEventListener('yt-navigate-finish', () => {
  ytAdMuted = false; // reset mute state per navigation
  checkBlockingStatus().then(enabled => {
    if (enabled) removeAds();
  });
});
