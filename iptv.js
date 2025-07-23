const video = document.getElementById('videoPlayer');
const overlay = document.getElementById('reconnect-overlay');
const categorySelect = document.getElementById('categorySelect');
const searchInput = document.getElementById('searchInput');
const channelList = document.getElementById('channelList');
const nowPlaying = document.getElementById('nowPlaying');
const importBtn = document.getElementById('importBtn');
const customUrlInput = document.getElementById('customUrl');

let channels = {};
let currentUrl = '';
let lastCurrentTime = 0;
let freezeCounter = 0;
const MAX_FREEZE_ATTEMPTS = 3;

function parseM3U(m3u, groupName = 'Imported') {
  const lines = m3u.split('\n');
  let currentChannel = {};
  const group = groupName || 'Misc';
  if (!channels[group]) channels[group] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)$/);
      currentChannel = { name: nameMatch ? nameMatch[1] : 'Unknown', logo: '' };

      const logoMatch = line.match(/tvg-logo=["']?(.*?)["']?(\s|$)/);
      if (logoMatch) currentChannel.logo = logoMatch[1];
    } else if (line && !line.startsWith('#')) {
      currentChannel.url = line;
      channels[group].push(currentChannel);
      currentChannel = {};
    }
  }
}

function renderCategories() {
  categorySelect.innerHTML = '';
  Object.keys(channels).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  renderChannels();
}

function renderChannels() {
  const selectedCat = categorySelect.value;
  const search = searchInput.value.toLowerCase();
  const list = channels[selectedCat] || [];
  channelList.innerHTML = '';

  list.filter(c => c.name.toLowerCase().includes(search)).forEach(channel => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = \`
      <img src="\${channel.logo}" alt="\${channel.name}" />
      <div>\${channel.name}</div>
    \`;
    card.onclick = () => playStream(channel.url, channel.name);
    channelList.appendChild(card);
  });
}

function playStream(url, name) {
  if (!url) return;
  nowPlaying.textContent = "Now Playing: " + name;
  currentUrl = url;
  overlay.classList.add("hidden");

  if (Hls.isSupported()) {
    if (video.hls) video.hls.destroy();
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    video.hls = hls;
  } else {
    video.src = url;
  }
  video.play().catch(() => {});
}

function checkFreeze() {
  if (!currentUrl || video.paused || video.seeking || video.readyState < 2) {
    freezeCounter = 0;
    return;
  }

  if (video.currentTime === lastCurrentTime) {
    freezeCounter++;
    if (freezeCounter >= MAX_FREEZE_ATTEMPTS) {
      console.warn("📺 Freeze detected — reconnecting...");
      reconnectStream();
      freezeCounter = 0;
    }
  } else {
    freezeCounter = 0;
  }
  lastCurrentTime = video.currentTime;
}

function reconnectStream() {
  overlay.classList.remove("hidden");
  const src = currentUrl;
  if (Hls.isSupported()) {
    if (video.hls) video.hls.destroy();
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    video.hls = hls;
  } else {
    video.src = src;
  }
  video.play().catch(() => {});
}

function startFreezeMonitor() {
  setInterval(checkFreeze, 5000);
}

function fetchDefaultM3U() {
  const defaultUrl = 'https://iptv-org.github.io/iptv/countries/ph.m3u';
  fetch(defaultUrl)
    .then(res => res.text())
    .then(data => {
      parseM3U(data, 'Philippines');
      renderCategories();
    })
    .catch(err => console.error("Failed to fetch M3U:", err));
}

importBtn.addEventListener('click', () => {
  const url = customUrlInput.value.trim();
  if (!url) return;
  fetch(url)
    .then(res => res.text())
    .then(data => {
      parseM3U(data, 'Imported');
      renderCategories();
    })
    .catch(err => alert("Failed to import playlist."));
});

searchInput.addEventListener('input', renderChannels);
categorySelect.addEventListener('change', renderChannels);

// Init
fetchDefaultM3U();
startFreezeMonitor();