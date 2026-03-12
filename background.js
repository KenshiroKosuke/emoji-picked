importScripts('jszip.min.js');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "download_zip") {
    const folderName = message.data.channelLabel ?? "youtube_emojis_" + new Date().getTime();
    const items = message.data.imageData;
    processZip(items, folderName);
  }
});

// Wrapping the logic in an async function to keep it clean
async function processZip(items, folderName) {
  const zip = new JSZip();
  const folder = zip.folder(folderName);
  
  const BATCH_SIZE = 10;
  let downloadedCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (item) => {
      try {
        const response = await fetch(item.url);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        folder.file(item.filename, blob);
      } catch (e) {
        console.error(`Failed to fetch: ${item.url}`, e);
      } finally {
        downloadedCount++;
      }
    }));
    
    // --- SEND PROGRESS UPDATE TO POPUP ---
    // The .catch() prevents an error if you close the popup while it's downloading
    chrome.runtime.sendMessage({
      action: "download_progress",
      current: downloadedCount,
      total: items.length
    }).catch(() => {}); 
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  
  const reader = new FileReader();
  reader.onloadend = function() {
    chrome.downloads.download({
      url: reader.result,
      filename: `${folderName}.zip`,
      saveAs: true
    }, () => {
      // --- SEND COMPLETION MESSAGE ---
      chrome.runtime.sendMessage({ action: "download_complete" }).catch(() => {});
    });
  };
  reader.readAsDataURL(zipBlob);
}