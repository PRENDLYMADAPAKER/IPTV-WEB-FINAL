
const video = document.getElementById("videoPlayer");
const reconnectOverlay = document.createElement("div");
reconnectOverlay.id = "reconnectOverlay";
reconnectOverlay.textContent = "Reconnecting…";
reconnectOverlay.style.position = "absolute";
reconnectOverlay.style.top = "50%";
reconnectOverlay.style.left = "50%";
reconnectOverlay.style.transform = "translate(-50%, -50%)";
reconnectOverlay.style.color = "white";
reconnectOverlay.style.background = "rgba(0, 0, 0, 0.7)";
reconnectOverlay.style.padding = "10px 20px";
reconnectOverlay.style.borderRadius = "10px";
reconnectOverlay.style.display = "none";
reconnectOverlay.style.zIndex = "1000";
video.parentNode.style.position = "relative";
video.parentNode.appendChild(reconnectOverlay);

let lastTime = 0;
let freezeCounter = 0;
let maxFreezeChecks = 3;
let freezeCheckInterval = 5000; // 5s
let retrying = false;

function smartFreezeCheck() {
  if (video.paused || video.seeking || video.readyState < 2) {
    freezeCounter = 0;
    return;
  }

  if (video.currentTime === lastTime) {
    freezeCounter++;
    console.log("⚠️ Freeze suspected. Counter:", freezeCounter);
    if (freezeCounter >= maxFreezeChecks && !retrying) {
      triggerReconnect();
    }
  } else {
    freezeCounter = 0;
  }
  lastTime = video.currentTime;
}

function triggerReconnect() {
  retrying = true;
  reconnectOverlay.style.display = "block";
  const currentSrc = video.currentSrc;
  const currentChannel = document.getElementById("channelSelect").value;

  console.log("🔁 Reconnecting to", currentSrc);
  video.src = "";
  video.load();

  setTimeout(() => {
    video.src = currentSrc;
    video.load();
    video.play().catch(() => {});
    reconnectOverlay.style.display = "none";
    retrying = false;
  }, 3000);
}

setInterval(smartFreezeCheck, freezeCheckInterval);
