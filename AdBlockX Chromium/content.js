// AdBlockX - Content Script v1.3 [Restored & Merged]

let isBlockingEnabled = true;
let stealthModeEnabled = false;
let blockCookiesEnabled = false;
let antiFingerprintEnabled = false;
let httpsEverywhereEnabled = false;

// ─── Custom Right-Click Blocking ──────────────────────────────────────────────
let lastRightClickedElement = null;
let customSelectors = [];

document.addEventListener('contextmenu', (e) => {
  lastRightClickedElement = e.target;
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BLOCK_CUSTOM_ELEMENT' && lastRightClickedElement) {
    blockCustomElement(lastRightClickedElement, message.scope);
  } else if (message.type === 'ACTIVATE_PICKER') {
    activateElementPicker();
  }
});

function sanitizeClassName(c) {
  return c.replace(/[^a-zA-Z0-9_-]/g, '');
}

function isValidSelector(selector) {
  if (!selector || typeof selector !== 'string') return false;
  if (selector.length > 500) return false;
  try {
    document.querySelectorAll(selector);
    return true;
  } catch (e) { return false; }
}

function generateSelector(el) {
  if (!el || el.tagName === 'BODY' || el.tagName === 'HTML') return null;
  if (el.id) {
    const safeId = sanitizeClassName(el.id);
    if (safeId) return `#${safeId}`;
  }

  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':')).map(c => `.${sanitizeClassName(c)}`).join('');
    if (classes && isValidSelector(classes)) {
      try {
        if (document.querySelectorAll(classes).length === 1) return classes;
      } catch (e) { }
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
      removeAds();
    }
  });
}

// ─── Status Sync ─────────────────────────────────────────────────────────────
async function checkBlockingStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isEnabled', 'whitelist', 'stealthModeEnabled', 'blockCookies', 'antiFingerprint', 'httpsEverywhere'], (result) => {
      const isEnabled = result.isEnabled !== false;
      stealthModeEnabled = result.stealthModeEnabled === true;
      blockCookiesEnabled = result.blockCookies === true;
      antiFingerprintEnabled = result.antiFingerprint === true;
      httpsEverywhereEnabled = result.httpsEverywhere === true;
      
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

// ─── Pro Privacy: Anti-Fingerprinting (Canvas / Navigator) ───────────────────
function injectAntiFingerprint() {
  if (!antiFingerprintEnabled) return;
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      try {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function() {
          if (this.width > 0 && this.height > 0) {
            const ctx = this.getContext('2d');
            if (ctx) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
              ctx.fillRect(0, 0, 1, 1);
            }
          }
          return originalToDataURL.apply(this, arguments);
        };
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      } catch(e) {}
    })();
  `;
  (document.head || document.documentElement).prepend(script);
  script.remove();
}

// ─── Pro Stealth: Anti-Adblock Bypass ────────────────────────────────────────
function injectStealthPayload() {
  if (!stealthModeEnabled) return;

  const script = document.createElement('script');
  script.textContent = `
    (function() {
      try {
        const noop = () => {};
        const fakeABD = { onDetected: noop, onNotDetected: noop, check: noop };
        ['blockAdBlock','FuckAdBlock','adblockDetector','BlockAdBlock','AdBlockDetector'].forEach(name => {
          try { Object.defineProperty(window, name, { value: fakeABD, writable: false, configurable: true }); } catch(e) {}
        });
        window.isAdBlockActive = false;

        const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
        const originalOffsetWidth  = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
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
      } catch(e) {}
    })();
  `;
  (document.head || document.documentElement).prepend(script);
  script.remove();
}

// ─── Pro Blocking: Cookie Shield ─────────────────────────────────────────────
function injectCookieHider() {
  if (!blockCookiesEnabled) return;
  const style = document.createElement('style');
  style.id = 'adblockx-cookie-hider';
  style.textContent = `
    [class*="cookie-banner"], [id*="cookie-banner"], [class*="cookie-notice"], [id*="cookie-notice"],
    [class*="cookie-consent"], [id*="cookie-consent"], [class*="gdpr-banner"], [id*="gdpr-banner"],
    [id*="onetrust-consent-sdk"], .qc-cmp-ui-container, .fc-ab-root, .fc-dialog, #sp-cc, #sp-cc-root {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// ─── HTTPS Everywhere: Upgrade Links ────────────────────────────────────────
