
const m3uUrl = "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/IPTVPREMIUM.m3u";
let channels = [];
let currentIndex = 0;

const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const importBtn = document.getElementById("importBtn");
const customM3U = document.getElementById("customM3U");

const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

function setClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString();
  }, 1000);
}

function parseM3U(content) {
  const lines = content.split("\n");
  const parsed = [];
  let current = {};

  for (let line of lines) {
    if (line.startsWith("#EXTINF:")) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : "Unnamed",
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Others",
        url: "",
      };
    } else if (line.startsWith("http") || line.startsWith("rtmp") || line.startsWith("rtsp") || line.startsWith("udp") || line.startsWith("acestream")) {
      current.url = line.trim();
      parsed.push({ ...current });
    }
  }

  return parsed;
}

function isStreamSupported(url) {
  return url.startsWith("http") && !url.includes("udp:") && !url.includes("rtsp:") && !url.includes("acestream:");
}

async function loadM3U(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    channels = parseM3U(text);
    renderCategories();
    renderChannels();
    const firstPlayable = channels.findIndex(ch => isStreamSupported(ch.url));
    if (firstPlayable !== -1) playChannel(firstPlayable);
  } catch (err) {
    alert("Failed to load M3U. Please check the URL.");
    console.error(err);
  }
}

function renderCategories() {
  const groups = ["All", "Favorites", ...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML = groups.map(g => `<option value="${g}">${g}</option>`).join("");
}

function renderChannels() {
  const keyword = searchInput.value.toLowerCase();
  const group = categoryFilter.value;
  channelList.innerHTML = "";

  channels.forEach((ch, index) => {
    const isFav = favorites.includes(ch.name);
    const isSupported = isStreamSupported(ch.url);
    if (
      (group === "All" || ch.group === group || (group === "Favorites" && isFav)) &&
      ch.name.toLowerCase().includes(keyword)
    ) {
      const div = document.createElement("div");
      div.className = "channel-card" + (isSupported ? "" : " disabled");
      div.innerHTML = `
        <img src="${ch.logo || "https://via.placeholder.com/150"}" alt="${ch.name}">
        <span>${ch.name}${!isSupported ? " 🚫" : ""}</span>
        <div class="fav ${isFav ? "on" : ""}" data-index="${index}">★</div>
      `;
      if (isSupported) div.onclick = () => playChannel(index);
      channelList.appendChild(div);
    }
  });
}


function playChannel(url) {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();

  const selectedSource = document.getElementById("sourceSelector")?.value || "";
  if (selectedSource === "TheTVApp" && Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
    });
  } else {
    video.src = url;
    video.play();
  }

  nowPlaying.textContent = "Now Playing: " + getChannelName(url);
  currentIndex = channels.findIndex(c => c.url === url);
}
);

  // Auto-reconnect logic for stability
  let retryCount = 0;
  function handleStreamError() {
    if (retryCount >= 3) return;
    retryCount++;
    console.warn("Stream issue detected. Retrying playback...", retryCount);
    setTimeout(() => {
      video.load();
      video.play().catch((err) => console.warn("Retry failed:", err));
    }, 2000);
  }

  video.onerror = handleStreamError;
  video.onstalled = handleStreamError;
  video.onwaiting = handleStreamError;
}

function toggleFavorite(index) {
  const ch = channels[index];
  if (!ch) return;
  const i = favorites.indexOf(ch.name);
  if (i === -1) {
    favorites.push(ch.name);
  } else {
    favorites.splice(i, 1);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderChannels();
}

channelList.addEventListener("click", (e) => {
  if (e.target.classList.contains("fav")) {
    e.stopPropagation();
    toggleFavorite(e.target.dataset.index);
  }
});

searchInput.addEventListener("input", renderChannels);
categoryFilter.addEventListener("change", renderChannels);
importBtn.addEventListener("click", () => {
  const url = customM3U.value.trim();
  if (url) loadM3U(url);
});

setClock();
loadM3U(m3uUrl);



// ✅ Smart Freeze Detection + Confirmed Recovery Loop
let lastTime = 0;
let freezeCounter = 0;
let freezeCheckTimer;

function setupFreezeMonitor(videoEl, streamUrl) {
  clearInterval(freezeCheckTimer);
  freezeCounter = 0;
  lastTime = 0;

  freezeCheckTimer = setInterval(() => {
    if (!videoEl || videoEl.readyState < 2 || videoEl.paused) return;

    if (videoEl.currentTime === lastTime) {
      freezeCounter++;
      console.log("🔁 Freeze suspected (counter: " + freezeCounter + ")");
      if (freezeCounter >= 3) {
        triggerReconnect(videoEl, streamUrl);
        freezeCounter = 0;
      }
    } else {
      lastTime = videoEl.currentTime;
      freezeCounter = 0;
    }
  }, 5000);
}

function triggerReconnect(videoEl, streamUrl) {
  console.warn("⚠️ Video frozen. Attempting reconnect…");
  showReconnectOverlay(true);

  let retryAttempts = 0;
  function tryReplay() {
    videoEl.pause();
    videoEl.src = "";
    videoEl.load();
    setTimeout(() => {
      videoEl.src = streamUrl;
      videoEl.load();
      videoEl.play().then(() => {
        hideReconnectOverlay();
        setupFreezeMonitor(videoEl, streamUrl);
        console.log("✅ Reconnected successfully.");
      }).catch((err) => {
        retryAttempts++;
        console.warn("Reconnect attempt " + retryAttempts + " failed. Retrying…");
        if (retryAttempts < 20) setTimeout(tryReplay, 2000);
        else showReconnectOverlay("❌ Failed to reconnect after 20 tries");
      });
    }, 1000);
  }

  tryReplay();
}

function showReconnectOverlay(show = true) {
  let overlay = document.getElementById("reconnectOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "reconnectOverlay";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.color = "white";
    overlay.style.fontSize = "20px";
    overlay.style.zIndex = "9999";
    overlay.innerText = "Reconnecting…";
    document.body.appendChild(overlay);
  }
  overlay.style.display = show ? "flex" : "none";
}

function hideReconnectOverlay() {
  showReconnectOverlay(false);
}



// === 🔁 Playlist Auto-Update & Manual Refresh ===
function fetchPlaylistAndReload() {
  fetch(m3uUrl)
    .then(res => res.text())
    .then(data => {
      channels = parseM3U(data);
      populateGroupList();
      populateChannelList();
      if (channels.length > 0) {
        currentIndex = 0;
        playChannel(channels[0]);
      }
    })
    .catch(err => {
      console.error("Failed to reload playlist:", err);
    });
}

// 🔘 Add manual update button to DOM
const updateBtn = document.createElement("button");
updateBtn.innerText = "🔄 Update Playlist";
updateBtn.style.position = "absolute";
updateBtn.style.top = "10px";
updateBtn.style.right = "10px";
updateBtn.style.zIndex = "1000";
updateBtn.style.padding = "6px 12px";
updateBtn.style.borderRadius = "6px";
updateBtn.style.border = "none";
updateBtn.style.background = "#ff5555";
updateBtn.style.color = "#fff";
updateBtn.style.fontSize = "14px";
updateBtn.style.cursor = "pointer";
document.body.appendChild(updateBtn);

updateBtn.addEventListener("click", () => {
  console.log("🔁 Manual playlist update triggered.");
  fetchPlaylistAndReload();
});

// 🔁 Auto-update every 3 minutes
setInterval(() => {
  console.log("⏱️ Auto-refreshing playlist from source...");
  fetchPlaylistAndReload();
}, 180000);
