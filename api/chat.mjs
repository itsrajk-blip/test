import { createHmac, timingSafeEqual } from 'node:crypto';
const AGENT_ID = 'agent_475c0197b77439bbadd5cc363f';
function sign(value, key) { return createHmac('sha256', key).update('premier-chat:' + value).digest('base64url'); }
function issueToken(id, key) {
  const payload = Buffer.from(JSON.stringify({ id, exp: Date.now() + 86400000 })).toString('base64url');
  return payload + '.' + sign(payload, key);
}
function readToken(token, key) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload, key)), actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof data.id === 'string' && data.exp > Date.now() ? data.id : null;
  } catch { return null; }
}
function replies(data) {
  const messages = data.messages || data.message_with_tool_calls || [];
  return messages.filter(m => m.role === 'agent' && typeof m.content === 'string').map(m => m.content);
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  if (req.headers['x-receptionist-request'] !== '1' || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) return res.status(403).json({ error: 'Please use the chat on this website.' });
  const key = process.env.RETELL_API_KEY;
  if (!key) return res.status(503).json({ error: 'Chat is not configured on this deployment.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid request.' }); } }
  if (!body || typeof body !== 'object' || !['start', 'message', 'end'].includes(body.action)) return res.status(400).json({ error: 'Invalid chat action.' });
  const { action } = body;
  const id = action === 'start' ? null : readToken(body.session, key);
  if (action !== 'start' && !id) return res.status(403).json({ error: 'This chat session has expired. Please start a new chat.' });
  if (action === 'message' && (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 2000)) return res.status(400).json({ error: 'Please enter a message of up to 2,000 characters.' });
  const path = action === 'start' ? '/create-chat' : action === 'message' ? '/create-chat-completion' : '/end-chat/' + encodeURIComponent(id);
  const payload = action === 'start' ? { agent_id: process.env.RETELL_CHAT_AGENT_ID || AGENT_ID } : action === 'message' ? { chat_id: id, content: body.message.trim() } : undefined;
  try {
    const response = await fetch('https://api.retellai.com' + path, {
      method: action === 'end' ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(payload ? { body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) return res.status(502).json({ error: `Chat could not complete this request (Retell HTTP ${response.status}). Please try again.` });
    if (action === 'end') return res.status(200).json({ ended: true });
    const data = await response.json();
    if (action === 'start') {
      if (typeof data.chat_id !== 'string') return res.status(502).json({ error: 'Unable to start a chat session.' });
      return res.status(200).json({ session: issueToken(data.chat_id, key), messages: replies(data) });
    }
    return res.status(200).json({ messages: replies(data), ended: data.chat_status === 'ended' });
  } catch { return res.status(502).json({ error: 'Chat is temporarily unavailable. Please try again.' }); }
}
