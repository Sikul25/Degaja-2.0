// Tiny wrapper around Vercel's built-in IP geolocation headers, so the
// static frontend (which has no server-side rendering) can ask "what
// country is this visitor in?" on first load to pick a default language.
// Only works once actually deployed on Vercel — these headers are absent
// in local dev.
export default function handler(req, res) {
  const country = req.headers["x-vercel-ip-country"] || "";
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ country });
}
