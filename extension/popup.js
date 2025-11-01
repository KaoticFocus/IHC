// Popup script
let isRecording = false;

// Load recording status
chrome.runtime.sendMessage({ action: 'get-recording-status' }, (response) => {
  if (response && response.isRecording) {
    updateUI(true);
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'recording-started') {
    updateUI(true);
  } else if (request.action === 'recording-stopped') {
    updateUI(false);
  }
});

document.getElementById('startBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'start-recording' });
  updateUI(true);
});

document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop-recording' });
  updateUI(false);
});

function updateUI(recording) {
  isRecording = recording;
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  if (recording) {
    statusEl.textContent = '🔴 Recording...';
    statusEl.className = 'status recording';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusEl.textContent = 'Ready';
    statusEl.className = 'status idle';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

