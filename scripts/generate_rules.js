const fs = require('fs');
const path = require('path');

/**
 * AdBlockX Rules Generator
 * This script merges the community blocklist.json with advanced URL patterns
 * to produce the static rules.json bundled with the extension.
 */

const BLOCKLIST_PATH = path.join(__dirname, 'blocklist.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'AdBlockX Chromium', 'rules.json');

// ─── 1. Load Domains from JSON ───────────────────────────────────────────────
let domains = [];
try {
  const rawData = fs.readFileSync(BLOCKLIST_PATH, 'utf8');
  domains = JSON.parse(rawData);
  console.log(`Successfully loaded ${domains.length} domains from blocklist.json`);
} catch (error) {
  console.error('Error reading blocklist.json:', error.message);
  process.exit(1);
}

// ─── 2. Advanced URL Patterns (Path-based blocking) ──────────────────────────
const urlPatterns = [
  "/ads.js",
  "/ad.js",
  "/track.js",
  "/analytics.js",
  "/prebid.js",
  "/pixel.js",
  "/tracking.js",
  "/ad-request",
  "/?ad_type=",
  "/wp-content/plugins/ad-inserter/",
  "/wp-content/plugins/advanced-ads/",
  "-ad-script.js",
  "/ad-banner.js"
];

// ─── 3. Generate Rules ───────────────────────────────────────────────────────
const rules = [];
let id = 1;

const allResourceTypes = [
  "script", "image", "xmlhttprequest", "sub_frame", 
  "ping", "beacon", "media", "websocket", "other"
];

// Add domain-based block rules (e.g., ||doubleclick.net)
domains.forEach(domain => {
  if (domain && domain.trim()) {
    rules.push({
      "id": id++,
      "priority": 1,
      "action": { "type": "block" },
      "condition": {
        "urlFilter": `||${domain.trim()}`,
        "resourceTypes": allResourceTypes
      }
    });
  }
});

// Add pattern-based block rules (e.g., /ads.js)
urlPatterns.forEach(pattern => {
  rules.push({
    "id": id++,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": pattern,
      "resourceTypes": allResourceTypes
    }
  });
});

// ─── 4. Save to rules.json ──────────────────────────────────────────────────
try {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(rules, null, 2));
  console.log(`\nSUCCESS: Generated ${rules.length} rules in:`);
  console.log(`👉 ${OUTPUT_PATH}`);
} catch (error) {
  console.error('Error writing rules.json:', error.message);
}
