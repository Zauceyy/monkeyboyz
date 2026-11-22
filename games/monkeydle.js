/* Monkeydle: Wordle, MonkeyBoyz style. One 5-letter word a day, same for everyone. 6 tries. Solve it for Lucky Packs. */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const START = Date.UTC(2026, 10, 22);  // puzzle #1 = Nov 22, 2026
  function nyToday() {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const [y, m, d] = p.split('-').map(Number); return Date.UTC(y, m - 1, d);
  }
  const dayNo = () => Math.floor((nyToday() - START) / 864e5) + 1;
  // Word lists (real Wordle lists) live in dle-words.js and load the first time Monkeydle opens.
  let W = null, VALID = null;
  function words(cb) {
    if (W) return cb();
    const go = () => { W = window.MB_DLE_WORDS; VALID = new Set(); [W.A, W.G].forEach(t => { for (let i = 0; i < t.length; i += 5) VALID.add(t.substr(i, 5)); }); cb(); };
    if (window.MB_DLE_WORDS) return go();
    const sc = document.createElement('script'); sc.src = 'games/dle-words.js?v=1'; sc.onload = go;
    sc.onerror = () => { if (root) root.innerHTML = '<p class="empty">Couldn\'t load today\'s Monkeydle. Try reloading.</p>'; };
    document.head.appendChild(sc);
  }
  const todays = () => { const n = W.A.length / 5, i = ((dayNo() - 1) % n + n) % n; return W.A.substr(i * 5, 5); };

  const TRIES = 6;
  let root, shown = false, day, word, st, input = '', busy = false;
  const stats = () => LS.get('mb_dle_stats', { played: 0, wins: 0, streak: 0, max: 0, dist: [0, 0, 0, 0, 0, 0], lastWin: 0, lastDay: 0 });

  const CSS = `
  .dle{max-width:520px;margin:0 auto;text-align:center;user-select:none;-webkit-user-select:none}
  .dle-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .dle-top b{font-size:22px}
  .dle-top small{color:var(--ink2)}
  .dle-hint{display:inline-block;background:var(--tile);border-radius:980px;padding:6px 14px;font-size:14px;margin:4px 0 14px}
  .dle-grid{display:grid;gap:6px;justify-content:center;margin:0 auto 16px}
  .dle-row{display:grid;gap:6px}
  .dle-row.shake{animation:dleShake .4s}
  .dle-t{width:var(--sz);height:var(--sz);border:2px solid var(--line);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:calc(var(--sz) * .5);font-weight:800;text-transform:uppercase;color:var(--ink);background:var(--bg);transition:transform .15s}
  .dle-t.on{border-color:var(--ink2);transform:scale(1.06)}
  .dle-t.g,.dle-t.y,.dle-t.x{color:#fff;border-color:transparent;animation:dleFlip .45s ease both}
  .dle-t.g{background:#2ea043} .dle-t.y{background:#d4a017} .dle-t.x{background:#6e7681}
  .dle-row.win .dle-t{animation:dleFlip .45s ease both, dleHop .4s ease both;animation-delay:inherit}
  @keyframes dleFlip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}
  @keyframes dleHop{50%{transform:translateY(-10px)}}
  @keyframes dleShake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  .dle-kb{display:flex;flex-direction:column;gap:6px;align-items:center}
  .dle-kb div{display:flex;gap:5px;width:100%;justify-content:center}
  .dle-kb button{flex:1;max-width:44px;height:54px;border:0;border-radius:8px;background:var(--tile);color:var(--ink);font:inherit;font-weight:700;font-size:15px;cursor:pointer;padding:0}
  .dle-kb button.wide{max-width:70px;font-size:12px}
  .dle-kb button.g{background:#2ea043;color:#fff} .dle-kb button.y{background:#d4a017;color:#fff} .dle-kb button.x{background:#6e7681;color:#fff}
  .dle-msg{min-height:24px;font-weight:700;margin:4px 0 10px}
  .dle-done{background:var(--tile);border-radius:20px;padding:16px;margin:10px 0}
  .dle-done h3{margin:0 0 6px}
  .dle-stats{display:flex;justify-content:center;gap:18px;margin:10px 0}
  .dle-stats div{display:flex;flex-direction:column;font-size:12px;color:var(--ink2)} .dle-stats b{font-size:22px;color:var(--ink)}
  .dle-dist{max-width:300px;margin:8px auto;text-align:left;font-size:13px}
  .dle-dist div{display:flex;align-items:center;gap:6px;margin:3px 0} .dle-dist i{display:block;background:#6e7681;color:#fff;font-style:normal;padding:1px 6px;border-radius:4px;min-width:14px;text-align:right}
  .dle-dist i.me{background:#2ea043}
  .dle-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px}
  .dle-btn{border:0;border-radius:980px;background:#2ea043;color:#fff;font:inherit;font-weight:700;padding:10px 20px;cursor:pointer}
  .dle-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
  .dle-board{background:var(--tile);border-radius:20px;padding:14px 16px;margin-top:16px;text-align:left}
  .dle-board h5{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)}
  .dle-board ol{margin:0;padding-left:22px;font-size:15px} .dle-board li{margin:4px 0}
  .dle-board .empty{color:var(--ink2);font-size:14px;margin:0}
  .dle-name{display:flex;gap:8px;justify-content:center;margin:8px 0}
  .dle-name input{font:inherit;font-size:15px;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:180px}`;
  function css() { if (!document.getElementById('dle-css')) { const s = document.createElement('style'); s.id = 'dle-css'; s.textContent = CSS; document.head.appendChild(s); } }

  // Wordle-style scoring that handles double letters properly
  function score(guess, ans) {
    const res = Array(guess.length).fill('x'), left = {};
    for (let i = 0; i < ans.length; i++) if (guess[i] === ans[i]) res[i] = 'g'; else left[ans[i]] = (left[ans[i]] || 0) + 1;
    for (let i = 0; i < guess.length; i++) if (res[i] !== 'g' && left[guess[i]]) { res[i] = 'y'; left[guess[i]]--; }
    return res;
  }
  function load() {
    day = dayNo(); word = todays();
    st = LS.get('mb_dle5_' + day, null) || { guesses: [], done: false, won: false, rewarded: false, posted: false };
  }
  function save() { LS.set('mb_dle5_' + day, st); }

  function init(r) { css(); root = r; addEventListener('keydown', onKey); }
  function draw(anim) {
    const n = word.length, sz = Math.min(62, Math.floor((Math.min(window.innerWidth, 520) - 40 - (n - 1) * 6) / n));
    const rows = Array.from({ length: TRIES }, (_, r) => {
      const g = st.guesses[r], cur = !st.done && r === st.guesses.length;
      const res = g ? score(g, word) : null, txt = g || (cur ? input : '');
      return `<div class="dle-row${g && st.won && r === st.guesses.length - 1 ? ' win' : ''}" style="grid-template-columns:repeat(${n},var(--sz))">` +
        Array.from({ length: n }, (_, i) => `<div class="dle-t${res ? ' ' + res[i] : txt[i] ? ' on' : ''}" style="${res && anim === r ? `animation-delay:${i * .12}s` : res ? 'animation:none' : ''}">${txt[i] || ''}</div>`).join('') + '</div>';
    }).join('');
    // keyboard colors: best result per letter
    const best = {}; const rank = { g: 3, y: 2, x: 1 };
    st.guesses.forEach(g => score(g, word).forEach((c, i) => { if (!best[g[i]] || rank[c] > rank[best[g[i]]]) best[g[i]] = c; }));
    const key = k => `<button data-k="${k}" class="${best[k] || ''}">${k}</button>`;
    const kb = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, i) => `<div>${i === 2 ? '<button data-k="ENTER" class="wide">ENTER</button>' : ''}${[...row].map(key).join('')}${i === 2 ? '<button data-k="BACK" class="wide">⌫</button>' : ''}</div>`).join('');
    const s = stats();
    root.innerHTML = `<div class="dle" style="--sz:${sz}px">
      <div class="dle-top"><b>🟩 Monkeydle</b><small>#${day}</small></div>
      <div class="dle-grid">${rows}</div>
      <p class="dle-msg"></p>
      ${st.done ? doneBox(s) : `<div class="dle-kb">${kb}</div>`}
      <div class="dle-board"><h5>Today's leaderboard</h5><div class="dle-lb"><p class="empty">Loading…</p></div></div>
    </div>`;
    root.querySelectorAll('.dle-kb button').forEach(b => b.onclick = () => press(b.dataset.k));
    if (st.done) wireDone();
    drawBoard();
  }
  function doneBox(s) {
    const total = s.dist.reduce((a, b) => a + b, 0) || 1, mx = Math.max(1, ...s.dist);
    const left = msLeft(), h = Math.floor(left / 36e5), m = Math.floor(left / 6e4) % 60;
    return `<div class="dle-done">
      <h3>${st.won ? (st.guesses.length <= 2 ? '🤯 Genius!' : st.guesses.length <= 4 ? '🔥 Nice!' : '😅 Phew!') : '🙈 Not today'}</h3>
      <div>${st.won ? `Got it in ${st.guesses.length}/${TRIES}` : `The word was <b>${word}</b>`}${st.won ? ` · +${packsFor(st.guesses.length)} 🍀 Lucky Pack${packsFor(st.guesses.length) > 1 ? 's' : ''}` : ''}</div>
      <div class="dle-stats"><div><b>${s.played}</b>Played</div><div><b>${s.played ? Math.round(s.wins / s.played * 100) : 0}%</b>Won</div><div><b>${s.streak}</b>Streak 🔥</div><div><b>${s.max}</b>Best streak</div></div>
      <div class="dle-dist">${s.dist.map((v, i) => `<div>${i + 1} <i class="${st.won && st.guesses.length === i + 1 ? 'me' : ''}" style="width:${Math.max(6, v / mx * 100)}%">${v}</i></div>`).join('')}</div>
      <div class="dle-name">${LS.get('mb_flappy_name', '') ? '' : '<input class="dle-nm" maxlength="16" placeholder="Your name for the leaderboard"><button class="dle-btn ghost dle-save">Save</button>'}</div>
      <div class="dle-btns"><button class="dle-btn dle-share">📋 Copy result</button></div>
      <p style="color:var(--ink2);font-size:13px;margin:10px 0 0">Next Monkeydle in ${h}h ${m}m</p>
    </div>`;
  }
  function wireDone() {
    const sh = root.querySelector('.dle-share');
    sh.onclick = () => {
      const grid = st.guesses.map(g => score(g, word).map(c => c === 'g' ? '🟩' : c === 'y' ? '🟨' : '⬛').join('')).join('\n');
      const text = `Monkeydle #${day} ${st.won ? st.guesses.length : 'X'}/${TRIES} 🐒\n${grid}\nmonkeyboyz.cool`;
      const ok = () => { sh.textContent = '✅ Copied! Paste it in Discord'; };
      const fallback = () => { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); ok(); } catch (e) { sh.textContent = 'Couldn\'t copy'; } t.remove(); };
      try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
    };
    const sv = root.querySelector('.dle-save');
    if (sv) sv.onclick = () => { const v = root.querySelector('.dle-nm').value.trim().slice(0, 16); if (!v) return; LS.set('mb_flappy_name', v); st.posted = false; save(); post(); draw(); };
  }
  // time until midnight in New York, when the next puzzle unlocks
  const msLeft = () => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const g = t => +p.find(x => x.type === t).value; return Math.max(0, ((23 - g('hour')) * 3600 + (59 - g('minute')) * 60 + (60 - g('second'))) * 1000); };
  const packsFor = n => n <= 2 ? 3 : n <= 4 ? 2 : 1;
  function msg(t, keep) { const m = root.querySelector('.dle-msg'); if (!m) return; m.textContent = t; if (!keep) setTimeout(() => { if (m.textContent === t) m.textContent = ''; }, 1800); }
  function onKey(e) {
    if (!shown || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Enter') { e.preventDefault(); press('ENTER'); }
    else if (e.key === 'Backspace') { e.preventDefault(); press('BACK'); }
    else if (/^[a-z]$/i.test(e.key)) press(e.key.toUpperCase());
  }
  function press(k) {
    if (st.done || busy) return;
    if (k === 'BACK') { input = input.slice(0, -1); return redrawRow(); }
    if (k === 'ENTER') return submit();
    if (input.length < word.length) { input += k; redrawRow(); }
  }
  function redrawRow() {
    const row = root.querySelectorAll('.dle-row')[st.guesses.length]; if (!row) return;
    [...row.children].forEach((t, i) => { t.textContent = input[i] || ''; t.className = 'dle-t' + (input[i] ? ' on' : ''); });
  }
  function submit() {
    if (input.length < word.length) { const row = root.querySelectorAll('.dle-row')[st.guesses.length]; row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); return msg('Not enough letters'); }
    if (!VALID.has(input)) { const row = root.querySelectorAll('.dle-row')[st.guesses.length]; row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); return msg('Not in word list'); }
    const g = input; input = ''; st.guesses.push(g);
    const won = g === word, out = st.guesses.length >= TRIES;
    if (won || out) {
      st.done = true; st.won = won;
      const s = stats();
      if (s.lastDay !== day) {
        s.played++; s.lastDay = day;
        if (won) { s.wins++; s.dist[st.guesses.length - 1]++; s.streak = s.lastWin === day - 1 ? s.streak + 1 : 1; s.lastWin = day; s.max = Math.max(s.max, s.streak); }
        else s.streak = 0;
        LS.set('mb_dle_stats', s);
      }
    }
    save(); busy = true;
    draw(st.guesses.length - 1);
    setTimeout(() => {
      busy = false;
      if (won) {
        msg(['🤯 GENIUS', '🔥 Magnificent', '👏 Impressive', '😎 Splendid', '👍 Great', '😮‍💨 Phew'][st.guesses.length - 1], true);
        if (!st.rewarded) { st.rewarded = true; save(); const n = packsFor(st.guesses.length);
          window.dispatchEvent(new CustomEvent('mb:pack', { detail: { lucky: true, count: n, why: `solving Monkeydle #${day} in ${st.guesses.length}` } })); }
      } else if (st.done) msg(`The word was ${word}`, true);
      if (st.done) post();
    }, word.length * 120 + 500);
  }
  // shared leaderboard
  function post() {
    if (st.posted || !window.MB_API) return;
    const name = String(LS.get('mb_flappy_name', '') || '').slice(0, 16); if (!name) return;
    let dev = null; try { dev = localStorage.getItem('mb_voter'); } catch (e) {}
    if (!dev) { dev = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', dev); } catch (e) {} }
    fetch(window.MB_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'dle', day, name, tries: st.guesses.length, solved: st.won, voter: dev }) })
      .then(r => r.json()).then(d => { if (d.ok) { st.posted = true; save(); showBoard(d.results || []); } }).catch(() => {});
  }
  function drawBoard() { if (!window.MB_API) return; fetch(window.MB_API + '?action=dle&day=' + day).then(r => r.json()).then(d => { if (d.ok) showBoard(d.results || []); }).catch(() => showBoard(null)); }
  function showBoard(list) {
    const box = root && root.querySelector('.dle-lb'); if (!box) return;
    if (!list) { box.innerHTML = '<p class="empty">Couldn\'t load the leaderboard.</p>'; return; }
    const solved = list.filter(r => r.solved).sort((a, b) => a.tries - b.tries || a.t - b.t), failed = list.filter(r => !r.solved);
    if (!list.length) { box.innerHTML = `<p class="empty">Nobody has finished today's Monkeydle yet.${st.done ? '' : ' Be the first!'}</p>`; return; }
    box.innerHTML = `<ol>${solved.map(r => `<li><b>${esc(r.name)}</b> · ${r.tries}/${TRIES}</li>`).join('')}</ol>` +
      (failed.length ? `<p class="empty" style="margin-top:6px">❌ Didn't get it: ${failed.map(r => esc(r.name)).join(', ')}</p>` : '') +
      (st.done ? '' : '<p class="empty" style="margin-top:6px">Finish today\'s puzzle to get on the board.</p>');
  }
  function show() { shown = true; words(() => { if (!shown) return; const d = dayNo(); if (d !== day || !st) { load(); input = ''; } draw(); }); }
  function hide() { shown = false; }
  window.MBDle = { init, show, hide, _today: () => (load(), { day, word }) };
})();
