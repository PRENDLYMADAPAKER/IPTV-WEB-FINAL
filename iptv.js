const m3uUrl = "https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

async function loadChannels() {
  const res = await fetch(m3uUrl);
  const text = await res.text();
  const entries = text.split('#EXTINF:').slice(1).map((entry, i) => {
    const lines = entry.trim().split('
');
    const info = lines[0];
    const url = lines[1];
    const nameMatch = info.match(/tvg-name="([^"]+)"/);
    const logoMatch = info.match(/tvg-logo="([^"]+)"/);
    const groupMatch = info.match(/group-title="([^"]+)"/);
    return {
      name: nameMatch ? nameMatch[1] : "Channel " + i,
      logo: logoMatch ? logoMatch[1] : "",
      group: groupMatch ? groupMatch[1] : "Others",
      url: url
    };
  });

  const carousel = document.getElementById('channelCarousel');
  const grid = document.getElementById('channelGrid');
  const catFilter = document.getElementById('categoryFilter');
  const video = document.getElementById('video');
  const chName = document.getElementById('channel-name');
  const chIcon = document.getElementById('channel-icon');

  const categories = [...new Set(entries.map(e => e.group))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catFilter.appendChild(opt);
  });

  function playChannel(channel) {
    chName.textContent = channel.name;
    chIcon.src = channel.logo;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(video);
    } else {
      video.src = channel.url;
    }
  }

  function createItem(channel) {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.innerHTML = \`
      <img src="\${channel.logo}" /><br/>
      <span>\${channel.name}</span><br/>
      <span class="fav">⭐</span>
    \`;
    div.onclick = () => playChannel(channel);
    return div;
  }

  function filterAndDisplay() {
    const term = document.getElementById('search').value.toLowerCase();
    const cat = catFilter.value;
    grid.innerHTML = "";
    carousel.innerHTML = "";
    entries.filter(e =>
      (!cat || e.group === cat) &&
      e.name.toLowerCase().includes(term)
    ).forEach(e => {
      grid.appendChild(createItem(e));
      carousel.appendChild(createItem(e));
    });
  }

  document.getElementById('search').oninput = filterAndDisplay;
  catFilter.onchange = filterAndDisplay;

  filterAndDisplay();
  playChannel(entries[0]);
}

document.getElementById('logoutBtn').onclick = () => {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  });
};

window.onload = () => {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) window.location.href = "login.html";
    else loadChannels();
  });
};