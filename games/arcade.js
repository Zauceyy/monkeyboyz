/* MonkeyBoyz arcade: Whack-a-Monkey and the online Monkey Race. Both pay out Lucky Packs for Monkey Cards. */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const okImg = u => /^(https:\/\/|members\/|games\/)/.test(u || '') ? u : '';
  function members() {
    let content = null; try { content = C; } catch (e) {}
    const list = (content && Array.isArray(content.members) && content.members.length) ? content.members
      : ['Armen', 'Zay', 'Blackdog', 'Dylan', 'Geordie', 'Kansas', 'Erick', 'Freddy', 'Gerson'].map(n => ({ name: n, img: 'members/' + n.toLowerCase() + '.webp' }));
    return list.filter(m => m && m.name);
  }
  const imgFor = name => { const m = members().find(x => x.name.toLowerCase() === String(name).toLowerCase()); return m ? okImg(m.img) : ''; };
  const lucky = (n, why) => window.dispatchEvent(new CustomEvent('mb:pack', { detail: { lucky: true, count: n, why } }));
  const device = () => { let id = null; try { id = localStorage.getItem('mb_voter'); } catch (e) {}
    if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', id); } catch (e) {} } return id; };
  const myName = () => String(LS.get('mb_flappy_name', '') || '').slice(0, 16);
  let actx = null;
  function beep(freqs, step, type, vol) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
      freqs.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * step;
        o.type = type || 'square'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + .2); });
    } catch (e) {}
  }

  const CSS = `
  .wk{max-width:560px;margin:0 auto;text-align:center}
  .wk-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:17px;margin-bottom:12px;flex-wrap:wrap}
  .wk-bar b{font-size:24px}
  .wk-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;background:linear-gradient(#6b9b37,#4c7a26);padding:18px;border-radius:24px;position:relative;touch-action:manipulation;user-select:none;-webkit-user-select:none}
  .wk-hole{position:relative;aspect-ratio:1;border-radius:50%;background:radial-gradient(ellipse at 50% 70%,#2b1a0e 0 45%,#4a2e17 46% 60%,transparent 61%);overflow:hidden;cursor:pointer}
  .wk-mole{position:absolute;left:12%;width:76%;aspect-ratio:1;bottom:-80%;border-radius:50%;overflow:hidden;transition:bottom .12s ease-out;box-shadow:0 0 0 4px #fff;background:#ddd}
  .wk-mole img{width:100%;height:100%;object-fit:cover;pointer-events:none}
  .wk-hole.up .wk-mole{bottom:14%}
  .wk-hole.bad .wk-mole{box-shadow:0 0 0 4px #ff3b30}
  .wk-hole.gold .wk-mole{box-shadow:0 0 0 5px #ffd43b,0 0 24px #ffd43b}
  .wk-hole.hit .wk-mole{transform:scaleY(.6) translateY(20%);transition:transform .08s}
  .wk-tag{position:absolute;left:50%;top:6%;transform:translateX(-50%);font-size:11px;font-weight:800;color:#fff;background:#ff3b30;border-radius:8px;padding:1px 6px;z-index:2;display:none}
  .wk-hole.bad.up .wk-tag{display:block}
  .wk-pop{position:absolute;font-weight:900;font-size:22px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.5);pointer-events:none;animation:wkPop .7s ease-out forwards;z-index:3}
  @keyframes wkPop{to{transform:translateY(-40px);opacity:0}}
  .wk-ov{position:absolute;inset:0;border-radius:24px;background:rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;padding:20px;gap:10px}
  .wk-ov h3{margin:0;font-size:28px}
  .wk-ov p{margin:0;color:#e9ecef;max-width:340px;line-height:1.4}
  .arc-btn{border:0;border-radius:980px;background:#ffd43b;color:#111;font:inherit;font-weight:700;font-size:17px;padding:11px 24px;cursor:pointer}
  .arc-btn:disabled{opacity:.5;cursor:default}

  .rc{max-width:900px;margin:0 auto;text-align:left}
  .rc-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  .rc-head b{font-size:20px}
  .rc-phase{font-size:16px;font-weight:700;padding:6px 14px;border-radius:980px;background:var(--tile)}
  .rc-phase.live{background:#ff3b30;color:#fff}
  .rc-track{position:relative;background:repeating-linear-gradient(90deg,#c08552 0 60px,#b5794a 60px 120px);border-radius:20px;padding:10px 54px 10px 10px;overflow:hidden}
  .rc-track::after{content:"";position:absolute;top:0;bottom:0;right:44px;width:12px;background:repeating-linear-gradient(0deg,#fff 0 10px,#111 10px 20px)}
  .rc-lane{position:relative;height:46px;border-bottom:2px dashed rgba(255,255,255,.35)}
  .rc-lane:last-child{border-bottom:0}
  .rc-run{position:absolute;top:3px;left:0;width:40px;height:40px;will-change:transform;z-index:1}
  .rc-run img{width:40px;height:40px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px #fff;background:#ddd}
  .rc-run.go img{animation:rcHop .28s ease-in-out infinite alternate}
  .rc-run .n{position:absolute;left:46px;top:11px;font-size:13px;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.7);white-space:nowrap}
  .rc-run.flip .n{left:auto;right:46px}
  .rc-lane.mine .rc-run img{box-shadow:0 0 0 3px #ffd43b,0 0 12px #ffd43b}
  .rc-lane .bets{position:absolute;right:-48px;top:12px;font-size:12px;color:#fff;font-weight:700;z-index:2}
  .rc-place{position:absolute;right:-50px;top:8px;font-size:20px;z-index:2}
  @keyframes rcHop{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-5px) rotate(6deg)}}
  .rc-say{min-height:26px;font-size:17px;font-weight:700;text-align:center;margin:12px 0 6px}
  .rc-picks{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px;margin-top:10px}
  .rc-pick{border:2px solid var(--line);background:var(--bg);color:var(--ink);border-radius:16px;padding:8px 6px;cursor:pointer;font:inherit;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:6px}
  .rc-pick img{width:52px;height:52px;border-radius:50%;object-fit:cover;background:var(--line)}
  .rc-pick.on{border-color:#ffd43b;background:rgba(255,212,59,.18);font-weight:700}
  .rc-pick:disabled{opacity:.55;cursor:default}
  .rc-row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-top:16px}
  .rc-box{background:var(--tile);border-radius:18px;padding:14px 16px;flex:1;min-width:240px}
  .rc-box h5{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)}
  .rc-box input{font:inherit;font-size:15px;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%;box-sizing:border-box}
  .rc-bets{list-style:none;margin:0;padding:0;font-size:14px;display:flex;flex-direction:column;gap:6px}
  .rc-bets li{display:flex;align-items:center;gap:8px}
  .rc-bets img{width:22px;height:22px;border-radius:50%;object-fit:cover}
  .rc-note{color:var(--ink2);font-size:13px;margin:10px 0 0}
  @media (max-width:600px){ .rc-lane{height:40px} .rc-run,.rc-run img{width:34px;height:34px} .rc-run .n{left:40px;top:9px;font-size:12px} .rc-run.flip .n{left:auto;right:40px} .rc-track{padding-right:46px} .rc-track::after{right:36px} }`;
  function css() { if (!document.getElementById('arc-css')) { const st = document.createElement('style'); st.id = 'arc-css'; st.textContent = CSS; document.head.appendChild(st); } }

  /* ============================== WHACK-A-MONKEY ============================== */
  const Whack = (() => {
    const GOAL = 30, LEN = 30;
    let root, holes = [], state = 'ready', score = 0, left = LEN, timers = [], tickT = 0, endAt = 0, best = LS.get('mb_whack_best', 0);
    function init(r) {
      css(); root = r;
      root.innerHTML = `<div class="wk">
        <div class="wk-bar"><span>Score <b class="wk-s">0</b></span><span>⏱ <b class="wk-t">${LEN}</b>s</span><span>Best <b class="wk-b">${best}</b></span></div>
        <div class="wk-grid">${Array.from({ length: 9 }, () => '<div class="wk-hole"><span class="wk-tag">DON\'T</span><div class="wk-mole"><img alt=""></div></div>').join('')}
          <div class="wk-ov"><h3>🔨 Whack-a-Monkey</h3><p>Smack the boys when they pop up. <b>Don't hit Gerson</b> (red ring, −3). Gold ones are worth +5. Score <b>${GOAL}+</b> in ${LEN} seconds for a 🍀 Lucky Pack.</p><button class="arc-btn wk-go">Start</button></div>
        </div></div>`;
      holes = [...root.querySelectorAll('.wk-hole')];
      holes.forEach(h => h.addEventListener('pointerdown', e => { e.preventDefault(); hit(h, e); }));
      root.querySelector('.wk-go').onclick = start;
    }
    function clear() { timers.forEach(clearTimeout); timers = []; clearInterval(tickT); tickT = 0; holes.forEach(h => { h.className = 'wk-hole'; h.dataset.kind = ''; }); }
    function start() {
      clear(); score = 0; left = LEN; state = 'play'; endAt = Date.now() + LEN * 1000;
      root.querySelector('.wk-ov').style.display = 'none'; upd();
      tickT = setInterval(() => { left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)); upd(); if (left <= 0) finish(); }, 200);
      spawn();
    }
    function spawn() {
      if (state !== 'play') return;
      const prog = 1 - (endAt - Date.now()) / (LEN * 1000);
      popOne(prog);
      timers.push(setTimeout(spawn, 820 - prog * 420 + Math.random() * 160));
      if (Math.random() < .2 + prog * .25) timers.push(setTimeout(() => { if (state === 'play') popOne(prog); }, 220));   // sometimes two at once
    }
    function popOne(prog) {
      const free = holes.filter(h => !h.classList.contains('up'));
      if (free.length) {
        const h = free[Math.floor(Math.random() * free.length)], ms = members();
        const gerson = ms.find(m => m.name.toLowerCase() === 'gerson');
        const x = Math.random(); let kind = 'ok', m = ms[Math.floor(Math.random() * ms.length)];
        if (gerson && x < .16) { kind = 'bad'; m = gerson; } else if (x > .955) kind = 'gold';
        if (kind === 'ok' && gerson && m === gerson) m = ms.find(y => y !== gerson) || m;
        h.querySelector('img').src = okImg(m.img); h.dataset.kind = kind;
        h.className = 'wk-hole up' + (kind === 'bad' ? ' bad' : kind === 'gold' ? ' gold' : '');
        const upFor = 1000 - prog * 420;
        timers.push(setTimeout(() => { if (h.dataset.kind) { h.className = 'wk-hole'; h.dataset.kind = ''; } }, upFor));
      }
    }
    function hit(h, e) {
      if (state !== 'play' || !h.classList.contains('up') || !h.dataset.kind) return;
      const kind = h.dataset.kind, pts = kind === 'bad' ? -3 : kind === 'gold' ? 5 : 1;
      score = Math.max(0, score + pts); h.dataset.kind = ''; h.classList.add('hit');
      timers.push(setTimeout(() => { h.className = 'wk-hole'; }, 160));
      beep(kind === 'bad' ? [200, 140] : kind === 'gold' ? [784, 1047, 1319] : [660], .06);
      const p = document.createElement('div'); p.className = 'wk-pop'; p.textContent = (pts > 0 ? '+' : '') + pts;
      const g = root.querySelector('.wk-grid').getBoundingClientRect(); p.style.left = (e.clientX - g.left - 10) + 'px'; p.style.top = (e.clientY - g.top - 20) + 'px';
      if (pts < 0) p.style.color = '#ff6b6b';
      root.querySelector('.wk-grid').appendChild(p); setTimeout(() => p.remove(), 700);
      upd();
    }
    function upd() { root.querySelector('.wk-s').textContent = score; root.querySelector('.wk-t').textContent = left; root.querySelector('.wk-b').textContent = best; }
    function finish() {
      if (state !== 'play') return;
      state = 'over'; clear();
      const nb = score > best; if (nb) { best = score; LS.set('mb_whack_best', best); }
      const won = score >= GOAL;
      const ov = root.querySelector('.wk-ov'); ov.style.display = 'flex';
      ov.innerHTML = `<h3>${won ? '🏆 ' + score + ' points!' : score + ' points'}</h3>
        <p>${won ? 'You hit the goal! +1 🍀 Lucky Pack.' : `You needed ${GOAL} for a Lucky Pack. So close.`}${nb ? '<br>New best!' : ''}</p>
        <button class="arc-btn wk-go">Play again</button>`;
      ov.querySelector('.wk-go').onclick = start; upd();
      if (won) { beep([523, 659, 784, 1047], .09); lucky(1, 'scoring ' + score + ' in Whack-a-Monkey'); }
    }
    function stop() { if (state === 'play') { state = 'ready'; clear(); const ov = root.querySelector('.wk-ov'); ov.style.display = 'flex';
      ov.innerHTML = `<h3>🔨 Whack-a-Monkey</h3><p>Game stopped. Score ${GOAL}+ in ${LEN} seconds for a 🍀 Lucky Pack.</p><button class="arc-btn wk-go">Start</button>`;
      ov.querySelector('.wk-go').onclick = start; } }
    return { init, show() {}, hide: stop };
  })();

  /* ============================== MONKEY RACE (online) ============================== */
  // One race for everyone, every 2 minutes. The server keeps the bets and only reveals the race's
  // random seed when betting closes, so nobody can know the winner ahead of time.
  const Race = (() => {
    const RACE_LEN = 26000, PAYOUT = 3;
    let root, R = null, offset = 0, pollT = 0, raf = 0, shown = false, lastSay = '', leader = -1, fetching = false, seenResult = null;
    const now = () => Date.now() + offset;
    function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    // Same seed => same race on every screen
    function simulate(seed, n) {
      const r = mulberry(seed), SEG = 10, runners = [];
      for (let i = 0; i < n; i++) {
        const form = .94 + r() * .12, segs = [];
        for (let k = 0; k < SEG; k++) segs.push((1 / SEG) / (form * (.86 + r() * .28)));
        runners.push({ segs, total: segs.reduce((a, b) => a + b, 0) });
      }
      const fastest = Math.min(...runners.map(x => x.total)), scale = 17000 / fastest;
      runners.forEach(x => { x.segs = x.segs.map(d => d * scale); x.finish = x.total * scale; });
      const order = runners.map((x, i) => i).sort((a, b) => runners[a].finish - runners[b].finish);
      return { runners, order };
    }
    function posAt(run, ms) {
      if (ms <= 0) return 0; if (ms >= run.finish) return 1;
      let t = 0, p = 0; const step = 1 / run.segs.length;
      for (const d of run.segs) { if (t + d >= ms) return p + step * ((ms - t) / d); t += d; p += step; }
      return 1;
    }
    function init(r) {
      css(); root = r;
      root.innerHTML = `<div class="rc">
        <div class="rc-head"><b class="rc-title">🏁 Monkey Race</b><span class="rc-phase">Loading…</span></div>
        <div class="rc-track"></div>
        <div class="rc-say"></div>
        <div class="rc-picks"></div>
        <div class="rc-row">
          <div class="rc-box"><h5>Your name</h5><input class="rc-name" maxlength="16" placeholder="So people see your pick"></div>
          <div class="rc-box"><h5>Picks this race</h5><ul class="rc-bets"><li style="color:var(--ink2)">No picks yet</li></ul></div>
        </div>
        <p class="rc-note">A new race starts every 2 minutes and everyone on the site watches the same one. Pick who you think wins before betting closes. Pick the winner and you get <b>${PAYOUT} 🍀 Lucky Packs</b>.</p>
      </div>`;
      const nm = root.querySelector('.rc-name'); nm.value = myName();
      nm.onchange = () => { LS.set('mb_flappy_name', nm.value.trim().slice(0, 16)); const b = LS.get('mb_race_bet', null); if (b && R && b.id === R.id && now() < R.start) bet(b.pick); };
    }
    async function load() {
      if (!window.MB_API || fetching) return; fetching = true;
      try {
        const t0 = Date.now(); const d = await fetch(window.MB_API + '?action=race&nc=' + t0).then(r => r.json());
        if (d && d.ok) { offset = d.now + (Date.now() - t0) / 2 - Date.now(); setState(d); }
        else say('The race track is closed right now. Try again soon.');
      } catch (e) { say('Couldn\'t reach the race. Check your connection.'); }
      fetching = false;
    }
    function setState(d) {
      const fresh = !R || R.id !== d.id;
      R = Object.assign({}, d);
      if (d.seed != null) R.sim = simulate(d.seed, d.racers.length);
      if (fresh) { leader = -1; lastSay = ''; buildTrack(); }
      drawBets(); drawPicks();
    }
    function buildTrack() {
      const tr = root.querySelector('.rc-track'); tr.innerHTML = '';
      R.racers.forEach((name, i) => {
        const lane = document.createElement('div'); lane.className = 'rc-lane'; lane.dataset.i = i;
        lane.innerHTML = `<div class="rc-run"><img alt="" src="${esc(imgFor(name))}"><span class="n">${esc(name)}</span></div><span class="bets"></span>`;
        tr.appendChild(lane);
      });
      root.querySelector('.rc-title').textContent = '🏁 Monkey Race #' + (R.id % 10000);
    }
    function myBet() { const b = LS.get('mb_race_bet', null); return b && R && b.id === R.id ? b.pick : null; }
    function drawPicks() {
      const box = root.querySelector('.rc-picks'), open = now() < R.start, mine = myBet();
      box.innerHTML = '';
      R.racers.forEach(name => {
        const b = document.createElement('button'); b.className = 'rc-pick' + (mine === name ? ' on' : ''); b.disabled = !open;
        b.innerHTML = `<img alt="" src="${esc(imgFor(name))}"><span>${esc(name)}</span>`;
        b.onclick = () => bet(name); box.appendChild(b);
      });
      root.querySelectorAll('.rc-lane').forEach(l => l.classList.toggle('mine', R.racers[+l.dataset.i] === mine));
    }
    function drawBets() {
      const ul = root.querySelector('.rc-bets'), bets = R.bets || [];
      ul.innerHTML = bets.length ? '' : '<li style="color:var(--ink2)">No picks yet. Be the first!</li>';
      bets.forEach(b => { const li = document.createElement('li'); li.innerHTML = `<b>${esc(b.name)}</b> → <img alt="" src="${esc(imgFor(b.pick))}">${esc(b.pick)}`; ul.appendChild(li); });
      const count = {}; bets.forEach(b => count[b.pick] = (count[b.pick] || 0) + 1);
      root.querySelectorAll('.rc-lane').forEach(l => { const c = count[R.racers[+l.dataset.i]]; l.querySelector('.bets').textContent = c ? '👤' + c : ''; });
    }
    async function bet(name) {
      if (!R || now() >= R.start) return;
      LS.set('mb_race_bet', { id: R.id, pick: name }); drawPicks(); beep([660, 880], .06, 'triangle');
      say(`You picked ${name}. Good luck!`);
      try {
        const d = await fetch(window.MB_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'bet', race: R.id, pick: name, name: myName(), voter: device() }) }).then(r => r.json());
        if (d && d.ok) setState(d); else if (d && d.error) say(d.error);
      } catch (e) {}
    }
    function say(t) { const s = root.querySelector('.rc-say'); if (s && t !== lastSay) { s.textContent = t; lastSay = t; } }
    function frame() {
      raf = shown ? requestAnimationFrame(frame) : 0;
      if (!R) return;
      const T = now(), ph = root.querySelector('.rc-phase'), into = T - R.start, next = (R.id + 1) * R.cycle;
      const runs = [...root.querySelectorAll('.rc-run')], trackW = root.querySelector('.rc-track').clientWidth - 64 - runs[0]?.clientWidth || 0;
      if (T < R.start) {
        const s = Math.ceil((R.start - T) / 1000);
        ph.className = 'rc-phase'; ph.textContent = `Betting closes in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        runs.forEach(r => { r.style.transform = 'translateX(0)'; r.classList.remove('go', 'flip'); });
        root.querySelectorAll('.rc-place').forEach(x => x.remove());
        if (!myBet()) say('Pick a monkey below 👇');
        if (s <= 3 && s > 0) say(`${s}…`);
        return;
      }
      if (!R.sim) { ph.className = 'rc-phase live'; ph.textContent = '🔴 Starting…'; if (!fetching) load(); return; }
      const { runners, order } = R.sim;
      if (into < RACE_LEN) {
        ph.className = 'rc-phase live'; ph.textContent = '🔴 RACE IS ON';
        let lead = 0, best = -1;
        runs.forEach((el, i) => { const p = posAt(runners[i], into); el.style.transform = `translateX(${(p * trackW).toFixed(1)}px)`; el.classList.toggle('go', p < 1); el.classList.toggle('flip', p > .55);
          if (p > best) { best = p; lead = i; } });
        if (into < 600) say('And they\'re off! 🏁');
        else if (lead !== leader && best < .97) { leader = lead; say(`${R.racers[lead]} takes the lead!`); beep([500], .05, 'triangle', .04); }
        const done = order.filter(i => runners[i].finish <= into);
        if (done.length) placeMarks(done);
        if (done.length && best >= 1 && done[0] === order[0]) say(`🏆 ${R.racers[order[0]]} wins!`);
        drawPicksLocked();
      } else {
        runs.forEach((el, i) => { el.style.transform = `translateX(${trackW}px)`; el.classList.remove('go'); el.classList.add('flip'); });
        placeMarks(order);
        const s = Math.max(0, Math.ceil((next - T) / 1000));
        ph.className = 'rc-phase'; ph.textContent = `Next race in ${s}s`;
        result(order);
        if (T >= next && !fetching) load();
      }
    }
    function drawPicksLocked() { root.querySelectorAll('.rc-pick').forEach(b => b.disabled = true); }
    function placeMarks(done) {
      const medals = ['🥇', '🥈', '🥉'];
      done.slice(0, 3).forEach((i, k) => { const lane = root.querySelector(`.rc-lane[data-i="${i}"]`); if (lane && !lane.querySelector('.rc-place')) {
        const m = document.createElement('span'); m.className = 'rc-place'; m.textContent = medals[k]; lane.appendChild(m); lane.querySelector('.bets').textContent = ''; } });
    }
    function result(order) {
      if (seenResult === R.id) return; seenResult = R.id;
      const win = R.racers[order[0]], mine = myBet();
      const paid = LS.get('mb_race_paid', []);
      if (mine && mine === win && !paid.includes(R.id)) {
        paid.push(R.id); LS.set('mb_race_paid', paid.slice(-50));
        say(`🏆 ${win} won and you picked them! +${PAYOUT} 🍀 Lucky Packs`); beep([523, 659, 784, 1047, 1319], .09);
        lucky(PAYOUT, 'picking ' + win + ' in the Monkey Race');
      } else if (mine) say(`🏆 ${win} won. You picked ${mine}. Next race in a bit!`);
      else say(`🏆 ${win} won! Pick one for the next race.`);
      const winners = (R.bets || []).filter(b => b.pick === win).map(b => b.name);
      if (winners.length) setTimeout(() => say(`🏆 ${win} won! Called it: ${winners.join(', ')}`), 3500);
    }
    function show() {
      shown = true; load();
      clearInterval(pollT); pollT = setInterval(() => { if (R && now() < R.start) load(); }, 5000);
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function hide() { shown = false; clearInterval(pollT); pollT = 0; cancelAnimationFrame(raf); raf = 0; }
    return { init, show, hide, _simulate: simulate };
  })();

  window.MBWhack = Whack;
  window.MBRace = Race;
})();
