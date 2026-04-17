# AdBlockX

<div align="center">
  <img src="./AdBlockX%20Chromium/icons/icon128.png" alt="AdBlockX Logo" width="128" />


<h1>AdBlockX</h1>
  <p><strong>A Premium, High-Performance, Privacy-First Ad Blocker for Chromium Browsers.</strong></p>
  <p>Version 1.2 → 1.3 • Powered by ITFORSEC</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](manifest.json)
  [![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen.svg)](https://github.com/wikicrafter/adblock)
</div>

---

## 🚀 Why AdBlockX?

AdBlockX is a professional-grade ad blocking extension built entirely on Google's strict **Manifest V3** architecture. Unlike massive, legacy ad blockers that bloat your browser memory and secretly harvest telemetry, AdBlockX is engineered for raw speed, zero latency, and **absolute data privacy**. 

### 🆕 What's New in v1.3 (Security & Feature Update)

- **🔒 Enhanced Security** - Critical XSS vulnerabilities fixed, strict domain validation across all entry points
- **🔒 Allowlist Bug Fix** - Fixed critical bug where whitelisted domains were being blocked
- **🔐 HTTPS Everywhere** - Automatically upgrade HTTP connections to secure HTTPS
- **🎯 Visual Element Picker** - Click-to-select element blocking with hover preview (like uBlock Origin)
- **📊 Advanced Settings Page** - Full dashboard with statistics, charts, and feature toggles
- **⚡ Performance Optimized** - Better memory management and rule handling

---

## ✨ Detailed Feature Guide

### 1. **Zero-Latency Network Blocking**
**How it works:** You don't have to do anything! The moment you install AdBlockX, it uses native Chrome APIs (`declarativeNetRequest`) to silently sever connections to over 70+ major ad networks and tracking pixels before the browser even attempts to load them.

---

### 2. **Automatic Blocklist Syncing**
**How it works:** AdBlockX automatically downloads and validates new blocking rules from our GitHub-hosted blocklist every 30 days via the lightning-fast jsDelivr CDN.

**Security features:**
- ✅ Strict domain validation (only valid DNS names accepted)
- ✅ Protected allowlist (never blocks Google, GitHub, Chrome Web Store, etc.)
- ✅ Size limits (max 5,000 rules to prevent abuse)
- ✅ Content-type verification (JSON only)
- ✅ No duplicate rules
- ✅ Rate-limited to prevent bandwidth abuse

**Privacy guarantee:** The sync is completely anonymous. No IP logging, no tracking, no analytics. Just pure blocking rules.

---

### 3. **Custom Domain Blocking**
**How to use it:** Found an annoying ad domain that slipped through?
1. Click the AdBlockX shield icon in your toolbar
2. Scroll to the bottom of the popup
3. Type the domain (e.g., `annoying-ads.com`) into the input field
4. Click **"Block Domain"**
5. Done! AdBlockX will now block all requests to that domain across all websites

**Use cases:**
- Block specific analytics trackers
- Block annoying pop-up domains
- Block social media trackers
- Block cryptocurrency miners

---

### 4. **Visual Element Picker** ⭐ NEW
**How to use it:** A powerful, visual element selector similar to uBlock Origin.
1. Click the AdBlockX shield icon in your toolbar
2. Click the **"Element Picker"** button (purple/gradient style)
3. Hover over any element on the page - it will be highlighted with a red outline
4. Click to select - a dialog shows the generated CSS selector
5. Choose scope: **"This page only"** or **"Everywhere"**
6. Click **"Block Element"** to confirm
7. Press **Esc** at any time to cancel

**Pro tip:** The tooltip shows element info (tag, ID, class) to help you understand what will be blocked.

---

### 5. **HTTPS Everywhere** ⭐ NEW
**How to use it:** Automatically upgrade HTTP connections to secure HTTPS.
1. Open the settings page (click the gear icon in the popup)
2. Scroll to **"Advanced Privacy"** section
3. Toggle **"HTTPS Everywhere"** on
4. Done! All HTTP navigations will be upgraded to HTTPS

**Note:** This is a basic implementation. If a site doesn't support HTTPS, you may see connection errors.

---

### 6. **Advanced Privacy Controls**
**How to use it:** Multiple privacy enhancements available in the settings page.
1. Open the settings page
2. Go to **"Advanced Privacy"** section
3. Configure:
   - **Block Social Widgets** - Hide Facebook, Twitter, LinkedIn tracking buttons
   - **Block Cookie Notices** - Automatically dismiss GDPR popups
   - **Anti-Fingerprinting** - Prevent device fingerprinting
   - **HTTPS Everywhere** - Upgrade HTTP to HTTPS

---

### 7. **Stealth Mode (Anti-Adblock Defeater)**
**How to use it:** Many news and sports sites now detect your ad blocker and throw up a massive wall that says *"Please disable your ad blocker to read this article"*.

1. Click the AdBlockX shield icon in your toolbar to open the popup
2. Flip on the **Stealth Mode** switch (amber/gold color)
3. Refresh the page! AdBlockX quietly injects a sophisticated payload that:
   - Mocks anti-adblock detection libraries (`blockAdBlock`, `FuckAdBlock`, etc.)
   - Spoofs bait element dimensions (makes hidden ads appear visible to detectors)
   - Bypasses Google Funding Choices and Admiral paywalls
   - Intercepts GDPR/CMP consent APIs

**⚠️ Note:** Stealth mode may occasionally break complex web applications. Toggle it off if you experience issues on a specific site.

---

### 8. **Site Whitelisting & Live Metrics**
**How to use it:** Open the gorgeous glassmorphism popup menu anytime to see exactly how many ads have been blocked this **Session** and over your **Lifetime**. 

**Support your favorite creators:**
If you want to support a website owner or YouTube creator you love, simply click the **"Whitelist this site"** button. AdBlockX will instantly back down and reload the page to allow their specific ads through.

**Real-time updates:** Watch the counter tick up as you browse — see exactly how much cleaner your web experience has become!

---

### 9. **Advanced YouTube Filtering**
**How it works:** YouTube is notoriously difficult to block because they constantly change their code. AdBlockX features a dedicated, highly optimized code scanner that:

- ✅ Removes video ads (pre-roll, mid-roll, post-roll)
- ✅ Skips unskippable ads automatically
- ✅ Hides sponsored video recommendations
- ✅ Removes masthead banner ads
- ✅ Blocks sidebar promotional content
- ✅ Eliminates in-feed ad units
- ✅ Fast-forwards through ad countdowns at 16x speed
- ✅ Auto-clicks "Skip Ad" buttons
- ✅ Removes overlay advertisements

---

### 10. **Automatic Cookie Banner Dismissal**
**How it works:** AdBlockX automatically detects and removes annoying GDPR cookie consent banners from thousands of websites, including:

- OneTrust
- Cookiebot
- Google Funding Choices
- Sourcepoint
- Quantcast
- Generic cookie notices

**Smart dismissal:** AdBlockX attempts to click "Reject" buttons first, then falls back to removing the entire banner if no button is found, ensuring your consent preferences are respected when possible.

---

### 11. **Settings Dashboard** ⭐ NEW
**How to use it:** Full-featured settings page with advanced configuration.
1. Click the gear icon in the popup header
2. Explore sections:
   - **Protection Engine** - Cloud sync status and manual sync button
   - **Advanced Privacy** - All privacy toggles in one place
   - **Whitelist** - Manage allowed domains
   - **Blocked Sites Manager** - View and search all blocking rules
   - **Analytics** - 7-day chart, data saved, time saved
   - **FAQ** - Help documentation

---

## 📥 Installation

AdBlockX is distributed directly via this open-source repository so you always have the most direct, developer-signed code with **no middleman**.

### **Download the Latest Release:**
👉 **[Download AdBlockX v1.3 (AdBlockX v1.3 Chromium.7z)](./AdBlockX%20v1.3%20Chromium.7z)** 👈  
*(Previous: [v1.2](./AdBlockX%20v1.2%20Chromium.7z))*

> **Note on .7z Format**: To keep the download extremely small and fast, the extension is compressed in the `.7z` archive format. You will need a free archiving tool like [7-Zip](https://www.7-zip.org/) (Windows) or [The Unarchiver](https://theunarchiver.com/) (Mac) to open it.

---

### Step-by-Step Installation Guide

#### **Step 1: Download & Extract** 
Download the `.7z` file from the link above. Right-click the file and extract it to a permanent folder on your computer (like your Documents folder). You should now have an unzipped folder called `AdBlockX Chromium` or similar.

#### **Step 2A: Install on Google Chrome**
1. Open Chrome and type `chrome://extensions/` in the URL bar
2. In the top right corner, turn on **Developer mode**
3. Click the **Load unpacked** button in the top left
4. Select the folder you extracted in Step 1
5. *Done!* Pin the AdBlockX shield to your toolbar for easy access

#### **Step 2B: Install on Microsoft Edge**
1. Open Edge and type `edge://extensions/` in the URL bar
2. In the bottom left menu, turn on **Developer mode**
3. Click the **Load unpacked** button at the top right
4. Select the folder you extracted in Step 1
5. *Done!* Pin the AdBlockX shield to your toolbar for easy access

#### **Step 2C: Install on Brave Browser**
1. Open Brave and type `brave://extensions/` in the URL bar
2. In the top right corner, turn on **Developer mode**
3. Click the **Load unpacked** button in the top left
4. Select the folder you extracted in Step 1
5. *Done!* Pin the AdBlockX shield to your toolbar for easy access

---

## 🔧 Configuration & Settings

### First Launch
After installation, AdBlockX starts working immediately with these default settings:
- ✅ Protection: **Enabled**
- ❌ Stealth Mode: **Disabled** (toggle on when needed)
- ❌ HTTPS Everywhere: **Disabled** (toggle on for secure browsing)
- 📊 Statistics: **0 / 0** (session / total)
- 📋 Whitelist: **Empty**

### Recommended Settings
For most users, we recommend:
- Keep **Protection ON** at all times
- Enable **Stealth Mode** only when you encounter anti-adblock walls
- Enable **HTTPS Everywhere** for secure browsing
- Whitelist sites you want to support (YouTube creators, news sites, etc.)

---

## 🛠️ For Developers

### Project Structure
```
adblock/
├── AdBlockX Chromium/          # Main extension folder
│   ├── manifest.json            # Extension configuration
│   ├── background.js           # Service worker (rules, stats, sync)
│   ├── content.js              # Content script (DOM, YouTube, picker)
│   ├── popup.html              # Extension popup interface
│   ├── popup.js                # Popup logic
│   ├── popup.css               # Glassmorphism UI styling
│   ├── settings.html           # Settings dashboard page
│   ├── settings.js             # Settings logic
│   ├── settings.css            # Settings page styling
│   ├── styles.css             # Injected cosmetic filters
│   ├── rules.json             # Static declarativeNetRequest rules
│   ├── icons/                 # Extension icons (16px, 48px, 128px)
│   └── _metadata/             # Generated ruleset data
├── scripts/                    # Blocklist tools
│   ├── blocklist.json         # Community-maintained blocklist
│   └── generate_rules.js      # Rule generation script
├── website/                    # Landing page
│   ├── index.html
│   ├── css/style.css
│   └── js/script.js
├── LICENSE                     # MIT License
└── README.md                   # This file
```

### Remote Blocklist Format
The remote blocklist is a simple JSON array of domain names:
```json
[
  "doubleclick.net",
  "adservice.google.com",
  "pagead2.googlesyndication.com",
  "analytics.google.com"
]
```

**Validation rules:**
- Must be valid DNS domain names
- Maximum 253 characters per domain
- No IP addresses, wildcards, or paths
- Cannot include protected domains (Google, GitHub, etc.)

### Contributing to the Blocklist
Want to add a domain to the community blocklist?
1. Fork this repository
2. Edit `scripts/blocklist.json`
3. Add the domain following the format above
4. Run `node scripts/generate_rules.js` to regenerate rules.json
5. Submit a pull request with a description of what the domain serves

We review all submissions within 48 hours!

---

## 📊 Performance & Benchmarks

### Memory Usage
- **Idle:** ~15 MB (one of the lightest ad blockers available)
- **Active browsing:** ~25-30 MB
- **Comparison:** uBlock Origin (~40 MB), AdBlock Plus (~60 MB)

### Page Load Speed
- **Average improvement:** 30-50% faster page loads on ad-heavy sites
- **Blocked requests:** Typically 10-50 per page on news sites
- **Network savings:** 2-5 MB of data per page on average

### CPU Impact
- **Background:** Near-zero CPU usage (declarativeNetRequest is native)
- **DOM scanning:** <1% CPU on most sites
- **YouTube:** 2-3% CPU due to aggressive mutation observer

---

## 🔒 Privacy & Security

### Data Collection: **NONE**
AdBlockX does **NOT** collect, store, or transmit:
- ❌ Browsing history
- ❌ Search queries
- ❌ Clicked links
- ❌ Personal information
- ❌ Analytics or telemetry
- ❌ Crash reports

### Remote Connections
The **ONLY** external connection AdBlockX makes is:
- 🔄 Blocklist sync: `https://cdn.jsdelivr.net/gh/wikicrafter/adblock@main/scripts/blocklist.json`
  - Frequency: Once every 30 days
  - Purpose: Download updated blocking rules
  - Privacy: Anonymous, no IP logging by us (jsDelivr CDN may log for DDoS protection)

### Permissions Explained
AdBlockX requests these permissions:
- **`declarativeNetRequest`** - Block ad network requests before they load
- **`storage`** - Save your settings, whitelist, and statistics locally
- **`tabs`** - Detect current tab for whitelist functionality
- **`webNavigation`** - Detect page loads for ad scanning
- **`contextMenus`** - Add right-click blocking options
- **`<all_urls>`** - Inject cosmetic filters on all websites

**All permissions are essential** for ad blocking functionality. We don't request history, bookmarks, or any sensitive permissions.

---

## 🐛 Troubleshooting

### Extension Not Blocking Ads
1. Check if protection is enabled (shield icon should show green "Protection Active")
2. Verify the site isn't whitelisted
3. Try disabling other ad blockers (conflicts can occur)
4. Refresh the page after installation
5. Check browser console for errors (F12 → Console)

### Site Breaking / Not Loading
1. Try disabling Stealth Mode
2. Whitelist the site temporarily
3. Disable custom element blocks for that domain
4. Report the issue on GitHub with the URL

### YouTube Ads Still Showing
1. Refresh the page (YouTube's SPA navigation can skip initial blocking)
2. Clear browser cache
3. Make sure you're not whitelisting `youtube.com`
4. Try disabling browser hardware acceleration (rare cases)

### "Report Missing Ad" Feature
If you see an ad that AdBlockX missed:
1. Click the AdBlockX icon
2. Click "Report missing ad" at the bottom
3. This opens a GitHub issue with pre-filled information
4. Describe the ad type and location on the page
5. We'll add it to the blocklist in the next update!

---

## 🗺️ Roadmap

### Completed in v1.3 ✅
- [x] Dashboard page with detailed statistics and graphs
- [x] Anti-fingerprinting features
- [x] Visual element picker
- [x] HTTPS Everywhere

### Planned Features (v1.4+)
- [ ] Import/export custom filter lists
- [ ] Per-site custom rules editor
- [ ] Scheduled whitelist (e.g., "Allow ads 9-5 on weekdays")
- [ ] Dark/Light theme toggle
- [ ] Notification when blocklist updates
- [ ] Quick site report button (report broken sites faster)
- [ ] Regional blocklists (country-specific ad networks)

### Long-term Vision
- Multi-browser support (Firefox, Safari)
- Mobile browser support (Kiwi, Firefox Mobile)
- Community-driven filter list voting system
- Machine learning ad detection (experimental)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Blocklist Contributions
1. Found a new ad domain? Add it to `scripts/blocklist.json`
2. Submit a PR with the domain and description
3. We'll review and merge within 48 hours

### Bug Reports
1. Check if the issue already exists
2. Create a new issue with:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

---

## 📜 Changelog

### v1.3.0 (Current) - Security & Feature Update
| Type | Changes |
|------|---------|
| 🛡️ Security | Fixed XSS vulnerability, fixed allowlist bypass, added domain validation |
| ✨ New | Visual Element Picker, HTTPS Everywhere, Settings Dashboard |
| 🔧 Improved | 7-day stats chart, data/time saved calculations, FAQ docs |
| ⚡ Optimized | Better memory management, enhanced anti-fingerprinting |

### v1.2.0
- ✨ **NEW:** Automatic remote blocklist syncing every 30 days
- ✨ **NEW:** Custom domain blocking UI in popup
- ✨ **NEW:** Enhanced security with strict domain validation
- 🔧 **IMPROVED:** YouTube ad detection speed (50ms debounce)
- 🔧 **IMPROVED:** Better statistics tracking
- 🐛 **FIXED:** Audio unmute bug after YouTube ads
- 🐛 **FIXED:** Session counter not resetting on browser restart
- 🛡️ **SECURITY:** Added domain allowlist to prevent critical site blocking
- 🛡️ **SECURITY:** Implemented size limits on remote blocklist (max 5,000 rules)

### v1.1.0
- ✨ Initial public release
- ✅ Manifest V3 compliance
- ✅ Stealth mode anti-adblock bypass
- ✅ Custom element blocking via right-click
- ✅ YouTube-specific ad filtering
- ✅ Cookie banner auto-dismissal
- ✅ Site whitelisting
- ✅ Real-time statistics

---

## 💖 Support the Project

AdBlockX is a passion project built to keep the web fast, clean, and free from invasive tracking. It is 100% free and open-source. 

If this extension makes your daily browsing experience better, please consider supporting the developer so we can continue adding new features, maintaining the block lists, and keeping it optimized!

<a href="https://ko-fi.com/gigaa" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me a Coffee at ko-fi.com" height="36" style="border:0px;height:36px;" /></a>

---

## 📄 License

This project is completely open-source and licensed under the [MIT License](LICENSE). Please feel free to fork, learn from, and contribute to the code!
