const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

async function loadChannels() {
  const res = await fetch(m3uUrl);
  const text = await res.text();
  const entries = text.split('#EXTINF:').slice(1).map((entry, i) => {
    const lines = entry.trim().split('\n');
    const info = lines[0];
    const url = lines[1];
    const name = (info.match(/tvg-name="([^"]+)"/) || [])[1] || `Channel ${i}`;
    const logo = (info.match(/tvg-logo="([^"]+)"/) || [])[1] || "";
    const group = (info.match(/group-title="([^"]+)"/) || [])[1] || "Others";
    return { name, logo, group, url };
  });

  const video = document.getElementById('video');
  const grid = document.getElementById('channelGrid');
  const carousel = document.getElementById('channelCarousel');
  const search = document.getElementById('search');
  const filter = document.getElementById('categoryFilter');
  const nameDisplay = document.getElementById('channel-name');
  const iconDisplay = document.getElementById('channel-icon');

  const categories = [...new Set(entries.map(e => e.group))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });

  function play(channel) {
    nameDisplay.textContent = channel.name;
    iconDisplay.src = channel.logo;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(video);
    } else {
      video.src = channel.url;
    }
  }

  function makeItem(channel) {
    const div = document.createElement('div');
    div.className = "channel-item";
    div.innerHTML = `<img src="${channel.logo}" /><br>${channel.name}<br><span>⭐</span>`;
    div.onclick = () => play(channel);
    return div;
  }

  function render() {
    const keyword = search.value.toLowerCase();
    const category = filter.value;
    grid.innerHTML = "";
    carousel.innerHTML = "";
    entries.filter(c =>
      (!category || c.group === category) &&
      c.name.toLowerCase().includes(keyword)
    ).forEach(channel => {
      grid.appendChild(makeItem(channel));
      carousel.appendChild(makeItem(channel));
    });
  }

  search.oninput = render;
  filter.onchange = render;
  render();
  play(entries[0]);
}

document.getElementById('logoutBtn').onclick = () => {
  firebase.auth().signOut().then(() => window.location.href = "login.html");
};

firebase.auth().onAuthStateChanged(user => {
  if (!user) window.location.href = "login.html";
  else loadChannels();
});
