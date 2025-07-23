
const m3uUrl = "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/IPTVPREMIUM.m3u";
let channels = [];
let currentIndex = 0;
let lastCurrentTime = 0;
let freezeCheckInterval;
let reconnecting = false;

const video = document.querySelector("video");
const overlay = document.createElement("div");
overlay.innerText = "Reconnecting…";
overlay.style.position = "absolute";
overlay.style.top = "50%";
overlay.style.left = "50%";
overlay.style.transform = "translate(-50%, -50%)";
overlay.style.padding = "10px 20px";
overlay.style.background = "rgba(0, 0, 0, 0.7)";
overlay.style.color = "#fff";
overlay.style.fontSize = "18px";
overlay.style.borderRadius = "10px";
overlay.style.zIndex = "999";
overlay.style.display = "none";
document.body.appendChild(overlay);

async function fetchM3U(url) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split("\n");
  channels = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1]?.trim() || "Unnamed";
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "";
      const url = lines[i + 1];
      channels.push({ name, url, logo });
    }
  }
  populateChannelList();
}

function populateChannelList() {
  const container = document.querySelector(".channel-list");
  const dropdown = document.querySelector("select");
  container.innerHTML = "";
  dropdown.innerHTML = "<option disabled selected>UDPTV Live Streams</option>";
  channels.forEach((ch, index) => {
    const btn = document.createElement("button");
    btn.className = "channel";
    btn.innerHTML = ch.logo
      ? `<img src="${ch.logo}" alt="${ch.name}"><span>${ch.name}</span>`
      : `<span>${ch.name}</span>`;
    btn.onclick = () => playChannel(index);
    container.appendChild(btn);

    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = ch.name;
    dropdown.appendChild(opt);
  });
}

function playChannel(index) {
  currentIndex = index;
  const ch = channels[index];
  video.src = ch.url;
  video.play();
  document.querySelector(".now-playing").textContent = ch.name;
  resetFreezeDetection();
}

function resetFreezeDetection() {
  if (freezeCheckInterval) clearInterval(freezeCheckInterval);
  freezeCheckInterval = setInterval(() => {
    if (video.paused || video.readyState < 2 || reconnecting) return;
    if (video.currentTime === lastCurrentTime) {
      reconnect();
    } else {
      lastCurrentTime = video.currentTime;
    }
  }, 5000);
}

function reconnect() {
  if (reconnecting) return;
  reconnecting = true;
  overlay.style.display = "block";
  const ch = channels[currentIndex];
  video.src = ch.url;
  video.load();
  video.play().then(() => {
    reconnecting = false;
    overlay.style.display = "none";
  }).catch(() => {
    setTimeout(() => {
      reconnecting = false;
      reconnect();
    }, 3000);
  });
}

document.querySelector("select").onchange = function () {
  playChannel(parseInt(this.value));
};

document.querySelector("input[type='text']").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  document.querySelectorAll(".channel").forEach(btn => {
    btn.style.display = btn.textContent.toLowerCase().includes(query) ? "block" : "none";
  });
});

document.getElementById("importBtn").onclick = () => {
  const customUrl = document.getElementById("customUrl").value.trim();
  if (customUrl) fetchM3U(customUrl);
};

fetchM3U(m3uUrl);
