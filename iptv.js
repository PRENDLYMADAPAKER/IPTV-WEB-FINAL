const M3U_URL = "https://iptv-cors-proxy.onrender.com/https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
const video = document.getElementById("videoPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const carousel = document.getElementById("channelCarousel");

let allChannels = [];
let favorites = [];

function parseM3U(data) {
  const lines = data.split("\n");
  const channels = [];
  let current = {};

  for (let line of lines) {
    if (line.startsWith("#EXTINF")) {
      const name = line.match(/,(.*)/)?.[1]?.trim();
      const logo = line.match(/tvg-logo="(.*?)"/)?.[1] || "";
      const group = line.match(/group-title="(.*?)"/)?.[1] || "Others";
      current = { name, logo, group };
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      channels.push({ ...current });
    }
  }

  return channels;
}

function loadVideo(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }
}

function renderChannels(channels) {
  carousel.innerHTML = "";
  const categories = new Set(["All"]);

  channels.forEach((ch, i) => {
    categories.add(ch.group);

    const card = document.createElement("div");
    card.className = "channel-card";
    card.innerHTML = `
      <img src="${ch.logo}" class="channel-logo" />
      <div>${ch.name}</div>
    `;

    card.onclick = () => {
      loadVideo(ch.url);
      nowPlaying.textContent = `Now Playing: ${ch.name}`;
    };

    carousel.appendChild(card);
  });

  // Update categories dropdown
  categoryFilter.innerHTML = "";
  [...categories].forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function filterChannels() {
  const term = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = allChannels.filter(ch => {
    const matchName = ch.name.toLowerCase().includes(term);
    const matchCategory = category === "All" || ch.group === category;
    return matchName && matchCategory;
  });

  renderChannels(filtered);
}

async function init() {
  const res = await fetch(M3U_URL);
  const txt = await res.text();
  allChannels = parseM3U(txt);
  renderChannels(allChannels);
}

searchInput.addEventListener("input", filterChannels);
categoryFilter.addEventListener("change", filterChannels);

init();
