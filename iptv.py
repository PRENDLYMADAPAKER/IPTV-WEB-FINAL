const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

let channels = [];
let filteredChannels = [];
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let currentCategory = "All Channels";
let currentIndex = 0;

const video = document.getElementById("video");
const channelList = document.getElementById("channel-list");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const nowPlaying = document.getElementById("now-playing");

document.getElementById("update").addEventListener("click", fetchAndParseM3U);
searchInput.addEventListener("input", () => filterChannels());
categorySelect.addEventListener("change", () => {
  currentCategory = categorySelect.value;
  filterChannels();
});

function fetchAndParseM3U() {
  fetch(m3uUrl)
    .then(res => res.text())
    .then(data => {
      const lines = data.split("\n");
      channels = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("#EXTINF")) {
          const name = lines[i].split(",")[1] || "Unnamed";
          const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
          const logo = logoMatch ? logoMatch[1] : "";
          const groupMatch = lines[i].match(/group-title="(.*?)"/);
          const category = groupMatch ? groupMatch[1] : "Others";
          const url = lines[i + 1];
          if (url && url.startsWith("http")) {
            channels.push({ name, logo, category, url });
          }
        }
      }
      populateCategories();
      filterChannels();
    })
    .catch(err => {
      alert("Failed to load playlist.");
      console.error(err);
    });
}

function populateCategories() {
  const uniqueCategories = [...new Set(channels.map(c => c.category))];
  categorySelect.innerHTML = `<option>All Channels</option><option>Favorites</option>`;
  uniqueCategories.forEach(cat => {
    categorySelect.innerHTML += `<option>${cat}</option>`;
  });
}

function filterChannels() {
  const searchTerm = searchInput.value.toLowerCase();
  filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      currentCategory === "All Channels" ||
      (currentCategory === "Favorites" && favorites.includes(c.url)) ||
      c.category === currentCategory;
    return matchesSearch && matchesCategory;
  });
  currentIndex = 0;
  renderChannelGrid();
}

function renderChannelGrid() {
  channelList.innerHTML = "";
  filteredChannels.forEach((ch, index) => {
    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `
      <img src="${ch.logo}" alt="${ch.name}" />
      <p>${ch.name}</p>
      <button class="fav-btn">${favorites.includes(ch.url) ? "★" : "☆"}</button>
    `;
    div.onclick = () => {
      playChannel(index);
    };
    div.querySelector(".fav-btn").onclick = e => {
      e.stopPropagation();
      toggleFavorite(ch.url);
    };
    channelList.appendChild(div);
  });
}

function toggleFavorite(url) {
  if (favorites.includes(url)) {
    favorites = favorites.filter(fav => fav !== url);
  } else {
    favorites.push(url);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  filterChannels();
}

function playChannel(index) {
  const channel = filteredChannels[index];
  currentIndex = index;
  nowPlaying.innerText = channel.name;

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
    video.play();
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    video.play();
  } else {
    alert("This browser cannot play the stream.");
  }
}

function nextChannel() {
  if (filteredChannels.length === 0) return;
  currentIndex = (currentIndex + 1) % filteredChannels.length;
  playChannel(currentIndex);
}

function prevChannel() {
  if (filteredChannels.length === 0) return;
  currentIndex = (currentIndex - 1 + filteredChannels.length) % filteredChannels.length;
  playChannel(currentIndex);
}

// Swipe detection
let touchStartX = 0;
channelList.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
});

channelList.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx > 50) prevChannel();
  else if (dx < -50) nextChannel();
});

// Load on page start
fetchAndParseM3U();