function injectHttpsUpgrade() {
  if (!httpsEverywhereEnabled) return;
  const style = document.createElement('style');
  style.id = 'adblockx-https-upgrade';
  style.textContent = `
    a[href^="http://"] { transition: none !important; }
  `;
  (document.head || document.documentElement).appendChild(style);
  
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      try {
        var upgradeLink = function(link) {
          var href = link.getAttribute('href');
          if (href && href.startsWith('http://')) {
            link.setAttribute('href', href.replace('http://', 'https://'));
          }
        };
        document.querySelectorAll('a[href^="http://"]').forEach(upgradeLink);
        new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === 1) {
                if (node.tagName === 'A') upgradeLink(node);
                node.querySelectorAll && node.querySelectorAll('a[href^="http://"]').forEach(upgradeLink);
              }
            });
          });
        }).observe(document.documentElement, { childList: true, subtree: true });
      } catch(e) {}
    })();
  `;
  (document.head || document.documentElement).prepend(script);
  script.remove();
}

// ─── Element Picker (Visual Selector) ───────────────────────────────────────
let pickerActive = false;
let pickerOverlay = null;
let pickerTooltip = null;
let pickerDialog = null;
let hoveredElement = null;
let highlightedElement = null;

function activateElementPicker() {
  if (pickerActive) return;
  pickerActive = true;
  
  createPickerOverlay();
  document.body.style.cursor = 'crosshair';
}

function createPickerOverlay() {
  pickerOverlay = document.createElement('div');
  pickerOverlay.id = 'adblockx-picker-overlay';
  pickerOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 2147483646; pointer-events: none;
  `;
  
  pickerTooltip = document.createElement('div');
  pickerTooltip.id = 'adblockx-picker-tooltip';
  pickerTooltip.style.cssText = `
    position: fixed; padding: 8px 12px; background: #1e293b; color: #fff;
    border-radius: 6px; font-size: 12px; font-family: system-ui, sans-serif;
    z-index: 2147483647; pointer-events: none; display: none; max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); line-height: 1.4;
  `;
  
  pickerDialog = document.createElement('div');
  pickerDialog.id = 'adblockx-picker-dialog';
  pickerDialog.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #fff; border-radius: 12px; padding: 24px; z-index: 2147483647;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4); font-family: system-ui, sans-serif;
    display: none; min-width: 320px; max-width: 90vw;
  `;
  
  const hint = document.createElement('div');
  hint.id = 'adblockx-picker-hint';
  hint.style.cssText = `
    position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: #fff; padding: 10px 20px; border-radius: 20px;
    font-size: 13px; font-family: system-ui, sans-serif; z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  hint.innerHTML = '🎯 <b>Element Picker Active</b> — Click element to block, <b>Esc</b> to cancel';
  
  document.body.appendChild(pickerOverlay);
  document.body.appendChild(pickerTooltip);
  document.body.appendChild(pickerDialog);
  document.body.appendChild(hint);
  
  document.addEventListener('mouseover', pickerMouseOver, true);
  document.addEventListener('mouseout', pickerMouseOut, true);
  document.addEventListener('click', pickerClick, true);
  document.addEventListener('keydown', pickerKeyDown, true);
}

