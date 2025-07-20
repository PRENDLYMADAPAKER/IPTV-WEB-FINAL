const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

let allChannels = [];
let currentChannelIndex = 0;
let hls = null; // GLOBAL HLS instance

const video = document.getElementById("videoPlayer");
const channelGrid = document.getElementById("channelGrid");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const nowPlaying = document.getElementById("nowPlaying");

function loadM3U() {
  fetch(m3uUrl)
    .then(res => res.text())
    .then(parseM3U)
    .then(channels => {
      allChannels = channels;
      populateCategories(channels);
      renderChannels();
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
      channels.push({ ...current });
      current = {};
    }
  }
  return channels;
}

function populateCategories(channels) {
  const uniqueGroups = [...new Set(channels.map(ch => ch.group))];
  categorySelect.innerHTML = `<option value="">All Categories</option>` +
    uniqueGroups.map(g => `<option value="${g}">${g}</option>`).join('');
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const group = categorySelect.value;

  return allChannels.filter(ch => {
    return (!group || ch.group === group) &&
           (!search || ch.name.toLowerCase().includes(search));
  });
}

function renderChannels() {
  const filtered = applyFilters();
  channelGrid.innerHTML = '';
  filtered.forEach((ch, index) => {
    const isFav = localStorage.getItem("fav_" + ch.name);
    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `
      <img src="${ch.logo}" />
      <div>${ch.name}</div>
      <div class="star" onclick="event.stopPropagation(); toggleFavorite('${ch.name}')">
        ${isFav ? '⭐' : '☆'}
      </div>
    `;
    div.onclick = () => playChannel(index);
    channelGrid.appendChild(div);
  });
}

function playChannel(index) {
  const filtered = applyFilters();
  const channel = filtered[index];
  if (!channel) return;

  currentChannelIndex = index;
  nowPlaying.innerHTML = `<img src="${channel.logo}" style="width:30px;vertical-align:middle;margin-right:8px" /> ${channel.name}`;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported()) {
    hls = new Hls();
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
  renderChannels();
}

// Search and category events
searchInput.addEventListener("input", renderChannels);
categorySelect.addEventListener("change", renderChannels);

video.addEventListener("ended", () => {
  const filtered = applyFilters();
  let next = (currentChannelIndex + 1) % filtered.length;
  playChannel(next);
});

// Swipe support
let startX = 0;
video.addEventListener("touchstart", e => startX = e.touches[0].clientX);
video.addEventListener("touchend", e => {
  const deltaX = e.changedTouches[0].clientX - startX;
  const filtered = applyFilters();
  if (Math.abs(deltaX) > 50) {
    if (deltaX < 0) {
      let next = (currentChannelIndex + 1) % filtered.length;
      playChannel(next);
    } else {
      let prev = (currentChannelIndex - 1 + filtered.length) % filtered.length;
      playChannel(prev);
    }
  }
});

window.onload = loadM3U;
