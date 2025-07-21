import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { parseM3U } from "../utils/m3uParser";

export default function Home() {
  const [channels, setChannels] = useState([]);
  const [search, setSearch] = useState("");
  const [nowPlaying, setNowPlaying] = useState(null);
  const videoRef = useRef(null);

  const loadPlaylist = async () => {
    const res = await fetch("https://raw.githubusercontent.com/PRENDLYMADAPAKER/ANG-KALAT-MO/refs/heads/main/IPTVPREMIUM.m3u");
    const text = await res.text();
    const parsed = parseM3U(text);
    setChannels(parsed);
    if (!nowPlaying && parsed.length > 0) {
      playChannel(parsed[0]);
    }
  };

  const playChannel = (channel) => {
    setNowPlaying(channel);
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = channel.url;
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, []);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 max-w-screen-md mx-auto">
      <div className="flex items-center space-x-3">
        <img src="/logo.png" alt="Logo" className="h-10" />
        <h1 className="text-2xl font-bold">IPTV Premium</h1>
      </div>

      <div className="mt-2 bg-gray-800 p-2 rounded text-sm">
        Now Playing: <span className="font-semibold">{nowPlaying?.name || "Loading..."}</span>
      </div>

      <div className="mt-4">
        <video ref={videoRef} controls className="w-full rounded border border-gray-600" />
      </div>

      <div className="mt-4 flex space-x-2">
        <input
          className="p-2 rounded bg-gray-700 w-full"
          type="text"
          placeholder="Search channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={loadPlaylist}
        >
          Update Playlist
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {filteredChannels.map((ch, i) => (
          <div
            key={i}
            className="bg-gray-900 p-2 rounded hover:bg-gray-800 cursor-pointer flex items-center"
            onClick={() => playChannel(ch)}
          >
            {ch.logo ? (
              <img src={ch.logo} alt={ch.name} className="h-8 w-8 mr-2 object-contain" />
            ) : (
              <div className="h-8 w-8 mr-2 bg-gray-700 rounded" />
            )}
            <span>{ch.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
  }
