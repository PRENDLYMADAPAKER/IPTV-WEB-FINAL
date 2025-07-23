
const m3uUrl = "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/IPTVPREMIUM.m3u";
let channels = [];
let currentIndex = 0;

const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const nowPlaying = document.getElementById("nowPlaying");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const importBtn = document.getElementById("importBtn");
const customM3U = document.getElementById("customM3U");

let channels = [];
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let lastCurrentTime = 0;
let freezeCheckInterval;
let reconnecting = false;

function parseM3U(m3u) {
  const lines = m3u.split('\n');
  let result = [], current = {};
  for (let line of lines) {
    if (line.startsWith("#EXTINF")) {
      const name = line.split(',').pop().trim();
      const logo = line.match(/tvg-logo="(.*?)"/)?.[1] || '';
      const group = line.match(/group-title="(.*?)"/)?.[1] || 'Others';
      current = { name, logo, group };
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      result.push(current);
    }
  }
  return result;
}

function groupChannels(channels) {
  const groups = {};
  channels.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });
  return groups;
}

function renderCategories() {
  const groups = new Set(channels.map(c => c.group));
  categoryFilter.innerHTML = '<option>All</option><option>Favorites</option>' +
    [...groups].map(g => `<option>${g}</option>`).join('');
}

function renderChannels() {
  const group = categoryFilter.value;
  const search = searchInput.value.toLowerCase();
  channelList.innerHTML = '';

  channels.filter(c =>
    (group === 'All' || c.group === group || (group === 'Favorites' && favorites.includes(c.name))) &&
    c.name.toLowerCase().includes(search)
  ).forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'channel-card';
    div.innerHTML = \`
      <img src="\${c.logo || 'https://via.placeholder.com/150'}" alt="">
      <span>\${c.name}</span>
      <button onclick="toggleFavorite('\${c.name}'); event.stopPropagation();">\${favorites.includes(c.name) ? '★' : '☆'}</button>
    \`;
    div.onclick = () => playChannel(c.url, c.name);
    channelList.appendChild(div);
  });
}

function playChannel(url, name) {
  nowPlaying.textContent = "Now Playing: " + name;
  video.src = url;
  video.play().catch(console.warn);
}

function toggleFavorite(name) {
  const index = favorites.indexOf(name);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(name);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderChannels();
}

function startFreezeCheck() {
  clearInterval(freezeCheckInterval);
  freezeCheckInterval = setInterval(() => {
    if (video.paused || video.readyState < 2 || reconnecting) return;

    if (video.currentTime === lastCurrentTime) {
      reconnectStream();
    } else {
      lastCurrentTime = video.currentTime;
    }
  }, 4000);
}

function reconnectStream() {
  if (reconnecting) return;
  reconnecting = true;
  const overlay = document.createElement('div');
  overlay.id = "reconnectOverlay";
  overlay.innerText = "Reconnecting…";
  overlay.style = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#000a;color:white;padding:10px 20px;border-radius:10px;z-index:9999";
  document.querySelector(".video-wrapper")?.appendChild(overlay);

  const currentUrl = video.src;
  video.pause();
  video.src = '';
  video.load();
  setTimeout(() => {
    video.src = currentUrl;
    video.load();
    video.play().finally(() => {
      reconnecting = false;
      document.getElementById("reconnectOverlay")?.remove();
    });
  }, 2000);
}

async function loadPlaylist(url) {
  try {
    const res = await fetch(url);
    const txt = await res.text();
    channels = parseM3U(txt);
    renderCategories();
    renderChannels();
  } catch (e) {
    alert("Failed to load playlist.");
    console.error(e);
  }
}

categoryFilter.onchange = renderChannels;
searchInput.oninput = renderChannels;
importBtn.onclick = () => {
  if (customM3U.value.trim()) loadPlaylist(customM3U.value.trim());
};

loadPlaylist(M3U_URL);
startFreezeCheck();
