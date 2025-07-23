
const m3uUrl = "https://cdn.jsdelivr.net/gh/PRENDLYMADAPAKER/ANG-KALAT-MO@main/IPTVPREMIUM.m3u";
let channels = [];
let currentIndex = 0;
let video = document.getElementById("videoPlayer");
let overlay = document.getElementById("overlay");
let lastTime = 0;
let stuckCounter = 0;
let reconnecting = false;

// Reconnect overlay element
function showOverlay(show) {
  overlay.style.display = show ? "flex" : "none";
}

// Fetch and parse M3U
async function fetchChannels() {
  try {
    const response = await fetch(m3uUrl);
    const data = await response.text();
    const lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF:")) {
        const nameMatch = lines[i].match(/,(.*)$/);
        const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
        const groupMatch = lines[i].match(/group-title="([^"]+)"/);
        const url = lines[i + 1]?.trim();
        if (url && url.startsWith("http")) {
          channels.push({
            name: nameMatch ? nameMatch[1] : "Untitled",
            url,
            logo: logoMatch ? logoMatch[1] : "",
            group: groupMatch ? groupMatch[1] : "Other"
          });
        }
      }
    }
    populateDropdown();
  } catch (err) {
    console.error("Error fetching M3U:", err);
  }
}

// Populate dropdown with parsed channels
function populateDropdown() {
  const select = document.getElementById("channelSelect");
  channels.forEach((ch, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = ch.name;
    select.appendChild(opt);
  });
}

// Play selected channel
function playChannel(index) {
  if (!channels[index]) return;
  currentIndex = index;
  const ch = channels[index];
  video.src = ch.url;
  document.getElementById("nowPlaying").textContent = ch.name;
  video.load();
  video.play().catch(err => console.error("Playback error:", err));
}

// Monitor video freeze
setInterval(() => {
  if (video.paused || video.readyState < 2 || reconnecting) return;
  if (video.currentTime === lastTime) {
    stuckCounter++;
    if (stuckCounter >= 5) {
      reconnectStream();
    }
  } else {
    stuckCounter = 0;
  }
  lastTime = video.currentTime;
}, 2000);

// Attempt to reconnect the stream
function reconnectStream() {
  if (reconnecting) return;
  reconnecting = true;
  showOverlay(true);
  const ch = channels[currentIndex];
  let attempts = 0;
  const tryReconnect = setInterval(() => {
    if (!reconnecting) {
      clearInterval(tryReconnect);
      return;
    }
    console.log("Retrying stream...");
    video.src = ch.url;
    video.load();
    video.play().then(() => {
      showOverlay(false);
      stuckCounter = 0;
      reconnecting = false;
      clearInterval(tryReconnect);
    }).catch(err => {
      attempts++;
      if (attempts > 10) {
        clearInterval(tryReconnect);
        console.error("Reconnect failed.");
      }
    });
  }, 3000);
}

// UI handlers
document.getElementById("channelSelect").addEventListener("change", e => {
  playChannel(e.target.value);
});

document.getElementById("importBtn").addEventListener("click", () => {
  const customUrl = document.getElementById("customM3u").value;
  if (customUrl) {
    fetch(customUrl).then(res => res.text()).then(data => {
      channels = [];
      document.getElementById("channelSelect").innerHTML = '<option selected disabled>Select a channel</option>';
      const lines = data.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("#EXTINF:")) {
          const nameMatch = lines[i].match(/,(.*)$/);
          const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
          const groupMatch = lines[i].match(/group-title="([^"]+)"/);
          const url = lines[i + 1]?.trim();
          if (url && url.startsWith("http")) {
            channels.push({
              name: nameMatch ? nameMatch[1] : "Untitled",
              url,
              logo: logoMatch ? logoMatch[1] : "",
              group: groupMatch ? groupMatch[1] : "Other"
            });
          }
        }
      }
      populateDropdown();
    });
  }
});

// Initial load
fetchChannels();
