export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { user, pass } = req.body;

  if (
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS
  ) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false });
}