function pickerMouseOver(e) {
  if (!pickerActive || e.target.id?.startsWith('adblockx-')) return;
  
  if (highlightedElement) {
    highlightedElement.style.outline = '';
  }
  
  hoveredElement = e.target;
  hoveredElement.style.outline = '2px solid #ef4444';
  highlightedElement = hoveredElement;
  
  const tag = escapeHtml(hoveredElement.tagName.toLowerCase());
  const id = hoveredElement.id ? `#${escapeHtml(sanitizeClassName(hoveredElement.id))}` : '';
  const cls = hoveredElement.className && typeof hoveredElement.className === 'string' 
    ? '.' + hoveredElement.className.trim().split(/\s+/).slice(0, 2).map(sanitizeClassName).join('.') 
    : '';
  const selector = generateSelector(hoveredElement);
  
  pickerTooltip.innerHTML = `
    <b style="color:#c084fc">${tag.toUpperCase()}</b><br>
    <span style="color:#94a3b8">${id}${escapeHtml(cls)}</span><br>
    <span style="color:#86efac; font-size:11px">${escapeHtml(selector) || 'complex selector'}</span>
  `;
  pickerTooltip.style.display = 'block';
  
  const rect = hoveredElement.getBoundingClientRect();
  pickerTooltip.style.top = (rect.bottom + 8) + 'px';
  pickerTooltip.style.left = rect.left + 'px';
  
  if (rect.bottom + 80 > window.innerHeight) {
    pickerTooltip.style.top = (rect.top - pickerTooltip.offsetHeight - 8) + 'px';
  }
}

function pickerMouseOut(e) {
  if (e.target === hoveredElement && !e.target.id?.startsWith('adblockx-')) {
    pickerTooltip.style.display = 'none';
  }
}

