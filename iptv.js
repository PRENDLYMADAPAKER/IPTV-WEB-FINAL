// iptv.js (Updated with CORS Proxy support)

const proxy = "https://iptv-cors-proxy.onrender.com/";
let videoElement = document.getElementById("videoPlayer");
let channelList = [];
let currentChannelIndex = 0;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function fetchM3U() {
  fetch("https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u")
    .then(res => res.text())
    .then(data => {
      const lines = data.split("\n");
      let current = {};

      lines.forEach(line => {
        if (line.startsWith("#EXTINF:")) {
          const info = line.split(",")[1];
          const logoMatch = line.match(/tvg-logo="(.*?)"/);
          const groupMatch = line.match(/group-title="(.*?)"/);

          current = {
            name: info,
            logo: logoMatch ? logoMatch[1] : "",
            group: groupMatch ? groupMatch[1] : "Other"
          };
        } else if (line && !line.startsWith("#")) {
          current.url = line;
          channelList.push(current);
        }
      });

      populateCategories();
      displayChannels(channelList);
      playChannel(channelList[0]);
    });
}

function populateCategories() {
  const categories = [...new Set(channelList.map(c => c.group))];
  const select = document.getElementById("categorySelect");
  select.innerHTML = '<option value="All">All</option><option value="Favorite">Favorite</option>' +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

function displayChannels(channels) {
  const container = document.getElementById("channelList");
  container.innerHTML = channels.map((ch, index) => `
    <div class="channelCard" onclick="playChannel(channelList[${index}])">
      <img src="${ch.logo}" alt="Logo">
      <p>${ch.name}</p>
      <button onclick="toggleFavorite(event, ${index})">
        ${favorites.includes(ch.url) ? '★' : '☆'}
      </button>
    </div>
  `).join("");
}

function playChannel(channel) {
  const streamUrl = proxy + channel.url;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(videoElement);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoElement.play();
    });
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = streamUrl;
    videoElement.play();
  }

  document.getElementById("nowPlaying").innerHTML = `
    <img src="${channel.logo}" alt="" class="nowLogo">
    <span>${channel.name}</span>
  `;
}

function toggleFavorite(event, index) {
  event.stopPropagation();
  const url = channelList[index].url;

  if (favorites.includes(url)) {
    favorites = favorites.filter(f => f !== url);
  } else {
    favorites.push(url);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayChannels(filteredChannels());
}

function filteredChannels() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categorySelect").value;

  return channelList.filter(ch => {
    const matchSearch = ch.name.toLowerCase().includes(search);
    const matchCategory = category === "All" || ch.group === category || (category === "Favorite" && favorites.includes(ch.url));
    return matchSearch && matchCategory;
  });
}

function handleSearchAndCategory() {
  displayChannels(filteredChannels());
}

document.getElementById("searchInput").addEventListener("input", handleSearchAndCategory);
document.getElementById("categorySelect").addEventListener("change", handleSearchAndCategory);

// Optional logout listener
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      window.location.href = "index.html";
    });
  });
}

fetchM3U();
