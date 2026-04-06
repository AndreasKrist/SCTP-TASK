export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch video' });

    const contentType = response.headers.get('content-type') || 'video/webm';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="recording.webm"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
