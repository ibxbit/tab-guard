import {
  initializeStorage,
  getBlockedSites,
  getAllowedSites,
  getCustomBlockedMessage,
  getNotificationSettings,
  incrementDistractionAttempts,
  recordFocusSession
} from '../utils/storage.js';

const BLOCKED_PAGE_URL = chrome.runtime.getURL('public/blocked.html');

// Helper to get active focus session
async function getActiveFocusSession() { 
  return new Promise((resolve) => {
    chrome.storage.local.get(['focusSession'], (result) => {
      const session = result.focusSession;
      if (session && session.active && session.endTime > Date.now()) {
        resolve(session);
      } else {
        resolve(null);
      }
    });
  });
}

// Initialize background script
async function initializeBackground() {
  try {
    await initializeStorage();
    console.log('Tab Guard background script initialized');
  } catch (error) {
    console.error('Error initializing background script:', error);
  }
}

// Check if URL should be blocked
async function shouldBlockUrl(url) {
  try {
    const session = await getActiveFocusSession();
    if (!session) return false;

    const blockedSites = await getBlockedSites();
    const allowedSites = await getAllowedSites();
    const hostname = new URL(url).hostname.toLowerCase();

    // Check if site is explicitly allowed
    if (allowedSites.some(site => hostname.includes(site.toLowerCase()))) {
      return false;
    }
    // Check if site should be blocked
    return blockedSites.some(site => hostname.includes(site.toLowerCase()));
  } catch (error) {
    console.error('Error checking if URL should be blocked:', error);
    return false;
  }
}

// Handle tab updates
async function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    // Prevent redirect loop: if already on blocked page, do nothing
    if (tab.url.startsWith(BLOCKED_PAGE_URL)) return;
    const shouldBlock = await shouldBlockUrl(tab.url);
    if (shouldBlock) {
      // Record distraction attempt
      const attempts = await incrementDistractionAttempts();
      // Show notification if enabled
      const notifications = await getNotificationSettings();
      if (notifications.distractionAttempts) {
        showNotification(
          'Distraction Blocked! 🚫',
          `You tried to visit ${new URL(tab.url).hostname} during focus time.`,
          'warning'
        );
      }
      // Redirect to blocked page
      await chrome.tabs.update(tabId, { url: BLOCKED_PAGE_URL });
    }
  }
}

// Handle tab creation
async function handleTabCreated(tab) {
  if (tab.url && tab.url !== 'chrome://newtab/') {
    // Prevent redirect loop: if already on blocked page, do nothing
    if (tab.url.startsWith(BLOCKED_PAGE_URL)) return;
    const shouldBlock = await shouldBlockUrl(tab.url);
    if (shouldBlock) {
      // Record distraction attempt
      const attempts = await incrementDistractionAttempts();
      // Show notification if enabled
      const notifications = await getNotificationSettings();
      if (notifications.distractionAttempts) {
        showNotification(
          'New Tab Blocked! 🚫',
          `You tried to open ${new URL(tab.url).hostname} during focus time.`,
          'warning'
        );
      }
      // Redirect to blocked page
      await chrome.tabs.update(tab.id, { url: BLOCKED_PAGE_URL });
    }
  }
}

// Handle navigation attempts
async function handleBeforeNavigate(details) {
  if (details.frameId === 0) { // Main frame only
    const shouldBlock = await shouldBlockUrl(details.url);
    
    if (shouldBlock) {
      // Record distraction attempt
      const attempts = await incrementDistractionAttempts();
      
      // Show notification if enabled
      const notifications = await getNotificationSettings();
      if (notifications.distractionAttempts) {
        showNotification(
          'Navigation Blocked! 🚫',
          `You tried to navigate to ${new URL(details.url).hostname} during focus time.`,
          'warning'
        );
      }
      
      // Cancel the navigation
      return { cancel: true };
    }
  }
}

