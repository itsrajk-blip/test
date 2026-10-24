import { RetellWebClient } from 'retell-client-js-sdk';
const client = new RetellWebClient();
const dialog = document.querySelector('#voice-dialog');
const start = document.querySelector('#start-call');
const end = document.querySelector('#end-call');
const status = document.querySelector('#voice-status');
let busy = false;
let active = false;
let generation = 0;
const setStatus = text => { status.textContent = text; };
function reset(text) { busy = false; active = false; start.disabled = false; end.disabled = true; setStatus(text); }
document.querySelector('#voice').onclick = () => dialog.showModal();
document.querySelector('#close-voice').onclick = () => dialog.close();
dialog.addEventListener('close', () => { generation++; client.stopCall(); reset('Call ended. You can start another test call.'); });
client.on('call_started', () => { active = true; busy = false; end.disabled = false; setStatus('Connected. Speak to the Rayan Cleaning Services receptionist.'); });
client.on('call_ended', () => reset('Call ended. Thank you for testing.'));
client.on('error', () => { client.stopCall(); reset('The call could not connect. Check your microphone permission and connection, then try again.'); });
start.onclick = async () => {
  if (busy || active) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setStatus('Microphone access requires HTTPS. Open this website using a secure connection.'); return; }
  busy = true; start.disabled = true; const attempt = ++generation;
  setStatus('Please allow microphone access…');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    if (attempt !== generation) return;
    setStatus('Connecting to your test receptionist…');
    const response = await fetch('/api/voice/call', { method: 'POST', headers: { 'X-Receptionist-Request': '1', 'X-Test-Access-Code': document.querySelector('#test-code').value } });
    const data = await response.json();
    if (attempt !== generation) return;
    if (!response.ok) throw new Error(data.error || 'Unable to create a call.');
    await client.startCall({ accessToken: data.access_token, callId: data.call_id, transport: data.transport, url: data.url, iceServers: data.ice_servers });
    if (attempt !== generation) client.stopCall();
  } catch (error) {
    if (attempt !== generation) return;
    reset(error.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser settings and try again.' : error.name === 'NotFoundError' ? 'No microphone was found. Connect one and try again.' : error.message || 'Unable to connect. Please try again.');
  }
};
end.onclick = () => { generation++; client.stopCall(); reset('Call ended. Thank you for testing.'); };
window.addEventListener('pagehide', () => client.stopCall());
