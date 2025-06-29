// storage.js
const STORAGE_KEY = 'allowedSites';

export async function getAllowedSites() {
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY], result => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

export async function saveAllowedSite(site) {
  const sites = await getAllowedSites();
  if (!sites.includes(site)) {
    sites.push(site);
    chrome.storage.local.set({ [STORAGE_KEY]: sites });
  }
}
