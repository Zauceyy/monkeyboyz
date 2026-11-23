/* Site-wide alerts: everyone on monkeyboyz.cool sees a banner when someone pulls a super rare card
   (Legendary, Golden #100, Pirate Token, the secret) or loses an online 1v1. Polls the backend every ~25s. */
(function () {
  const BIG = { Legendary: '#f0b232', Mythic: '#ff4fd8', 'Pirate Token': '#f5b700', Secret: '#20c997' };
  const LABEL = { Legendary: 'a LEGENDARY card', Mythic: 'a GOLDEN one-of-one', 'Pirate Token': 'THE PIRATE TOKEN', Secret: 'the SECRET card' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const myName = () => { try { return String(JSON.parse(localStorage.getItem('mb_flappy_name')) || '').trim().toLowerCase(); } catch (e) { return ''; } };
  const device = () => { let id = null; try { id = localStorage.getItem('mb_voter'); } catch (e) {} if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', id); } catch (e) {} } return id; };
  let last = 0; try { last = Number(localStorage.getItem('mb_alert_seen')) || 0; } catch (e) {}
  if (!last || Date.now() - last > 10 * 60000) last = Date.now() - 90000;   // only alert for things that just happened
  const queue = []; let showing = false;

  const css = `
  .mba{position:fixed;left:50%;top:14px;transform:translate(-50%,-140%);z-index:9999;max-width:min(560px,calc(100vw - 24px));
    background:#111;color:#fff;border-radius:18px;padding:12px 18px 12px 12px;display:flex;gap:12px;align-items:center;cursor:pointer;
    box-shadow:0 12px 40px rgba(0,0,0,.35),0 0 0 3px var(--ac);transition:transform .45s cubic-bezier(.2,1.4,.4,1);font:inherit}
  .mba.in{transform:translate(-50%,0)}
  .mba .ic{font-size:34px;line-height:1;flex:none;animation:mbaPulse 1s ease-in-out infinite}
  .mba b{color:var(--ac)} .mba small{display:block;color:#aaa;font-size:12px;margin-top:2px}
  .mba.loss{--ac:#e5484d}
  @keyframes mbaPulse{50%{transform:scale(1.18) rotate(-6deg)}}
  .mba-conf{position:fixed;top:-40px;z-index:9998;font-size:26px;pointer-events:none;animation:mbaFall linear forwards}
  @keyframes mbaFall{to{transform:translateY(110vh) rotate(var(--r))}}`;
  function addCss() { if (!document.getElementById('mba-css')) { const s = document.createElement('style'); s.id = 'mba-css'; s.textContent = css; document.head.appendChild(s); } }

  function chime(big) {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)(); if (c.state === 'suspended') return;
      (big ? [523, 659, 784, 1047, 1319] : [392, 330, 262]).forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * .1;
        o.type = big ? 'triangle' : 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .3);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .32);
      });
      setTimeout(() => c.close(), 1500);
    } catch (e) {}
  }
  function confetti(emojis) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 24; i++) {
      const d = document.createElement('div'); d.className = 'mba-conf'; d.textContent = emojis[i % emojis.length];
      d.style.left = Math.random() * 100 + 'vw'; d.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      d.style.animationDuration = (2.2 + Math.random() * 2) + 's'; d.style.animationDelay = Math.random() * .8 + 's';
      document.body.appendChild(d); setTimeout(() => d.remove(), 5200);
    }
  }
  function next() {
    if (showing || !queue.length) return;
    showing = true; addCss();
    const a = queue.shift(), el = document.createElement('div');
    el.className = 'mba' + (a.loss ? ' loss' : ''); if (a.color) el.style.setProperty('--ac', a.color);
    el.innerHTML = `<span class="ic">${a.icon}</span><div>${a.html}<small>${a.sub}</small></div>`;
    document.body.appendChild(el); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    chime(!a.loss); if (a.party) confetti(a.party);
    let gone = false;
    const close = () => { if (gone) return; gone = true; el.classList.remove('in'); setTimeout(() => { el.remove(); showing = false; next(); }, 450); };
    el.onclick = () => { close(); if (a.go) location.hash = a.go; };
    setTimeout(close, a.loss ? 6000 : 8000);
  }
  function push(a) { queue.push(a); next(); }

  function handle(d) {
    const me = myName(); let newest = last;
    (d.pulls || []).slice().reverse().forEach(p => {
      if (!(p.t > last) || !BIG[p.rarity]) return; newest = Math.max(newest, p.t);
      if (me && String(p.name).trim().toLowerCase() === me) return;   // you already saw your own pull
      const huge = p.rarity === 'Mythic' || p.rarity === 'Pirate Token';
      push({ icon: p.rarity === 'Pirate Token' ? '🏴‍☠️' : p.rarity === 'Secret' ? '🤫' : huge ? '👑' : '🌟', color: BIG[p.rarity],
        html: `<b>${esc(p.name)}</b> just pulled ${LABEL[p.rarity]}: <b>${esc(p.title)}</b>!`, sub: 'Monkey Cards · tap to open packs', go: '#games',
        party: huge ? ['🍌', '✨', '🎉', '💰', '🐒'] : null });
    });
    (d.news || []).slice().reverse().forEach(n => {
      if (!(n.t > last)) return; newest = Math.max(newest, n.t);
      if (n.kind !== 'loss') return;
      push({ loss: true, icon: '💀', html: `<b>${esc(n.who)}</b> lost to ${esc(n.other)} in ${esc(n.game)}!`, sub: 'Online 1v1 · tap to play', go: '#games' });
    });
    if (newest > last) { last = newest; try { localStorage.setItem('mb_alert_seen', String(last)); } catch (e) {} }
  }
  function poll() {
    if (document.hidden || !window.MB_API) return;
    fetch(window.MB_API + '?action=alerts').then(r => r.json()).then(d => { if (d && d.ok) handle(d); }).catch(() => {});
  }
  setTimeout(poll, 4000); setInterval(poll, 25000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

  window.MBAlerts = {
    // the winner's browser reports it, so a sore loser can't hide it
    loss(loser, winner, game) {
      if (!window.MB_API || !loser || !winner) return;
      fetch(window.MB_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'news', kind: 'loss', who: loser, other: winner, game, voter: device() }) }).then(() => setTimeout(poll, 1500)).catch(() => {});
    },
    _test: handle
  };
})();
