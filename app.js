const nav = document.querySelector('#main-nav');
const toggle = document.querySelector('#menu-toggle');
const menu = document.querySelector('#mobile-menu');
function closeMenu() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
toggle.onclick = () => { menu.hidden = !menu.hidden; toggle.setAttribute('aria-expanded', String(!menu.hidden)); };
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
window.addEventListener('scroll', () => nav.classList.toggle('nav-scrolled', scrollY > 50), { passive: true });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
let searchMode = 'buy';
const cards = [...document.querySelectorAll('[data-listing]')];
const searchInput = document.querySelector('#property-query');
const modeButtons = [...document.querySelectorAll('[data-search-mode]')];
function chooseMode(mode) {
  searchMode = mode;
  modeButtons.forEach(b => { const selected = b.dataset.searchMode === mode; b.classList.toggle('mode-selected', selected); b.setAttribute('aria-pressed', String(selected)); });
}
function filterListings(mode = searchMode) {
  chooseMode(mode);
  const q = searchInput.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => { const show = (mode === 'all' || mode === card.dataset.mode) && (!q || card.dataset.searchText.includes(q)); card.hidden = !show; if (show) visible++; });
  document.querySelector('#property-empty').hidden = visible !== 0;
}
modeButtons.forEach(b => b.onclick = () => chooseMode(b.dataset.searchMode));
document.querySelector('#property-search').onclick = () => { filterListings(); document.querySelector('#properties').scrollIntoView({ behavior: 'smooth' }); };
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.querySelector('#property-search').click(); });
document.querySelectorAll('[data-filter-link]').forEach(a => a.addEventListener('click', () => { searchInput.value = ''; filterListings(a.dataset.filterLink); }));
chooseMode('buy');
const detail = document.querySelector('#property-detail');
document.querySelectorAll('[data-detail]').forEach(card => card.onclick = event => {
  event.preventDefault();
  const clone = card.cloneNode(true); clone.hidden = false; clone.removeAttribute('href'); clone.removeAttribute('data-detail');
  document.querySelector('#property-detail-content').replaceChildren(clone);
  detail.showModal();
});
document.querySelector('#close-property').onclick = () => detail.close();
let teamIndex = 0;
const track = document.querySelector('#team-track');
function moveTeam(direction) {
  const first = track.children[0];
  const columns = innerWidth >= 1024 ? 3 : 1;
  teamIndex = Math.min(Math.max(0, teamIndex + direction), track.children.length - columns);
  const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  track.style.transform = `translateX(-${teamIndex * step}px)`;
}
document.querySelectorAll('[data-team-direction]').forEach(b => b.onclick = () => moveTeam(Number(b.dataset.teamDirection)));
window.addEventListener('resize', () => moveTeam(0));
document.querySelector('#contact-form').onsubmit = event => { event.preventDefault(); document.querySelector('#contact-notice').textContent = 'Demo only: nothing was sent or saved. The reference agency is not connected to this form.'; };
// Keep a navy fallback until YouTube reports a playable frame, rather than showing an iframe error.
const heroVideo = document.querySelector('#home iframe');
heroVideo.addEventListener('load', () => {
  heroVideo.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'premier-hero' }), 'https://www.youtube.com');
});
window.addEventListener('message', event => {
  if (event.origin !== 'https://www.youtube.com' || event.source !== heroVideo.contentWindow) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data.event === 'onReady' || data.info?.playerState === 1) heroVideo.classList.add('video-ready');
  } catch { /* Ignore messages that are not YouTube player events. */ }
});
