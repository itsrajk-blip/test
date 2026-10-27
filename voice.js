import { RetellWebClient } from 'retell-client-js-sdk';
const client = new RetellWebClient();
const dialog = document.querySelector('#voice-dialog');
const trigger = document.querySelector('#voice');
const retry = document.querySelector('#start-call');
const end = document.querySelector('#end-call');
const status = document.querySelector('#voice-status');
let busy = false;
let active = false;
let generation = 0;
const setStatus = text => { status.textContent = text; };
function reset(text) {
  busy = false; active = false; trigger.disabled = false;
  retry.hidden = false; retry.disabled = false; end.hidden = true;
  setStatus(text);
}
function stopCall() { generation++; client.stopCall(); reset('Call ended.'); }
document.querySelector('#close-voice').onclick = () => dialog.close();
dialog.addEventListener('close', () => { stopCall(); trigger.focus(); });
client.on('call_started', () => {
  active = true; busy = false; end.hidden = false; setStatus('Connected. You can speak now.');
});
client.on('call_ended', () => reset('Call ended. Thank you for calling.'));
client.on('error', () => { generation++; client.stopCall(); reset('The call could not connect. Check your microphone permission and connection, then try again.'); });
async function startCall() {
  if (busy || active) return;
  if (!dialog.open) dialog.showModal();
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    reset('Microphone access requires HTTPS. Open this website using a secure connection.'); return;
  }
  busy = true; trigger.disabled = true; retry.hidden = true; end.hidden = false;
  const attempt = ++generation;
  setStatus('Please allow microphone access…');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    if (attempt !== generation) return;
    setStatus('Connecting to your receptionist…');
    const response = await fetch('/api/voice/call', { method: 'POST', headers: { 'X-Receptionist-Request': '1' } });
    const data = await response.json();
    if (attempt !== generation) return;
    if (!response.ok) throw new Error(data.error || 'Unable to create a call.');
    await client.startCall({ accessToken: data.access_token, callId: data.call_id, transport: data.transport, url: data.url, iceServers: data.ice_servers });
    if (attempt !== generation) client.stopCall();
  } catch (error) {
    if (attempt !== generation) return;
    reset(error.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser settings and try again.' : error.name === 'NotFoundError' ? 'No microphone was found. Connect one and try again.' : error.message || 'Unable to connect. Please try again.');
  }
}
trigger.onclick = startCall;
retry.onclick = startCall;
end.onclick = () => { stopCall(); dialog.close(); };
window.addEventListener('pagehide', stopCall);
