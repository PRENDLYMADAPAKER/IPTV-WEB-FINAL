const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

let allChannels = [];
let currentCategory = "All";
let showFavorites = false;
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let hls;

async function loadM3U() {
  const res = await fetch(m3uUrl);
  const text = await res.text();
  const lines = text.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const nameMatch = lines[i].match(/,(.*)$/);
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const groupMatch = lines[i].match(/group-title="(.*?)"/);
      const url = lines[i + 1];
      channels.push({
        name: nameMatch ? nameMatch[1] : "No Name",
        logo: logoMatch ? logoMatch[1] : "",
        category: groupMatch ? groupMatch[1] : "Other",
        url: url.trim()
      });
    }
  }

  allChannels = channels;
  populateCategories();
  displayChannels();
  playChannel(allChannels[0]); // auto play first
}

function populateCategories() {
  const select = document.getElementById("categorySelect");
  const cats = [...new Set(allChannels.map(c => c.category))];
  cats.sort();
  cats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function displayChannels() {
  const container = document.getElementById("channelCarousel");
  const search = document.getElementById("searchInput").value.toLowerCase();
  container.innerHTML = "";

  const filtered = allChannels.filter(c => {
    const matchCategory = currentCategory === "All" || c.category === currentCategory;
    const matchSearch = c.name.toLowerCase().includes(search);
    const matchFav = !showFavorites || favorites.includes(c.url);
    return matchCategory && matchSearch && matchFav;
  });

  filtered.forEach(channel => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.onclick = () => playChannel(channel);

    const img = document.createElement("img");
    img.src = channel.logo || "https://via.placeholder.com/60";
    card.appendChild(img);

    const name = document.createElement("div");
    name.className = "channel-name";
    name.textContent = channel.name;
    card.appendChild(name);

    const star = document.createElement("div");
    star.className = "star";
    star.innerHTML = favorites.includes(channel.url) ? "★" : "☆";
    star.classList.toggle("fav", favorites.includes(channel.url));
    star.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(channel.url);
      displayChannels();
    };
    card.appendChild(star);

    container.appendChild(card);
  });
}

function toggleFavorite(url) {
  if (favorites.includes(url)) {
    favorites = favorites.filter(f => f !== url);
  } else {
    favorites.push(url);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function playChannel(channel) {
  document.getElementById("nowPlayingName").textContent = channel.name;
  document.getElementById("nowPlayingLogo").src = channel.logo || "https://via.placeholder.com/40";

  const video = document.getElementById("videoPlayer");

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, function (event, data) {
      if (data.fatal) {
        console.error("HLS fatal error:", data);
        hls.destroy();
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
  } else {
    alert("This browser does not support this stream.");
  }

  video.play();
}

document.getElementById("searchInput").addEventListener("input", displayChannels);
document.getElementById("categorySelect").addEventListener("change", e => {
  currentCategory = e.target.value;
  displayChannels();
});
document.getElementById("favToggle").addEventListener("click", () => {
  showFavorites = !showFavorites;
  displayChannels();
});

loadM3U();
