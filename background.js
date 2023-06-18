chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.url.includes("youtube.com") && details.type === 'script') {
      return { cancel: true };
    }
  },
  { urls: ["*://*.youtube.com/*/base.js"] },
  ['blocking']
);
