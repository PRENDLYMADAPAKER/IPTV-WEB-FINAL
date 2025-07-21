import { useEffect, useState } from 'react';
import Hls from 'hls.js';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [channels, setChannels] = useState([]);
  const [currentStream, setCurrentStream] = useState('');
  const [search, setSearch] = useState('');

  const m3uUrl = "https://iptv-cors-proxy.onrender.com/https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u";

  useEffect(() => {
    fetch(m3uUrl)
      .then(res => res.text())
      .then(parseM3U);
  }, []);

  const parseM3U = (text) => {
    const lines = text.split('\n');
    const parsed = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        const title = lines[i].split(',')[1]?.trim();
        const url = lines[i + 1];
        if (url && url.startsWith('http')) {
          parsed.push({ title, url });
        }
      }
    }
    setChannels(parsed);
    if (parsed.length > 0) setCurrentStream(parsed[0].url);
  };

  useEffect(() => {
    const video = document.getElementById('videoPlayer');
    if (Hls.isSupported() && currentStream) {
      const hls = new Hls();
      hls.loadSource(currentStream);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentStream;
    }
  }, [currentStream]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src="/logo.png" alt="Logo" className={styles.logo} />
        <input
          type="text"
          placeholder="Search channel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
      </header>

      <video id="videoPlayer" className={styles.video} controls autoPlay />

      <div className={styles.channelList}>
        {channels
          .filter(ch => ch.title.toLowerCase().includes(search.toLowerCase()))
          .map((ch, index) => (
            <button key={index} onClick={() => setCurrentStream(ch.url)} className={styles.channel}>
              {ch.title}
            </button>
        ))}
      </div>
    </div>
  );
            }
