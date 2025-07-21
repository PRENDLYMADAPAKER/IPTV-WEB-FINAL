const m3uUrl = 'https://iptv-cors-proxy.onrender.com/https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/main/IPTVPREMIUM.m3u';

const video = document.getElementById('videoPlayer');
const channelListEl = document.getElementById('channelList');
const nowPlayingEl = document.getElementById('nowPlaying');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');

let allChannels = [];

fetch(m3uUrl)
  .then(res => res.text())
  .then(data => {
    allChannels = parseM3U(data);
    populateCategories(allChannels);
    renderChannels(allChannels);
  })
  .catch(err => {
    console.error("Failed to load playlist:", err);
    channelListEl.innerHTML = '<p style="color:red;">Failed to load playlist.</p>';
  });

function parseM3U(data) {
  const lines = data.split('\n');
  const channels = [];
  let current = {};

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const info = line.split(',');
      current.name = info[1] || 'No Name';
      const groupMatch = line.match(/group-title="(.*?)"/);
      current.group = groupMatch ? groupMatch[1] : 'Other';
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      current.logo = logoMatch ? logoMatch[1] : '';
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      channels.push({ ...current });
      current = {};
    }
  }
  return channels;
}

function populateCategories(channels) {
  const categories = new Set(['All']);
  channels.forEach(ch => categories.add(ch.group));
  categorySelect.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function renderChannels(channels) {
  const filtered = channels.filter(ch => {
    const searchText = searchInput.value.toLowerCase();
    const inName = ch.name.toLowerCase().includes(searchText);
    const inGroup = categorySelect.value === 'All' || ch.group === categorySelect.value;
    return inName && inGroup;
  });

  channelListEl.innerHTML = '';
  filtered.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = `
      <img class="channel-logo" src="${ch.logo}" onerror="this.src=''" />
      <div>${ch.name}</div>
    `;
    card.onclick = () => playChannel(ch);
    channelListEl.appendChild(card);
  });
}

function playChannel(channel) {
  nowPlayingEl.textContent = channel.name;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
  video.play();
}

searchInput.addEventListener('input', () => renderChannels(allChannels));
categorySelect.addEventListener('change', () => renderChannels(allChannels));
