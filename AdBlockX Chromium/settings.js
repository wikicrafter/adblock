document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.getElementById('reset-button');
  const whitelistContainer = document.getElementById('whitelist-container');
  const customBlocksContainer = document.getElementById('custom-blocks-container');
  const syncBtn = document.getElementById('sync-now-button');
  const syncStatus = document.getElementById('sync-status');
  const resetStatsBtn = document.getElementById('reset-stats-button');
  const totalBlockedVal = document.getElementById('total-blocked-val');
  const sessionBlockedVal = document.getElementById('session-blocked-val');
  const sidebarTotalStat = document.getElementById('sidebar-total-stat');
  const dataSavedVal = document.getElementById('data-saved-val');
  const timeSavedVal = document.getElementById('time-saved-val');
  const manualBlockBtn = document.getElementById('add-manual-block-btn');
  const manualBlockInput = document.getElementById('manual-block-input');
  const blockFeedback = document.getElementById('block-feedback');
  const blockedSearchInput = document.getElementById('blocked-search-input');
  
  // Privacy Toggles
  const socialToggle = document.getElementById('block-social-toggle');
  const cookiesToggle = document.getElementById('block-cookies-toggle');
  const fingerprintToggle = document.getElementById('anti-fingerprint-toggle');
  const httpsEverywhereToggle = document.getElementById('https-everywhere-toggle');

  let allDynamicRules = [];

  // Collapsible Logic
  const headers = document.querySelectorAll('.collapsible-header');
  headers.forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.search-box') || e.target.closest('.search-trigger')) return;
      const section = header.closest('.section');
      section.classList.toggle('collapsed');
    });
  });

  // Search Trigger Logic
  document.querySelectorAll('.search-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = trigger.closest('.section');
      const input = section.querySelector('input[type="text"]');
      section.classList.remove('collapsed');
      if (input) input.focus();
    });
  });

  // Sidebar Navigation Link Logic
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.remove('collapsed');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Load initial data
  loadWhitelist();
  loadCustomBlocks();
  loadEngineStatus();
  loadStats();
  loadPrivacySettings();

  function loadPrivacySettings() {
    chrome.storage.local.get(['blockSocial', 'blockCookies', 'antiFingerprint', 'httpsEverywhere'], (res) => {
      if (socialToggle) socialToggle.checked = res.blockSocial || false;
      if (cookiesToggle) cookiesToggle.checked = res.blockCookies || false;
      if (fingerprintToggle) fingerprintToggle.checked = res.antiFingerprint || false;
      if (httpsEverywhereToggle) httpsEverywhereToggle.checked = res.httpsEverywhere || false;
    });
  }

  [socialToggle, cookiesToggle, fingerprintToggle, httpsEverywhereToggle].forEach(toggle => {
    if (!toggle) return;
    toggle.addEventListener('change', () => {
      chrome.storage.local.set({
        blockSocial: socialToggle.checked,
        blockCookies: cookiesToggle.checked,
        antiFingerprint: fingerprintToggle.checked,
        httpsEverywhere: httpsEverywhereToggle.checked
      }, () => {
        chrome.runtime.sendMessage({ type: 'UPDATE_PRIVACY_RULES' });
      });
    });
  });

  function loadStats() {
    chrome.storage.local.get(['adsBlockedTotal', 'adsBlockedSession', 'usageHistory'], (result) => {
      const total = result.adsBlockedTotal || 0;
      if (totalBlockedVal) totalBlockedVal.textContent = total.toLocaleString();
      if (sidebarTotalStat) sidebarTotalStat.textContent = total.toLocaleString();
      if (sessionBlockedVal) sessionBlockedVal.textContent = (result.adsBlockedSession || 0).toLocaleString();

      // Calculate Savings
      const mbSaved = (total * 0.15).toFixed(1);
      const secondsSaved = total * 0.5;
      const minutesSaved = Math.round(secondsSaved / 60);

      if (dataSavedVal) dataSavedVal.textContent = `${mbSaved} MB`;
      if (timeSavedVal) timeSavedVal.textContent = `${minutesSaved} min`;

      // Render Chart
      renderChart(result.usageHistory || [0, 0, 0, 0, 0, 0, 0]);
    });
  }

  function renderChart(history) {
    const bars = document.querySelectorAll('.chart-bar');
    if (bars.length === 0) return;
    const max = Math.max(...history, 100);
    
    history.forEach((val, i) => {
      if (bars[i]) {
        const height = (val / max) * 100;
        bars[i].style.height = `${Math.max(height, 5)}%`;
        bars[i].setAttribute('title', `${val} blocks`);
      }
    });
  }

  function loadEngineStatus() {
    chrome.storage.local.get(['lastRemoteSync'], (result) => {
      const lastSync = result.lastRemoteSync;
      if (syncStatus) syncStatus.textContent = lastSync ? `Last checked: ${new Date(lastSync).toLocaleString()}` : 'Never synced';
    });
  }

  function loadWhitelist() {
    chrome.storage.local.get(['whitelist'], (result) => {
      renderList(whitelistContainer, result.whitelist || [], (domain) => {
        removeWhitelistDomain(domain);
      });
    });
  }

  function loadCustomBlocks() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      allDynamicRules = rules.map(r => ({
        id: r.id,
        domain: (r.condition.urlFilter || '').replace('||', '')
      })).sort((a, b) => a.domain.localeCompare(b.domain));

      renderList(customBlocksContainer, allDynamicRules, (id) => {
        removeCustomBlock(id);
      }, true);
    });
  }

  function filterBlockedSites() {
    const query = blockedSearchInput.value.toLowerCase().trim();
    const filtered = allDynamicRules.filter(item => item.domain.toLowerCase().includes(query));
    renderList(customBlocksContainer, filtered, (id) => removeCustomBlock(id), true);
  }

  if (blockedSearchInput) {
    blockedSearchInput.addEventListener('input', filterBlockedSites);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderList(container, items, deleteCallback, isComplex = false) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state">No entries found.</div>';
      return;
    }
    const visibleItems = items.slice(0, 100);
    container.innerHTML = '';
    visibleItems.forEach(item => {
      const domain = escapeHtml(isComplex ? item.domain : item);
      const id = isComplex ? item.id : item;
      const div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <span class="domain-name" title="${domain}">${domain}</span>
        <button class="btn-icon-danger" title="Unblock / Remove">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      `;
      div.querySelector('button').addEventListener('click', () => {
        deleteCallback(id);
        div.style.opacity = '0.5';
        setTimeout(() => div.remove(), 300);
      });
      container.appendChild(div);
    });
    if (items.length > 100) {
      const more = document.createElement('div');
      more.className = 'empty-state';
      more.textContent = `... and ${items.length - 100} more items.`;
      container.appendChild(more);
    }
  }

  function removeWhitelistDomain(domain) {
    chrome.storage.local.get(['whitelist'], (result) => {
      let whitelist = result.whitelist || [];
      whitelist = whitelist.filter(d => d !== domain);
      chrome.storage.local.set({ whitelist: whitelist });
    });
  }

  function removeCustomBlock(id) {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [id] });
  }

  // Manual Block Logic
  if (manualBlockBtn && manualBlockInput) {
    manualBlockBtn.addEventListener('click', () => {
      let domain = manualBlockInput.value.trim();
      if (!domain) return;
      domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        showFeedback('Please enter a valid domain (e.g. example.com)', 'error');
        return;
      }
      manualBlockBtn.disabled = true;
      chrome.runtime.sendMessage({ type: 'ADD_DYNAMIC_RULE', domain: domain }, () => {
        manualBlockBtn.disabled = false;
        manualBlockInput.value = '';
        showFeedback(`Successfully blocked ${domain}`, 'success');
        const managerSection = document.getElementById('section-manager');
        if (managerSection) managerSection.classList.remove('collapsed');
        loadCustomBlocks();
      });
    });
    manualBlockInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') manualBlockBtn.click(); });
  }

  function showFeedback(text, type) {
    if (!blockFeedback) return;
    blockFeedback.textContent = text;
    blockFeedback.className = `input-feedback feedback-${type}`;
    blockFeedback.style.opacity = '1';
    setTimeout(() => { blockFeedback.style.opacity = '0'; }, 3000);
  }

  // Sync Logic
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      syncBtn.disabled = true;
      const originalText = syncBtn.innerHTML;
      syncBtn.innerHTML = 'Syncing...';
      chrome.runtime.sendMessage({ type: 'FORCE_SYNC' }, () => {
        setTimeout(() => {
          syncBtn.disabled = false;
          syncBtn.innerHTML = originalText;
          loadEngineStatus();
          loadCustomBlocks();
        }, 1500);
      });
    });
  }

  // Reset Stats Logic
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      chrome.storage.local.set({ 
        adsBlockedTotal: 0, 
        adsBlockedSession: 0, 
        usageHistory: [0, 0, 0, 0, 0, 0, 0] 
      }, () => {
        loadStats();
        const originalText = resetStatsBtn.textContent;
        resetStatsBtn.textContent = 'Data Cleared!';
        setTimeout(() => resetStatsBtn.textContent = originalText, 2000);
      });
    });
  }

  // Full Reset Logic
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (resetBtn.dataset.confirming !== 'true') {
        resetBtn.dataset.confirming = 'true';
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = 'Confirm Reset?';
        setTimeout(() => { resetBtn.dataset.confirming = 'false'; resetBtn.innerHTML = originalText; }, 3000);
        return;
      }
      chrome.storage.local.clear(() => {
        const defaults = {
          isEnabled: true,
          stealthModeEnabled: false,
          adsBlockedTotal: 0,
          adsBlockedSession: 0,
          whitelist: [],
          blockSocial: false,
          blockCookies: false,
          antiFingerprint: false,
          httpsEverywhere: false,
          usageHistory: [0,0,0,0,0,0,0],
          lastAnalyticsDay: new Date().toISOString().split('T')[0]
        };
        chrome.storage.local.set(defaults, () => {
          chrome.declarativeNetRequest.getDynamicRules((rules) => {
            chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: rules.map(r => r.id) }, () => {
              location.reload();
            });
          });
        });
      });
    });
  }
});
