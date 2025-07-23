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
const MAX_FREEZE_ATTEMPTS = 6;

function parseM3U(m3u, group = 'IPTV PREMIUM') {
  const lines = m3u.split('\n');
  let current = {};
  if (!channels[group]) channels[group] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)$/);
      current = { name: nameMatch ? nameMatch[1] : 'Unnamed', logo: '' };
      const logoMatch = line.match(/tvg-logo=["']?(.*?)["']/);
      if (logoMatch) current.logo = logoMatch[1];
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      channels[group].push(current);
      current = {};
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
  const selected = categorySelect.value;
  const query = searchInput.value.toLowerCase();
  const list = channels[selected] || [];
  channelList.innerHTML = '';

  list.filter(c => c.name.toLowerCase().includes(query)).forEach(channel => {
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
      console.log("Freeze detected. Reconnecting...");
      reconnectStream();
      freezeCounter = 0;
    }
  } else {
    freezeCounter = 0;
    overlay.classList.add("hidden");
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
  setInterval(checkFreeze, 1000);
}

function fetchDefaultM3U() {
  const defaultUrl = 'https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u';
  fetch(defaultUrl)
    .then(res => res.text())
    .then(data => {
      parseM3U(data, 'IPTV PREMIUM');
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
    .catch(() => alert("Failed to import playlist."));
});

searchInput.addEventListener('input', renderChannels);
categorySelect.addEventListener('change', renderChannels);

fetchDefaultM3U();
startFreezeMonitor();