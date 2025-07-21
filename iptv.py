const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";
const player = document.getElementById("videoPlayer");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const channelList = document.getElementById("channelList");
const useProxyCheckbox = document.getElementById("useProxy");
const logoutBtn = document.getElementById("logoutBtn");

let channels = [];

async function fetchM3U() {
  try {
    const response = await fetch(m3uUrl);
    const text = await response.text();
    parseM3U(text);
    renderChannels();
    populateCategories();
  } catch (error) {
    console.error("Failed to fetch M3U:", error);
  }
}

function parseM3U(data) {
  const lines = data.split("\n");
  let current = {};
  channels = [];

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("#EXTINF")) {
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);
      const name = line.split(",").pop().trim();

      current = {
        name,
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Other"
      };
    } else if (line && !line.startsWith("#")) {
      current.url = line;
      channels.push({ ...current });
    }
  }
}

function renderChannels() {
  const search = searchInput.value.toLowerCase();
  const category = categorySelect.value;

  channelList.innerHTML = "";

  channels
    .filter(ch => ch.name.toLowerCase().includes(search))
    .filter(ch => category === "All" || ch.group === category)
    .forEach(ch => {
      const div = document.createElement("div");
      div.className = "channel";

      const img = document.createElement("img");
      img.src = ch.logo || "https://via.placeholder.com/60x40?text=Logo";
      img.alt = ch.name;

      const label = document.createElement("span");
      label.textContent = ch.name;

      div.appendChild(img);
      div.appendChild(label);
      div.onclick = () => playChannel(ch.url);

      channelList.appendChild(div);
    });
}

function populateCategories() {
  const unique = Array.from(new Set(channels.map(c => c.group))).sort();
  categorySelect.innerHTML = `<option value="All">All</option>`;
  unique.forEach(group => {
    const opt = document.createElement("option");
    opt.value = group;
    opt.textContent = group;
    categorySelect.appendChild(opt);
  });
}

function playChannel(url) {
  const finalUrl = useProxyCheckbox.checked
    ? `https://iptv-cors-proxy.onrender.com/proxy/${encodeURIComponent(url)}`
    : url;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(finalUrl);
    hls.attachMedia(player);
  } else if (player.canPlayType("application/vnd.apple.mpegurl")) {
    player.src = finalUrl;
  } else {
    alert("This browser does not support HLS.");
  }
}

// Event Listeners
searchInput.addEventListener("input", renderChannels);
categorySelect.addEventListener("change", renderChannels);
logoutBtn.addEventListener("click", () => {
  alert("Logged out!");
  // Optional: Firebase sign out
});

fetchM3U();
