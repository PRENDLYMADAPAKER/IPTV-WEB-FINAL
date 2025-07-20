// ✅ Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyA0TjMoFSYBIs0VQ9shUilOuDGb1uXHjKI",
  authDomain: "iptv-log-in.firebaseapp.com",
  projectId: "iptv-log-in",
  storageBucket: "iptv-log-in.firebasestorage.app",
  messagingSenderId: "820026131349",
  appId: "1:820026131349:web:417abd6ad9057c55a92c9c",
  measurementId: "G-4Y8T6J595Z"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ Check Login & Device Limit
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
    const userRef = db.ref("devices/" + user.uid);

    userRef.once("value").then(snapshot => {
      const devices = snapshot.val() || {};
      if (!devices[deviceId] && Object.keys(devices).length >= 2) {
        alert("Device limit exceeded (2 max).");
        firebase.auth().signOut();
        window.location.href = "login.html";
      } else {
        devices[deviceId] = true;
        userRef.set(devices);
        initIPTV(); // Load channels only after auth + device check
      }
    });
  } else {
    window.location.href = "login.html";
  }
});

// ✅ Logout Function
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    alert("Logout error: " + error.message);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
});

// ✅ IPTV Setup
let allChannels = [];
let currentStream = null;

function initIPTV() {
  const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

  fetch(m3uUrl)
    .then(response => response.text())
    .then(data => {
      allChannels = parseM3U(data);
      displayChannels(allChannels);
    });
}

function parseM3U(data) {
  const lines = data.split("\n");
  const channels = [];
  let channel = {};

  lines.forEach(line => {
    if (line.startsWith("#EXTINF")) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);

      channel = {
        name: nameMatch ? nameMatch[1] : "Unknown",
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "Other"
      };
    } else if (line.startsWith("http")) {
      channel.url = line.trim();
      channels.push(channel);
    }
  });

  return channels;
}

function displayChannels(channels) {
  const container = document.getElementById("channel-container");
  container.innerHTML = "";
  container.className = "channel-carousel"; // Enable horizontal scroll

  channels.forEach((ch, index) => {
    const div = document.createElement("div");
    div.className = "channel-item";
    div.innerHTML = `
      <img src="${ch.logo}" onerror="this.src='default.png'" />
      <div>${ch.name}</div>
    `;
    div.onclick = () => playChannel(ch, index);
    container.appendChild(div);
  });
}

function playChannel(channel, index) {
  const video = document.getElementById("videoPlayer");
  const icon = document.getElementById("channel-icon");
  const name = document.getElementById("channel-name");

  name.textContent = channel.name;
  icon.src = channel.logo || "default.png";

  if (Hls.isSupported()) {
    if (currentStream) currentStream.destroy();
    currentStream = new Hls();
    currentStream.loadSource(channel.url);
    currentStream.attachMedia(video);
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
  } else {
    alert("HLS not supported on this device.");
  }

  video.play();
}

// ✅ Search Filter
document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = allChannels.filter(ch => ch.name.toLowerCase().includes(value));
  displayChannels(filtered);
});

// ✅ Category Filter
document.getElementById("categoryFilter").addEventListener("change", (e) => {
  const value = e.target.value;
  if (value === "all") {
    displayChannels(allChannels);
  } else {
    const filtered = allChannels.filter(ch => ch.group === value);
    displayChannels(filtered);
  }
});
