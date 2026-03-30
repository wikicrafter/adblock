const fs = require('fs');
const path = require('path');

const domains = [
  // Existing from previous
  "doubleclick.net", "googlesyndication.com", "adservice.google.com", "adnxs.com",
  "amazon-adsystem.com", "criteo.com", "pubmatic.com", "ads.yahoo.com", "moatads.com",
  "taboola.com", "outbrain.com", "adroll.com", "rubiconproject.com", "openx.net",
  "smartadserver.com", "indexexchange.com", "appnexus.com", "advertising.com",
  "zedo.com", "yieldmanager.com", "serving-sys.com", "contextweb.com", "nexac.com",
  "lijit.com", "sharethis.com", "addthis.com", "teads.tv", "casalemedia.com",
  "simpli.fi", "revcontent.com", "zergnet.com", "exponential.com", "tribalfusion.com",
  "bidswitch.net", "sovrn.com", "33across.com", "gumgum.com", "infolinks.com", "media.net",

  // Analytics & Trackers
  "google-analytics.com", "ssl.google-analytics.com", "analytics.google.com",
  "connect.facebook.net", "pixel.facebook.com", "analytics.tiktok.com",
  "ads.tiktok.com", "hotjar.com", "ads-twitter.com", "analytics.twitter.com",
  "snapads.com", "tr.snapchat.com", "metrics.apple.com", "scorecardresearch.com",
  "quantserve.com", "crazyegg.com", "mixpanel.com", "segment.com", "mouseflow.com",
  "clarity.ms", "api-js.mixpanel.com", "log.pinterest.com", "trk.pinterest.com",
  "ads.reddit.com", "alb.reddit.com", "telemetry.mozilla.org", "events.redditmedia.com",

  // Ad networks
  "adform.net", "adtechus.com", "demdex.net", "imrworldwide.com", "lijit.com",
  "mookie1.com", "rlcdn.com", "turn.com", "yieldoptimizer.com", "ads.linkedin.com",
  "bcp.crwdcntrl.net", "tags.tiqcdn.com", "bat.bing.com", "ad.yieldmanager.com",
  "ib.adnxs.com", "securepubads.g.doubleclick.net", "pagead2.googlesyndication.com",
  "tpc.googlesyndication.com", "partner.googleadservices.com", "s0.2mdn.net",
  "stats.g.doubleclick.net", "cm.g.doubleclick.net", "static.doubleclick.net",
  "m.doubleclick.net", "a.adsafeprotected.com", "b.adsafeprotected.com",
  "pixel.adsafeprotected.com", "grmatch.adform.net", "track.adform.net",

  // More generalized trackers
  "adserver.yahoo.com", "flurry.com", "admarvel.com", "adsymptotic.com",
  "adzerk.net", "advertising.apple.com", "iad.apple.com", "burstnet.com",
  "casalemedia.com", "chango.com", "cpxinteractive.com", "epom.com",
  "exoclick.com", "exponental.com", "falkag.net", "fastclick.net", "fimserve.com",
  "glammedia.com", "infolinks.com", "jumptap.com", "kontera.com", "linkshare.com",
  "madadsmedia.com", "matomy.com", "media.net", "millennialmedia.com",
  "popads.net", "popcash.net", "propellerads.com", "revcontent.com",
  "rmxads.com", "rubiconproject.com", "shareasale.com", "sizmek.com",
  "skimlinks.com", "smartadserver.com", "sovren.com", "specificmedia.com",
  "spotxchange.com", "taboola.com", "tapjoy.com", "tremorvideo.com",
  "undertone.com", "valueclick.com", "verizonmedia.com", "vibrantmedia.com",
  "yieldmo.com", "yieldoptimizer.com", "yume.com"
];

// Combine regular expressions for ad URL patterns
// e.g. path-based blocking: URLs containing these substrings
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

const rules = [];
let id = 1;

// Base configuration for the "condition.resourceTypes" parameter
const allResourceTypes = [
  "script", "image", "xmlhttprequest", "sub_frame", 
  "ping", "beacon", "media", "websocket", "other"
];

// Add domain rules
for (const domain of domains) {
  rules.push({
    "id": id++,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": `||${domain}`,
      "resourceTypes": allResourceTypes
    }
  });
}

// Add path/pattern rules
for (const pattern of urlPatterns) {
  rules.push({
    "id": id++,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": pattern,
      "resourceTypes": allResourceTypes
    }
  });
}

const outputPath = path.join(__dirname, '..', 'AdBlockX Chromium', 'rules.json');
fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));

console.log(`Generated ${rules.length} rules in ${outputPath}`);
