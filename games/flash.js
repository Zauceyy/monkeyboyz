/* MonkeyBoyz Flash games: old .swf games played through Ruffle (a free Flash emulator that runs in the browser) */
(function () {
  // To add a game: put the .swf in games/flash/ and add a line here.
  const GAMES = [
    { id: 'impossible-quiz-deluxe', title: 'The Impossible Quiz Deluxe', by: 'Splapp-me-do', year: 2007,
      swf: 'games/flash/impossible-quiz-deluxe.swf', cover: 'games/flash/impossible-quiz-deluxe.jpg', w: 550, h: 400,
      about: 'Answer 110 questions that make no sense. You get 3 lives. Good luck.' },
    { id: 'duck-life-4', title: 'Duck Life 4', by: 'Wix Games', year: 2012,
      swf: 'games/flash/duck-life-4.swf', cover: 'games/flash/duck-life-4.jpg', w: 750, h: 480,
      about: 'Train your duck at running, swimming, flying and climbing, then race to win. Your progress saves in this browser.' },
  ];
  const RUFFLE = ['https://unpkg.com/@ruffle-rs/ruffle@0.8.0/ruffle.js', 'https://cdn.jsdelivr.net/npm/@ruffle-rs/ruffle@0.8.0/ruffle.js'];

  const CSS = `
  .fl-list{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:0 0 22px}
  .fl-card{border:0;background:var(--tile);color:var(--ink);border-radius:18px;padding:0;width:220px;overflow:hidden;cursor:pointer;font:inherit;text-align:left;box-shadow:0 0 0 2px transparent;transition:box-shadow .15s, transform .15s}
  .fl-card:hover{transform:translateY(-2px)}
  .fl-card.on{box-shadow:0 0 0 3px var(--link)}
  .fl-card img{display:block;width:100%;aspect-ratio:11/8;object-fit:cover;background:#111}
  .fl-card b{display:block;font-size:15px;padding:10px 12px 2px}
  .fl-card span{display:block;font-size:12px;color:var(--ink2);padding:0 12px 12px}
  .fl-stage{position:relative;width:min(880px,100%);margin:0 auto;border-radius:18px;overflow:hidden;background:#000;box-shadow:0 20px 50px rgba(0,0,0,.25)}
  .fl-stage ruffle-player{display:block;width:100%;height:100%}
  .fl-stage:fullscreen{border-radius:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  .fl-msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#d2d2d7;font-size:15px;padding:20px;text-align:center}
  .fl-bar{display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;margin-top:14px;color:var(--ink2);font-size:14px}
  .fl-bar button{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:980px;font:inherit;font-size:14px;padding:8px 16px;cursor:pointer}
  .fl-about{color:var(--ink2);font-size:15px;margin:12px auto 0;max-width:560px}`;

  let root, stage, bar, about, player = null, current = null, loading = null, shown = false;

  function loadRuffle() {
    if (window.RufflePlayer && window.RufflePlayer.newest) return Promise.resolve();
    if (loading) return loading;
    window.RufflePlayer = window.RufflePlayer || {};
    // no "Click to unmute" banner, no Ruffle splash; fit the game in the box
    window.RufflePlayer.config = { autoplay: 'on', unmuteOverlay: 'hidden', splashScreen: false, letterbox: 'on', contextMenu: 'rightClickOnly', warnOnUnsupportedContent: false, showSwfDownload: false };
    loading = RUFFLE.reduce((p, src) => p.catch(() => new Promise((ok, bad) => {
      const s = document.createElement('script'); s.src = src; s.crossOrigin = 'anonymous';
      s.onload = () => (window.RufflePlayer && window.RufflePlayer.newest ? ok() : bad()); s.onerror = bad;
      document.head.appendChild(s);
    })), Promise.reject());
    loading.catch(() => { loading = null; });
    return loading;
  }

  function msg(t) { if (!stage) return; stage.querySelectorAll('.fl-msg').forEach(n => n.remove()); if (t) { const m = document.createElement('div'); m.className = 'fl-msg'; m.textContent = t; stage.appendChild(m); } }

  function unload() {
    if (player) { try { player.remove(); } catch (e) {} player = null; }
  }

  function play(g) {
    current = g;
    try { localStorage.setItem('mb_flash_last', g.id); } catch (e) {}
    root.querySelectorAll('.fl-card').forEach(c => c.classList.toggle('on', c.dataset.id === g.id));
    stage.style.aspectRatio = g.w + ' / ' + g.h;
    stage.style.width = `min(880px, 100%, calc((100vh - 230px) * ${(g.w / g.h).toFixed(4)}))`;   // fits on screen
    about.textContent = g.about || '';
    bar.querySelector('.fl-credit').textContent = `${g.title} by ${g.by}${g.year ? ' (' + g.year + ')' : ''}`;
    unload(); msg('Loading the game…');
    loadRuffle().then(() => {
      if (current !== g || !shown) return;
      player = window.RufflePlayer.newest().createPlayer();
      stage.appendChild(player);
      player.ruffle().load({ url: g.swf, allowScriptAccess: false }).then(() => msg('')).catch(() => msg('This game couldn\'t load. Try reloading the page.'));
      setTimeout(() => { if (player && current === g) msg(''); }, 4000);
    }).catch(() => msg('Couldn\'t load the Flash player. Check your connection and try again.'));
  }

  function init(r) {
    root = r;
    if (!document.getElementById('fl-css')) { const st = document.createElement('style'); st.id = 'fl-css'; st.textContent = CSS; document.head.appendChild(st); }
    root.innerHTML = `<div class="fl-list"></div><div class="fl-stage"></div>
      <div class="fl-bar"><span class="fl-credit"></span><button class="fl-full">⤢ Full screen</button><button class="fl-restart">↻ Restart</button></div>
      <p class="fl-about"></p>`;
    stage = root.querySelector('.fl-stage'); bar = root.querySelector('.fl-bar'); about = root.querySelector('.fl-about');
    const list = root.querySelector('.fl-list');
    GAMES.forEach(g => {
      const b = document.createElement('button'); b.className = 'fl-card'; b.dataset.id = g.id; b.type = 'button';
      const im = new Image(); im.src = g.cover; im.alt = ''; im.loading = 'lazy';
      const t = document.createElement('b'); t.textContent = g.title;
      const s = document.createElement('span'); s.textContent = 'by ' + g.by;
      b.append(im, t, s); b.onclick = () => play(g);
      list.appendChild(b);
    });
    if (GAMES.length < 2) list.style.display = 'none';
    bar.querySelector('.fl-full').onclick = () => { try { (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage); } catch (e) {} };
    bar.querySelector('.fl-restart').onclick = () => { if (current) play(current); };
  }
  // start when the Flash tab is opened; stop (and silence) when leaving it
  function show() {
    shown = true;
    if (player) return;
    let last = null; try { last = localStorage.getItem('mb_flash_last'); } catch (e) {}
    play(current || GAMES.find(g => g.id === last) || GAMES[0]);
  }
  function hide() { shown = false; if (!root) return; unload(); msg(''); }

  window.MBFlash = { init, show, hide };
})();
