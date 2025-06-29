import {
  initializeStorage,
  getBlockedSites,
  addBlockedSite,
  removeBlockedSite,
  getAllowedSites,
  addAllowedSite,
  removeAllowedSite,
  getTheme,
  setTheme,
  getCustomBlockedMessage,
  setCustomBlockedMessage,
  getCurrentQuote,
  getNextQuote,
  getNotificationSettings,
  updateNotificationSetting,
  getSessionStats,
  incrementDistractionAttempts,
  recordFocusSession
} from '../utils/storage.js';

// DOM Elements
const elements = {
  // Focus Session
  focusSection: document.getElementById('focusSection'),
  focusSetup: document.getElementById('focusSetup'),
  focusActive: document.getElementById('focusActive'),
  focusMinutes: document.getElementById('focusMinutes'),
  passcode: document.getElementById('passcode'),
  startFocusBtn: document.getElementById('startFocusBtn'),
  countdown: document.getElementById('countdown'),
  unlockPasscode: document.getElementById('unlockPasscode'),
  stopFocusBtn: document.getElementById('stopFocusBtn'),
  statusText: document.getElementById('statusText'),
  
  // Site Management
  blockedSiteInput: document.getElementById('blockedSiteInput'),
  addBlockedBtn: document.getElementById('addBlockedBtn'),
  blockedSitesList: document.getElementById('blockedSitesList'),
  allowedSiteInput: document.getElementById('allowedSiteInput'),
  addAllowedBtn: document.getElementById('addAllowedBtn'),
  allowedSitesList: document.getElementById('allowedSitesList'),
  
  // Theme
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.querySelector('.theme-icon'),
  
  // Customization
  customMessage: document.getElementById('customMessage'),
  saveMessageBtn: document.getElementById('saveMessageBtn'),
  currentQuote: document.getElementById('currentQuote'),
  nextQuoteBtn: document.getElementById('nextQuoteBtn'),
  
  // Notifications
  sessionCompletionNotif: document.getElementById('sessionCompletionNotif'),
  distractionAttemptsNotif: document.getElementById('distractionAttemptsNotif'),
  dailySummaryNotif: document.getElementById('dailySummaryNotif'),
  
  // Statistics
  totalSessions: document.getElementById('totalSessions'),
  totalFocusTime: document.getElementById('totalFocusTime'),
  distractionAttempts: document.getElementById('distractionAttempts'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// Session state
let focusSession = null;
let timerInterval = null;

// Initialize the popup
async function initializePopup() {
  try {
    await initializeStorage();
    await loadCurrentState();
    setupEventListeners();
    await applyTheme();
    showToast('Tab Guard loaded successfully!', 'success');
  } catch (error) {
    console.error('Error initializing popup:', error);
    showToast('Error loading Tab Guard', 'error');
  }
}

// Load current state from storage
async function loadCurrentState() {
  // Load session state from storage
  const session = await getSessionFromStorage();
  if (session && session.active) {
    focusSession = session;
    showFocusActive();
    startTimer();
  } else {
    showFocusSetup();
  }
  
  // Load sites
  await loadSites();
  
  // Load custom message
  const customMessage = await getCustomBlockedMessage();
  elements.customMessage.value = customMessage;
  
  // Load motivation quote
  const quote = await getCurrentQuote();
  elements.currentQuote.textContent = quote;
  
  // Load notification settings
  const notifications = await getNotificationSettings();
  elements.sessionCompletionNotif.checked = notifications.sessionCompletion;
  elements.distractionAttemptsNotif.checked = notifications.distractionAttempts;
  elements.dailySummaryNotif.checked = notifications.dailySummary;
  
  // Load statistics
  await loadStatistics();
}

// Session storage helpers
function getSessionFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['focusSession'], (result) => {
      resolve(result.focusSession || null);
    });
  });
}
function setSessionToStorage(session) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ focusSession: session }, resolve);
  });
}
function clearSessionFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['focusSession'], resolve);
  });
}

