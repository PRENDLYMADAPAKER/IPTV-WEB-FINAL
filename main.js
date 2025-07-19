const video = document.getElementById('player');
const streamUrl = "https://s-b2.towtooma.net/plyvivo/1otenidoga8ud020p050/chunklist.m3u8";

if (Hls.isSupported()) {
  const hls = new Hls({
    xhrSetup: function(xhr) {
      xhr.setRequestHeader("Referer", "https://strikeout.im/");
    }
  });
  hls.loadSource(streamUrl);
  hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = streamUrl;
}
