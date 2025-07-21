const m3uUrl = 'https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u';
const corsProxy = 'https://iptv-cors-proxy.onrender.com/proxy/';

let channels = [];
let favorites = new Set();
let currentChannelIndex = 0;
let filteredChannels = [];

const videoPlayer = document.getElementById('videoPlayer');
const nowPlaying = document.getElementById('nowPlaying');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const channelCarousel = document.getElementById('channelCarousel');

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
      const rawUrl = line.trim();

      // ✅ Apply proxy only to .m3u8 and if not already proxied
      const needsProxy = rawUrl.includes('.m3u8') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1');
      const proxiedUrl = needsProxy ? `${corsProxy}${rawUrl}` : rawUrl;

      parsed.push({ name, logo, group, url: proxiedUrl });
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

function playChannel(channel) {
  nowPlaying.innerText = `Now Playing: ${channel.name}`;
  currentChannelIndex = filteredChannels.findIndex(c => c.url === channel.url);

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(videoPlayer);
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal && document.getElementById('autoplayToggle').checked) {
        autoPlayNext();
      }
    });
  } else {
    videoPlayer.src = channel.url;
    videoPlayer.onerror = () => {
      if (document.getElementById('autoplayToggle').checked) {
        autoPlayNext();
      }
    };
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

// ---------------- App Init ----------------
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.getElementById('themeToggle').checked = true;
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
