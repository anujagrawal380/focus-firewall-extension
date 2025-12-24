// Default blocked websites
const DEFAULT_BLOCKED_SITES = [
  'linkedin.com',
  'x.com',
  'youtube.com',
  'hotstar.com'
];

// Store tabs that have been bypassed temporarily
const bypassedTabs = new Map();

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['blockedSites', 'todos'], (data) => {
    if (!data.blockedSites) {
      chrome.storage.sync.set({ blockedSites: DEFAULT_BLOCKED_SITES });
    }
    if (!data.todos) {
      chrome.storage.sync.set({ todos: [] });
    }
  });
});

// Check if URL should be blocked
function shouldBlockUrl(url, blockedSites) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    
    return blockedSites.some(site => {
      const cleanSite = site.toLowerCase().replace('www.', '');
      return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
    });
  } catch (e) {
    return false;
  }
}

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Only handle main frame
  
  // Check if this tab has been bypassed
  if (bypassedTabs.has(details.tabId)) {
    const bypassData = bypassedTabs.get(details.tabId);
    
    // If bypassing to this specific URL, allow it
    if (bypassData.url === details.url) {
      bypassedTabs.delete(details.tabId);
      return;
    }
  }
  
  chrome.storage.sync.get(['blockedSites'], (data) => {
    const blockedSites = data.blockedSites || DEFAULT_BLOCKED_SITES;
    
    if (shouldBlockUrl(details.url, blockedSites)) {
      // Redirect to block page with original URL as parameter
      const blockPageUrl = chrome.runtime.getURL('block.html') + 
        '?url=' + encodeURIComponent(details.url);
      
      chrome.tabs.update(details.tabId, { url: blockPageUrl });
    }
  });
});

// Listen for messages from block page to bypass
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'bypass' && request.url && sender.tab) {
    bypassedTabs.set(sender.tab.id, { 
      url: request.url, 
      timestamp: Date.now() 
    });
    sendResponse({ success: true });
  }
  return true;
});
