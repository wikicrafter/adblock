document.addEventListener('DOMContentLoaded', () => {
  const powerToggle = document.getElementById('power-toggle');
  const stealthToggle = document.getElementById('stealth-toggle');
  const statsSession = document.getElementById('stats-session');
  const statsTotal = document.getElementById('stats-total');
  const statusText = document.getElementById('status-text');
  const statusCard = document.getElementById('status-card');
  const whitelistBtn = document.getElementById('whitelist-site');

  // Load initial state
  chrome.storage.local.get(['isEnabled', 'stealthModeEnabled', 'adsBlockedTotal', 'adsBlockedSession', 'whitelist'], (result) => {
    const isEnabled = result.isEnabled !== false;
    powerToggle.checked = isEnabled;
    stealthToggle.checked = result.stealthModeEnabled === true;
    
    statsSession.textContent = result.adsBlockedSession || 0;
    statsTotal.textContent = result.adsBlockedTotal || 0;
    updateStatusUI(isEnabled);
    
    // Check if current site is whitelisted
    checkWhitelistStatus(result.whitelist || []);
  });

  // Toggle logic
  powerToggle.addEventListener('change', () => {
    const enabled = powerToggle.checked;
    chrome.storage.local.set({ isEnabled: enabled });
    updateStatusUI(enabled);
  });

  stealthToggle.addEventListener('change', () => {
    chrome.storage.local.set({ stealthModeEnabled: stealthToggle.checked });
  });

  function updateStatusUI(enabled) {
    if (enabled) {
      statusText.textContent = 'Protection Active';
      statusCard.classList.remove('disabled');
      statusText.style.color = '#22c55e'; // Success green
    } else {
      statusText.textContent = 'Protection Paused';
      statusCard.classList.add('disabled');
      statusText.style.color = '#ef4444'; // Danger red
    }
  }

  async function checkWhitelistStatus(whitelist) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('http')) {
      const domain = new URL(tab.url).hostname;
      if (whitelist.includes(domain)) {
        whitelistBtn.textContent = 'Remove from Whitelist';
        statusText.textContent = 'Site Whitelisted';
        statusText.style.color = '#94a3b8'; // Muted
      } else {
        whitelistBtn.textContent = 'Whitelist this site';
      }
    } else {
      whitelistBtn.disabled = true;
      whitelistBtn.style.opacity = '0.5';
    }
  }

  // Whitelist button logic
  whitelistBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const domain = new URL(tab.url).hostname;
      chrome.storage.local.get(['whitelist'], (result) => {
        let whitelist = result.whitelist || [];
        if (whitelist.includes(domain)) {
          whitelist = whitelist.filter(d => d !== domain);
          whitelistBtn.textContent = 'Whitelist this site';
        } else {
          whitelist.push(domain);
          whitelistBtn.textContent = 'Remove from Whitelist';
        }
        
        chrome.storage.local.set({ whitelist: whitelist }, () => {
          chrome.tabs.reload(tab.id);
          window.close();
        });
      });
    }
  });

  // Element Picker button logic
  const pickerBtn = document.getElementById('element-picker');
  if (pickerBtn) {
    pickerBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_PICKER' }, () => {
          window.close();
        });
      }
    });
  }

  // Report missing ad logic
  const reportBtn = document.getElementById('report-ad');
  if (reportBtn) {
    reportBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        let domain = 'Unknown Domain';
        try { domain = new URL(tab.url).hostname; } catch (e) {}
        
        const issueUrl = `https://github.com/wikicrafter/adblock/issues/new?title=Ad+Report:+${domain}&body=**URL:**+${encodeURIComponent(tab.url)}%0A%0A**Description:**+I+am+seeing+an+ad+on+this+page.`;
        chrome.tabs.create({ url: issueUrl });
      }
    });
  }

  // Listener for real-time stat updates
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.adsBlockedTotal) {
        statsTotal.textContent = changes.adsBlockedTotal.newValue;
      }
      if (changes.adsBlockedSession) {
        statsSession.textContent = changes.adsBlockedSession.newValue;
      }
    }
  });

  // Handle Custom Domain Blocking
  const addCustomDomainBtn = document.getElementById('add-custom-domain');
  const customDomainInput = document.getElementById('custom-domain-input');
  
  if (addCustomDomainBtn && customDomainInput) {
    addCustomDomainBtn.addEventListener('click', () => {
      let domain = customDomainInput.value.trim();
      if (domain) {
        domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
        if (!domainRegex.test(domain)) {
          customDomainInput.placeholder = 'Invalid domain!';
          setTimeout(() => customDomainInput.placeholder = 'e.g. annoying-ads.com', 2000);
          return;
        }
        chrome.runtime.sendMessage({ type: 'ADD_DYNAMIC_RULE', domain: domain });
        customDomainInput.value = '';
        customDomainInput.placeholder = 'Domain blocked!';
        setTimeout(() => customDomainInput.placeholder = 'e.g. annoying-ads.com', 2000);
      }
    });
  }
  // Handle Settings Page
  const settingsBtn = document.getElementById('open-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });
  }
});
