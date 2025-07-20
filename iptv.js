// iptv.js

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

// ✅ Logout logic
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

// ✅ Protect page from unauthorized access
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// ✅ Fetch and display M3U channels
fetch("https://corsproxy.io/?https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u")
  .then(res => res.text())
  .then(data => {
    const lines = data.split("\n");
    const channelContainer = document.getElementById("channel-container");
    const channelList = [];

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
          channelList.push({ name, logo, group, url });
        }
      }
    }

    // ✅ Group channels by category
    const categories = {};
    channelList.forEach(channel => {
      if (!categories[channel.group]) {
        categories[channel.group] = [];
      }
      categories[channel.group].push(channel);
    });

    // ✅ Create and display carousel-style groups
    Object.keys(categories).forEach(group => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "channel-group";

      const title = document.createElement("h3");
      title.textContent = group;
      groupDiv.appendChild(title);

      const carousel = document.createElement("div");
      carousel.className = "channel-carousel";

      categories[group].forEach(channel => {
        const item = document.createElement("div");
        item.className = "channel-item";
        item.innerHTML = `
          <img src="${channel.logo}" alt="logo">
          <span>${channel.name}</span>
        `;
        item.addEventListener("click", () => {
          playChannel(channel);
        });
        carousel.appendChild(item);
      });

      groupDiv.appendChild(carousel);
      channelContainer.appendChild(groupDiv);
    });

    console.log("✅ Channels loaded:", channelList.length);
  })
  .catch(err => {
    console.error("❌ Error loading M3U file:", err);
  });

// ✅ Play selected channel with HLS.js support
function playChannel(channel) {
  const player = document.getElementById("video-player");
  const title = document.getElementById("now-playing-title");
  const icon = document.getElementById("now-playing-icon");

  title.textContent = channel.name;
  icon.src = channel.logo;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(player);
  } else if (player.canPlayType("application/vnd.apple.mpegurl")) {
    player.src = channel.url;
  }

  player.play();
}
