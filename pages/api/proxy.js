export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing 'url'");

  const response = await fetch(targetUrl, {
    headers: {
      Referer: "https://strikeout.im/",
      Origin: "https://strikeout.im/"
    }
  });

  res.setHeader("Content-Type", response.headers.get("Content-Type"));
  const stream = await response.arrayBuffer();
  res.send(Buffer.from(stream));
}
