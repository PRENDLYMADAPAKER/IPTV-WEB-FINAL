// IPTV.JS - FIXED VERSION ✅

const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
const epgUrl = "https://tinyurl.com/DrewLive002-epg";

const video = document.getElementById("videoPlayer");
const nowPlaying = document.getElementById("nowPlaying");
const channelIcon = document.getElementById("channel-icon");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const carousel = document.querySelector(".channel-carousel");

let channels = [];
let currentChannelIndex = 0;

// 🟨 Fetch and parse M3U playlist
async function loadM3U() {
  try {
    const res = await fetch(m3uUrl);
    const text = await res.text();

    const lines = text.split("\n");
    let channel = {};

    for (let line of lines) {
      if (line.startsWith("#EXTINF")) {
        const nameMatch = line.match(/,(.*)/);
        const logoMatch = line.match(/tvg-logo="(.*?)"/);
        const groupMatch = line.match(/group-title="(.*?)"/);

        channel = {
          name: nameMatch ? nameMatch[1] : "Unknown",
          logo: logoMatch ? logoMatch[1] : "",
          group: groupMatch ? groupMatch[1] : "Other"
        };
      } else if (line.startsWith("http")) {
        channel.url = line.trim();
        channels.push(channel);
        channel = {};
      }
    }

    console.log(`✅ Loaded ${channels.length} channels`);
    if (channels.length === 0) {
      nowPlaying.innerText = "No channels found 😢";
      return;
    }

    renderCarousel(channels);
    playChannel(0);

    populateCategoryFilter();
  } catch (err) {
    console.error("❌ Failed to load M3U:", err);
    nowPlaying.innerText = "Failed to load channel list.";
  }
}

// ▶️ Play a channel
function playChannel(index) {
  const ch = channels[index];
  if (!ch) return;

  currentChannelIndex = index;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(ch.url);
    hls.attachMedia(video);
  } else {
    video.src = ch.url;
  }

  nowPlaying.innerText = ch.name;
  channelIcon.src = ch.logo || "https://via.placeholder.com/30x30";
}

// 🎠 Render carousel
function renderCarousel(channelList) {
  carousel.innerHTML = "";

  channelList.forEach((ch, index) => {
    const item = document.createElement("div");
    item.className = "channel-item";
    item.innerHTML = `
      <img src="${ch.logo}" alt="${ch.name}" />
      <div style="font-size: 12px;">${ch.name}</div>
    `;
    item.addEventListener("click", () => playChannel(index));
    carousel.appendChild(item);
  });
}

// 🔍 Search channels
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = channels.filter(ch => ch.name.toLowerCase().includes(term));
  renderCarousel(filtered);
});

// 🗂 Filter by group
categoryFilter.addEventListener("change", () => {
  const val = categoryFilter.value;
  const filtered = val === "All" ? channels : channels.filter(ch => ch.group === val);
  renderCarousel(filtered);
});

// 🧩 Populate categories
function populateCategoryFilter() {
  const groups = [...new Set(channels.map(ch => ch.group))];
  categoryFilter.innerHTML = `<option>All</option>`;
  groups.forEach(group => {
    categoryFilter.innerHTML += `<option>${group}</option>`;
  });
}

// 🚀 Start
loadM3U();
