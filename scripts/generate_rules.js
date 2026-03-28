const fs = require('fs');
const path = require('path');

// A consolidated, robust list of top ad networks and telemetry/privacy trackers
const blocklist = [
  // --- Ad Networks & Exchanges ---
  "doubleclick.net", "googlesyndication.com", "adservice.google.com", "adnxs.com",
  "amazon-adsystem.com", "criteo.com", "pubmatic.com", "ads.yahoo.com",
  "moatads.com", "taboola.com", "outbrain.com", "adroll.com", "rubiconproject.com",
  "openx.net", "smartadserver.com", "indexexchange.com", "appnexus.com",
  "advertising.com", "zedo.com", "yieldmanager.com", "serving-sys.com",
  "contextweb.com", "nexac.com", "lijit.com", "sharethis.com", "addthis.com",
  "teads.tv", "casalemedia.com", "advertising.com", "simpli.fi", "revcontent.com",
  "zergnet.com", "exponential.com", "tribalfusion.com", "bidswitch.net", "sovrn.com",
  "33across.com", "gumgum.com", "infolinks.com", "media.net", "chitika.com",
  "exoclick.com", "popads.net", "trafficjunky.com", "ero-advertising.com", "juicyads.com",

  // --- Analytics & Privacy Trackers ---
  "google-analytics.com", "googleadservices.com", "googletagmanager.com", 
  "scorecardresearch.com", "quantserve.com", "quantcount.com", "statcounter.com",
  "histats.com", "mixpanel.com", "kissmetrics.com", "hotjar.com", "segment.com",
  "segment.io", "chartbeat.com", "chartbeat.net", "crazyegg.com", "fullstory.com",
  "optimizely.com", "newrelic.com", "amplitude.com", "sentry.io", "bugsnag.com",
  "loggly.com", "rollbar.com", "raygun.io", "datadoghq.com", "clicky.com",
  "mouseflow.com", "inspectlet.com", "luckyorange.com", "vwo.com",

  // --- Social Media Trackers (Pixels / Buttons) ---
  "facebook.net", "facebook.com/tr", "connect.facebook.net", "pixel.facebook.com",
  "syndication.twitter.com", "platform.twitter.com", "ads-api.twitter.com",
  "analytics.twitter.com", "snapchat.com/tr", "tiktok.com/api/ad", 
  "analytics.tiktok.com", "linkedin.com/count", "licdn.com",
  "pinterest.com/ct", "ct.pinterest.com"
];

const rules = [];
let ruleId = 1;

blocklist.forEach((domain) => {
  rules.push({
    id: ruleId++,
    priority: 1,
    action: {
      type: "block"
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: [
        "script",
        "image",
        "xmlhttprequest",
        "sub_frame",
        "ping",
        "beacon",
        "media",
        "websocket"
      ]
    }
  });
});

const outputPath = path.join(__dirname, '..', 'AdBlockX Chromium', 'rules.json');
fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));

console.log(`Successfully generated ${rules.length} core Manifest V3 filtering rules.`);
console.log(`Saved to: ${outputPath}`);
