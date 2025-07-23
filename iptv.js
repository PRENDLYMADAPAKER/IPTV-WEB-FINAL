
// iptv.js - Improved with smart freeze detection & reconnect

const video = document.getElementById("videoPlayer");
const channelSelector = document.getElementById("channelSelector");
const reconnectOverlay = document.getElementById("reconnectOverlay");
let currentUrl = "";
let freezeCheckInterval = null;
let lastCurrentTime = 0;
let isReconnecting = false;

function playChannel(url) {
  currentUrl = url;
  if (Hls.isSupported()) {
    if (video.hls) {
      video.hls.destroy();
    }
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    video.hls = hls;
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.play();
  }
  document.getElementById("nowPlaying").textContent = channelSelector.options[channelSelector.selectedIndex].text;
  startFreezeCheck();
}

function startFreezeCheck() {
  clearInterval(freezeCheckInterval);
  lastCurrentTime = video.currentTime;

  freezeCheckInterval = setInterval(() => {
    if (video.paused || video.readyState < 2) return;

    if (video.currentTime === lastCurrentTime && !video.seeking) {
      triggerReconnect("Video frozen");
    } else {
      lastCurrentTime = video.currentTime;
    }
  }, 5000);
}

function triggerReconnect(reason) {
  if (isReconnecting || !currentUrl) return;

  isReconnecting = true;
  showReconnectOverlay(true);

  console.log("Reconnecting due to:", reason);

  const tryReconnect = () => {
    console.log("Trying to reconnect...");
    playChannel(currentUrl);
    setTimeout(() => {
      if (!video.paused && video.currentTime !== lastCurrentTime) {
        // Success
        isReconnecting = false;
        showReconnectOverlay(false);
      } else {
        tryReconnect(); // Try again
      }
    }, 3000);
  };

  tryReconnect();
}

function showReconnectOverlay(show) {
  reconnectOverlay.style.display = show ? "flex" : "none";
}

// Setup channels (adjust list as needed)
const channels = [
  { name: "HBO", url: "https://your-stream-url/hbo.m3u8" },
  { name: "GMA", url: "https://your-stream-url/gma.m3u8" },
];

channels.forEach((channel) => {
  const option = document.createElement("option");
  option.value = channel.url;
  option.textContent = channel.name;
  channelSelector.appendChild(option);
});

channelSelector.addEventListener("change", () => {
  const selectedUrl = channelSelector.value;
  playChannel(selectedUrl);
});

document.getElementById("importBtn").addEventListener("click", () => {
  const customUrl = document.getElementById("customUrl").value;
  if (customUrl) {
    playChannel(customUrl);
  }
});
