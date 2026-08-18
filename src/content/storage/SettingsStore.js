const SETTINGS_KEY = 'ado-mermaid-viewer-settings';

const DEFAULT_SETTINGS = {
  autoScan: true,
  showToolbar: true,
  theme: 'auto', // 'auto' | 'light' | 'dark'
  keyboardShortcuts: true
};

let cachedSettings = null;

export async function getSettings() {
  if (cachedSettings) return cachedSettings;
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  cachedSettings = { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
  return cachedSettings;
}

export async function setSettings(newSettings) {
  const current = await getSettings();
  cachedSettings = { ...current, ...newSettings };
  await chrome.storage.sync.set({ [SETTINGS_KEY]: cachedSettings });
  return cachedSettings;
}

export async function getSetting(key) {
  const settings = await getSettings();
  return settings[key];
}

export function clearCache() {
  cachedSettings = null;
}

export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}