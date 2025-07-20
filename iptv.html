// iptv.js

const M3U_URL = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

let channels = [], filtered = [], currentIndex = 0;
let hls;

async function fetchChannels() {
  const res = await fetch(M3U_URL);
  const text = await res.text();
  const lines = text.split("\n");
  let channel = {};

  for (let line of lines) {
    if (line.startsWith("#EXTINF")) {
      const name = line.split(",")[1]?.trim() || "Unnamed";
      const logoMatch = /tvg-logo="([^"]+)"/.exec(line);
      const groupMatch = /group-title="([^"]+)"/.exec(line);
      channel = {
        name,
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Other"
      };
    } else if (line.startsWith("http")) {
      channel.url = line.trim();
      channels.push(channel);
      channel = {};
    }
  }

  populateCategories();
  renderChannels();
  playChannel(0);
}

function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const cats = Array.from(new Set(channels.map(c => c.group)));
  select.innerHTML = `<option value="all">All Categories</option>` +
    cats.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

function renderChannels() {
  const search = document.getElementById("search").value.toLowerCase();
  const selectedCat = document.getElementById("categoryFilter").value;
  const container = document.getElementById("channelCarousel");
  container.innerHTML = "";

  filtered = channels.filter(ch =>
    (selectedCat === "all" || ch.group === selectedCat) &&
    ch.name.toLowerCase().includes(search)
  );

  filtered.forEach((ch, i) => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.innerHTML = `
      <img src="${ch.logo}" class="channel-icon" alt="${ch.name}">
      <div>${ch.name}</div>
    `;
    card.onclick = () => playChannel(i);
    container.appendChild(card);
  });
}

function playChannel(index) {
  currentIndex = index;
  const ch = filtered[index] || channels[index];
  const video = document.getElementById("videoPlayer");

  if (hls) {
    hls.destroy();
  }

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(ch.url);
    hls.attachMedia(video);
    video.play().catch(() => {
      video.muted = true;
      video.play();
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = ch.url;
    video.play().catch(() => {
      video.muted = true;
      video.play();
    });
  } else {
    alert("This browser doesn't support HLS.");
  }

  document.getElementById("nowIcon").src = ch.logo;
  document.getElementById("nowName").textContent = " " + ch.name;
}

// Keyboard left/right support
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    currentIndex = (currentIndex + 1) % filtered.length;
    playChannel(currentIndex);
  } else if (e.key === "ArrowLeft") {
    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    playChannel(currentIndex);
  }
});

// Touch swipe support
let startX = 0;
document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;
  if (diff > 50) {
    currentIndex = (currentIndex + 1) % filtered.length;
    playChannel(currentIndex);
  } else if (diff < -50) {
    currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    playChannel(currentIndex);
  }
});

window.logout = function () {
  localStorage.clear();
  location.href = "login.html";
};

window.onload = fetchChannels;
