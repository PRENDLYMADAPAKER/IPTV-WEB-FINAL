const m3uUrl = 'https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u';

let channels = [];
let favorites = new Set();
let currentChannelIndex = 0;
let filteredChannels = [];
let userCountry = '';
let proxyEnabled = localStorage.getItem('useProxy') === 'true';

const videoPlayer = document.getElementById('videoPlayer');
const nowPlaying = document.getElementById('nowPlaying');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const channelCarousel = document.getElementById('channelCarousel');
const nowPlayingThumb = document.querySelector('#nowPlayingThumbnail img');
const proxyToggle = document.getElementById('proxyToggle');

let currentHls = null;

// ---------------- GeoCheck ----------------
fetch('https://ipinfo.io/json?token=5b6d16609bce1c')
  .then(res => res.json())
  .then(data => {
    userCountry = data.country;
    console.log("User country:", userCountry);
  });

// ---------------- Parse Playlist ----------------
function parseM3U(content) {
  const lines = content.split('\n');
  const parsed = [];

  let name = '', logo = '', group = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/tvg-name="(.*?)"/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);

      name = nameMatch ? nameMatch[1] : 'Unknown';
      logo = logoMatch ? logoMatch[1] : '';
      group = groupMatch ? groupMatch[1] : 'Other';
    } else if (line.startsWith('http')) {
      parsed.push({ name, logo, group, url: line.trim() });
    }
  }

  return parsed;
}

// ---------------- Channel Display ----------------
function loadChannels(list = []) {
  filteredChannels = list.length ? list : channels;
  channelCarousel.innerHTML = '';

  filteredChannels.forEach((channel, index) => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = `
      <img src="${channel.logo}" onerror="this.src='https://via.placeholder.com/120x90?text=No+Logo'" />
      <div>${channel.name}</div>
      <div style="font-size: 20px;" class="${favorites.has(channel.url) ? 'favorite' : ''}">❤️</div>
    `;

    card.onclick = () => playChannel(channel);
    card.querySelector('div:last-child').onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(channel.url);
      loadChannels(filteredChannels);
    };

    channelCarousel.appendChild(card);
  });
}

// ---------------- Play Channel ----------------
function playChannel(channel) {
  nowPlaying.innerText = `Now Playing: ${channel.name}`;
  nowPlayingThumb.src = channel.logo || 'https://via.placeholder.com/120x90?text=No+Logo';

  currentChannelIndex = filteredChannels.findIndex(c => c.url === channel.url);
  stopCurrentStream();

  let streamUrl = proxyEnabled
    ? `https://iptv-cors-proxy.onrender.com/${encodeURIComponent(channel.url)}`
    : channel.url;

  videoPlayer.src = streamUrl;
  videoPlayer.load();
  videoPlayer.play().catch(() => {
    if (Hls.isSupported()) {
      currentHls = new Hls();
      currentHls.loadSource(streamUrl);
      currentHls.attachMedia(videoPlayer);

      currentHls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal && document.getElementById('autoplayToggle').checked) {
          autoPlayNext();
        }
      });
    } else {
      nowPlaying.innerText = `Playback failed: ${channel.name}`;
      if (document.getElementById('autoplayToggle').checked) {
        autoPlayNext();
      }
    }
  });
}

function stopCurrentStream() {
  videoPlayer.pause();
  videoPlayer.removeAttribute('src');
  videoPlayer.load();

  if (currentHls) {
    currentHls.destroy();
    currentHls = null;
  }
}

function autoPlayNext() {
  let nextIndex = (currentChannelIndex + 1) % filteredChannels.length;
  const nextChannel = filteredChannels[nextIndex];
  if (nextChannel) {
    setTimeout(() => playChannel(nextChannel), 1000);
  }
}

// ---------------- Favorites ----------------
function toggleFavorite(url) {
  if (favorites.has(url)) {
    favorites.delete(url);
  } else {
    favorites.add(url);
  }
  saveFavorites();
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

function loadFavorites() {
  const saved = localStorage.getItem('favorites');
  if (saved) favorites = new Set(JSON.parse(saved));
}

// ---------------- Filtering & Categories ----------------
function filterChannels() {
  const query = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const favOnly = document.getElementById('favOnlyToggle').checked;

  const filtered = channels.filter(channel => {
    const matchName = channel.name.toLowerCase().includes(query);
    const matchCat = category === 'All' || channel.group === category;
    const matchFav = !favOnly || favorites.has(channel.url);
    return matchName && matchCat && matchFav;
  });

  loadChannels(filtered);
  if (filtered.length === 0) nowPlaying.innerText = 'No channels found.';
}

function populateCategories() {
  const uniqueGroups = ['All', ...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML = '';
  uniqueGroups.forEach(group => {
    const opt = document.createElement('option');
    opt.value = group;
    opt.textContent = group;
    categoryFilter.appendChild(opt);
  });
}

// ---------------- Settings Modal ----------------
function openSettings() {
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.add('hidden');
}

document.getElementById('themeToggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.classList.add('light');
    localStorage.setItem('theme', 'light');
  } else {
    document.body.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  }
});

document.getElementById('favOnlyToggle').addEventListener('change', filterChannels);

proxyToggle.addEventListener('change', (e) => {
  proxyEnabled = e.target.checked;
  localStorage.setItem('useProxy', proxyEnabled);
  console.log("Proxy mode:", proxyEnabled ? 'ON' : 'OFF');
});

// ---------------- App Init ----------------
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.getElementById('themeToggle').checked = true;
}

if (proxyEnabled) {
  proxyToggle.checked = true;
}

searchInput.addEventListener('input', filterChannels);
categoryFilter.addEventListener('change', filterChannels);

fetch(m3uUrl)
  .then(res => res.text())
  .then(text => {
    channels = parseM3U(text);
    loadFavorites();
    populateCategories();
    loadChannels();
  });
