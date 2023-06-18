function removeAds() {
  const adSelectors = [
    // Example ad selectors for common ad elements
    ".ad-banner",
    ".ad-container",
    ".ad-wrapper"
  ];

  adSelectors.forEach(selector => {
    const ads = document.querySelectorAll(selector);
    ads.forEach(ad => {
      ad.remove();
    });
  });
}

const observer = new MutationObserver(removeAds);
observer.observe(document, { childList: true, subtree: true });

removeAds();
