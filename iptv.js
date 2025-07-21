const video = document.getElementById('videoPlayer');
const channelList = document.getElementById('channelList');
const categorySelect = document.getElementById('categorySelect');
const searchInput = document.getElementById('searchInput');
const nowPlaying = document.getElementById('nowPlaying');

const M3U_URL = 'https://iptv-cors-proxy.onrender.com/https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u';

let channels = [];
let categories = new Set();

async function loadChannels() {
  const res = await fetch(M3U_URL);
  const data = await res.text();

  const lines = data.split('\n');
  let currentChannel = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);

      currentChannel = {
        name: nameMatch ? nameMatch[1] : 'No Name',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Other',
        url: ''
      };
    } else if (line.startsWith('http')) {
      currentChannel.url = line.trim();
      channels.push(currentChannel);
      categories.add(currentChannel.group);
    }
  }

  updateCategorySelect();
  displayChannels();
}

function updateCategorySelect() {
  categorySelect.innerHTML = '<option value="All">All</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function displayChannels() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categorySelect.value;

  channelList.innerHTML = '';

  channels.forEach(channel => {
    if (
      (selectedCategory === 'All' || channel.group === selectedCategory) &&
      channel.name.toLowerCase().includes(searchTerm)
    ) {
      const card = document.createElement('div');
      card.className = 'channel-card';
      card.innerHTML = `
        <img src="${channel.logo || 'https://via.placeholder.com/100x60?text=No+Logo'}" alt="${channel.name}" />
        <p>${channel.name}</p>
      `;
      card.onclick = () => playChannel(channel);
      channelList.appendChild(card);
    }
  });
}

function playChannel(channel) {
  nowPlaying.textContent = `Now Playing: ${channel.name}`;
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
}

searchInput.addEventListener('input', displayChannels);
categorySelect.addEventListener('change', displayChannels);

loadChannels();
