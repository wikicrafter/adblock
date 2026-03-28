// AdBlockX - Background Service Worker

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
});

// Reset session counter on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ adsBlockedSession: 0 });
});

// Initial session counter set
chrome.storage.local.set({ adsBlockedSession: 0 });

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "block-element-domain" || info.menuItemId === "block-element-global") {
    const scope = info.menuItemId === "block-element-domain" ? "domain" : "global";
    chrome.tabs.sendMessage(tab.id, { 
      type: 'BLOCK_CUSTOM_ELEMENT', 
      scope: scope 
    });
  }
});

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

      // Update badge text if needed (shorten if > 999)
      const displayCount = newTotal > 999 ? (newTotal / 1000).toFixed(1) + 'k' : newTotal.toString();
      chrome.action.setBadgeText({ text: displayCount });
      chrome.action.setBadgeBackgroundColor({ color: '#6366f1' }); // Indigo color
    });
  }
});
