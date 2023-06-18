// Remove video overlay ads
function removeOverlayAds() {
  const overlayAds = document.querySelectorAll(".ytp-ad-overlay-slot");
  overlayAds.forEach(ad => {
    ad.remove();
  });
}

// Mutation observer to remove video overlay ads dynamically
const observer = new MutationObserver(removeOverlayAds);
observer.observe(document, { childList: true, subtree: true });

// Run the function on initial page load
removeOverlayAds();
