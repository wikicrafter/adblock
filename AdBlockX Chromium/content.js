// AdBlockX - Content Script
let isBlockingEnabled = true;
let stealthModeEnabled = false;

// Custom Context Menu Blocking
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
  
  // Try classes if they seem unique enough (avoids picking up layout containers like .flex)
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':')).map(c => `.${c}`).join('');
    if (classes) {
      try {
        if (document.querySelectorAll(classes).length === 1) return classes;
      } catch(e) {}
    }
  }

  // Structural path fallback
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


// Check if blocking is enabled for this site
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

function injectStealthPayload() {
  if (!stealthModeEnabled) return;
  
  const script = document.createElement('script');
  script.textContent = `
    try {
      // Mock common Anti-Adblock variables to fool detectors
      Object.defineProperty(window, 'blockAdBlock', { value: false, writable: true });
      Object.defineProperty(window, 'FuckAdBlock', { value: false, writable: true });
      window.isAdBlockActive = false;
      window.adblock = false;
      window.adblocker = false;
      window.hasAdBlocker = false;
    } catch (e) {}
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove(); // Remove immediately to keep DOM perfectly clean
}

function loadCustomSelectors() {
  const host = window.location.hostname;
  chrome.storage.local.get([`custom_blocks_${host}`, 'custom_blocks_global'], (result) => {
    customSelectors = (result[`custom_blocks_${host}`] || []).concat(result['custom_blocks_global'] || []);
    if (customSelectors.length > 0) removeAds();
  });
}

function removeAds() {
  if (!isBlockingEnabled) return;

  const adSelectors = [
    ".ad-banner", ".ad-container", ".ad-wrapper", ".ad-popup", 
    ".ad-native", ".google-auto-placed", ".adsbygoogle",
    "div[id^='google_ads_']", "div[id^='div-gpt-ad']",
    ".top-ads-container", ".sidebar-ads"
  ];

  const selectorString = adSelectors.join(", ");
  const ads = document.querySelectorAll(selectorString);

  let removedCount = 0;
  ads.forEach(ad => {
    ad.remove();
    removedCount++;
  });

  // Apply User Custom Blocked Selectors
  if (customSelectors.length > 0) {
    try {
      const customElements = document.querySelectorAll(customSelectors.join(", "));
      customElements.forEach(el => {
        el.remove();
        removedCount++;
      });
    } catch (e) { console.error("Invalid custom selector", e); }
  }

  // YouTube Specific Logic
  if (window.location.hostname.includes("youtube.com")) {
    removedCount += removeYouTubeAds();
  } else {
    removedCount += removeGenericVideoAds();
  }

  if (removedCount > 0) {
    chrome.runtime.sendMessage({ type: 'AD_REMOVED', count: removedCount });
    console.log(`AdBlockX: Blocked ${removedCount} elements.`);
  }
}

function removeGenericVideoAds() {
  let count = 0;
  // 1. Generic Video Ad Skipping
  const skipSelectors = [
    '.skip-ad', '.skip_ad', '.video-skip', '.ad-skip',
    '[aria-label="Skip Ad"]', '[class*="skip-button"]',
    '.close-ad', '.ad-close', '.close_ad'
  ];

  const skipButtons = document.querySelectorAll(skipSelectors.join(', '));
  skipButtons.forEach(btn => {
    if (btn.offsetParent !== null) {
      btn.click();
      count++;
    }
  });

  // 2. Overlay Removal
  const overlays = document.querySelectorAll('div[style*="z-index"], div[class*="overlay"], div[class*="modal"]');
  overlays.forEach(overlay => {
    const style = window.getComputedStyle(overlay);
    const zIndex = parseInt(style.zIndex);

    if (!isNaN(zIndex) && zIndex > 1000) {
      if (overlay.querySelector('iframe') ||
          overlay.className.includes('ad') ||
          overlay.id.includes('ad') ||
          overlay.innerText.toLowerCase().includes('advertisement')) {
        overlay.remove();
        count++;
      }
    }
  });
  return count;
}

function removeYouTubeAds() {
  let count = 0;
  // 1. Video Ads (Skip/Fast Forward)
  const video = document.querySelector('video');
  const adShowing = document.querySelector('.ad-showing, .ad-interrupting');
  
  // Expanded list of known YouTube skip button classes/selectors
  const skipSelectors = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.videoAdUiSkipButton',
    '.ytp-skip-ad-button',
    '[id^="skip-button:"]',
    '.ytp-ad-text.ytp-ad-skip-button-text'
  ];
  const skipButtons = document.querySelectorAll(skipSelectors.join(', '));

  // If we detect an ad showing state OR we see a skip button
  if ((adShowing || skipButtons.length > 0) && video) {
    // Fast forward to end
    if (!isNaN(video.duration) && video.duration > 0) {
      video.currentTime = video.duration;
    }
    // Also speed up playback just in case seeking is blocked
    video.playbackRate = 16.0;
  }

  // Click any skip buttons that are visible
  skipButtons.forEach(btn => {
    btn.click();
    count++;
  });

  const overlayClose = document.querySelectorAll('.ytp-ad-overlay-close-button');
  overlayClose.forEach(btn => {
    btn.click();
    count++;
  });

  // 2. Sidebar/Feed Ads (Specific Containers)
  const adContainers = document.querySelectorAll('ytd-ad-slot-renderer, ytd-promoted-sparkles-web-renderer, ytd-display-ad-renderer, ytd-banner-promoted-video-renderer, ytd-in-feed-ad-layout-renderer, ytd-statement-banner-renderer');
  adContainers.forEach(container => {
    container.remove();
    count++;
  });

  // 3. "Sponsored" injected feed items (Masthead & Search)
  const feedItems = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-rich-section-renderer, .ytd-rich-grid-row');
  feedItems.forEach(item => {
    // Look for sponsored text or ad badges aggressively
    const text = item.innerText || '';
    if (
      text.includes('Sponsored') || 
      text.includes('Ad ·') ||
      item.querySelector('.ytd-badge-supported-renderer[aria-label="Sponsored"]') ||
      item.querySelector('#ad-badge') || 
      item.querySelector('.badge-shape-wiz--ad')
    ) {
      // Small safeguard to not hide the entire page if something goes wrong
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

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedRemoveAds = debounce(removeAds, 500);
const fastRemoveAds = debounce(removeAds, 50);

const observer = new MutationObserver((mutations) => {
  let shouldRun = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldRun = true;
      break;
    }
  }

  if (shouldRun) {
    if (window.location.hostname.includes("youtube.com")) {
      fastRemoveAds();
    } else {
      debouncedRemoveAds();
    }
  }
});

function startObserving() {
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    removeAds();
  } else {
    new MutationObserver((mutations, obs) => {
      if (document.body) {
        obs.disconnect();
        observer.observe(document.body, { childList: true, subtree: true });
        removeAds();
      }
    }).observe(document.documentElement, { childList: true });
  }
}

// Initialize
checkBlockingStatus().then(enabled => {
  if (enabled) {
    injectStealthPayload();
    loadCustomSelectors();
    startObserving();
  }
});

// Re-check on YouTube navigation (SPA)
window.addEventListener('yt-navigate-finish', () => {
  checkBlockingStatus().then(enabled => {
    if (enabled) removeAds();
  });
});
