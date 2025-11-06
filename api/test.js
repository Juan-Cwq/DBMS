export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working!',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    method: req.method
  });
}
