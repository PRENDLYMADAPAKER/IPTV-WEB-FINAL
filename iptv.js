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

  video.src = ch.url;
  video.load();
  video.play().catch((err) => {
    console.warn("Initial playback error:", err);
  });

  const overlay = document.getElementById("reconnectOverlay");
  let lastTime = video.currentTime;
  let freezeCounter = 0;
  let checkInterval;

  function stopMonitoring() {
    clearInterval(checkInterval);
    overlay.style.display = "none";
  }

  function startMonitoring() {
    clearInterval(checkInterval);
    checkInterval = setInterval(() => {
      // If video is paused or ended, ignore
      if (video.paused || video.ended) return;

      // If video is making progress, reset counter
      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        freezeCounter = 0;
        overlay.style.display = "none";
      } else {
        // No progress, increase freeze counter
        freezeCounter++;
        if (freezeCounter >= 5) { // 5 seconds frozen
          overlay.style.display = "flex";
          console.warn("⛔ Video frozen, attempting reconnect...");
          video.load();
          video.play().catch(err => console.warn("Retry failed:", err));
          freezeCounter = 0; // reset after retry
        }
      }
    }, 1000);
  }

  // Clean up and restart freeze monitoring
  video.onplaying = startMonitoring;
  video.oncanplay = () => overlay.style.display = "none";
  video.onloadeddata = () => overlay.style.display = "none";
  video.onpause = stopMonitoring;
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

// No swipe-play functionality
setClock();
loadM3U(m3uUrl);
