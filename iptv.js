// iptv.js

const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

let allChannels = [];
let currentChannelIndex = 0;

const video = document.getElementById("videoPlayer");
const channelGrid = document.getElementById("channelGrid");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const nowPlaying = document.getElementById("nowPlaying");
const favoritesOnly = false;

function loadM3U() {
  fetch(m3uUrl)
    .then(res => res.text())
    .then(parseM3U)
    .then(channels => {
      allChannels = channels;
      renderChannels(channels);
      playChannel(0);
    });
}

function parseM3U(data) {
  const lines = data.split('\n');
  const channels = [];
  let current = {};
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)/);
      current.name = nameMatch ? nameMatch[1] : "No Name";
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      current.logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/100";
      const groupMatch = line.match(/group-title="([^"]+)"/);
      current.group = groupMatch ? groupMatch[1] : "Other";
    } else if (line.startsWith('http')) {
      current.url = line;
      channels.push({...current});
      current = {};
    }
  }
  return channels;
}

function renderChannels(channels) {
  channelGrid.innerHTML = '';
  const filtered = applyFilters(channels);
  filtered.forEach((ch, index) => {
    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `
      <img src="${ch.logo}" />
      <div>${ch.name}</div>
      <div class="star" onclick="toggleFavorite('${ch.name}')">⭐</div>
    `;
    div.onclick = () => playChannel(index);
    channelGrid.appendChild(div);
  });

  // Populate categories
  const uniqueGroups = [...new Set(channels.map(ch => ch.group))];
  categorySelect.innerHTML = `<option value="">All Categories</option>` + 
    uniqueGroups.map(g => `<option value="${g}">${g}</option>`).join('');
}

function applyFilters(channels) {
  const search = searchInput.value.toLowerCase();
  const group = categorySelect.value;
  let filtered = channels;

  if (search) {
    filtered = filtered.filter(ch => ch.name.toLowerCase().includes(search));
  }

  if (group) {
    filtered = filtered.filter(ch => ch.group === group);
  }

  return filtered;
}

function playChannel(index) {
  const channel = allChannels[index];
  currentChannelIndex = index;
  nowPlaying.innerHTML = `<img src="${channel.logo}" style="width:30px;vertical-align:middle;margin-right:8px" /> ${channel.name}`;
  
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = channel.url;
  } else {
    alert("This browser does not support HLS.");
  }
}

function toggleFavorite(name) {
  const key = "fav_" + name;
  const isFav = localStorage.getItem(key);
  if (isFav) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, "true");
  }
  renderChannels(allChannels);
}

searchInput.addEventListener("input", () => renderChannels(allChannels));
categorySelect.addEventListener("change", () => renderChannels(allChannels));

video.addEventListener("ended", () => {
  let next = (currentChannelIndex + 1) % allChannels.length;
  playChannel(next);
});

// Swipe support
let startX = 0;
video.addEventListener("touchstart", e => startX = e.touches[0].clientX);
video.addEventListener("touchend", e => {
  const deltaX = e.changedTouches[0].clientX - startX;
  if (Math.abs(deltaX) > 50) {
    if (deltaX < 0) {
      // swipe left
      let next = (currentChannelIndex + 1) % allChannels.length;
      playChannel(next);
    } else {
      // swipe right
      let prev = (currentChannelIndex - 1 + allChannels.length) % allChannels.length;
      playChannel(prev);
    }
  }
});

window.onload = loadM3U;
