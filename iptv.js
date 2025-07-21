const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

const video = document.getElementById('videoPlayer');
const channelGrid = document.getElementById('channelCarousel');
const nowPlayingName = document.getElementById('nowPlayingName');
const nowPlayingLogo = document.getElementById('nowPlayingLogo');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const favToggle = document.getElementById('favToggle');

let allChannels = [];
let currentCategory = "All";
let showOnlyFavs = false;
let favorites = JSON.parse(localStorage.getItem('favorites') || "[]");

async function loadM3U() {
  const res = await fetch(m3uUrl);
  const text = await res.text();
  const lines = text.split('\n');

  let channels = [];
  let current = {};

  for (let line of lines) {
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/tvg-name="([^"]+)"/) || line.match(/,(.+)/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      current = {
        name: nameMatch ? nameMatch[1] : 'No Name',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Other'
      };
    } else if (line.startsWith('http')) {
      current.url = line.trim();
      channels.push(current);
    }
  }

  allChannels = channels;
  populateCategories();
  renderChannels();
  playChannel(channels[0]);
}

function populateCategories() {
  const categories = [...new Set(allChannels.map(c => c.group))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function renderChannels() {
  const filtered = allChannels.filter(c => {
    const matchCategory = currentCategory === "All" || c.group === currentCategory;
    const matchSearch = c.name.toLowerCase().includes(searchInput.value.toLowerCase());
    const isFav = favorites.includes(c.url);
    return matchCategory && matchSearch && (!showOnlyFavs || isFav);
  });

  channelGrid.innerHTML = "";

  filtered.forEach(channel => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.onclick = () => playChannel(channel);

    const logo = document.createElement('img');
    logo.src = channel.logo || "https://via.placeholder.com/60x60?text=No+Logo";

    const name = document.createElement('div');
    name.className = 'channel-name';
    name.textContent = channel.name;

    const star = document.createElement('div');
    star.className = 'star';
    star.innerHTML = favorites.includes(channel.url) ? "★" : "☆";
    if (favorites.includes(channel.url)) star.classList.add('fav');
    star.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(channel.url);
      renderChannels();
    };

    card.appendChild(logo);
    card.appendChild(name);
    card.appendChild(star);
    channelGrid.appendChild(card);
  });
}

function playChannel(channel) {
  nowPlayingName.textContent = channel.name;
  nowPlayingLogo.src = channel.logo || "https://via.placeholder.com/40";

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
}

function toggleFavorite(url) {
  if (favorites.includes(url)) {
    favorites = favorites.filter(f => f !== url);
  } else {
    favorites.push(url);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

searchInput.addEventListener('input', renderChannels);
categorySelect.addEventListener('change', e => {
  currentCategory = e.target.value;
  renderChannels();
});
favToggle.addEventListener('click', () => {
  showOnlyFavs = !showOnlyFavs;
  favToggle.textContent = showOnlyFavs ? "💔 All Channels" : "❤️ Favorites";
  renderChannels();
});

loadM3U();
