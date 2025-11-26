function removeAds() {
  const adSelectors = [
    ".ad-banner",
    ".ad-container",
    ".ad-wrapper",
    ".ad-popup",
    ".ad-native",
    ".google-auto-placed",
    ".adsbygoogle",
    // Add more specific selectors here based on observation
    "div[id^='google_ads_']",
    "div[id^='div-gpt-ad']"
  ];

  const selectorString = adSelectors.join(", ");
  const ads = document.querySelectorAll(selectorString);

  let removedCount = 0;
  ads.forEach(ad => {
    ad.remove();
    removedCount++;
  });

  // YouTube Specific Logic
  if (window.location.hostname.includes("youtube.com")) {
    removeYouTubeAds();
  } else {
    // Generic Video/Streaming Logic
    removeGenericVideoAds();
  }

  if (removedCount > 0) {
    console.log(`AdBlocker: Removed ${removedCount} ads.`);
  }
}

function removeGenericVideoAds() {
  // 1. Generic Video Ad Skipping
  // Look for common "Skip" buttons in video players
  const skipSelectors = [
    '.skip-ad', '.skip_ad', '.video-skip', '.ad-skip',
    '[aria-label="Skip Ad"]', '[class*="skip-button"]',
    '.close-ad', '.ad-close', '.close_ad'
  ];

  const skipButtons = document.querySelectorAll(skipSelectors.join(', '));
  skipButtons.forEach(btn => {
    // Ensure it's visible and clickable
    if (btn.offsetParent !== null) {
      btn.click();
      console.log('AdBlocker: Clicked generic skip button');
    }
  });

  // 2. Overlay Removal (Pop-ups over video)
  // Heuristic: Divs with high z-index that cover the screen or video
  const overlays = document.querySelectorAll('div[style*="z-index"], div[class*="overlay"], div[class*="modal"]');
  overlays.forEach(overlay => {
    const style = window.getComputedStyle(overlay);
    const zIndex = parseInt(style.zIndex);

    // Check if it's a high z-index overlay that might be an ad
    // This is risky, so we check for ad-like keywords in class/id or if it contains an iframe
    if (!isNaN(zIndex) && zIndex > 1000) {
      if (overlay.querySelector('iframe') ||
        overlay.className.includes('ad') ||
        overlay.id.includes('ad') ||
        overlay.className.includes('popup') ||
        overlay.innerText.toLowerCase().includes('advertisement')) {

        overlay.remove();
        console.log('AdBlocker: Removed generic overlay');
      }
    }
  });
}

function removeYouTubeAds() {
  // 1. Video Ads (Skip/Fast Forward)
  const video = document.querySelector('video');
  const adShowing = document.querySelector('.ad-showing');

  if (adShowing && video) {
    // Fast forward
    if (!isNaN(video.duration)) {
      video.currentTime = video.duration;
    }

    // Click Skip Button
    const skipButtons = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .videoAdUiSkipButton');
    skipButtons.forEach(btn => btn.click());

    // Click Overlay Close Button
    const overlayClose = document.querySelectorAll('.ytp-ad-overlay-close-button');
    overlayClose.forEach(btn => btn.click());
  }

  // 2. Sidebar/Feed Ads (Sponsored)
  // Remove "Sponsored" items in feed
  const sponsoredItems = document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer');
  sponsoredItems.forEach(item => {
    // Check if it contains "Sponsored" text or badge
    if (item.innerText.includes('Sponsored') || item.querySelector('#ad-badge-container')) {
      item.style.display = 'none';
    }
  });

  // Remove specific ad containers
  const adContainers = document.querySelectorAll('ytd-ad-slot-renderer, ytd-promoted-sparkles-web-renderer');
  adContainers.forEach(container => container.remove());
}

// Debounce function to limit how often removeAds runs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Run immediately if possible
if (document.documentElement) {
  removeAds();
}

// Observe DOM changes with debouncing
const debouncedRemoveAds = debounce(removeAds, 500);
// For YouTube, we need faster reaction for video ads
const fastRemoveAds = debounce(removeAds, 50);

const observer = new MutationObserver((mutations) => {
  // Only run if nodes were added
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

// Start observing as soon as body is available
function startObserving() {
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    removeAds(); // Initial sweep on body load
  } else {
    // Wait for body
    new MutationObserver((mutations, obs) => {
      if (document.body) {
        obs.disconnect();
        observer.observe(document.body, { childList: true, subtree: true });
        removeAds();
      }
    }).observe(document.documentElement, { childList: true });
  }
}

startObserving();

// Final sweep when DOM is ready
document.addEventListener('DOMContentLoaded', removeAds);
window.addEventListener('load', removeAds);
// YouTube uses pushState, so we need to re-run on navigation
window.addEventListener('yt-navigate-finish', removeAds);
