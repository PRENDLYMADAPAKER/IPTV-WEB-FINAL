const playlistUrl = "https://iptv-cors-proxy.onrender.com?url=https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/main/IPTVPREMIUM.m3u";

const video = document.getElementById("videoPlayer");
const channelList = document.getElementById("channelList");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

let channels = [];

fetch(playlistUrl)
  .then((res) => res.text())
  .then((data) => {
    const lines = data.split("\n");
    let currentChannel = {};

    lines.forEach((line) => {
      if (line.startsWith("#EXTINF")) {
        const nameMatch = line.match(/,(.*)$/);
        const tvgMatch = line.match(/tvg-logo="(.*?)"/);
        const groupMatch = line.match(/group-title="(.*?)"/);

        currentChannel = {
          name: nameMatch ? nameMatch[1] : "Unknown",
          logo: tvgMatch ? tvgMatch[1] : "",
          group: groupMatch ? groupMatch[1] : "Other",
        };
      } else if (line && !line.startsWith("#")) {
        currentChannel.url = line;
        channels.push(currentChannel);
      }
    });

    displayCategories();
    displayChannels(channels);
  })
  .catch((err) => {
    document.getElementById("channelList").innerHTML =
      '<p style="color:red">Failed to load playlist.</p>';
    console.error(err);
  });

function displayCategories() {
  const categories = ["All", ...new Set(channels.map((ch) => ch.group))];
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

function displayChannels(list) {
  channelList.innerHTML = "";
  list.forEach((ch, index) => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.innerHTML = `
      <img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100x60?text=No+Logo'">
      <span>${ch.name}</span>
    `;
    card.onclick = () => playChannel(ch);
    channelList.appendChild(card);
  });
}

function playChannel(channel) {
  nowPlaying.textContent = channel.name;
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function () {
      video.play();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
  }
}

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = channels.filter((ch) =>
    ch.name.toLowerCase().includes(term)
  );
  displayChannels(filtered);
});

categoryFilter.addEventListener("change", () => {
  const value = categoryFilter.value;
  const filtered =
    value === "All" ? channels : channels.filter((ch) => ch.group === value);
  displayChannels(filtered);
});
