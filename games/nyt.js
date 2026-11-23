/* Daily puzzles in the style of the NYT games: Connections, Strands, the Mini and the Crossword.
   One puzzle per game per day (New York midnight), Lucky Packs for solving, and a shared leaderboard.
   Puzzle data lives in puzzles-data.js and loads the first time one of these games opens. */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const START = Date.UTC(2026, 10, 22);
  function nyToday() {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const [y, m, d] = p.split('-').map(Number); return Date.UTC(y, m - 1, d);
  }
  const dayNo = () => Math.floor((nyToday() - START) / 864e5) + 1;
  const msLeft = () => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const g = t => +p.find(x => x.type === t).value; return Math.max(0, ((23 - g('hour')) * 3600 + (59 - g('minute')) * 60 + (60 - g('second'))) * 1000); };
  const nextIn = () => { const l = msLeft(); return `${Math.floor(l / 36e5)}h ${Math.floor(l / 6e4) % 60}m`; };
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function rng(seed) { let x = seed | 0; return () => { x = Math.imul(x ^ x >>> 15, 2246822507) + 0x9E3779B9 | 0; return (x >>> 0) / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  let loading = null;
  function data(cb) {
    if (window.MB_PUZ) return cb(window.MB_PUZ);
    if (!loading) {
      loading = [];
      const sc = document.createElement('script'); sc.src = 'games/puzzles-data.js?v=1';
      sc.onload = () => loading.forEach(f => f(window.MB_PUZ));
      sc.onerror = () => { loading.forEach(f => f(null)); loading = null; };
      document.head.appendChild(sc);
    }
    loading.push(cb);
  }

  const CSS = `
  .pz{max-width:560px;margin:0 auto;text-align:center;user-select:none;-webkit-user-select:none}
  .pz-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;gap:8px}
  .pz-top b{font-size:22px} .pz-top small{color:var(--ink2)}
  .pz-msg{min-height:24px;font-weight:700;margin:6px 0}
  .pz-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0}
  .pz-btn{border:1px solid var(--line);border-radius:980px;background:transparent;color:var(--ink);font:inherit;font-weight:700;padding:9px 18px;cursor:pointer}
  .pz-btn.main{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .pz-btn:disabled{opacity:.4;cursor:default}
  .pz-done{background:var(--tile);border-radius:20px;padding:16px;margin:12px 0}
  .pz-done h3{margin:0 0 6px}
  .pz-board{background:var(--tile);border-radius:20px;padding:14px 16px;margin-top:16px;text-align:left}
  .pz-board h5{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)}
  .pz-board ol{margin:0;padding-left:22px;font-size:15px} .pz-board li{margin:4px 0}
  .pz-board .empty{color:var(--ink2);font-size:14px;margin:0}
  .pz-name{display:flex;gap:8px;justify-content:center;margin:8px 0}
  .pz-name input{font:inherit;font-size:15px;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:180px}
  /* Connections */
  .cn-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .cn-t{aspect-ratio:1.6;border:0;border-radius:10px;background:#efefe6;color:#121212;font:inherit;font-weight:800;font-size:clamp(10px,3.1vw,16px);cursor:pointer;padding:2px;word-break:break-word;transition:transform .1s}
  .cn-t.sel{background:#5a594e;color:#fff}
  .cn-t:active{transform:scale(.96)}
  .cn-row{grid-column:1/-1;border-radius:10px;padding:12px 8px;color:#121212;animation:cnPop .35s ease}
  .cn-row b{display:block;font-size:15px;text-transform:uppercase} .cn-row span{font-size:14px}
  .cn-0{background:#f9df6d}.cn-1{background:#a0c35a}.cn-2{background:#b0c4ef}.cn-3{background:#ba81c5}
  .cn-dots{display:flex;gap:6px;justify-content:center;align-items:center;margin:12px 0;font-size:14px;color:var(--ink2)}
  .cn-dots i{width:12px;height:12px;border-radius:50%;background:#5a594e;display:inline-block}
  .cn-grid.shake{animation:dleShake2 .4s}
  @keyframes cnPop{0%{transform:scale(.9);opacity:.4}100%{transform:scale(1);opacity:1}}
  @keyframes dleShake2{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  /* Strands */
  .st-theme{background:#c0ddd9;color:#121212;border-radius:14px;padding:8px 14px;margin:0 auto 10px;display:inline-block}
  .st-theme small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
  .st-theme b{font-size:18px}
  .st-cur{min-height:30px;font-size:22px;font-weight:800;letter-spacing:.08em}
  .st-wrap{position:relative;width:min(100%,360px);margin:0 auto;touch-action:none}
  .st-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;position:relative;z-index:1}
  .st-c{aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:clamp(16px,5vw,22px);cursor:pointer;color:var(--ink)}
  .st-c.sel{background:#d5d5c8;color:#121212}
  .st-c.f{background:#aedfee;color:#121212} .st-c.s{background:#f8cd05;color:#121212}
  .st-c.h{box-shadow:inset 0 0 0 2px #2f6f8f}
  .st-svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
  .st-meta{display:flex;justify-content:center;gap:10px;align-items:center;margin:10px 0;color:var(--ink2);font-size:14px}
  .st-meter{display:inline-flex;gap:3px} .st-meter i{width:10px;height:10px;border-radius:50%;background:var(--line);display:inline-block} .st-meter i.on{background:#2f6f8f}
  /* Crossword */
  .xw-clue{background:#a7d8ff;color:#121212;border-radius:12px;padding:10px 12px;font-weight:700;min-height:22px;margin:0 0 10px;display:flex;gap:8px;align-items:center;text-align:left}
  .xw-clue button{border:0;background:transparent;font-size:20px;cursor:pointer;color:#121212;padding:0 4px}
  .xw-clue span{flex:1}
  .xw-grid{display:grid;margin:0 auto;border:2px solid #121212;width:min(100%,var(--w));background:#121212;gap:1px}
  .xw-c{aspect-ratio:1;background:#fff;color:#121212;position:relative;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs);cursor:pointer}
  .xw-c.b{background:#121212;cursor:default}
  .xw-c.w{background:#a7d8ff} .xw-c.cur{background:#ffda00}
  .xw-c.bad{color:#d00} .xw-c.rev{color:#2860d8}
  .xw-c sup{position:absolute;top:1px;left:2px;font-size:calc(var(--fs) * .38);font-weight:500;line-height:1}
  .xw-lists{display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:left;margin-top:14px;font-size:14px}
  .xw-lists h5{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)}
  .xw-lists div p{margin:0;padding:4px 6px;border-radius:6px;cursor:pointer} .xw-lists p.on{background:#a7d8ff;color:#121212} .xw-lists p.ok{color:var(--ink2);text-decoration:line-through}
  .xw-time{font-variant-numeric:tabular-nums}
  .pz-kb{display:flex;flex-direction:column;gap:6px;align-items:center;margin-top:12px}
  .pz-kb div{display:flex;gap:5px;width:100%;justify-content:center}
  .pz-kb button{flex:1;max-width:42px;height:50px;border:0;border-radius:8px;background:var(--tile);color:var(--ink);font:inherit;font-weight:700;font-size:15px;cursor:pointer;padding:0}
  .pz-kb button.wide{max-width:64px;font-size:12px}
  @media (max-width:520px){.xw-lists{grid-template-columns:1fr}}`;
  function css() { if (!document.getElementById('pz-css')) { const s = document.createElement('style'); s.id = 'pz-css'; s.textContent = CSS; document.head.appendChild(s); } }

  // ---------- shared daily plumbing: state, rewards, leaderboard, share ----------
  function Daily(game, label, opts) {
    const D = { game, label, day: 0, st: null, root: null, shown: false, P: null };
    D.key = () => `mb_pz_${game}_${D.day}`;
    D.load = (all) => {
      D.day = dayNo(); const list = all[opts.list]; D.P = list[((D.day - 1) % list.length + list.length) % list.length];
      D.st = LS.get(D.key(), null) || opts.fresh();
    };
    D.save = () => LS.set(D.key(), D.st);
    D.reward = (n, why) => { if (D.st.rewarded || n <= 0) return; D.st.rewarded = true; D.save(); window.dispatchEvent(new CustomEvent('mb:pack', { detail: { lucky: true, count: n, why } })); };
    D.post = () => {
      if (D.st.posted || !window.MB_API || !D.st.done) return;
      const name = String(LS.get('mb_flappy_name', '') || '').slice(0, 16); if (!name) return;
      let dev = null; try { dev = localStorage.getItem('mb_voter'); } catch (e) {}
      if (!dev) { dev = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', dev); } catch (e) {} }
      fetch(window.MB_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'daily', game, day: D.day, name, score: opts.score(D.st), solved: !!D.st.won, voter: dev }) })
        .then(r => r.json()).then(d => { if (d.ok) { D.st.posted = true; D.save(); D.showBoard(d.results || []); } }).catch(() => {});
    };
    D.board = () => `<div class="pz-board"><h5>Today's leaderboard</h5><div class="pz-lb"><p class="empty">Loading…</p></div></div>`;
    D.fetchBoard = () => { if (!window.MB_API) return D.showBoard(null); fetch(window.MB_API + `?action=daily&game=${game}&day=${D.day}`).then(r => r.json()).then(d => D.showBoard(d.ok ? d.results || [] : null)).catch(() => D.showBoard(null)); };
    D.showBoard = (list) => {
      const box = D.root && D.root.querySelector('.pz-lb'); if (!box) return;
      if (!list) { box.innerHTML = '<p class="empty">Couldn\'t load the leaderboard.</p>'; return; }
      if (!list.length) { box.innerHTML = `<p class="empty">Nobody has finished today's ${label} yet.${D.st.done ? '' : ' Be the first!'}</p>`; return; }
      const ok = list.filter(r => r.solved).sort((a, b) => a.score - b.score || a.t - b.t), bad = list.filter(r => !r.solved);
      box.innerHTML = `<ol>${ok.map(r => `<li><b>${esc(r.name)}</b> · ${opts.fmt(r.score)}</li>`).join('')}</ol>` +
        (bad.length ? `<p class="empty" style="margin-top:6px">❌ Didn't get it: ${bad.map(r => esc(r.name)).join(', ')}</p>` : '') +
        (D.st.done ? '' : '<p class="empty" style="margin-top:6px">Finish today\'s puzzle to get on the board.</p>');
    };
    D.doneBox = (title, line, shareText) => {
      const html = `<div class="pz-done"><h3>${title}</h3><div>${line}</div>
        <div class="pz-name">${LS.get('mb_flappy_name', '') ? '' : '<input class="pz-nm" maxlength="16" placeholder="Your name for the leaderboard"><button class="pz-btn pz-save">Save</button>'}</div>
        <div class="pz-btns"><button class="pz-btn main pz-share">📋 Copy result</button></div>
        <p style="color:var(--ink2);font-size:13px;margin:6px 0 0">Next puzzle in ${nextIn()}</p></div>`;
      setTimeout(() => {
        const sh = D.root.querySelector('.pz-share');
        if (sh) sh.onclick = () => {
          const ok = () => { sh.textContent = '✅ Copied! Paste it in Discord'; };
          const fb = () => { const t = document.createElement('textarea'); t.value = shareText; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { sh.textContent = 'Couldn\'t copy'; } t.remove(); };
          try { navigator.clipboard.writeText(shareText).then(ok, fb); } catch (e) { fb(); }
        };
        const sv = D.root.querySelector('.pz-save');
        if (sv) sv.onclick = () => { const v = D.root.querySelector('.pz-nm').value.trim().slice(0, 16); if (!v) return; LS.set('mb_flappy_name', v); D.st.posted = false; D.save(); D.post(); sv.parentNode.innerHTML = ''; };
      });
      return html;
    };
    D.msg = (t, keep) => { const m = D.root.querySelector('.pz-msg'); if (!m) return; m.textContent = t; if (!keep) setTimeout(() => { if (m.textContent === t) m.textContent = ''; }, 1800); };
    D.api = {
      init(r) { css(); D.root = r; if (opts.onKey) addEventListener('keydown', e => { if (!D.shown || !D.st || e.ctrlKey || e.metaKey || e.altKey) return; const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA') return; opts.onKey(e); }); },
      show() {
        D.shown = true; if (!D.st) D.root.innerHTML = '<p class="empty" style="text-align:center">Loading puzzle…</p>';
        data(all => {
          if (!D.shown) return;
          if (!all) { D.root.innerHTML = '<p style="text-align:center">Couldn\'t load today\'s puzzle. Try reloading.</p>'; return; }
          if (!D.st || D.day !== dayNo()) D.load(all);
          opts.draw(); D.fetchBoard(); if (opts.onShow) opts.onShow();
        });
      },
      hide() { D.shown = false; if (opts.onHide) opts.onHide(); },
      _d: D
    };
    return D;
  }

  // ================================ CONNECTIONS ================================
  const EMO = ['🟨', '🟩', '🟦', '🟪'];
  let cSel = [];
  const CN = Daily('conn', 'Connections', {
    list: 'conn', fresh: () => ({ found: [], guesses: [], mistakes: 0, done: false, won: false, rewarded: false, posted: false, order: null }),
    score: st => st.mistakes, fmt: s => s === 0 ? 'perfect 🔥' : `${s} mistake${s > 1 ? 's' : ''}`,
    draw: cnDraw
  });
  const groupOf = w => CN.P.findIndex(g => g[1].includes(w));
  function cnDraw() {
    const D = CN, st = D.st;
    if (!st.order) { st.order = shuffle(D.P.flatMap(g => g[1]), rng(D.day * 7 + 1)); D.save(); }
    const left = st.order.filter(w => !st.found.includes(groupOf(w)));
    const rows = st.found.map(g => `<div class="cn-row cn-${g}"><b>${esc(D.P[g][0])}</b><span>${D.P[g][1].map(esc).join(', ')}</span></div>`).join('');
    const tiles = st.done ? '' : left.map(w => `<button class="cn-t${cSel.includes(w) ? ' sel' : ''}" data-w="${esc(w)}">${esc(w)}</button>`).join('');
    D.root.innerHTML = `<div class="pz">
      <div class="pz-top"><b>🔗 Connections</b><small>#${D.day}</small></div>
      <p style="margin:0 0 10px;color:var(--ink2)">Make 4 groups of 4!</p>
      <div class="cn-grid">${rows}${tiles}</div>
      <p class="pz-msg"></p>
      ${st.done ? cnDone() : `<div class="cn-dots">Mistakes left: ${'<i></i>'.repeat(4 - st.mistakes)}</div>
      <div class="pz-btns"><button class="pz-btn cn-sh">Shuffle</button><button class="pz-btn cn-de">Deselect all</button><button class="pz-btn main cn-go"${cSel.length === 4 ? '' : ' disabled'}>Submit</button></div>`}
      ${D.board()}</div>`;
    D.root.querySelectorAll('.cn-t').forEach(b => b.onclick = () => {
      const w = b.dataset.w; if (cSel.includes(w)) cSel = cSel.filter(x => x !== w); else if (cSel.length < 4) cSel.push(w);
      b.classList.toggle('sel', cSel.includes(w)); D.root.querySelector('.cn-go').disabled = cSel.length !== 4;
    });
    const q = s => D.root.querySelector(s);
    if (q('.cn-sh')) q('.cn-sh').onclick = () => { const lft = st.order.filter(w => !st.found.includes(groupOf(w))); const sh = shuffle(lft, Math.random); st.order = st.order.filter(w => st.found.includes(groupOf(w))).concat(sh); D.save(); cnDraw(); D.fetchBoard(); };
    if (q('.cn-de')) q('.cn-de').onclick = () => { cSel = []; cnDraw(); D.fetchBoard(); };
    if (q('.cn-go')) q('.cn-go').onclick = cnSubmit;
  }
  function cnSubmit() {
    const D = CN, st = D.st; if (cSel.length !== 4 || st.done) return;
    const key = cSel.slice().sort().join('|');
    if (st.guesses.some(g => g.slice().sort().join('|') === key)) return D.msg('Already guessed!');
    st.guesses.push(cSel.slice());
    const gs = cSel.map(groupOf), counts = {}; gs.forEach(g => counts[g] = (counts[g] || 0) + 1);
    const best = Math.max(...Object.values(counts));
    if (best === 4) { st.found.push(gs[0]); cSel = []; }
    else {
      st.mistakes++;
      const grid = D.root.querySelector('.cn-grid'); grid.classList.remove('shake'); void grid.offsetWidth; grid.classList.add('shake');
    }
    if (st.found.length === 4) { st.done = true; st.won = true; }
    else if (st.mistakes >= 4) { st.done = true; st.won = false; for (let g = 0; g < 4; g++) if (!st.found.includes(g)) st.found.push(g); cSel = []; }
    D.save();
    const wasOneAway = best === 3 && !st.done;
    setTimeout(() => {
      cnDraw(); D.fetchBoard();
      if (wasOneAway) D.msg('One away…'); else if (best < 4 && !st.done) D.msg('Nope!');
      if (st.done) { if (st.won) D.reward(st.mistakes === 0 ? 3 : st.mistakes <= 2 ? 2 : 1, `solving Connections #${D.day}`); D.post(); }
    }, best === 4 ? 0 : 420);
  }
  function cnDone() {
    const D = CN, st = D.st, n = st.mistakes === 0 ? 3 : st.mistakes <= 2 ? 2 : 1;
    const grid = st.guesses.map(g => g.map(w => EMO[groupOf(w)]).join('')).join('\n');
    return D.doneBox(st.won ? (st.mistakes === 0 ? '🤯 Perfect!' : st.mistakes <= 2 ? '🔥 Great!' : '😅 Phew!') : '🙈 Next time!',
      st.won ? `Solved with ${st.mistakes} mistake${st.mistakes === 1 ? '' : 's'} · +${n} 🍀 Lucky Pack${n > 1 ? 's' : ''}` : 'Out of mistakes. The groups are above.',
      `Connections #${D.day} 🐒\n${grid}\nmonkeyboyz.cool`);
  }

  // ================================== STRANDS ==================================
  let sPath = [], sDrag = false, sMoved = false;
  const SN = Daily('strands', 'Strands', {
    list: 'strands', fresh: () => ({ found: [], bonus: [], hints: 0, earned: 0, hinted: [], order: [], done: false, won: false, rewarded: false, posted: false }),
    score: st => st.hints, fmt: s => s === 0 ? 'no hints 🔥' : `${s} hint${s > 1 ? 's' : ''}`,
    draw: stDraw
  });
  const adj = (a, b) => a !== b && Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) <= 1 && Math.abs(a % 6 - b % 6) <= 1;
  function stDraw() {
    const D = SN, st = D.st, P = D.P, g = P.g.join('');
    const total = Object.keys(P.w).length;
    const cellWord = {}; st.found.forEach(w => P.w[w].forEach(i => cellWord[i] = w));
    const hintCells = new Set(); st.hinted.filter(w => !st.found.includes(w)).forEach(w => P.w[w].forEach(i => hintCells.add(i)));
    const avail = st.earned - st.hints, meter = st.bonus.length % 3;
    D.root.innerHTML = `<div class="pz">
      <div class="pz-top"><b>🧵 Strands</b><small>#${D.day}</small></div>
      <div class="st-theme"><small>Today's theme</small><b>${esc(P.clue)}</b></div>
      <div class="st-cur">${st.done ? '' : sPath.map(i => g[i]).join('')}</div>
      <div class="st-wrap"><svg class="st-svg"></svg><div class="st-grid">${[...g].map((ch, i) => `<div class="st-c${cellWord[i] ? (cellWord[i] === P.span ? ' s' : ' f') : sPath.includes(i) ? ' sel' : ''}${hintCells.has(i) ? ' h' : ''}" data-i="${i}">${ch}</div>`).join('')}</div></div>
      <p class="pz-msg"></p>
      ${st.done ? stDone() : `<div class="st-meta"><span>${st.found.length} of ${total} theme words found</span></div>
      <div class="pz-btns"><button class="pz-btn st-hint"${avail > 0 ? '' : ' disabled'}>💡 Hint${avail > 0 ? ` (${avail})` : ''}</button>
      <span class="st-meter" title="Find 3 other words to earn a hint">${[0, 1, 2].map(k => `<i class="${k < meter ? 'on' : ''}"></i>`).join('')}</span></div>
      <p style="color:var(--ink2);font-size:13px;margin:0">Drag or tap letters, then tap the last letter again to submit. Every 3 non-theme words earns a hint. The <b style="color:#c9a000">spangram</b> touches two opposite sides.</p>`}
      ${D.board()}</div>`;
    stLines();
    if (st.done) return;
    const wrap = D.root.querySelector('.st-wrap');
    const cellAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.classList.contains('st-c') ? +el.dataset.i : null; };
    wrap.onpointerdown = e => {
      const i = cellAt(e.clientX, e.clientY); if (i == null) return; e.preventDefault();
      sDrag = true; sMoved = false;
      if (sPath.length && sPath[sPath.length - 1] === i) { stSubmit(); sDrag = false; return; }
      const k = sPath.indexOf(i);
      if (k >= 0) sPath = sPath.slice(0, k + 1);
      else if (sPath.length && adj(sPath[sPath.length - 1], i)) sPath.push(i);
      else sPath = [i];
      stPaint();
    };
    wrap.onpointermove = e => {
      if (!sDrag) return; const i = cellAt(e.clientX, e.clientY); if (i == null) return;
      const last = sPath[sPath.length - 1];
      if (i === last) return;
      if (sPath.length > 1 && i === sPath[sPath.length - 2]) { sPath.pop(); sMoved = true; stPaint(); return; }
      if (!sPath.includes(i) && adj(last, i)) {
        // only add when the pointer is near the cell center, so diagonals are easy
        const r = D.root.querySelector(`.st-c[data-i="${i}"]`).getBoundingClientRect();
        if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * 0.42) { sPath.push(i); sMoved = true; stPaint(); }
      }
    };
    wrap.onpointerup = () => { if (sDrag && sMoved && sPath.length > 1) stSubmit(); sDrag = false; };
    wrap.onpointerleave = () => { if (sDrag && sMoved && sPath.length > 1) stSubmit(); sDrag = false; };
    const hb = D.root.querySelector('.st-hint');
    if (hb) hb.onclick = () => {
      if (st.earned - st.hints <= 0) return;
      const next = Object.keys(P.w).find(w => w !== P.span && !st.found.includes(w) && !st.hinted.includes(w)) || Object.keys(P.w).find(w => !st.found.includes(w) && !st.hinted.includes(w));
      if (!next) return D.msg('Hint already showing');
      st.hints++; st.hinted.push(next); D.save(); stDraw(); D.fetchBoard();
    };
  }
  function stPaint() {
    const D = SN, g = D.P.g.join('');
    D.root.querySelectorAll('.st-c').forEach(c => { const i = +c.dataset.i; if (!c.classList.contains('f') && !c.classList.contains('s')) c.classList.toggle('sel', sPath.includes(i)); });
    const cur = D.root.querySelector('.st-cur'); if (cur) cur.textContent = sPath.map(i => g[i]).join('');
    stLines();
  }
  function stLines() {
    const D = SN, P = D.P, svg = D.root.querySelector('.st-svg'), wrap = D.root.querySelector('.st-wrap'); if (!svg || !wrap) return;
    const box = wrap.getBoundingClientRect(); if (!box.width) return;
    const ctr = i => { const r = D.root.querySelector(`.st-c[data-i="${i}"]`).getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; };
    const line = (path, col, w) => path.length > 1 ? `<polyline points="${path.map(i => ctr(i).join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const cw = box.width / 6 * 0.28;
    svg.innerHTML = D.st.found.map(w => line(P.w[w], w === P.span ? '#f8cd05' : '#aedfee', cw)).join('') + (D.st.done ? '' : line(sPath, '#d5d5c8', cw));
  }
  function stSubmit() {
    const D = SN, st = D.st, P = D.P, g = P.g.join(''), word = sPath.map(i => g[i]).join('');
    const path = sPath; sPath = [];
    if (word.length < 4) { stPaint(); return D.msg('Too short'); }
    const hit = Object.keys(P.w).find(w => w === word && P.w[w].slice().sort((a, b) => a - b).join() === path.slice().sort((a, b) => a - b).join());
    if (hit) {
      if (st.found.includes(hit)) { stPaint(); return D.msg('Already found'); }
      st.found.push(hit); st.order.push(hit === P.span ? 's' : 'f');
      if (st.found.length === Object.keys(P.w).length) { st.done = true; st.won = true; }
      D.save(); stDraw(); D.fetchBoard();
      D.msg(hit === P.span ? '🟡 SPANGRAM!' : ['Nice!', 'Good one!', 'Great find!'][st.found.length % 3]);
      if (st.done) { D.reward(st.hints === 0 ? 3 : st.hints <= 2 ? 2 : 1, `solving Strands #${D.day}`); D.post(); }
      return;
    }
    if (Object.keys(P.w).includes(word)) { stPaint(); return D.msg('Right word, different letters!'); }
    if (P.b.includes(word)) {
      if (st.bonus.includes(word)) { stPaint(); return D.msg('Already found'); }
      st.bonus.push(word); if (st.bonus.length % 3 === 0) st.earned++; st.order.push('b');
      D.save(); stDraw(); D.fetchBoard(); return D.msg(st.bonus.length % 3 === 0 ? '💡 Hint earned!' : 'Not a theme word');
    }
    stPaint(); D.msg('Not in word list');
  }
  function stDone() {
    const D = SN, st = D.st, n = st.hints === 0 ? 3 : st.hints <= 2 ? 2 : 1;
    const em = '💡'.repeat(st.hints) + st.order.filter(x => x !== 'b').map(x => x === 's' ? '🟡' : '🔵').join('');
    return D.doneBox(st.hints === 0 ? '🤯 Perfect!' : '🔥 Solved!', `Theme: <b>${esc(D.P.clue)}</b> · ${st.hints} hint${st.hints === 1 ? '' : 's'} · +${n} 🍀 Lucky Pack${n > 1 ? 's' : ''}`,
      `Strands #${D.day} 🐒\n“${D.P.clue}”\n${em.match(/.{1,8}/gu).join('\n')}\nmonkeyboyz.cool`);
  }

  // ================================= CROSSWORDS ================================
  function Crossword(game, label, icon, packsFor) {
    let cur = 0, dir = 'a', timer = null;
    const X = Daily(game, label, {
      list: game, fresh: () => ({ fill: {}, secs: 0, done: false, won: false, revealed: false, checked: false, rewarded: false, posted: false }),
      score: st => st.secs, fmt: s => fmtTime(s), draw, onKey, onShow: startTimer, onHide: stopTimer
    });
    const N = () => X.P.g.length, ch = i => X.P.g[Math.floor(i / N())][i % N()], black = i => ch(i) === '#';
    function words() {
      const n = N(), out = [];
      X.P.a.forEach(([num, r, c, clue]) => { const cells = []; for (let k = c; k < n && X.P.g[r][k] !== '#'; k++) cells.push(r * n + k); out.push({ d: 'a', num, clue, cells }); });
      X.P.d.forEach(([num, r, c, clue]) => { const cells = []; for (let k = r; k < n && X.P.g[k][c] !== '#'; k++) cells.push(k * n + c); out.push({ d: 'd', num, clue, cells }); });
      return out;
    }
    let W = [];
    const wordAt = (i, d) => W.find(w => w.d === d && w.cells.includes(i));
    function startTimer() { stopTimer(); if (X.st.done) return; timer = setInterval(() => { if (document.hidden) return; X.st.secs++; if (X.st.secs % 5 === 0) X.save(); const t = X.root.querySelector('.xw-time'); if (t) t.textContent = fmtTime(X.st.secs); }, 1000); }
    function stopTimer() { if (timer) clearInterval(timer); timer = null; if (X.st) X.save(); }
    function draw() {
      W = words(); const n = N(), st = X.st;
      if (black(cur)) cur = [...Array(n * n).keys()].find(i => !black(i));
      if (!wordAt(cur, dir)) dir = dir === 'a' ? 'd' : 'a';
      const w = wordAt(cur, dir), nums = {}; W.forEach(x => nums[x.cells[0]] = x.num);
      const fs = n <= 5 ? 'clamp(20px,7vw,34px)' : 'clamp(13px,4.2vw,22px)';
      X.root.innerHTML = `<div class="pz">
        <div class="pz-top"><b>${icon} ${label}</b><small>#${X.day} · <span class="xw-time">${fmtTime(st.secs)}</span></small></div>
        ${st.done ? '' : `<div class="xw-clue"><button class="xw-prev">‹</button><span>${w ? `<b>${w.num}${w.d === 'a' ? 'A' : 'D'}</b> ${esc(w.clue)}` : ''}</span><button class="xw-next">›</button></div>`}
        <div class="xw-grid" style="grid-template-columns:repeat(${n},1fr);--w:${n <= 5 ? 330 : 470}px;--fs:${fs}">${[...Array(n * n).keys()].map(i => black(i) ? '<div class="xw-c b"></div>' :
          `<div class="xw-c${!st.done && i === cur ? ' cur' : !st.done && w && w.cells.includes(i) ? ' w' : ''}${st.bad && st.bad.includes(i) && st.fill[i] ? ' bad' : ''}${st.revealed ? ' rev' : ''}" data-i="${i}">${nums[i] ? `<sup>${nums[i]}</sup>` : ''}${st.fill[i] || ''}</div>`).join('')}</div>
        <p class="pz-msg"></p>
        ${st.done ? doneBox() : `<div class="pz-kb">${['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, k) => `<div>${k === 2 ? '<button data-k="DIR" class="wide">↻</button>' : ''}${[...row].map(c => `<button data-k="${c}">${c}</button>`).join('')}${k === 2 ? '<button data-k="BACK" class="wide">⌫</button>' : ''}</div>`).join('')}</div>
        <div class="pz-btns"><button class="pz-btn xw-check">Check</button><button class="pz-btn xw-reveal">Reveal</button></div>`}
        <div class="xw-lists">${['a', 'd'].map(d => `<div><h5>${d === 'a' ? 'Across' : 'Down'}</h5>${W.filter(x => x.d === d).map(x => `<p class="${!st.done && w === x ? 'on' : ''}${x.cells.every(i => st.fill[i] === ch(i)) && st.done ? '' : ''}" data-w="${W.indexOf(x)}"><b>${x.num}</b> ${esc(x.clue)}</p>`).join('')}</div>`).join('')}</div>
        ${X.board()}</div>`;
      const q = s => X.root.querySelector(s);
      X.root.querySelectorAll('.xw-c:not(.b)').forEach(c => c.onclick = () => { const i = +c.dataset.i; if (X.st.done) return; if (i === cur) dir = dir === 'a' ? 'd' : 'a'; cur = i; draw(); X.fetchBoard(); });
      X.root.querySelectorAll('.xw-lists p').forEach(p => p.onclick = () => { if (X.st.done) return; const x = W[+p.dataset.w]; dir = x.d; cur = x.cells.find(i => !X.st.fill[i]) ?? x.cells[0]; draw(); X.fetchBoard(); });
      X.root.querySelectorAll('.pz-kb button').forEach(b => b.onclick = () => key(b.dataset.k));
      if (q('.xw-prev')) { q('.xw-prev').onclick = () => jump(-1); q('.xw-next').onclick = () => jump(1); }
      if (q('.xw-check')) q('.xw-check').onclick = () => { X.st.checked = true; X.st.bad = Object.keys(X.st.fill).map(Number).filter(i => X.st.fill[i] !== ch(i)); X.save(); draw(); X.fetchBoard(); X.msg(X.st.bad.length ? `${X.st.bad.length} wrong square${X.st.bad.length > 1 ? 's' : ''} in red` : 'Everything so far is right ✅'); };
      if (q('.xw-reveal')) q('.xw-reveal').onclick = () => {
        if (!confirmReveal()) return;
        for (let i = 0; i < n * n; i++) if (!black(i)) X.st.fill[i] = ch(i);
        X.st.revealed = true; X.st.done = true; X.st.won = false; X.save(); stopTimer(); draw(); X.fetchBoard(); X.post();
      };
    }
    let revealArmed = 0;
    function confirmReveal() { if (Date.now() - revealArmed < 3000) return true; revealArmed = Date.now(); X.msg('Tap Reveal again to give up (no Lucky Packs)'); return false; }
    function jump(k) { const i = W.indexOf(wordAt(cur, dir)); const x = W[(i + k + W.length) % W.length]; dir = x.d; cur = x.cells.find(c => !X.st.fill[c]) ?? x.cells[0]; draw(); X.fetchBoard(); }
    function key(k) {
      const st = X.st; if (st.done) return; const w = wordAt(cur, dir);
      if (k === 'DIR') { dir = dir === 'a' ? 'd' : 'a'; if (!wordAt(cur, dir)) dir = dir === 'a' ? 'd' : 'a'; }
      else if (k === 'BACK') {
        if (st.fill[cur]) delete st.fill[cur];
        else if (w) { const p = w.cells.indexOf(cur); if (p > 0) { cur = w.cells[p - 1]; delete st.fill[cur]; } }
      } else if (/^[A-Z]$/.test(k)) {
        st.fill[cur] = k; if (st.bad) st.bad = st.bad.filter(i => i !== cur);
        if (w) { const p = w.cells.indexOf(cur); const nxt = w.cells.slice(p + 1).find(i => !st.fill[i]); if (nxt != null) cur = nxt; else if (p < w.cells.length - 1) cur = w.cells[p + 1]; else { const i = W.indexOf(w); const x = W.slice(i + 1).concat(W.slice(0, i)).find(x => x.cells.some(c => !st.fill[c])); if (x) { dir = x.d; cur = x.cells.find(c => !st.fill[c]); } } }
      }
      X.save(); finishCheck(); draw(); X.fetchBoard();
    }
    function finishCheck() {
      const st = X.st, n = N(), cells = [...Array(n * n).keys()].filter(i => !black(i));
      if (!cells.every(i => st.fill[i])) return;
      if (cells.every(i => st.fill[i] === ch(i))) {
        st.done = true; st.won = true; X.save(); stopTimer();
        X.reward(packsFor(st.secs), `solving the ${label} #${X.day} in ${fmtTime(st.secs)}`); X.post();
      } else setTimeout(() => X.msg('Not quite! Something\'s wrong. Try Check.', true));
    }
    function onKey(e) {
      if (X.st.done) return;
      const n = N(), mv = (dr, dc, d) => { e.preventDefault(); if (dir !== d) { dir = d; draw(); X.fetchBoard(); return; } let r = Math.floor(cur / n), c = cur % n; do { r += dr; c += dc; } while (r >= 0 && r < n && c >= 0 && c < n && black(r * n + c)); if (r >= 0 && r < n && c >= 0 && c < n) cur = r * n + c; draw(); X.fetchBoard(); };
      if (e.key === 'ArrowRight') mv(0, 1, 'a'); else if (e.key === 'ArrowLeft') mv(0, -1, 'a');
      else if (e.key === 'ArrowDown') mv(1, 0, 'd'); else if (e.key === 'ArrowUp') mv(-1, 0, 'd');
      else if (e.key === 'Backspace') { e.preventDefault(); key('BACK'); }
      else if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); jump(e.shiftKey ? -1 : 1); }
      else if (e.key === ' ') { e.preventDefault(); key('DIR'); }
      else if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); key(e.key.toUpperCase()); }
    }
    function doneBox() {
      const st = X.st, n = packsFor(st.secs);
      return X.doneBox(st.won ? '🎉 Solved!' : '👀 Revealed', st.won ? `Finished in <b>${fmtTime(st.secs)}</b> · +${n} 🍀 Lucky Pack${n > 1 ? 's' : ''}` : 'Better luck tomorrow.',
        `${label} #${X.day} 🐒\n${st.won ? `Solved in ${fmtTime(st.secs)} ⏱️` : 'Revealed 👀'}\nmonkeyboyz.cool`);
    }
    return X;
  }
  const MINI = Crossword('mini', 'The Mini', '✏️', s => s <= 60 ? 2 : 1);
  const BIG = Crossword('big', 'The Crossword', '📰', s => s <= 300 ? 3 : 2);

  window.MBConn = CN.api; window.MBStrands = SN.api; window.MBMini = MINI.api; window.MBXword = BIG.api;
})();
