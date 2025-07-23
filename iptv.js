
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

function playChannel(index) {
  const ch = channels[index];
  if (!ch || !isStreamSupported(ch.url)) return;

  currentIndex = index;
  nowPlaying.textContent = "Now Playing: " + ch.name;

  video.removeAttribute("src");
  video.load();
  video.src = ch.url;
  video.play().catch((err) => {
    console.warn("Playback failed:", err);
  });

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


// ✅ Smart Freeze Detection & Reconnect Patch
let lastTime = 0;
let freezeCheckInterval;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10000;

function setupFreezeDetection(videoEl, src) {
    clearInterval(freezeCheckInterval);
    lastTime = videoEl.currentTime;
    reconnectAttempts = 0;

    freezeCheckInterval = setInterval(() => {
        if (videoEl.paused || videoEl.readyState < 2) return;

        if (videoEl.currentTime === lastTime) {
            reconnectAttempts++;
            if (reconnectAttempts > 3) {
                console.log("⚠️ Freeze detected. Reconnecting...");
                showOverlay("Reconnecting…");
                reconnectStream(videoEl, src);
                reconnectAttempts = 0;
            }
        } else {
            reconnectAttempts = 0;
            hideOverlay();
        }
        lastTime = videoEl.currentTime;
    }, 4000);
}

function reconnectStream(videoEl, src) {
    videoEl.src = "";
    videoEl.load();
    setTimeout(() => {
        videoEl.src = src;
        videoEl.load();
        videoEl.play().catch(err => console.warn("Replay failed:", err));
    }, 1500);
}

function showOverlay(text) {
    let overlay = document.getElementById("reconnectOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "reconnectOverlay";
        overlay.style.position = "absolute";
        overlay.style.top = "50%";
        overlay.style.left = "50%";
        overlay.style.transform = "translate(-50%, -50%)";
        overlay.style.padding = "12px 24px";
        overlay.style.background = "rgba(0,0,0,0.7)";
        overlay.style.color = "#fff";
        overlay.style.fontSize = "18px";
        overlay.style.borderRadius = "8px";
        overlay.style.zIndex = 9999;
        document.body.appendChild(overlay);
    }
    overlay.innerText = text;
    overlay.style.display = "block";
}

function hideOverlay() {
    const overlay = document.getElementById("reconnectOverlay");
    if (overlay) overlay.style.display = "none";
}
