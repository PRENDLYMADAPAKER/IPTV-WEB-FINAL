const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
let channels = [];
let filteredChannels = [];
let currentChannelIndex = 0;

const videoPlayer = document.getElementById("videoPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const channelList = document.getElementById("channelList");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");

document.getElementById("updateBtn").addEventListener("click", fetchAndParseM3U);
searchInput.addEventListener("input", filterChannels);
categorySelect.addEventListener("change", filterChannels);

async function fetchAndParseM3U() {
  try {
    const response = await fetch(m3uUrl);
    const data = await response.text();
    parseM3U(data);
    renderChannels();
  } catch (error) {
    alert("Failed to fetch M3U playlist.");
    console.error(error);
  }
}

function parseM3U(data) {
  channels = [];
  const lines = data.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const nameMatch = lines[i].match(/,(.*)/);
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const groupMatch = lines[i].match(/group-title="(.*?)"/);
      const url = lines[i + 1];
      if (url && url.startsWith("http")) {
        channels.push({
          name: nameMatch ? nameMatch[1] : "Unknown",
          logo: logoMatch ? logoMatch[1] : "",
          group: groupMatch ? groupMatch[1] : "Other",
          url: url.trim(),
        });
      }
    }
  }
  updateCategories();
  filteredChannels = [...channels];
}

function updateCategories() {
  const groups = ["All Channels", ...new Set(channels.map(c => c.group))];
  categorySelect.innerHTML = groups.map(g => `<option value="${g}">${g}</option>`).join("");
}

function filterChannels() {
  const search = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search) &&
    (category === "All Channels" || c.group === category)
  );
  renderChannels();
}

function renderChannels() {
  channelList.innerHTML = "";
  filteredChannels.forEach((channel, index) => {
    const item = document.createElement("div");
    item.className = "channel-card";
    item.innerHTML = `
      <img src="${channel.logo}" alt="logo" onerror="this.src='fallback.png'">
      <span>${channel.name}</span>
    `;
    item.addEventListener("click", () => playChannel(index));
    channelList.appendChild(item);
  });
}

function playChannel(index) {
  const channel = filteredChannels[index];
  currentChannelIndex = index;
  nowPlaying.textContent = channel.name;

  if (Hls.isSupported() && !videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(videoPlayer);
  } else {
    videoPlayer.src = channel.url;
    videoPlayer.load();
    videoPlayer.play();
  }
}

// Swipe channel switching (mobile)
let startX = 0;
videoPlayer.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});
videoPlayer.addEventListener("touchend", e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) switchChannel(-1); // swipe right = previous
    else switchChannel(1);           // swipe left = next
  }
});

function switchChannel(direction) {
  currentChannelIndex += direction;
  if (currentChannelIndex < 0) currentChannelIndex = filteredChannels.length - 1;
  if (currentChannelIndex >= filteredChannels.length) currentChannelIndex = 0;
  playChannel(currentChannelIndex);
}

// Auto-fetch on load
window.addEventListener("load", fetchAndParseM3U);
