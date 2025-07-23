
const m3uUrl = "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/IPTVPREMIUM.m3u";
let channels = [];
let currentIndex = 0;
let lastPlaybackTime = 0;
let freezeCheckInterval = null;
let reconnecting = false;

const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const importBtn = document.getElementById("importBtn");
const customM3U = document.getElementById("customM3U");
const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

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
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      parsed.push({ ...current });
    }
  }

  return parsed;
}

async function loadM3U(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("M3U fetch failed");
    const text = await res.text();
    channels = parseM3U(text);
    if (channels.length === 0) throw new Error("No channels parsed");
    renderCategories();
    renderChannels();
    playChannel(0);
  } catch (err) {
    alert("🚫 Failed to load channels. " + err.message);
    console.error("M3U Load Error:", err);
  }
}

function renderCategories() {
  const groups = ["All", "Favorites", ...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML = groups.map(g => `<option value="\${g}">\${g}</option>`).join("");
}

function renderChannels() {
  const keyword = searchInput.value.toLowerCase();
  const group = categoryFilter.value;
  channelList.innerHTML = "";

  channels.forEach((ch, index) => {
    const isFav = favorites.includes(ch.name);
    if (
      (group === "All" || ch.group === group || (group === "Favorites" && isFav)) &&
      ch.name.toLowerCase().includes(keyword)
    ) {
      const div = document.createElement("div");
      div.className = "channel-card";
      div.innerHTML = \`
        <img src="\${ch.logo || "https://via.placeholder.com/150"}" alt="\${ch.name}">
        <span>\${ch.name}</span>
        <div class="fav \${isFav ? "on" : ""}" data-index="\${index}">★</div>
      \`;
      div.onclick = () => playChannel(index);
      channelList.appendChild(div);
    }
  });
}

function playChannel(index) {
  const ch = channels[index];
  if (!ch) return;

  currentIndex = index;
  nowPlaying.textContent = "Now Playing: " + ch.name;

  stopFreezeCheck();
  video.pause();
  video.src = ch.url;
  video.load();
  video.play().catch(err => console.warn("Playback error:", err));
  startFreezeCheck();
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

function startFreezeCheck() {
  stopFreezeCheck();
  lastPlaybackTime = video.currentTime;

  freezeCheckInterval = setInterval(() => {
    if (video.paused || video.readyState < 2 || reconnecting) return;

    if (video.currentTime === lastPlaybackTime) {
      reconnect();
    } else {
      lastPlaybackTime = video.currentTime;
    }
  }, 4000);
}

function stopFreezeCheck() {
  clearInterval(freezeCheckInterval);
  freezeCheckInterval = null;
  reconnecting = false;
}

function reconnect() {
  if (reconnecting) return;
  reconnecting = true;

  const overlay = document.createElement("div");
  overlay.id = "reconnectOverlay";
  overlay.innerText = "Reconnecting…";
  overlay.style = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#000a;color:#fff;padding:10px 20px;border-radius:10px;z-index:9999";
  document.querySelector(".video-wrapper")?.appendChild(overlay);

  const currentSrc = video.src;
  video.pause();
  video.src = "";
  video.load();

  setTimeout(() => {
    video.src = currentSrc;
    video.load();
    video.play().finally(() => {
      reconnecting = false;
      document.getElementById("reconnectOverlay")?.remove();
      lastPlaybackTime = video.currentTime;
    });
  }, 2000);
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

loadM3U(m3uUrl);
