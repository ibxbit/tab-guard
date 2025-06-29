export function saveToStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export function getFromStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

// Storage utility functions for Tab Guard

// Default settings
const DEFAULT_SETTINGS = {
  blockedSites: [],
  allowedSites: [],
  isFocusMode: false,
  theme: 'dark', // 'dark' or 'light'
  customBlockedMessage: '🚫 This site is blocked. Stay focused!',
  motivationQuotes: [
    'Focus on being productive instead of busy.',
    'The only way to do great work is to love what you do.',
    'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    'The future depends on what you do today.',
    'Don\'t watch the clock; do what it does. Keep going.',
    'Your time is limited, don\'t waste it living someone else\'s life.',
    'The way to get started is to quit talking and begin doing.',
    'It always seems impossible until it\'s done.',
    'The only limit to our realization of tomorrow is our doubts of today.',
    'What you get by achieving your goals is not as important as what you become by achieving your goals.'
  ],
  currentQuoteIndex: 0,
  notifications: {
    sessionCompletion: true,
    distractionAttempts: true,
    dailySummary: true
  },
  sessionStats: {
    totalSessions: 0,
    totalFocusTime: 0,
    distractionAttempts: 0,
    lastSessionDate: null
  }
};

// Initialize storage with default settings
export async function initializeStorage() {
  const result = await chrome.storage.sync.get(null);
  
  // Merge with defaults for any missing keys
  const mergedSettings = { ...DEFAULT_SETTINGS, ...result };
  
  // Save back to ensure all default values are present
  await chrome.storage.sync.set(mergedSettings);
  
  return mergedSettings;
}

// Get all settings
export async function getAllSettings() {
  return await chrome.storage.sync.get(null);
}

// Get specific setting
export async function getSetting(key) {
  const result = await chrome.storage.sync.get(key);
  return result[key];
}

// Set specific setting
export async function setSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
}

// Get blocked sites
export async function getBlockedSites() {
  return await getSetting('blockedSites') || [];
}

// Add blocked site
export async function addBlockedSite(site) {
  const blockedSites = await getBlockedSites();
  if (!blockedSites.includes(site)) {
    blockedSites.push(site);
    await setSetting('blockedSites', blockedSites);
  }
}

// Remove blocked site
export async function removeBlockedSite(site) {
  const blockedSites = await getBlockedSites();
  const filtered = blockedSites.filter(s => s !== site);
  await setSetting('blockedSites', filtered);
}

// Get allowed sites
export async function getAllowedSites() {
  return await getSetting('allowedSites') || [];
}

// Add allowed site
export async function addAllowedSite(site) {
  const allowedSites = await getAllowedSites();
  if (!allowedSites.includes(site)) {
    allowedSites.push(site);
    await setSetting('allowedSites', allowedSites);
  }
}

// Remove allowed site
export async function removeAllowedSite(site) {
  const allowedSites = await getAllowedSites();
  const filtered = allowedSites.filter(s => s !== site);
  await setSetting('allowedSites', filtered);
}

// Focus mode toggle
export async function toggleFocusMode() {
  const isFocusMode = await getSetting('isFocusMode') || false;
  await setSetting('isFocusMode', !isFocusMode);
  return !isFocusMode;
}

// Get focus mode status
export async function getFocusModeStatus() {
  return await getSetting('isFocusMode') || false;
}

// Theme management
export async function getTheme() {
  return await getSetting('theme') || 'dark';
}

export async function setTheme(theme) {
  await setSetting('theme', theme);
}

// Custom message management
export async function getCustomBlockedMessage() {
  return await getSetting('customBlockedMessage') || DEFAULT_SETTINGS.customBlockedMessage;
}

export async function setCustomBlockedMessage(message) {
  await setSetting('customBlockedMessage', message);
}

// Motivation quotes management
export async function getMotivationQuotes() {
  return await getSetting('motivationQuotes') || DEFAULT_SETTINGS.motivationQuotes;
}

export async function setMotivationQuotes(quotes) {
  await setSetting('motivationQuotes', quotes);
}

export async function getCurrentQuote() {
  const quotes = await getMotivationQuotes();
  const currentIndex = await getSetting('currentQuoteIndex') || 0;
  return quotes[currentIndex] || quotes[0];
}

export async function getNextQuote() {
  const quotes = await getMotivationQuotes();
  const currentIndex = await getSetting('currentQuoteIndex') || 0;
  const nextIndex = (currentIndex + 1) % quotes.length;
  await setSetting('currentQuoteIndex', nextIndex);
  return quotes[nextIndex];
}

// Notification settings
export async function getNotificationSettings() {
  return await getSetting('notifications') || DEFAULT_SETTINGS.notifications;
}

export async function setNotificationSettings(settings) {
  await setSetting('notifications', settings);
}

export async function updateNotificationSetting(key, value) {
  const notifications = await getNotificationSettings();
  notifications[key] = value;
  await setNotificationSettings(notifications);
}

// Session statistics
export async function getSessionStats() {
  return await getSetting('sessionStats') || DEFAULT_SETTINGS.sessionStats;
}

export async function updateSessionStats(updates) {
  const stats = await getSessionStats();
  const updatedStats = { ...stats, ...updates };
  await setSetting('sessionStats', updatedStats);
}

export async function incrementDistractionAttempts() {
  const stats = await getSessionStats();
  stats.distractionAttempts += 1;
  await setSetting('sessionStats', stats);
  return stats.distractionAttempts;
}

export async function recordFocusSession(duration) {
  const stats = await getSessionStats();
  stats.totalSessions += 1;
  stats.totalFocusTime += duration;
  stats.lastSessionDate = new Date().toISOString();
  await setSetting('sessionStats', stats);
}

// Reset all settings to defaults
export async function resetToDefaults() {
  await chrome.storage.sync.clear();
  return await initializeStorage();
}
