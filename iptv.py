const m3uUrl =
  "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
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
    const text = await res.text();
    channels = parseM3U(text);
    renderCategories();
    renderChannels();
    playChannel(0);
  } catch (err) {
    alert("Failed to load M3U. Please check the URL.");
    console.error(err);
  }
}

function renderCategories() {
  const groups = ["All", "Favorites", ...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML = groups
    .map(g => `<option value="${g}">${g}</option>`)
    .join("");
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
      div.innerHTML = `
        <img src="${ch.logo || "https://via.placeholder.com/150"}" alt="${ch.name}">
        <span>${ch.name}</span>
        <div class="fav ${isFav ? "on" : ""}" data-index="${index}">★</div>
      `;
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

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(ch.url);
    hls.attachMedia(video);
  } else {
    video.src = ch.url;
  }
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

document.addEventListener("touchstart", handleSwipeStart, false);
document.addEventListener("touchend", handleSwipeEnd, false);

let xStart = null;

function handleSwipeStart(evt) {
  xStart = evt.touches[0].clientX;
}

function handleSwipeEnd(evt) {
  if (!xStart) return;
  let xEnd = evt.changedTouches[0].clientX;
  if (xEnd - xStart > 50) playChannel((currentIndex - 1 + channels.length) % channels.length);
  else if (xStart - xEnd > 50) playChannel((currentIndex + 1) % channels.length);
  xStart = null;
}

setClock();
loadM3U(m3uUrl);
