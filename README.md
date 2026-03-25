# Strava Activity Filter

A Chrome extension that lets you hide specific activity types from your Strava dashboard feed.

![Strava Activity Filter](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- Hide any combination of 16 activity types from your feed
- Settings persist across page loads and browser sessions
- Works with Strava's infinite scroll — new entries are filtered as they load
- Toggle filters on/off instantly without a page reload
- Clean, Strava-native UI

## Supported Activity Types

Run, Ride, Swim, Walk, Hike, Workout, Yoga, Ski / Snowboard, Kayak / Paddle, Golf, Soccer, Tennis, E-Bike, Commute, Race, Club Activity

## Installation

### From source (Chrome)

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the `strava-hider` folder
5. Go to `chrome://extensions` → **Details** on the extension
6. Under **Site access**, enable `https://www.strava.com/*`

### Usage

1. Navigate to [strava.com/dashboard](https://www.strava.com/dashboard)
2. Click the **Strava Filter** icon in your Chrome toolbar
3. Toggle the activity types you want to hide
4. Click **Apply filters** — hidden activities disappear immediately

## How it works

The extension injects a content script into the Strava dashboard page. It reads the activity type from each feed card's SVG icon title (`<svg data-testid="activity-icon"><title>Run</title>`), then hides the entire card if it matches a filtered type. A MutationObserver watches for new cards loaded by infinite scroll and filters them automatically.

Settings are stored via `chrome.storage.sync` so they persist across sessions and sync across devices if you're signed into Chrome.

## Development

```
strava-hider/
├── manifest.json      # Extension config (Manifest V3)
├── content.js         # Injected into Strava dashboard — filters feed cards
├── content.css        # Hides filtered cards
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic, storage read/write
└── icons/             # Extension icons (16, 48, 128px)
```

### Deployment
`zip -r ../strava-activity-filter.zip . --exclude "*.git*" --exclude ".DS_Store" --exclude "*.md" --exclude "LICENSE" --exclude ".gitignore" --exclude "strava-feed-filter-chrome-extension.code-workspace" --exclude "store*"`

### Making changes

1. Edit the source files
2. Go to `chrome://extensions` and click the reload icon on the extension
3. Refresh the Strava dashboard

### Adding new activity types

In `content.js`, add an entry to `ACTIVITY_TYPE_MAP`:

```js
'Your Type': ['keyword1', 'keyword2'],
```

Then add a matching entry in `popup.js`:

```js
{ name: 'Your Type', emoji: '🏄' },
```

## Notes

- Strava periodically updates their frontend. If filtering stops working, the `svg[data-testid="activity-icon"]` selector may need updating — open DevTools on the dashboard and inspect a feed card to find the new structure.
- This extension does not collect any data, make network requests, or interact with the Strava API.

## License

MIT