// UI switching
function showFocusSetup() {
  elements.focusSetup.classList.remove('hidden');
  elements.focusActive.classList.add('hidden');
  elements.statusText.textContent = 'Focus mode is off';
  elements.statusText.style.color = 'var(--text-secondary)';
}
function showFocusActive() {
  elements.focusSetup.classList.add('hidden');
  elements.focusActive.classList.remove('hidden');
  elements.statusText.textContent = 'Focus mode is active - sites are being blocked';
  elements.statusText.style.color = 'var(--success-color)';
}

// Event listeners
function setupEventListeners() {
  elements.startFocusBtn.addEventListener('click', handleStartFocus);
  elements.stopFocusBtn.addEventListener('click', handleStopFocus);
  elements.addBlockedBtn.addEventListener('click', handleAddBlockedSite);
  elements.addAllowedBtn.addEventListener('click', handleAddAllowedSite);
  elements.themeToggle.addEventListener('click', handleThemeToggle);
  elements.saveMessageBtn.addEventListener('click', handleSaveCustomMessage);
  elements.nextQuoteBtn.addEventListener('click', handleNextQuote);
  elements.sessionCompletionNotif.addEventListener('change', handleNotificationChange);
  elements.distractionAttemptsNotif.addEventListener('change', handleNotificationChange);
  elements.dailySummaryNotif.addEventListener('change', handleNotificationChange);
  document.addEventListener('keydown', handleKeyboardShortcuts);
  elements.blockedSiteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddBlockedSite(); });
  elements.allowedSiteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddAllowedSite(); });
  elements.customMessage.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSaveCustomMessage(); });
  elements.passcode.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleStartFocus(); });
  elements.unlockPasscode.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleStopFocus(); });
}

// Start focus session
async function handleStartFocus() {
  const minutes = parseInt(elements.focusMinutes.value, 10);
  const passcode = elements.passcode.value.trim();
  if (!minutes || minutes < 1 || minutes > 180) {
    showToast('Please enter a valid focus time (1-180 min)', 'warning');
    return;
  }
  if (!/^[0-9]{4}$/.test(passcode)) {
    showToast('Please set a 4-digit passcode', 'warning');
    return;
  }
  const endTime = Date.now() + minutes * 60 * 1000;
  focusSession = { active: true, endTime, passcode };
  await setSessionToStorage(focusSession);
  showFocusActive();
  startTimer();
  showToast('Focus session started!', 'success');
}

// Stop focus session
async function handleStopFocus() {
  const inputPass = elements.unlockPasscode.value.trim();
  if (!focusSession || !focusSession.active) return;
  if (inputPass !== focusSession.passcode) {
    showToast('Incorrect passcode', 'error');
    return;
  }
  await clearSessionFromStorage();
  focusSession = null;
  stopTimer();
  showFocusSetup();
  showToast('Focus session stopped', 'success');
}

// Timer logic
function startTimer() {
  updateCountdown();
  timerInterval = setInterval(updateCountdown, 1000);
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  elements.countdown.textContent = '--:--';
}
function updateCountdown() {
  if (!focusSession || !focusSession.active) return;
  const now = Date.now();
  const remaining = Math.max(0, focusSession.endTime - now);
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  elements.countdown.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  if (remaining <= 0) {
    handleSessionComplete();
  }
}
async function handleSessionComplete() {
  await clearSessionFromStorage();
  focusSession = null;
  stopTimer();
  showFocusSetup();
  showToast('Focus session complete!', 'success');
}

// Handle adding blocked site
async function handleAddBlockedSite() {
  const site = elements.blockedSiteInput.value.trim();
  if (!site) {
    showToast('Please enter a site to block', 'warning');
    return;
  }

  try {
    await addBlockedSite(site);
    elements.blockedSiteInput.value = '';
    await loadSites();
    showToast(`Blocked ${site}`, 'success');
  } catch (error) {
    console.error('Error adding blocked site:', error);
    showToast('Error adding blocked site', 'error');
  }
}

