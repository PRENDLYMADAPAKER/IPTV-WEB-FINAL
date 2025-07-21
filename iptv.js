const M3U_URL = "https://cors-proxy.iptv-unblock.workers.dev/?https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

const video = document.getElementById("videoPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const carousel = document.getElementById("channelCarousel");

let allChannels = [];

function parseM3U(data) {
  const lines = data.split("\n");
  const channels = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      const name = line.match(/,(.*)/)?.[1]?.trim();
      const logo = line.match(/tvg-logo="(.*?)"/)?.[1] || "";
      const group = line.match(/group-title="(.*?)"/)?.[1] || "Others";
      current = { name, logo, group };
    } else if (line.startsWith("http")) {
      current.url = line;
      if (current.name) {
        channels.push({ ...current });
      }
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

  if (channels.length === 0) {
    const msg = document.createElement("div");
    msg.style.padding = "20px";
    msg.textContent = "No channels found.";
    carousel.appendChild(msg);
    return;
  }

  channels.forEach((ch) => {
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

  // Update categories
  categoryFilter.innerHTML = "";
  [...categories].forEach((cat) => {
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
  try {
    const res = await fetch(M3U_URL);
    const txt = await res.text();
    allChannels = parseM3U(txt);

    if (allChannels.length === 0) {
      console.warn("⚠️ No channels were parsed from the M3U file.");
    }

    renderChannels(allChannels);
  } catch (err) {
    console.error("❌ Failed to load M3U playlist:", err);
    carousel.innerHTML = `<div style="padding: 20px;">Failed to load playlist.</div>`;
  }
}

searchInput.addEventListener("input", filterChannels);
categoryFilter.addEventListener("change", filterChannels);

init();
