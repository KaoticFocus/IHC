// Content script that runs on web pages
(function() {
  'use strict';

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'recording-started') {
      // Dispatch custom event to web app
      window.dispatchEvent(new CustomEvent('ihc-recording-started', {
        detail: { timestamp: request.timestamp }
      }));
      
      // If web app has a function to handle this, call it
      if (window.ihcExtension && window.ihcExtension.onRecordingStarted) {
        window.ihcExtension.onRecordingStarted(request.timestamp);
      }
    } else if (request.action === 'recording-stopped') {
      // Dispatch custom event to web app
      window.dispatchEvent(new CustomEvent('ihc-recording-stopped', {
        detail: { duration: request.duration }
      }));
      
      // If web app has a function to handle this, call it
      if (window.ihcExtension && window.ihcExtension.onRecordingStopped) {
        window.ihcExtension.onRecordingStopped(request.duration);
      }
    }
    
    sendResponse({ success: true });
  });

  // Expose extension API to web app
  window.ihcExtension = {
    startRecording: () => {
      chrome.runtime.sendMessage({ action: 'start-recording' });
    },
    stopRecording: () => {
      chrome.runtime.sendMessage({ action: 'stop-recording' });
    },
    getRecordingStatus: () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'get-recording-status' }, resolve);
      });
    },
    showNotification: (title, message) => {
      chrome.runtime.sendMessage({ action: 'notify', title, message });
    },
    onRecordingStarted: null,
    onRecordingStopped: null,
  };

  console.log('IHC Extension content script loaded');
})();

