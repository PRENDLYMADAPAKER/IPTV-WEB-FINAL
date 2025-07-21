const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
const proxyPrefix = "https://iptv-cors-proxy.onrender.com/"; // optional CORS proxy

const video = document.getElementById("videoPlayer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const channelList = document.getElementById("channelList");

let channels = [];

function parseM3U(m3u) {
  const lines = m3u.split('\n');
  let parsed = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const nameMatch = lines[i].match(/,(.*)/);
      const name = nameMatch ? nameMatch[1].trim() : `Channel ${i}`;
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "";
      const groupMatch = lines[i].match(/group-title="(.*?)"/);
      const group = groupMatch ? groupMatch[1] : "Other";
      const url = lines[i + 1]?.trim();
      if (url && url.startsWith("http")) {
        parsed.push({ name, logo, group, url });
      }
    }
  }
  return parsed;
}

function loadChannel(channel) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(proxyPrefix + channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
}

function renderChannels(list) {
  channelList.innerHTML = "";
  list.forEach((channel, index) => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.innerHTML = `
      <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='https://via.placeholder.com/60'" />
      <div>${channel.name}</div>
    `;
    card.onclick = () => loadChannel(channel);
    channelList.appendChild(card);
  });
}

function updateFilters() {
  const keyword = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  let filtered = channels.filter(c => c.name.toLowerCase().includes(keyword));
  if (category !== "all") {
    filtered = filtered.filter(c => c.group === category);
  }
  renderChannels(filtered);
}

async function init() {
  const res = await fetch(m3uUrl);
  const text = await res.text();
  channels = parseM3U(text);
  const categories = [...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML += categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
  renderChannels(channels);
  loadChannel(channels[0]);
}

searchInput.addEventListener("input", updateFilters);
categoryFilter.addEventListener("change", updateFilters);
document.getElementById("logoutBtn").addEventListener("click", () => alert("Logout not implemented yet."));

init();
