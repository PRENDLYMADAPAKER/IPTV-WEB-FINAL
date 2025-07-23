
// === 🌐 Multi-Source IPTV Loader with UI, Categories, Carousel ===
const sourceMap = {
  "UDPTV": "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/UDPTV.m3u",
  "TheTVApp": "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/TheTVApp.m3u"
};

let currentSource = "UDPTV";
let m3uUrl = sourceMap[currentSource];
let channels = [];
let currentIndex = 0;
let currentGroup = "All";
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

// === DOM Elements ===
const video = document.getElementById("videoPlayer");
const list = document.getElementById("channelList");

// === Source Dropdown ===
const sourceDropdown = document.createElement("select");
sourceDropdown.style.position = "absolute";
sourceDropdown.style.top = "10px";
sourceDropdown.style.left = "10px";
sourceDropdown.style.zIndex = "1001";
Object.keys(sourceMap).forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.innerText = name;
  sourceDropdown.appendChild(opt);
});
document.body.appendChild(sourceDropdown);
sourceDropdown.addEventListener("change", () => {
  currentSource = sourceDropdown.value;
  m3uUrl = sourceMap[currentSource];
  fetchPlaylistAndReload();
});

// === Smart Freeze Detection ===
let lastTime = 0;
let freezeCounter = 0;
let freezeTimer;
function setupFreezeMonitor(videoEl, streamUrl) {
  clearInterval(freezeTimer);
  freezeCounter = 0;
  lastTime = 0;
  freezeTimer = setInterval(() => {
    if (!videoEl || videoEl.readyState < 2 || videoEl.paused) return;
    if (videoEl.currentTime === lastTime) {
      freezeCounter++;
      if (freezeCounter >= 3) {
        triggerReconnect(videoEl, streamUrl);
        freezeCounter = 0;
      }
    } else {
      lastTime = videoEl.currentTime;
      freezeCounter = 0;
    }
  }, 5000);
}
function triggerReconnect(videoEl, streamUrl) {
  showReconnectOverlay(true);
  let retries = 0;
  function retry() {
    videoEl.pause(); videoEl.src = ""; videoEl.load();
    setTimeout(() => {
      videoEl.src = streamUrl;
      videoEl.load();
      videoEl.play().then(() => {
        hideReconnectOverlay();
        setupFreezeMonitor(videoEl, streamUrl);
      }).catch(() => {
        retries++;
        if (retries < 20) setTimeout(retry, 2000);
        else showReconnectOverlay("❌ Failed after 20 retries");
      });
    }, 1000);
  }
  retry();
}
function showReconnectOverlay(show = true) {
  let overlay = document.getElementById("reconnectOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "reconnectOverlay";
    Object.assign(overlay.style, {
      position: "absolute", top: 0, left: 0,
      width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", color: "white",
      display: "flex", justifyContent: "center", alignItems: "center",
      fontSize: "20px", zIndex: 9999
    });
    overlay.innerText = "Reconnecting…";
    document.body.appendChild(overlay);
  }
  overlay.style.display = show ? "flex" : "none";
}
function hideReconnectOverlay() {
  showReconnectOverlay(false);
}

// === M3U Parsing & Grouping ===
function parseM3U(data) {
  const lines = data.split("\n");
  const parsed = [];
  let name = "", logo = "", group = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      name = lines[i].match(/,(.*)$/)?.[1] || "Unnamed";
      logo = lines[i].match(/tvg-logo="(.*?)"/)?.[1] || "";
      group = lines[i].match(/group-title="(.*?)"/)?.[1] || "Others";
    } else if (lines[i].startsWith("http")) {
      parsed.push({ name, logo, group, url: lines[i] });
    }
  }
  return parsed;
}

// === Display Channels in Carousel Grid ===
function populateChannelList() {
  list.innerHTML = "";
  const filtered = currentGroup === "All" ? channels : channels.filter(c => c.group === currentGroup);
  filtered.forEach((ch, i) => {
    const item = document.createElement("div");
    item.className = "channel";
    item.innerHTML = \`
      <img src="\${ch.logo}" />
      <div>\${ch.name}</div>
    \`;
    item.onclick = () => {
      currentIndex = i;
      playChannel(ch);
    };
    list.appendChild(item);
  });
}

// === Play Channel ===
function playChannel(ch) {
  video.src = ch.url;
  video.load();
  video.play().then(() => {
    setupFreezeMonitor(video, ch.url);
  });
}

// === Playlist Fetch and Reload ===
function fetchPlaylistAndReload() {
  fetch(m3uUrl).then(res => res.text()).then(data => {
    channels = parseM3U(data);
    buildGroupFilters();
    populateChannelList();
    if (channels.length > 0) {
      playChannel(channels[0]);
    }
  });
}

// === Group Filter Buttons ===
function buildGroupFilters() {
  const container = document.getElementById("groupFilters");
  container.innerHTML = "";
  const groups = ["All", ...new Set(channels.map(c => c.group))];
  groups.forEach(g => {
    const btn = document.createElement("button");
    btn.innerText = g;
    btn.onclick = () => {
      currentGroup = g;
      populateChannelList();
    };
    container.appendChild(btn);
  });
}

// === Auto Refresh & Manual Update ===
const updateBtn = document.getElementById("updatePlaylist");
updateBtn.onclick = fetchPlaylistAndReload;
setInterval(fetchPlaylistAndReload, 180000);

// === Init Load ===
fetchPlaylistAndReload();
