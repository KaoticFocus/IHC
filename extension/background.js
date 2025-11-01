// Background service worker for the extension
let isRecording = false;
let recordingStartTime = null;

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  
  if (command === 'start-recording') {
    startRecording();
  } else if (command === 'stop-recording') {
    stopRecording();
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'start-recording') {
    startRecording();
    sendResponse({ success: true });
  } else if (request.action === 'stop-recording') {
    stopRecording();
    sendResponse({ success: true });
  } else if (request.action === 'get-recording-status') {
    sendResponse({ isRecording, recordingStartTime });
  } else if (request.action === 'notify') {
    showNotification(request.title, request.message);
    sendResponse({ success: true });
  }
  
  return true; // Indicates we will send a response asynchronously
});

function startRecording() {
  if (isRecording) return;
  
  isRecording = true;
  recordingStartTime = Date.now();
  
  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'recording-started',
        timestamp: recordingStartTime
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
  
  // Show notification
  showNotification('Recording Started', 'Voice recording has started. Use Ctrl+Shift+S to stop.');
  
  // Update badge
  chrome.action.setBadgeText({ text: '●' });
  chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
}

function stopRecording() {
  if (!isRecording) return;
  
  isRecording = false;
  const duration = Date.now() - recordingStartTime;
  recordingStartTime = null;
  
  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'recording-stopped',
        duration
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
  
  // Show notification
  showNotification('Recording Stopped', `Recording stopped after ${Math.round(duration / 1000)}s`);
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: title,
    message: message
  });
}

// Initialize badge
chrome.action.setBadgeText({ text: '' });

