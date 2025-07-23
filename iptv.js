
const sources = {
  "UDPTV": "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/UDPTV.m3u",
  "TheTVApp": "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/TheTVApp.m3u"
};

let channels = [];
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let currentIndex = 0;
let currentGroup = "All";
let hls;
let freezeInterval;
let lastTime = 0;

const video = document.getElementById("videoPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const overlay = document.getElementById("reconnectingOverlay");
const groupSelector = document.getElementById("groupSelector");
const sourceSelector = document.getElementById("sourceSelector");
const channelList = document.getElementById("channelList");

function parseM3U(content) {
  const lines = content.split("\n");
  const parsed = [];
  let name = "", logo = "", group = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const nameMatch = lines[i].match(/,(.*)$/);
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const groupMatch = lines[i].match(/group-title="(.*?)"/);
      name = nameMatch ? nameMatch[1] : "Unnamed";
      logo = logoMatch ? logoMatch[1] : "";
      group = groupMatch ? groupMatch[1] : "Others";
    } else if (lines[i] && !lines[i].startsWith("#")) {
      parsed.push({ name, logo, group, url: lines[i] });
    }
  }

  return parsed;
}

function loadChannels(source) {
  fetch(sources[source])
    .then(res => res.text())
    .then(text => {
      channels = parseM3U(text);
      displayGroups();
      displayChannels();
      if (channels.length > 0) playChannel(channels[0].url);
    });
}

function displayGroups() {
  const groups = ["All", ...new Set(channels.map(c => c.group))];
  groupSelector.innerHTML = groups.map(
    g => `<option value="${g}">${g}</option>`
  ).join("");
}

function displayChannels() {
  const filtered = channels.filter(
    c => currentGroup === "All" || c.group === currentGroup
  );

  channelList.innerHTML = filtered.map((c, index) => `
    <div class="channelCard ${favorites.includes(c.url) ? "favorite" : ""}" onclick="playChannel('${c.url}')">
      <img src="${c.logo}" onerror="this.src='logo.png'" alt="${c.name}" />
      <p>${c.name}</p>
      <button onclick="toggleFavorite(event, '${c.url}')">❤️</button>
    </div>
  `).join("");
}

function playChannel(url) {
  if (hls) {
    hls.destroy();
    hls = null;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();

  const source = sourceSelector.value;
  const proxy = "https://iptv-cors-proxy.onrender.com/";

  if (source === "TheTVApp" && Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(proxy + encodeURIComponent(url));
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else {
    video.src = url;
    video.play();
  }

  nowPlaying.textContent = "Now Playing: " + getChannelName(url);
  currentIndex = channels.findIndex(c => c.url === url);

  clearInterval(freezeInterval);
  freezeInterval = setInterval(checkFreeze, 5000);
}

function toggleFavorite(event, url) {
  event.stopPropagation();
  const index = favorites.indexOf(url);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(url);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayChannels();
}

function getChannelName(url) {
  const c = channels.find(c => c.url === url);
  return c ? c.name : "Unknown";
}

function checkFreeze() {
  if (video.paused || video.readyState < 2) return;
  if (video.currentTime === lastTime) {
    overlay.style.display = "flex";
    reconnect();
  } else {
    overlay.style.display = "none";
  }
  lastTime = video.currentTime;
}

function reconnect() {
  const url = channels[currentIndex]?.url;
  if (!url) return;

  playChannel(url);
}

groupSelector.addEventListener("change", e => {
  currentGroup = e.target.value;
  displayChannels();
});

sourceSelector.addEventListener("change", e => {
  loadChannels(e.target.value);
});

document.getElementById("searchInput").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  const filtered = channels.filter(c =>
    (currentGroup === "All" || c.group === currentGroup) &&
    c.name.toLowerCase().includes(term)
  );

  channelList.innerHTML = filtered.map((c, index) => `
    <div class="channelCard ${favorites.includes(c.url) ? "favorite" : ""}" onclick="playChannel('${c.url}')">
      <img src="${c.logo}" onerror="this.src='logo.png'" alt="${c.name}" />
      <p>${c.name}</p>
      <button onclick="toggleFavorite(event, '${c.url}')">❤️</button>
    </div>
  `).join("");
});

setInterval(() => {
  loadChannels(sourceSelector.value);
}, 180000); // auto refresh every 3 mins

window.onload = () => {
  loadChannels(sourceSelector.value);
};
