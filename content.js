function getChannelAndEmojiInfo() {
  // --- Case 1: Member Emojis ---
  const emojiContainer = document.querySelector(".CATEGORY_TYPE_CUSTOM.style-scope.yt-emoji-picker-category-renderer");
  if (emojiContainer) {
    const images = Array.from(emojiContainer.querySelectorAll("img"));
    const channelLabel = emojiContainer.getAttribute("aria-label") || "Unknown Channel";
    return {
      images,
      channelLabel,
    };
  }

  // --- Case 2: Non-Member Emojis ---
  const nonMemberEmojiContainer = document.querySelector("yt-emoji-picker-upsell-category-renderer");
  if (nonMemberEmojiContainer) {
    const categoryRendererDiv = nonMemberEmojiContainer.children[1];
    return {
      images: Array.from(categoryRendererDiv.querySelectorAll("img")),
      channelLabel: nonMemberEmojiContainer.children[0].textContent || "Unknown Channel",
    };
  }

  // --- Case 3: Nothing Found ---
  return undefined;
}

// Trigger this via a shortcut or message; here we'll just listen for a message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_info") {
    const data = getChannelAndEmojiInfo();

    if (!data) {
      sendResponse({ error: "Open the emoji picker first!" });
      return;
    }

    // Send the data back to the popup
    sendResponse({
      channel: data.channelLabel,
      count: data.images.length,
    });
    return;
  }

  if (request.action === "start_scraping") {
    const data = getChannelAndEmojiInfo();

    if (!data) {
      console.error("Target #emoji div not found.");
      return;
    }

    const { channelLabel, images } = data;

    console.log(`Found ${images.length} emojis!`);
    const imageData = images.map((img, index) => {
      // 1. Get raw URL
      let rawUrl = img.src;
      // 2. Cut URL before '='
      let cleanUrl = rawUrl.split("=w")[0];
      // 3. Format Name: Pad index + Alt
      let id = (index + 1).toString().padStart(3, "0");
      let alt = img.getAttribute("alt") || "emoji";
      // let filename = `${id}_${alt}.png`;

      return { url: cleanUrl, baseFilename: `${id}_${alt}` };
    });

    if (images.length > 0) {
      chrome.runtime.sendMessage({
        action: "download_zip",
        data: { imageData: imageData, channelLabel: channelLabel },
      });
      sendResponse({ status: "started" });
    } else {
      alert("No images found.");
      sendResponse({ error: "No images" });
      return;
    }
  }
});
