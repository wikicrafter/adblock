# AdBlocker (Manifest V3)

A lightweight, robust, and privacy-focused ad blocker built for modern Chromium browsers.

## 🚀 Key Features

- **⚡ Manifest V3 Architecture**: Built on the latest extension standard using `declarativeNetRequest` for native, high-performance blocking without privacy compromises.
- **📺 YouTube Optimized**:
    - **Auto-Skip**: Instantly detects and skips video ads.
    - **Clean Feed**: Removes "Sponsored" posts and sidebar ads.
    - **Ad Hiding**: Hides ad containers before they render.
- **🛡️ Expanded Coverage**:
    - Blocks ads on **Streaming** websites.
    - specialized rules for networks like ExoClick, TrafficJunky, and PopAds.
    - Generic video ad skipper for non-YouTube players.
- **🏎️ High Performance**:
    - **Zero-Bloat**: No heavy background scripts (uses Service Worker).
    - **Debounced Logic**: Content scripts are optimized to use minimal CPU.
    - **CSS Injection**: Hides ads instantly using native CSS before JavaScript runs.

## 🛠️ Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/wikicrafter/adblock.git
    ```
2.  **Open Chrome Extensions**:
    - Navigate to `chrome://extensions/` in your browser.
    - Enable **Developer mode** in the top right corner.
3.  **Load Extension**:
    - Click **Load unpacked**.
    - Select the `Chromium` directory from this repository.

## 🤝 Contributing

Contributions are welcome! If you find a site that isn't blocked correctly:

1.  **Fork** the repository.
2.  **Create a Branch**: `git checkout -b fix/site-name`.
3.  **Update Rules**:
    - Add domain rules to `rules.json`.
    - Add CSS selectors to `styles.css`.
4.  **Open a Pull Request**.

## 📄 License

Open Source. Feel free to use and modify.
