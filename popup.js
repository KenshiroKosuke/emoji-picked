const downloadBtn = document.getElementById('downloadBtn');
const channelNameEl = document.getElementById('channelName');
const emojiCountEl = document.getElementById('emojiCount');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('status');

// Run this the moment the popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url || !tab.url.includes("youtube.com")) {
    channelNameEl.innerText = "Please open YouTube.";
    return;
  }

  // Ask content.js for the info
  chrome.tabs.sendMessage(tab.id, { action: "get_info" }, (response) => {
    if (chrome.runtime.lastError) {
      // The content script isn't injected yet (page needs a refresh)
      channelNameEl.innerText = "Please refresh the page.";
      return;
    }

    if (response && response.error) {
      // The picker isn't open, or the selector failed
      channelNameEl.innerText = response.error;
      channelNameEl.style.color = "#ff9800"; // Orange warning color
    } else if (response) {
      // Success! Populate the UI and enable the button
      channelNameEl.innerText = response.channel;
      channelNameEl.style.color = "#fff";
      emojiCountEl.innerText = `${response.count} emojis ready to download.`;
      
      if (response.count > 0) {
        downloadBtn.disabled = false;
      }
    }
  });
});

downloadBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url || !tab.url.includes("youtube.com")) {
    statusText.innerText = "Please open YouTube.";
    return;
  }

  // Lock UI while working
  downloadBtn.disabled = true;
  statusText.innerText = "Finding emojis...";

  chrome.tabs.sendMessage(tab.id, { action: "start_scraping" }, (response) => {
    if (chrome.runtime.lastError) {
      statusText.innerText = "Error. Please refresh the page.";
      downloadBtn.disabled = false;
    }
  });
});

// Listen for progress messages from background.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "download_progress") {
    progressContainer.style.display = "block";
    statusText.innerText = `Downloading: ${message.current} / ${message.total}`;
    
    // Calculate percentage and update bar width
    const percent = (message.current / message.total) * 100;
    progressBar.style.width = `${percent}%`;
    
    if (message.current === message.total) {
      statusText.innerText = "Zipping files...";
    }
  } else if (message.action === "download_complete") {
    statusText.innerText = "Download Complete!";
    progressBar.style.backgroundColor = "#2196F3"; // Turn blue when done
    
    // Reset UI after 3 seconds
    setTimeout(() => {
      downloadBtn.disabled = false;
      progressContainer.style.display = "none";
      progressBar.style.width = "0%";
      progressBar.style.backgroundColor = "#4caf50";
      statusText.innerText = "";
    }, 3000);
  }
});