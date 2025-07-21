// iptv.js

const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/main/IPTVPREMIUM.m3u";

const video = document.getElementById("videoPlayer");
const channelList = document.getElementById("channelList");
const currentChannelName = document.getElementById("currentChannelName");
const search = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");

let channels = [];
let currentCategory = "All";

function parseM3U(content) {
  const lines = content.split("\n");
  const parsed = [];
  let current = {};

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);
      current = {
        name: nameMatch ? nameMatch[1] : "Unknown",
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Other"
      };
    } else if (line && !line.startsWith("#")) {
      current.url = line;
      parsed.push(current);
      current = {};
    }
  }
  return parsed;
}

function loadChannel(channel) {
  currentChannelName.textContent = channel.name;
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
  video.play();
}

function displayChannels(list) {
  channelList.innerHTML = "";
  list.forEach((channel, i) => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.innerHTML = `
      <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='default.png'">
      <span>${channel.name}</span>
    `;
    card.onclick = () => loadChannel(channel);
    channelList.appendChild(card);
  });
}

function updateCategoryFilter() {
  const categories = ["All", ...new Set(channels.map(c => c.group))];
  categoryFilter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

function applyFilters() {
  const keyword = search.value.toLowerCase();
  const filtered = channels.filter(c =>
    (currentCategory === "All" || c.group === currentCategory) &&
    c.name.toLowerCase().includes(keyword)
  );
  displayChannels(filtered);
}

search.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", e => {
  currentCategory = e.target.value;
  applyFilters();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  alert("Logout clicked");
});

fetch(m3uUrl)
  .then(res => res.text())
  .then(data => {
    channels = parseM3U(data);
    updateCategoryFilter();
    applyFilters();
    if (channels.length > 0) loadChannel(channels[0]);
  })
  .catch(err => {
    console.error("Failed to fetch or parse M3U:", err);
    alert("Error loading channel list.");
  });
