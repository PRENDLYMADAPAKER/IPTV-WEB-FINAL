export function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const nameMatch = lines[i].match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";

      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : null;

      const url = lines[i + 1]?.trim();
      if (url && url.startsWith("http")) {
        channels.push({ name, logo, url });
      }
    }
  }

  return channels;
}
