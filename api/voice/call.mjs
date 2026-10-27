export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  if (req.headers['x-receptionist-request'] !== '1' || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) return res.status(403).json({ error: 'Start the call from this website.' });
  if (!process.env.RETELL_API_KEY) return res.status(503).json({ error: 'Calling is not configured on this deployment.' });
  try {
    const response = await fetch('https://api.retellai.com/v3/create-web-call', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: process.env.RETELL_AGENT_ID || 'agent_71e55befe1d7f8c935338a625d' }), signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) return res.status(502).json({ error: `Retell could not create the call (HTTP ${response.status}).` });
    const data = await response.json();
    if (!data.access_token) return res.status(502).json({ error: 'Retell did not return a call token.' });
    return res.status(200).json(Object.fromEntries(['access_token', 'call_id', 'transport', 'url', 'ice_servers'].filter(k => k in data).map(k => [k, data[k]])));
  } catch { return res.status(502).json({ error: 'Unable to reach Retell. Please try again.' }); }
}
