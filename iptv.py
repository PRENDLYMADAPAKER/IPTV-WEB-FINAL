const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/main/IPTVPREMIUM.m3u";

let channels = [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

const video = document.getElementById("videoPlayer");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const channelGrid = document.getElementById("channelGrid");
const nowPlaying = document.getElementById("nowPlaying");
const nowLogo = document.getElementById("nowLogo");

async function fetchM3U(url) {
  const res = await fetch(url);
  const text = await res.text();
  parseM3U(text);
}

function parseM3U(data) {
  channels = [];
  let lines = data.split("\n");
  let current = {};

  lines.forEach(line => {
    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.*)/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);

      current = {
        name: nameMatch ? nameMatch[1].trim() : "Unknown",
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Other"
      };
    } else if (line.startsWith("http")) {
      current.url = line.trim();
      channels.push({ ...current });
    }
  });

  populateCategories();
  renderChannels();
}

function populateCategories() {
  const categories = ["All", ...new Set(channels.map(ch => ch.group))];
  categorySelect.innerHTML = categories.map(cat =>
    `<option value="${cat}">${cat}</option>`).join("");
}

function renderChannels() {
  const search = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  channelGrid.innerHTML = "";

  channels.forEach(ch => {
    if (
      ch.name.toLowerCase().includes(search) &&
      (category === "All" || ch.group === category)
    ) {
      const card = document.createElement("div");
      card.className = "channel-card";
      if (favorites.includes(ch.name)) card.classList.add("favorited");

      card.innerHTML = `
        <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/80x40?text=No+Logo'" />
        <div>${ch.name}</div>
        <div class="star" onclick="toggleFavorite(event, '${ch.name}')">★</div>
      `;

      card.onclick = () => playChannel(ch);
      channelGrid.appendChild(card);
    }
  });
}

function playChannel(channel) {
  nowPlaying.innerText = "Now Playing: " + channel.name;
  nowLogo.src = channel.logo;
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
}

function toggleFavorite(e, name) {
  e.stopPropagation();
  if (favorites.includes(name)) {
    favorites = favorites.filter(f => f !== name);
  } else {
    favorites.push(name);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderChannels();
}

function updatePlaylist() {
  fetchM3U(m3uUrl);
}

searchInput.addEventListener("input", renderChannels);
categorySelect.addEventListener("change", renderChannels);

updatePlaylist();
