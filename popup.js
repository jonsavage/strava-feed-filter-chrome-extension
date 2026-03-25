const INDOOR_OUTDOOR = [
  { name: 'Indoor', emoji: '🏠' },
  { name: 'Outdoor', emoji: '🌳' },
];

const ACTIVITY_TYPES = [
  { name: 'Run', emoji: '🏃' },
  { name: 'Ride', emoji: '🚴' },
  { name: 'Swim', emoji: '🏊' },
  { name: 'Walk', emoji: '🚶' },
  { name: 'Hike', emoji: '🥾' },
  { name: 'Workout', emoji: '💪' },
  { name: 'Yoga', emoji: '🧘' },
  { name: 'Ski / Snowboard', emoji: '⛷️' },
  { name: 'Kayak / Paddle', emoji: '🚣' },
  { name: 'Golf', emoji: '⛳' },
  { name: 'Soccer', emoji: '⚽' },
  { name: 'Tennis', emoji: '🎾' },
  { name: 'E-Bike', emoji: '⚡' },
  { name: 'Commute', emoji: '🔁' },
  { name: 'Race', emoji: '🏁' },
  { name: 'Club Activity', emoji: '👥' },
];

let selectedTypes = new Set();
let selectedDevices = new Set();
let selectedCategories = new Set();

function updateCount() {
  const el = document.getElementById('hidden-count');
  const n = selectedTypes.size + selectedDevices.size + selectedCategories.size;
  el.textContent = n === 0 ? 'None' : `${n} filter${n !== 1 ? 's' : ''}`;
}

function renderList() {
  const container = document.getElementById('activity-list');
  container.innerHTML = '';

  ACTIVITY_TYPES.forEach(type => {
    const item = document.createElement('div');
    item.className = 'activity-item' + (selectedTypes.has(type.name) ? ' active' : '');
    item.innerHTML = `
      <div class="toggle"></div>
      <span class="activity-emoji">${type.emoji}</span>
      <span class="activity-name">${type.name}</span>
    `;
    item.addEventListener('click', () => {
      if (selectedTypes.has(type.name)) {
        selectedTypes.delete(type.name);
        item.classList.remove('active');
      } else {
        selectedTypes.add(type.name);
        item.classList.add('active');
      }
      updateCount();
      // Auto-save on every toggle so selections persist even if popup closes
      chrome.storage.sync.set({ hiddenTypes: [...selectedTypes] });
    });
    container.appendChild(item);
  });
}

function fetchActivityCount() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'getHiddenCount' })
      .then(response => {
        const el = document.getElementById('activity-count');
        if (response && response.count > 0) {
          el.textContent = `(${response.count})`;
        } else {
          el.textContent = '';
        }
      })
      .catch(() => {});
  });
}

function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function renderCategoryList() {
  const container = document.getElementById('category-list');
  container.innerHTML = '';
  INDOOR_OUTDOOR.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'activity-item' + (selectedCategories.has(cat.name) ? ' active' : '');
    item.innerHTML = `
      <div class="toggle"></div>
      <span class="activity-emoji">${cat.emoji}</span>
      <span class="activity-name">${cat.name}</span>
    `;
    item.addEventListener('click', () => {
      if (selectedCategories.has(cat.name)) {
        selectedCategories.delete(cat.name);
        item.classList.remove('active');
      } else {
        selectedCategories.add(cat.name);
        item.classList.add('active');
      }
      updateCount();
      chrome.storage.sync.set({ hiddenCategories: [...selectedCategories] });
    });
    container.appendChild(item);
  });
}

function renderDeviceList(seenDevices) {
  const container = document.getElementById('device-list');
  container.innerHTML = '';

  if (!seenDevices || seenDevices.length === 0) {
    container.innerHTML = '<div class="device-empty">Visit your Strava feed to discover devices</div>';
    return;
  }

  seenDevices.sort().forEach(device => {
    const item = document.createElement('div');
    item.className = 'activity-item' + (selectedDevices.has(device) ? ' active' : '');
    item.innerHTML = `
      <div class="toggle"></div>
      <span class="activity-emoji">📱</span>
      <span class="activity-name">${device}</span>
    `;
    item.addEventListener('click', () => {
      if (selectedDevices.has(device)) {
        selectedDevices.delete(device);
        item.classList.remove('active');
      } else {
        selectedDevices.add(device);
        item.classList.add('active');
      }
      updateCount();
      chrome.storage.sync.set({ hiddenDevices: [...selectedDevices] });
    });
    container.appendChild(item);
  });
}

function refreshDeviceList() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'scanDevices' }).catch(() => {});
    }
  });
  setTimeout(() => {
    chrome.storage.local.get({ seenDevices: [] }, (local) => {
      renderDeviceList(local.seenDevices);
    });
  }, 500);
}

function applyFilters() {
  const hiddenTypes = [...selectedTypes];
  const hiddenDevices = [...selectedDevices];
  const hiddenCategories = [...selectedCategories];
  chrome.storage.sync.set({ hiddenTypes, hiddenDevices, hiddenCategories }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
}

// Load saved settings
chrome.storage.sync.get({ hiddenTypes: [], hiddenDevices: [], hiddenCategories: [] }, (result) => {
  selectedTypes = new Set(result.hiddenTypes);
  selectedDevices = new Set(result.hiddenDevices);
  selectedCategories = new Set(result.hiddenCategories);
  renderList();
  renderCategoryList();
  updateCount();
  fetchActivityCount();
  chrome.storage.local.get({ seenDevices: [] }, (local) => {
    renderDeviceList(local.seenDevices);
  });
});

document.getElementById('save-btn').addEventListener('click', applyFilters);
document.getElementById('refresh-devices').addEventListener('click', refreshDeviceList);

document.getElementById('clear-all').addEventListener('click', () => {
  selectedTypes.clear();
  selectedDevices.clear();
  selectedCategories.clear();
  chrome.storage.local.get({ seenDevices: [] }, (local) => {
    renderList();
    renderCategoryList();
    renderDeviceList(local.seenDevices);
    updateCount();
    chrome.storage.sync.set({ hiddenTypes: [], hiddenDevices: [], hiddenCategories: [] });
  });
});