function pickerClick(e) {
  if (!pickerActive) return;
  if (e.target.id?.startsWith('adblockx-')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const target = hoveredElement || e.target;
  const selector = generateSelector(target);
  
  if (!selector) {
    showPickerError('Cannot generate selector for this element');
    return;
  }
  
  showPickerDialog(target, selector);
}

function showPickerDialog(target, selector) {
  pickerDialog.innerHTML = `
    <h3 style="margin:0 0 16px;font-size:16px;color:#1e293b">Block Element?</h3>
    <div style="background:#f1f5f9;padding:12px;border-radius:8px;margin-bottom:16px">
      <div style="color:#64748b;font-size:11px;margin-bottom:4px">SELECTOR</div>
      <code style="color:#1e293b;font-size:12px;word-break:break-all">${escapeHtml(selector)}</code>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="radio" name="picker-scope" value="domain" checked>
        <span style="font-size:13px">This page only</span>
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="radio" name="picker-scope" value="global">
        <span style="font-size:13px">Everywhere</span>
      </label>
    </div>
    <div style="display:flex;gap:8px">
      <button id="adblockx-picker-block" style="
        flex:1;padding:10px;background:#ef4444;color:#fff;border:none;border-radius:6px;
        cursor:pointer;font-weight:600">Block Element</button>
      <button id="adblockx-picker-cancel" style="
        flex:1;padding:10px;background:#e2e8f0;color:#475569;border:none;border-radius:6px;
        cursor:pointer">Cancel</button>
    </div>
  `;
  
  pickerDialog.style.display = 'block';
  
  document.getElementById('adblockx-picker-block').onclick = () => {
    const scope = document.querySelector('input[name="picker-scope"]:checked').value;
    target.remove();
    blockCustomElement(target, scope);
    deactivatePicker();
  };
  
  document.getElementById('adblockx-picker-cancel').onclick = () => {
    pickerDialog.style.display = 'none';
    deactivatePicker();
  };
}

function showPickerError(msg) {
  pickerDialog.innerHTML = `
    <h3 style="margin:0 0 16px;font-size:16px;color:#ef444b">Error</h3>
    <p style="color:#64748b;margin-bottom:16px">${escapeHtml(msg)}</p>
    <button id="adblockx-picker-error-close"
      style="width:100%;padding:10px;background:#e2e8f0;border:none;border-radius:6px;cursor:pointer">
      Close
    </button>
  `;
  pickerDialog.style.display = 'block';
  
  document.getElementById('adblockx-picker-error-close').onclick = () => {
    pickerDialog.style.display = 'none';
    deactivatePicker();
  };
}

function pickerKeyDown(e) {
  if (e.key === 'Escape') {
    deactivatePicker();
  }
}

function deactivatePicker() {
  pickerActive = false;
  
  if (highlightedElement) {
    highlightedElement.style.outline = '';
  }
  
  document.body.style.cursor = '';
  
  const hint = document.getElementById('adblockx-picker-hint');
  if (hint) hint.remove();
  if (pickerOverlay) pickerOverlay.remove();
  if (pickerTooltip) pickerTooltip.remove();
  if (pickerDialog) pickerDialog.remove();
  
  pickerOverlay = null;
  pickerTooltip = null;
  pickerDialog = null;
  hoveredElement = null;
  highlightedElement = null;
  
  document.removeEventListener('mouseover', pickerMouseOver, true);
  document.removeEventListener('mouseout', pickerMouseOut, true);
  document.removeEventListener('click', pickerClick, true);
  document.removeEventListener('keydown', pickerKeyDown, true);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Core Removal ───────────────────────────────────────────────────────────
function removeAds() {
  if (!isBlockingEnabled) return;

  const adSelectors = [
    ".ad-banner", ".ad-container", ".ad-wrapper", ".ad-slot", ".ad-unit", ".ad-zone", ".ad-block",
    ".google-auto-placed", ".adsbygoogle", "ins.adsbygoogle", "iframe[src*='doubleclick']",
    "iframe[src*='adservice']", "iframe[src*='googlesyndication']",
    "[class*='sponsored']", "[id*='sponsored']", "[data-ad]", "[data-ad-unit]",
    ".taboola-widget", "[id*='taboola']", "[id*='outbrain']", ".popup-ad", ".popunder"
  ];

  let removedCount = 0;
  try {
    document.querySelectorAll(adSelectors.join(", ")).forEach(ad => {
      ad.remove();
      removedCount++;
    });
  } catch (e) { }

  if (customSelectors.length > 0) {
    try {
      const validSelectors = customSelectors.filter(isValidSelector);
      if (validSelectors.length > 0) {
        document.querySelectorAll(validSelectors.join(", ")).forEach(el => {
          el.remove();
          removedCount++;
        });
      }
    } catch (e) { }
  }

  const hostname = window.location.hostname;
  const isYouTube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
  if (isYouTube) {
    removedCount += handleYouTube();
  } else {
    removedCount += dismissCookieBanners();
  }

  if (removedCount > 0) {
    chrome.runtime.sendMessage({ type: 'AD_REMOVED', count: removedCount });
  }
}

function handleYouTube() {
  let count = 0;
  const video = document.querySelector('video');
  const adShowing = document.querySelector('.ad-showing, .ad-interrupting');
  
  if (adShowing && video) {
    if (!isNaN(video.duration) && video.duration > 0) video.currentTime = video.duration;
    video.playbackRate = 16.0;
    video.muted = true;
  } else if (video && video.playbackRate !== 1.0) {
    video.playbackRate = 1.0;
    video.muted = false;
  }

  document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-overlay-close-button').forEach(b => {
    b.click();
    count++;
  });

  const annoyanceSels = ['ytd-enforcement-message-view-model', 'yt-playability-error-supported-renderers', '.ytp-ad-troubleshooter'];
  document.querySelectorAll(annoyanceSels.join(', ')).forEach(el => {
    if (el.innerText.includes('interruptions') || el.innerText.includes('Ad blockers')) {
      el.remove();
      if (video) video.load();
      count++;
    }
  });
  return count;
}

function dismissCookieBanners() {
  let count = 0;
  const rejectPatterns = ['reject all', 'decline all', 'reject cookies', 'decline', 'no thanks'];
  document.querySelectorAll('button, a[role="button"]').forEach(btn => {
    const text = (btn.innerText || btn.textContent || '').toLowerCase().trim();
    if (rejectPatterns.some(p => text.includes(p)) && btn.offsetParent !== null) {
      btn.click();
      count++;
    }
  });
  return count;
}

// ─── Mutation Management ─────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const debouncedRemove = debounce(removeAds, 300);

const observer = new MutationObserver(() => {
  debouncedRemove();
});

function startObserving() {
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    removeAds();
  } else {
    setTimeout(startObserving, 100);
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────────
checkBlockingStatus().then(enabled => {
  if (enabled) {
    injectStealthPayload();
    injectAntiFingerprint();
    injectCookieHider();
    injectHttpsUpgrade();
    startObserving();
    const host = window.location.hostname;
    chrome.storage.local.get([`custom_blocks_${host}`, 'custom_blocks_global'], (r) => {
      customSelectors = (r[`custom_blocks_${host}`] || []).concat(r['custom_blocks_global'] || []);
      removeAds();
    });
  }
});
