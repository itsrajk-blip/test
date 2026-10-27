const chat = document.querySelector('#chat');
const messages = document.querySelector('#messages');
const input = document.querySelector('#message');
const form = document.querySelector('#chat-form');
const status = document.querySelector('#chat-status');
const endButton = document.querySelector('#end-chat');
const newButton = document.querySelector('#new-chat');
let session = null;
let busy = false;
let ended = false;
let returnFocus;
function addMessage(text, user = false) {
  const el = document.createElement('div'); el.className = 'message' + (user ? ' user' : '');
  el.textContent = text; messages.append(el); messages.scrollTop = messages.scrollHeight; return el;
}
function updateControls() {
  form.querySelector('button').disabled = busy || ended;
  input.disabled = busy || ended;
  endButton.disabled = busy || !session || ended;
  newButton.hidden = !ended;
}
async function request(action, extra = {}) {
  const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Receptionist-Request': '1' }, body: JSON.stringify({ action, session, ...extra }) });
  const data = await response.json();
  if (!response.ok) { const error = new Error(data.error || 'Unable to reach the receptionist. Please try again.'); error.status = response.status; throw error; }
  return data;
}
function openChat() {
  returnFocus = document.activeElement;
  const detail = document.querySelector('#property-detail'); if (detail.open) detail.close();
  if (!chat.open) chat.showModal();
  if (!messages.children.length) addMessage('Hi, welcome to Premier Property Agents. How can I help you today?');
  input.focus();
}
document.querySelectorAll('[data-chat]').forEach(b => b.onclick = openChat);
document.querySelector('#close').onclick = () => chat.close();
chat.addEventListener('close', () => returnFocus?.focus());
async function send(text) {
  text = text.trim();
  if (!text || busy || ended) return;
  if (text.length > 2000) { status.textContent = 'Please use up to 2,000 characters.'; return; }
  busy = true; status.textContent = 'Connecting…'; updateControls();
  const userMessage = addMessage(text, true); input.value = '';
  try {
    if (!session) {
      const data = await request('start'); session = data.session;
      if (!session) throw new Error('Unable to start a conversation. Please try again.');
      (data.messages || []).forEach(text => addMessage(text));
    }
    status.textContent = 'Receptionist is replying…';
    const data = await request('message', { message: text });
    (data.messages || []).forEach(text => addMessage(text));
    ended = Boolean(data.ended);
    status.textContent = ended ? 'Conversation ended' : 'AI receptionist';
    if (!data.messages?.length && !ended) status.textContent = 'Message received. You can send another message.';
  } catch (error) {
    status.textContent = error.message;
    if (error.status === 403) ended = true;
    userMessage.classList.add('unconfirmed'); userMessage.title = 'Delivery or reply could not be confirmed.';
    input.value = text;
  } finally { busy = false; updateControls(); if (chat.open && !ended) input.focus(); }
}
form.onsubmit = e => { e.preventDefault(); send(input.value); };
endButton.onclick = async () => {
  if (busy || !session || ended) return;
  busy = true; status.textContent = 'Ending conversation…'; updateControls();
  try { await request('end'); ended = true; status.textContent = 'Conversation ended'; addMessage('This conversation has ended. Thank you for getting in touch.'); }
  catch (error) { status.textContent = error.message; if (error.status === 403) ended = true; }
  finally { busy = false; updateControls(); }
};
newButton.onclick = () => { session = null; ended = false; messages.replaceChildren(); status.textContent = 'AI receptionist'; updateControls(); openChat(); };
updateControls();
