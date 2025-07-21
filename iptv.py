const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
let channels = [], filtered = [];

const video = document.getElementById("video");
const carousel = document.getElementById("channel-carousel");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("categoryFilter");
const nowTitle = document.getElementById("now-title");
const nowIcon = document.getElementById("now-icon");

function parseM3U(data) {
  const lines = data.split("\n");
  const parsed = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",").pop().trim();
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const groupMatch = lines[i].match(/group-title="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "";
      const group = groupMatch ? groupMatch[1] : "Other";
      const url = lines[i + 1];
      if (url && url.startsWith("http")) {
        parsed.push({ name, logo, group, url });
      }
    }
  }
  return parsed;
}

function updateCategoryFilter() {
  const groups = [...new Set(channels.map(ch => ch.group))].sort();
  categorySelect.innerHTML = `<option value="All">All Channels</option>` +
    groups.map(g => `<option value="${g}">${g}</option>`).join("");
}

function displayChannels(list) {
  carousel.innerHTML = "";
  list.forEach((ch, i) => {
    const div = document.createElement("div");
    div.className = "channel-card";
    div.innerHTML = `
      <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='fallback.png'" />
      <p>${ch.name}</p>
    `;
    div.onclick = () => playChannel(ch);
    carousel.appendChild(div);
  });
}

function playChannel(channel) {
  nowTitle.textContent = channel.name;
  nowIcon.src = channel.logo;
  if (Hls.isSupported() && channel.url.endsWith(".m3u8")) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }
  video.play();
}

function filterAndDisplay() {
  const keyword = searchInput.value.toLowerCase();
  const group = categorySelect.value;
  filtered = channels.filter(ch =>
    (group === "All" || ch.group === group) &&
    ch.name.toLowerCase().includes(keyword)
  );
  displayChannels(filtered);
}

searchInput.addEventListener("input", filterAndDisplay);
categorySelect.addEventListener("change", filterAndDisplay);

function loadPlaylist() {
  fetch(m3uUrl)
    .then(res => res.text())
    .then(data => {
      channels = parseM3U(data);
      updateCategoryFilter();
      filterAndDisplay();
      if (channels.length > 0) playChannel(channels[0]);
    })
    .catch(err => console.error("M3U Fetch error:", err));
}

window.onload = loadPlaylist;
