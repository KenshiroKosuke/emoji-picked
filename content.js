// Trigger this via a shortcut or message; here we'll just listen for a message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_info") {
    const emojiContainer = document.querySelector(
      ".CATEGORY_TYPE_CUSTOM.style-scope.yt-emoji-picker-category-renderer",
    );

    if (!emojiContainer) {
      sendResponse({ error: "Open the emoji picker first!" });
      return;
    }

    const images = emojiContainer.querySelectorAll("img");
    const channelLabel = emojiContainer.getAttribute("aria-label") || "Unknown Channel";

    // Send the data back to the popup
    sendResponse({
      channel: channelLabel,
      count: images.length,
    });
    return;
  }

  if (request.action === "start_scraping") {
    const emojiContainer = document.querySelector(
      ".CATEGORY_TYPE_CUSTOM.style-scope.yt-emoji-picker-category-renderer",
    );

    if (!emojiContainer) {
      console.error("Target #emoji div not found.");
      return;
    }

    const channelLabel = emojiContainer.getAttribute("aria-label");

    const images = emojiContainer.querySelectorAll("img");

    console.log(`Found ${images.length} emojis!`);
    const imageData = Array.from(images).map((img, index) => {
      // 1. Get raw URL
      let rawUrl = img.src;
      // 2. Cut URL before '='
      let cleanUrl = rawUrl.split("=w")[0];
      // 3. Format Name: Pad index + Alt
      let id = (index + 1).toString().padStart(3, "0");
      let alt = img.getAttribute("alt") || "emoji";
      let filename = `${id}_${alt}.png`;

      return { url: cleanUrl, filename: filename };
    });

    if (images.length > 0) {
      chrome.runtime.sendMessage({
        action: "download_zip",
        data: { imageData: imageData, channelLabel: channelLabel },
      });
    } else {
      alert("No images found.");
      return;
    }
  }
});
