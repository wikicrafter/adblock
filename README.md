<div align="center">
  <img src="./AdBlockX%20Chromium/icons/icon128.png" alt="AdBlockX Logo" width="128" />

  <h1>AdBlockX</h1>
  <p><strong>A Premium, High-Performance, Privacy-First Ad Blocker for Chromium Browsers.</strong></p>
  <p>Version 1.1 • Powered by ITFORSEC</p>
</div>

---

## 🚀 Why AdBlockX?

AdBlockX is a professional-grade ad blocking extension built entirely on Google's strict **Manifest V3** architecture. Unlike massive, legacy ad blockers that bloat your browser memory and secretly harvest telemetry, AdBlockX is engineered for raw speed, zero latency, and **absolute data privacy**. 

## ✨ Detailed Feature Guide

### 1. Zero-Latency Network Blocking
**How it works:** You don't have to do anything! The moment you install AdBlockX, it uses native Chrome APIs (`declarativeNetRequest`) to silently sever connections to over 70+ major ad networks and tracking pixels before the browser even attempts to load them. 

### 2. Custom Element Hiding (The Right-Click Blocker)
**How to use it:** Did a sneaky newsletter popup or an empty ad banner slip through the automated filters? 
1. **Right-click** the annoying image, video, or box.
2. Look at your standard Chrome context menu for two new options: **"Block element on this site"** and **"Block element everywhere"**.
3. Click your choice. AdBlockX instantly vaporizes the element, calculates its CSS path, and permanently remembers to hide it the next time you visit the page!

### 3. Stealth Mode (Anti-Adblock Defeater)
**How to use it:** Many news and sports sites now detect your ad blocker and throw up a massive wall that says *"Please disable your ad blocker to read this article"*.
1. Click the AdBlockX shield icon in your toolbar to open the popup.
2. Flip on the **Stealth Mode** switch. 
3. Refresh the page! AdBlockX quietly injects a mocking payload that tricks those sites into thinking your adblocker is disabled, letting you read the article while it continues to aggressively hide the ads in the background.

### 4. Site Whitelisting & Live Metrics
**How to use it:** Open the gorgeous Glassmorphism popup menu anytime to see exactly how many ads have been blocked this **Session** and over your **Lifetime**. 
If you want to support a website owner or YouTube creator you love, simply click the **"Whitelist this site"** button. AdBlockX will instantly back down and reload the page to allow their specific ads through.

### 5. Advanced YouTube Filtering
**How it works:** YouTube is notoriously difficult to block because they constantly change their code. AdBlockX features a dedicated, highly optimized code scanner that aggressively searches for sponsored Masthead rows, sidebar feeds, and even utilizes structural targeting to destroy new hidden `#ad-badge` containers instantly.

---

## 📥 Installation

AdBlockX is distributed directly via this open-source repository so you always have the most direct, developer-signed code.

**Download the Latest Release:**
👉 **[Download AdBlockX v1.1 (AdBlockX Chromium.7z)](./AdBlockX%20Chromium.7z)** 👈

> **Note on .7z Format**: To keep the download extremely small and fast, the extension is compressed in the `.7z` archive format. You will need a free archiving tool like [7-Zip](https://www.7-zip.org/) (Windows) or [The Unarchiver](https://theunarchiver.com/) (Mac) to open it.

### Step-by-Step Installation Guide

**Step 1. Download & Extract** 
Download the `.7z` file from the link above. Right-click the file and Extract it to a permanent folder on your computer (like your Documents folder). You should now have an unzipped folder called `Chromium` (or `AdBlockX Chromium`).

**Step 2. Install on Google Chrome**
1. Open Chrome and type `chrome://extensions/` in the URL bar.
2. In the top right corner, turn on **Developer mode**.
3. Click the **Load unpacked** button in the top left.
4. Select the folder you extracted in Step 1.
5. *Done!* Pin the AdBlockX shield to your toolbar.

**Step 2. Install on Microsoft Edge**
1. Open Edge and type `edge://extensions/` in the URL bar.
2. In the bottom left menu, turn on **Developer mode**.
3. Click the **Load unpacked** button at the top right.
4. Select the folder you extracted in Step 1.
5. *Done!* Pin the AdBlockX shield to your toolbar.

---

## 🛠️ For Developers

AdBlockX includes a robust developer script system allowing you to easily maintain and expand the core blocklist without manually writing thousands of lines of code.

You can modify the `blocklist` array in `scripts/generate_rules.js` and run the generator to output perfectly crafted Manifest V3 JSON rules:

```bash
node scripts/generate_rules.js
```

---

## 💖 Support the Project

AdBlockX is a passion project built to keep the web fast, clean, and free from invasive tracking. It is 100% free and open-source. 

If this extension makes your daily browsing experience better, please consider supporting the developer so we can continue adding new features, maintaining the block lists, and keeping it optimized!

<a href="https://ko-fi.com/gigaa" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" alt="Buy Me a Coffee at ko-fi.com" height="36" style="border:0px;height:36px;" /></a>

---

## 📄 License

This project is completely open-source and licensed under the [MIT License](LICENSE). Please feel free to fork, learn from, and contribute to the code!
