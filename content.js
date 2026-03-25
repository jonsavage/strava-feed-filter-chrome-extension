// Strava Activity Filter - Content Script

const ACTIVITY_TYPE_MAP = {
  'Run': ['run', 'running'],
  'Ride': ['ride', 'cycling', 'biking', 'virtual ride', 'virtual_ride', 'velomobile'],
  'Swim': ['swim', 'swimming'],
  'Walk': ['walk', 'walking'],
  'Hike': ['hike', 'hiking'],
  'Workout': ['workout', 'weight training', 'crossfit', 'elliptical', 'stairstepper', 'fitness'],
  'Yoga': ['yoga', 'pilates'],
  'Ski / Snowboard': ['ski', 'skiing', 'snowboard', 'alpine ski', 'backcountry ski', 'nordic ski', 'snowshoe'],
  'Kayak / Paddle': ['kayaking', 'paddling', 'canoeing', 'rowing', 'standup paddleboarding', 'surfing', 'windsurfing', 'kitesurfing', 'sailing'],
  'Golf': ['golf'],
  'Soccer': ['soccer'],
  'Tennis': ['tennis', 'squash', 'racquetball', 'badminton', 'pickleball', 'table tennis'],
  'E-Bike': ['e-bike', 'ebike', 'ebikeride', 'e-bikeride'],
  'Commute': ['commute'],
  'Race': ['race'],
  'Club Activity': ['group', 'club'],
};

const CATEGORY_DEVICE_MAP = {
  'Indoor': ['Zwift', 'Wahoo SYSTM'],
};

let hiddenTypes = [];
let hiddenDevices = [];
let hiddenCategories = [];
let observer = null;

function scanDevices() {
  const devices = new Set();
  document.querySelectorAll('[data-testid="device"]').forEach(el => {
    const name = el.textContent.trim();
    if (name) devices.add(name);
  });
  if (devices.size === 0) return;
  chrome.storage.local.get({ seenDevices: [] }, (result) => {
    const merged = new Set([...result.seenDevices, ...devices]);
    chrome.storage.local.set({ seenDevices: [...merged] });
  });
}

function filterFeed() {
  const cards = [...document.querySelectorAll('[id^="feed-entry-"]')];
  if (cards.length === 0) return;

  scanDevices();

  cards.forEach(card => {
    const iconTitle = card.querySelector('svg[data-testid="activity-icon"] title');
    const activityType = iconTitle ? iconTitle.textContent.trim().toLowerCase() : '';
    const deviceEl = card.querySelector('[data-testid="device"]');
    const device = deviceEl ? deviceEl.textContent.trim() : '';

    let shouldHide = false;

    if (activityType && hiddenTypes.length > 0) {
      for (const hiddenType of hiddenTypes) {
        const keywords = ACTIVITY_TYPE_MAP[hiddenType] || [hiddenType.toLowerCase()];
        for (const keyword of keywords) {
          if (activityType.includes(keyword)) { shouldHide = true; break; }
        }
        if (shouldHide) break;
      }
    }

    if (!shouldHide && device && hiddenDevices.length > 0) {
      shouldHide = hiddenDevices.some(d => d.toLowerCase() === device.toLowerCase());
    }

    if (!shouldHide && hiddenCategories.length > 0) {
      const indoorDevices = CATEGORY_DEVICE_MAP['Indoor'] || [];
      const isIndoor = device && indoorDevices.some(d => d.toLowerCase() === device.toLowerCase());

      for (const cat of hiddenCategories) {
        if (cat === 'Indoor' && isIndoor) { shouldHide = true; break; }
        if (cat === 'Outdoor' && !isIndoor) { shouldHide = true; break; }
      }
    }

    if (shouldHide) {
      card.style.setProperty('display', 'none', 'important');
      card.setAttribute('data-strava-filter-hidden', 'true');
    } else if (card.getAttribute('data-strava-filter-hidden') === 'true') {
      card.style.removeProperty('display');
      card.removeAttribute('data-strava-filter-hidden');
    }
  });
}

function startObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    clearTimeout(window._stravaFilterTimeout);
    window._stravaFilterTimeout = setTimeout(filterFeed, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function init() {
  chrome.storage.sync.get({ hiddenTypes: [], hiddenDevices: [], hiddenCategories: [] }, (result) => {
    hiddenTypes = result.hiddenTypes || [];
    hiddenDevices = result.hiddenDevices || [];
    hiddenCategories = result.hiddenCategories || [];
    filterFeed();
    setTimeout(filterFeed, 800);
    setTimeout(filterFeed, 2500);
    startObserver();
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsUpdated') {
    hiddenTypes = message.hiddenTypes;
    hiddenDevices = message.hiddenDevices || [];
    hiddenCategories = message.hiddenCategories || [];
    document.querySelectorAll('[data-strava-filter-hidden]').forEach(el => {
      el.style.removeProperty('display');
      el.removeAttribute('data-strava-filter-hidden');
    });
    filterFeed();
  }
  if (message.type === 'scanDevices') {
    scanDevices();
  }
  if (message.type === 'getHiddenCount') {
    return Promise.resolve({ count: document.querySelectorAll('[data-strava-filter-hidden]').length });
  }
});

init();
