import Hls from "https://cdn.jsdelivr.net/npm/hls.js@latest";

const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
const video = document.getElementById("video");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const nowPlaying = document.getElementById("nowPlaying");
const channelIcon = document.getElementById("channel-icon");
const channelContainer = document.getElementById("channel-container");

let allChannels = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function parseM3U(data) {
  const lines = data.split("\n");
  const channels = [];
  let current = {};

  lines.forEach(line => {
    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);

      current = {
        name: nameMatch ? nameMatch[1] : "Unknown",
        logo: logoMatch ? logoMatch[1] : "https://via.placeholder.com/50",
        group: groupMatch ? groupMatch[1] : "Others"
      };
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      channels.push({ ...current });
    }
  });

  return channels;
}

function renderChannels(channels) {
  channelContainer.innerHTML = "";
  channels.forEach(channel => {
    const div = document.createElement("div");
    div.className = "channel";
    div.innerHTML = `
      <img src="${channel.logo}" alt="${channel.name}">
      <div>${channel.name}</div>
      <div class="star" data-name="${channel.name}">${favorites.includes(channel.name) ? "⭐" : "☆"}</div>
    `;
    div.onclick = () => playChannel(channel);
    div.querySelector(".star").onclick = e => {
      e.stopPropagation();
      toggleFavorite(channel.name);
      renderChannels(channels);
    };
    channelContainer.appendChild(div);
  });

  // Carousel swipe
  let isDown = false;
  let startX;
  let scrollLeft;
  channelContainer.addEventListener("mousedown", e => {
    isDown = true;
    channelContainer.classList.add("dragging");
    startX = e.pageX - channelContainer.offsetLeft;
    scrollLeft = channelContainer.scrollLeft;
  });
  channelContainer.addEventListener("mouseleave", () => {
    isDown = false;
    channelContainer.classList.remove("dragging");
  });
  channelContainer.addEventListener("mouseup", () => {
    isDown = false;
    channelContainer.classList.remove("dragging");
  });
  channelContainer.addEventListener("mousemove", e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - channelContainer.offsetLeft;
    const walk = (x - startX) * 2;
    channelContainer.scrollLeft = scrollLeft - walk;
  });
}

function playChannel(channel) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
  nowPlaying.textContent = channel.name;
  channelIcon.src = channel.logo;
}

function toggleFavorite(name) {
  if (favorites.includes(name)) {
    favorites = favorites.filter(f => f !== name);
  } else {
    favorites.push(name);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function filterChannels() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  let filtered = allChannels;

  if (category === "Favorites") {
    filtered = filtered.filter(c => favorites.includes(c.name));
  } else if (category !== "All") {
    filtered = filtered.filter(c => c.group === category);
  }

  if (search) {
    filtered = filtered.filter(c => c.name.toLowerCase().includes(search));
  }

  renderChannels(filtered);
}

function updateCategoryFilter() {
  const groups = [...new Set(allChannels.map(c => c.group))].sort();
  categoryFilter.innerHTML = `<option value="All">All</option><option value="Favorites">⭐ Favorites</option>` +
    groups.map(g => `<option value="${g}">${g}</option>`).join("");
}

searchInput.addEventListener("input", filterChannels);
categoryFilter.addEventListener("change", filterChannels);

fetch(m3uUrl)
  .then(res => res.text())
  .then(text => {
    allChannels = parseM3U(text);
    const seen = new Set();
    allChannels = allChannels.filter(c => {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    updateCategoryFilter();
    renderChannels(allChannels);
  });

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});