// Handle adding allowed site
async function handleAddAllowedSite() {
  const site = elements.allowedSiteInput.value.trim();
  if (!site) {
    showToast('Please enter a site to allow', 'warning');
    return;
  }
  
  try {
    await addAllowedSite(site);
    elements.allowedSiteInput.value = '';
    await loadSites();
    showToast(`Allowed ${site}`, 'success');
  } catch (error) {
    console.error('Error adding allowed site:', error);
    showToast('Error adding allowed site', 'error');
  }
}

// Load sites from storage
async function loadSites() {
  try {
    const blockedSites = await getBlockedSites();
    const allowedSites = await getAllowedSites();
    
    renderSiteList(elements.blockedSitesList, blockedSites, 'blocked');
    renderSiteList(elements.allowedSitesList, allowedSites, 'allowed');
  } catch (error) {
    console.error('Error loading sites:', error);
  }
}

// Render site list
function renderSiteList(container, sites, type) {
  container.innerHTML = '';
  
  if (sites.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = `No ${type} sites yet`;
    emptyMessage.style.cssText = 'padding: 20px; text-align: center; color: var(--text-muted); font-style: italic;';
    container.appendChild(emptyMessage);
    return;
  }

  sites.forEach(site => {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    
    const siteName = document.createElement('span');
    siteName.className = 'site-name';
    siteName.textContent = site;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = `Remove ${site}`;
    removeBtn.addEventListener('click', () => handleRemoveSite(site, type));
    
    siteItem.appendChild(siteName);
    siteItem.appendChild(removeBtn);
    container.appendChild(siteItem);
  });
}

// Handle removing site
async function handleRemoveSite(site, type) {
  try {
    if (type === 'blocked') {
      await removeBlockedSite(site);
      showToast(`Removed ${site} from blocked sites`, 'success');
    } else {
      await removeAllowedSite(site);
      showToast(`Removed ${site} from allowed sites`, 'success');
    }
    await loadSites();
  } catch (error) {
    console.error('Error removing site:', error);
    showToast('Error removing site', 'error');
  }
}

// Handle theme toggle
async function handleThemeToggle() {
  try {
    const currentTheme = await getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
    await applyTheme();
    
    showToast(`Switched to ${newTheme} theme`, 'success');
  } catch (error) {
    console.error('Error toggling theme:', error);
    showToast('Error switching theme', 'error');
  }
}

// Apply current theme
async function applyTheme() {
  const theme = await getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme icon
  elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Handle saving custom message
async function handleSaveCustomMessage() {
  const message = elements.customMessage.value.trim();
  if (!message) {
    showToast('Please enter a custom message', 'warning');
    return;
  }
  
  try {
    await setCustomBlockedMessage(message);
    showToast('Custom message saved!', 'success');
  } catch (error) {
    console.error('Error saving custom message:', error);
    showToast('Error saving custom message', 'error');
  }
}

// Handle next quote
async function handleNextQuote() {
  try {
    const quote = await getNextQuote();
    elements.currentQuote.textContent = quote;
    showToast('New motivation quote loaded!', 'success');
  } catch (error) {
    console.error('Error loading next quote:', error);
    showToast('Error loading quote', 'error');
  }
}

// Handle notification setting change
async function handleNotificationChange(event) {
  const setting = event.target.id.replace('Notif', '');
  const value = event.target.checked;
  
  try {
    await updateNotificationSetting(setting, value);
    showToast(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} notifications ${value ? 'enabled' : 'disabled'}`, 'success');
  } catch (error) {
    console.error('Error updating notification setting:', error);
    showToast('Error updating notification setting', 'error');
  }
}

// Load statistics
async function loadStatistics() {
  try {
    const stats = await getSessionStats();
    
    elements.totalSessions.textContent = stats.totalSessions;
    elements.totalFocusTime.textContent = formatTime(stats.totalFocusTime);
    elements.distractionAttempts.textContent = stats.distractionAttempts;
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// Format time in hours and minutes
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Escape to close popup
  if (event.key === 'Escape') {
    window.close();
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  elements.toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStats') {
    loadStatistics();
  } else if (message.action === 'showToast') {
    showToast(message.message, message.type);
  }
});
