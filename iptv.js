const m3uSources = {
  "UDPTV": "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/UDPTV.m3u",
  "TheTVApp": "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/TheTVApp.m3u"
};

let channels = [];
let currentIndex = 0;
let hls;
let autoUpdateInterval;

const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const importBtn = document.getElementById("importBtn");
const customM3U = document.getElementById("customM3U");
const sourceSelector = document.getElementById("sourceSelector");
const updateBtn = document.getElementById("updateBtn");

const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

function setClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString();
  }, 1000);
}

function parseM3U(content) {
  const lines = content.split("\n");
  const parsed = [];
  let current = {};
  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.*)/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : "",
        logo: logoMatch ? logoMatch[1] : "https://placehold.co/100x100",
        group: groupMatch ? groupMatch[1] : "Other"
      };
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      parsed.push({ ...current });
    }
  }
  return parsed;
}

function loadM3U(url) {
  fetch(url)
    .then(res => res.text())
    .then(text => {
      channels = parseM3U(text);
      renderChannels();
    });
}

function renderChannels() {
  channelList.innerHTML = "";
  const searchTerm = searchInput.value.toLowerCase();
  const group = categoryFilter.value;
  const filtered = channels.filter(c =>
    (group === "All" || c.group === group) &&
    c.name.toLowerCase().includes(searchTerm)
  );
  const groups = [...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML = `<option>All</option>` + groups.map(g => `<option>${g}</option>`).join("");

  filtered.forEach((channel, index) => {
    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `
      <img src="${channel.logo}" onerror="this.src='https://placehold.co/100x100'">
      <p>${channel.name}</p>
    `;
    if (favorites.includes(channel.url)) div.classList.add("favorite");
    div.onclick = () => playChannel(index);
    channelList.appendChild(div);
  });
}

function playChannel(index) {
  const channel = channels[index];
  currentIndex = index;
  nowPlaying.textContent = `Now Playing: ${channel.name}`;

  // Reset
  if (hls) {
    hls.destroy();
    hls = null;
  }

  const useHLS = sourceSelector.value === "TheTVApp";
  const streamUrl = useHLS
    ? `https://iptv-cors-proxy.onrender.com/${encodeURIComponent(channel.url)}`
    : channel.url;

  if (useHLS && Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
  } else {
    video.src = streamUrl;
  }

  video.play();
  startReconnectWatcher();
}

function startReconnectWatcher() {
  let lastTime = video.currentTime;
  clearInterval(video._check);
  video._check = setInterval(() => {
    if (video.paused || video.readyState < 2) return;
    if (video.currentTime === lastTime) {
      playChannel(currentIndex);
    } else {
      lastTime = video.currentTime;
    }
  }, 4000);
}

searchInput.oninput = renderChannels;
categoryFilter.onchange = renderChannels;
sourceSelector.onchange = () => {
  loadM3U(sourceSelector.value === "Custom" ? customM3U.value : m3uSources[sourceSelector.value]);
};
importBtn.onclick = () => {
  const url = customM3U.value;
  if (url) {
    sourceSelector.value = "Custom";
    loadM3U(url);
  }
};
updateBtn.onclick = () => {
  const selected = sourceSelector.value;
  loadM3U(selected === "Custom" ? customM3U.value : m3uSources[selected]);
};

// Auto update every 3 mins
clearInterval(autoUpdateInterval);
autoUpdateInterval = setInterval(() => {
  updateBtn.click();
}, 180000);

setClock();
loadM3U(m3uSources["UDPTV"]);
