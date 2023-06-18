chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.type === 'script' && isAdUrl(details.url)) {
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ['blocking']
);

function isAdUrl(url) {
  // Add your custom logic to determine if the URL is an ad
  // You can use regular expressions or other methods to match ad URLs
  // For example, checking for common ad domains or patterns in the URL

  // Return true if it's an ad URL, false otherwise
  return url.includes("ad") || url.includes("advertisement");
}