// Show notification
function showNotification(title, message, type = 'info') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/tab-guard-logo.png',
    title: title,
    message: message
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleFocusMode') {
    handleFocusModeToggle(message.isFocusMode);
  } else if (message.action === 'getStats') {
    handleGetStats(sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Handle focus mode toggle
async function handleFocusModeToggle(isFocusMode) {
  try {
    if (isFocusMode) {
      // Focus mode activated
      const notifications = await getNotificationSettings();
      if (notifications.sessionCompletion) {
        showNotification(
          'Focus Mode Activated! 🎯',
          'Distracting sites are now blocked. Stay focused!',
          'success'
        );
      }
      
      // Start tracking session
      sessionStartTime = Date.now();
    } else {
      // Focus mode deactivated
      if (sessionStartTime) {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000); // in minutes
        await recordFocusSession(sessionDuration);
        sessionStartTime = null;
        
        const notifications = await getNotificationSettings();
        if (notifications.sessionCompletion) {
          showNotification(
            'Focus Session Complete! ✅',
            `Great job! You focused for ${sessionDuration} minutes.`,
            'success'
          );
        }
      }
    }
  } catch (error) {
    console.error('Error handling focus mode toggle:', error);
  }
}

// Handle get stats request
async function handleGetStats(sendResponse) {
  try {
    const stats = await getSessionStats();
    sendResponse({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-focus-mode') {
    const currentStatus = await getFocusModeStatus();
    const newStatus = !currentStatus;
    
    // Update storage
    await chrome.storage.sync.set({ isFocusMode: newStatus });
    
    // Show notification
    const notifications = await getNotificationSettings();
    if (notifications.sessionCompletion) {
      showNotification(
        newStatus ? 'Focus Mode Activated! 🎯' : 'Focus Mode Deactivated',
        newStatus ? 'Distracting sites are now blocked.' : 'You can now visit all sites.',
        newStatus ? 'success' : 'warning'
      );
    }
  }
});

// Daily summary notification (runs at 9 PM)
function scheduleDailySummary() {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(21, 0, 0, 0); // 9 PM
  
  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1); // Tomorrow
  }
  
  const delay = targetTime.getTime() - now.getTime();
  
  setTimeout(async () => {
    try {
      const notifications = await getNotificationSettings();
      if (notifications.dailySummary) {
        const stats = await getSessionStats();
        const today = new Date().toDateString();
        const lastSession = stats.lastSessionDate ? new Date(stats.lastSessionDate).toDateString() : null;
        
        if (lastSession === today) {
          showNotification(
            'Daily Focus Summary 📊',
            `Today you completed ${stats.totalSessions} focus sessions and stayed focused for ${Math.floor(stats.totalFocusTime / 60)}h ${stats.totalFocusTime % 60}m. Great work!`,
            'success'
          );
        }
      }
      
      // Schedule next day
      scheduleDailySummary();
    } catch (error) {
      console.error('Error showing daily summary:', error);
    }
  }, delay);
}

// Session tracking
let sessionStartTime = null;

// Initialize when extension loads
initializeBackground();

// Set up event listeners
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.tabs.onCreated.addListener(handleTabCreated);
chrome.webNavigation.onBeforeNavigate.addListener(handleBeforeNavigate);

// Schedule daily summary
scheduleDailySummary();

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First time installation
    showNotification(
      'Welcome to Tab Guard! 🎉',
      'Your focus companion is ready. Click the extension icon to get started!',
      'success'
    );
  } else if (details.reason === 'update') {
    // Extension updated
    showNotification(
      'Tab Guard Updated! ✨',
      'New features and improvements are available. Check out the new customization options!',
      'success'
    );
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open popup when notification is clicked
  chrome.action.openPopup();
});

// Instantly block navigation before page loads
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only main frame
  if (details.frameId !== 0) return;
  // Prevent redirect loop
  if (details.url.startsWith(BLOCKED_PAGE_URL)) return;
  const shouldBlock = await shouldBlockUrl(details.url);
  if (shouldBlock) {
    // Redirect instantly
    chrome.tabs.update(details.tabId, { url: BLOCKED_PAGE_URL });
  }
}, { url: [{ schemes: ["http", "https"] }] });

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    shouldBlockUrl,
    handleTabUpdate,
    handleTabCreated,
    handleBeforeNavigate,
    showNotification,
    handleFocusModeToggle
  };
}
