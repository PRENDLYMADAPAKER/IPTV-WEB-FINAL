import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z",
  databaseURL: "https://iptv-log-in-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ Logout button
document.getElementById("logout-btn")?.addEventListener("click", () => {
  const user = auth.currentUser;
  if (user) {
    const deviceKey = localStorage.getItem("deviceKey");
    if (deviceKey) {
      set(ref(db, `devices/${user.uid}/${deviceKey}`), null).then(() => {
        signOut(auth).then(() => {
          localStorage.removeItem("deviceKey");
          window.location.href = "index.html";
        });
      });
    } else {
      signOut(auth).then(() => {
        window.location.href = "index.html";
      });
    }
  }
});

// ✅ Protect IPTV page
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// ✅ Channel fetch logic
let allChannels = [];

fetch("https://corsproxy.io/?https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u")
  .then(res => res.text())
  .then(data => {
    const lines = data.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF")) {
        const nameMatch = lines[i].match(/,(.*)$/);
        const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
        const groupMatch = lines[i].match(/group-title="(.*?)"/);
        const url = lines[i + 1];
        if (url && url.startsWith("http")) {
          const name = nameMatch ? nameMatch[1] : "Unknown";
          const logo = logoMatch ? logoMatch[1] : "";
          const group = groupMatch ? groupMatch[1] : "Other";
          allChannels.push({ name, logo, group, url });
        }
      }
    }

    renderChannels(allChannels);
    populateCategories(allChannels);
  })
  .catch(err => console.error("❌ Failed to fetch M3U:", err));

// ✅ Play selected channel
function playChannel(channel) {
  const player = document.getElementById("video-player");
  const title = document.getElementById("now-playing-title");
  const icon = document.getElementById("now-playing-icon");

  title.textContent = channel.name;
  icon.src = channel.logo || "";

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(player);
  } else {
    player.src = channel.url;
  }

  player.play();
}

// ✅ Render channels (carousel)
function renderChannels(channels) {
  const container = document.getElementById("channel-container");
  container.innerHTML = ""; // Clear existing

  const grouped = {};
  channels.forEach(channel => {
    if (!grouped[channel.group]) grouped[channel.group] = [];
    grouped[channel.group].push(channel);
  });

  Object.keys(grouped).forEach(group => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "channel-group";

    const title = document.createElement("h3");
    title.textContent = group;
    groupDiv.appendChild(title);

    const carousel = document.createElement("div");
    carousel.className = "channel-carousel";

    grouped[group].forEach(channel => {
      const item = document.createElement("div");
      item.className = "channel-item";
      item.innerHTML = `
        <img src="${channel.logo}" alt="${channel.name}">
        <span>${channel.name}</span>
      `;
      item.addEventListener("click", () => playChannel(channel));
      carousel.appendChild(item);
    });

    groupDiv.appendChild(carousel);
    container.appendChild(groupDiv);
  });
}

// ✅ Populate category filter
function populateCategories(channels) {
  const categoryFilter = document.getElementById("categoryFilter");
  const uniqueGroups = [...new Set(channels.map(c => c.group))];

  categoryFilter.innerHTML = `<option value="All">All Categories</option>`;
  uniqueGroups.forEach(group => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    categoryFilter.appendChild(option);
  });
}

// ✅ Filter by category
document.getElementById("categoryFilter")?.addEventListener("change", e => {
  const selected = e.target.value;
  const filtered = selected === "All"
    ? allChannels
    : allChannels.filter(c => c.group === selected);
  renderChannels(filtered);
});

// ✅ Search filter
document.getElementById("search")?.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();
  const filtered = allChannels.filter(c =>
    c.name.toLowerCase().includes(keyword)
  );
  renderChannels(filtered);
});
