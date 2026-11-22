/* MonkeyBoyz games: Flappy Monkey + Bobble Clicker */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const fmt = n => n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : Math.floor(n).toLocaleString();

  /* ============================ FLAPPY MONKEY ============================ */
  const Flappy = (() => {
    const W = 400, H = 600, GROUND = 70;
    let cv, ctx, raf = 0, last = 0, state = 'ready', running = false;
    let monkey, trees, score, best = LS.get('mb_flappy_best', 0), t = 0, clouds = [];
    const GRAV = 1500, FLAP = -430, SPEED = 165, GAP = 165, SPACING = 225, TW = 68;

    function reset() {
      monkey = { x: 110, y: H / 2 - 40, vy: 0, r: 20 };
      trees = []; score = 0; t = 0;
      for (let i = 0; i < 3; i++) addTree(W + 120 + i * SPACING);
      clouds = Array.from({ length: 4 }, (_, i) => ({ x: i * 120 + Math.random() * 60, y: 40 + Math.random() * 160, s: .6 + Math.random() * .6 }));
    }
    function addTree(x) {
      const minTop = 60, maxTop = H - GROUND - GAP - 60;
      trees.push({ x, top: minTop + Math.random() * (maxTop - minTop), passed: false });
    }
    function flap() {
      if (state === 'over') { if (performance.now() - overAt > 450) { reset(); state = 'ready'; } return; }
      if (state === 'ready') state = 'play';
      monkey.vy = FLAP;
    }
    let overAt = 0, onOver = null;
    function die() {
      state = 'over'; overAt = performance.now();
      if (score > best) { best = score; LS.set('mb_flappy_best', best); }
      if (onOver) onOver(score);
    }
    function update(dt) {
      t += dt;
      clouds.forEach(c => { c.x -= 12 * c.s * dt; if (c.x < -80) { c.x = W + 40; c.y = 40 + Math.random() * 160; } });
      if (state === 'ready') { monkey.y = H / 2 - 40 + Math.sin(t * 4) * 8; return; }
      if (state === 'over') { if (monkey.y < H - GROUND - monkey.r) { monkey.vy += GRAV * dt; monkey.y += monkey.vy * dt; } return; }
      monkey.vy += GRAV * dt; monkey.y += monkey.vy * dt;
      trees.forEach(tr => {
        tr.x -= SPEED * dt;
        if (!tr.passed && tr.x + TW < monkey.x) { tr.passed = true; score++; }
        const hitX = monkey.x + monkey.r - 6 > tr.x && monkey.x - monkey.r + 6 < tr.x + TW;
        const hitY = monkey.y - monkey.r + 6 < tr.top || monkey.y + monkey.r - 6 > tr.top + GAP;
        if (hitX && hitY) die();
      });
      if (trees[0].x < -TW) { trees.shift(); addTree(trees[trees.length - 1].x + SPACING); }
      if (monkey.y + monkey.r > H - GROUND || monkey.y - monkey.r < -40) die();
    }
    function trunk(x, y, h, capAtBottom) {
      const g = ctx.createLinearGradient(x, 0, x + TW, 0);
      g.addColorStop(0, '#6b4423'); g.addColorStop(.5, '#8b5a2b'); g.addColorStop(1, '#5a381c');
      ctx.fillStyle = g; ctx.fillRect(x + 8, y, TW - 16, h);
      // leafy cap at the gap side
      const cy = capAtBottom ? y + h : y;
      ctx.fillStyle = '#2f9e44';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x + 10 + i * 16, cy, 18, 13, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#40c057';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x + 18 + i * 16, cy + (capAtBottom ? -4 : 4), 14, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#74c0fc'); sky.addColorStop(1, '#d0ebff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      clouds.forEach(c => { ctx.beginPath(); ctx.ellipse(c.x, c.y, 34 * c.s, 14 * c.s, 0, 0, 7); ctx.ellipse(c.x + 22 * c.s, c.y - 8 * c.s, 22 * c.s, 14 * c.s, 0, 0, 7); ctx.fill(); });
      // far jungle
      ctx.fillStyle = '#8ce99a';
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(((i * 60 - t * 20) % 540 + 540) % 540 - 70, H - GROUND, 50, Math.PI, 0); ctx.fill(); }
      trees.forEach(tr => { trunk(tr.x, 0, tr.top, true); trunk(tr.x, tr.top + GAP, H - GROUND - tr.top - GAP, false); });
      // ground
      ctx.fillStyle = '#8d6e3f'; ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = '#51cf66'; ctx.fillRect(0, H - GROUND, W, 14);
      ctx.fillStyle = '#37b24d';
      for (let i = 0; i < 14; i++) { const x = ((i * 32 - t * SPEED) % 448 + 448) % 448 - 32; ctx.fillRect(x, H - GROUND + 14, 16, 6); }
      // monkey
      ctx.save(); ctx.translate(monkey.x, monkey.y);
      const ang = state === 'play' || state === 'over' ? Math.max(-.5, Math.min(1.2, monkey.vy / 600)) : 0;
      ctx.rotate(ang);
      ctx.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.scale(-1, 1); ctx.fillText('🐒', 0, 2);
      ctx.restore();
      // text
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 6;
      ctx.font = '700 54px -apple-system,Inter,sans-serif';
      if (state !== 'ready') { ctx.strokeText(score, W / 2, 90); ctx.fillText(score, W / 2, 90); }
      ctx.font = '700 22px -apple-system,Inter,sans-serif';
      if (state === 'ready') { panel('Flappy Monkey', 'Tap, click or press Space to flap', best ? 'Best: ' + best : ''); }
      if (state === 'over') { panel('Game over', 'Score: ' + score + '   Best: ' + best, 'Tap to try again'); }
    }
    function panel(a, b, c) {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(40, H / 2 - 110, W - 80, 150, 20); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 32px -apple-system,Inter,sans-serif'; ctx.fillText(a, W / 2, H / 2 - 60);
      ctx.font = '500 17px -apple-system,Inter,sans-serif'; ctx.fillText(b, W / 2, H / 2 - 22);
      if (c) { ctx.fillStyle = '#ffd43b'; ctx.fillText(c, W / 2, H / 2 + 10); }
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function loop(now) {
      const dt = Math.min(.033, (now - last) / 1000 || 0); last = now;
      update(dt); draw();
      if (running) raf = requestAnimationFrame(loop);
    }
    function init(canvas, opts) {
      onOver = opts && opts.onOver;
      cv = canvas; ctx = cv.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      reset();
      cv.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });
      window.addEventListener('keydown', e => {
        if (!running) return;
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
      });
      draw();
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); if (state === 'play') state = 'ready', reset(); }
    return { init, start, stop };
  })();

  /* ============================ BOBBLE CLICKER ============================ */
  const Clicker = (() => {
    const UPGRADES = [
      { id: 'hands',   name: 'Extra Hands',       desc: '+1 bobble per click',   base: 15,    click: 1 },
      { id: 'phones',  name: 'Bigger Headphones', desc: '+1 bobble per second',  base: 40,    sec: 1 },
      { id: 'fan',     name: 'Bobble Fan',        desc: '+4 bobbles per second', base: 220,   sec: 4 },
      { id: 'stache',  name: 'Mustache Wax',      desc: '+8 bobbles per click',  base: 650,   click: 8 },
      { id: 'factory', name: 'Bobble Factory',    desc: '+25 bobbles per second',base: 2500,  sec: 25 },
      { id: 'stream',  name: 'MonkeyBoyz Stream', desc: '+120 bobbles per second',base: 18000, sec: 120 },
    ];
    let S = LS.get('mb_clicker', { n: 0, total: 0, own: {} });
    let el = {}, stopAt = 0, saveT = 0, lastT = 0;
    const own = id => S.own[id] || 0;
    const cost = u => Math.ceil(u.base * Math.pow(1.15, own(u.id)));
    const perClick = () => 1 + UPGRADES.reduce((a, u) => a + (u.click || 0) * own(u.id), 0);
    const perSec = () => UPGRADES.reduce((a, u) => a + (u.sec || 0) * own(u.id), 0);
    function save() { LS.set('mb_clicker', S); }
    function render() {
      el.count.textContent = fmt(S.n);
      el.rate.textContent = `${fmt(perClick())} per click · ${fmt(perSec())} per second`;
      el.shop.querySelectorAll('button.up').forEach(b => {
        const u = UPGRADES.find(x => x.id === b.dataset.id);
        b.disabled = S.n < cost(u);
        b.querySelector('.c').textContent = fmt(cost(u));
        b.querySelector('.o').textContent = own(u.id) ? '×' + own(u.id) : '';
      });
    }
    function bobble(e) {
      const add = perClick(); S.n += add; S.total += add;
      // play the real bobble video while clicking
      const v = el.video;
      try { if (v.paused) { v.play().catch(() => {}); } } catch (err) {}
      stopAt = performance.now() + 1400;
      // squish
      el.head.classList.remove('pop'); void el.head.offsetWidth; el.head.classList.add('pop');
      // floating number
      const f = document.createElement('div'); f.className = 'float'; f.textContent = '+' + fmt(add);
      const r = el.stage.getBoundingClientRect();
      const x = (e && e.clientX ? e.clientX - r.left : r.width / 2) + (Math.random() * 30 - 15);
      const y = (e && e.clientY ? e.clientY - r.top : r.height / 2);
      f.style.left = x + 'px'; f.style.top = y + 'px';
      el.stage.appendChild(f); setTimeout(() => f.remove(), 900);
      render();
    }
    function loop() {
      const now = performance.now();
      if (!el.video.paused && now > stopAt) el.video.pause();
      // earn by real time passed, so the rate is right even when the browser slows the timer down
      const dt = Math.min(60, (now - (lastT || now)) / 1000); lastT = now;
      const g = perSec() * dt; if (g) { S.n += g; S.total += g; render(); }
      if (now - saveT > 4000) { save(); saveT = now; }
    }
    let timer = 0;
    function init(root) {
      root.innerHTML = `
        <div class="clk">
          <div class="clk-left">
            <div class="clk-count"><b id="clkN">0</b><span>Gerson bobbles</span></div>
            <div class="clk-rate" id="clkRate"></div>
            <div class="clk-stage" id="clkStage">
              <button class="clk-head" id="clkHead" aria-label="Bobble Gerson's head">
                <video id="clkVid" src="games/bobble.mp4" poster="games/bobble.jpg" muted playsinline loop preload="auto"></video>
              </button>
            </div>
            <p class="clk-tip">Click Gerson's head to make him bobble.</p>
          </div>
          <div class="clk-shop" id="clkShop"><h4>Upgrades</h4></div>
        </div>`;
      el = { count: root.querySelector('#clkN'), rate: root.querySelector('#clkRate'), stage: root.querySelector('#clkStage'),
             head: root.querySelector('#clkHead'), video: root.querySelector('#clkVid'), shop: root.querySelector('#clkShop') };
      UPGRADES.forEach(u => {
        const b = document.createElement('button'); b.dataset.id = u.id; b.className = 'up';
        b.innerHTML = '<span class="t"></span><span class="d"></span><span class="row"><span class="c"></span><span class="o"></span></span>';
        b.querySelector('.t').textContent = u.name; b.querySelector('.d').textContent = u.desc;
        b.onclick = () => { const c = cost(u); if (S.n < c) return; S.n -= c; S.own[u.id] = own(u.id) + 1; save(); render(); };
        el.shop.appendChild(b);
      });
      const reset = document.createElement('button'); reset.className = 'reset'; reset.textContent = 'Reset progress';
      reset.onclick = () => { if (confirm('Reset all your bobbles and upgrades?')) { S = { n: 0, total: 0, own: {} }; save(); render(); } };
      el.shop.appendChild(reset);
      el.head.addEventListener('pointerdown', e => { e.preventDefault(); bobble(e); });
      el.head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bobble(); } });
      render();
    }
    function start() { if (!timer) { lastT = performance.now(); timer = setInterval(loop, 100); } }
    function stop() { clearInterval(timer); timer = 0; save(); try { el.video && el.video.pause(); } catch (e) {} }
    return { init, start, stop };
  })();

  /* ======================== FLAPPY MONKEY LEADERBOARD ======================== */
  const Board = (() => {
    let el = {}, lastScore = 0, myName = LS.get('mb_flappy_name', '');
    const api = () => window.MB_API;
    const device = () => { let id = null; try { id = localStorage.getItem('mb_voter'); } catch (e) {}
      if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', id); } catch (e) {} } return id; };
    function draw(top) {
      el.list.innerHTML = '';
      if (!top || !top.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No scores yet — be the first!'; el.list.appendChild(li); return; }
      top.forEach((r, i) => {
        const li = document.createElement('li');
        if (myName && r.name.toLowerCase() === myName.toLowerCase()) li.className = 'me';
        const rank = document.createElement('span'); rank.className = 'rk'; rank.textContent = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = r.name;
        const sc = document.createElement('b'); sc.textContent = r.score;
        li.append(rank, nm, sc); el.list.appendChild(li);
      });
    }
    async function load() {
      if (!api()) return;
      try { const d = await fetch(api() + '?action=leaderboard').then(r => r.json()); if (d.ok) draw(d.top); } catch (e) {}
    }
    function offer(score) {
      if (score < 1) return;
      lastScore = score;
      el.score.textContent = score;
      el.name.value = myName;
      el.msg.textContent = '';
      el.save.disabled = false;
      el.form.style.display = '';
    }
    async function save() {
      const name = el.name.value.trim();
      if (!name) { el.msg.textContent = 'Type a name first.'; return; }
      el.save.disabled = true; el.msg.textContent = 'Saving…';
      try {
        const d = await fetch(api(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'score', name, score: lastScore, voter: device() }) }).then(r => r.json());
        if (!d.ok) throw new Error(d.error);
        myName = name; LS.set('mb_flappy_name', name);
        draw(d.top); el.form.style.display = 'none';
      } catch (e) { el.msg.textContent = e.message || "Couldn't save — try again."; el.save.disabled = false; }
    }
    function init(root) {
      root.innerHTML = `
        <div class="lb-form" style="display:none">
          <div>You scored <b class="lb-score"></b>! Put it on the board?</div>
          <div class="lb-row"><input class="lb-name" maxlength="20" placeholder="Your name"><button class="lb-save">Save score</button></div>
          <div class="lb-msg"></div>
        </div>
        <h4>🏆 Leaderboard</h4>
        <ol class="lb-list"></ol>`;
      el = { form: root.querySelector('.lb-form'), score: root.querySelector('.lb-score'), name: root.querySelector('.lb-name'),
             save: root.querySelector('.lb-save'), msg: root.querySelector('.lb-msg'), list: root.querySelector('.lb-list') };
      el.save.onclick = save;
      el.name.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') save(); });
      load();
    }
    return { init, load, offer };
  })();

  /* ============================== GAMES VIEW ============================== */
  let inited = false, current = 'flappy';
  function pick(which) {
    current = which;
    document.querySelectorAll('.game-pick').forEach(b => b.classList.toggle('on', b.dataset.game === which));
    document.getElementById('gameFlappy').style.display = which === 'flappy' ? '' : 'none';
    document.getElementById('gameClicker').style.display = which === 'clicker' ? '' : 'none';
    document.getElementById('gameBlocks').style.display = which === 'blocks' ? '' : 'none';
    document.getElementById('gameFlash').style.display = which === 'flash' ? '' : 'none';
    document.getElementById('gameCards').style.display = which === 'cards' ? '' : 'none';
    document.getElementById('gameWhack').style.display = which === 'whack' ? '' : 'none';
    document.getElementById('gameRace').style.display = which === 'race' ? '' : 'none';
    const B = window.MBBlocks, F = window.MBFlash, K = window.MBCards, W = window.MBWhack, RC = window.MBRace;
    if (which !== 'flash' && F) F.hide();
    if (which !== 'cards' && K) K.hide();
    if (which !== 'whack' && W) W.hide();
    if (which !== 'race' && RC) RC.hide();
    if (which !== 'flappy') Flappy.stop();
    if (which !== 'clicker') Clicker.stop();
    if (which !== 'blocks' && B) B.stop();
    if (which === 'flappy') { Flappy.start(); Board.load(); }
    else if (which === 'clicker') Clicker.start();
    else if (which === 'flash') { if (F) F.show(); }
    else if (which === 'cards') { if (K) K.show(); }
    else if (which === 'whack') { if (W) W.show(); }
    else if (which === 'race') { if (RC) RC.show(); }
    else if (B) B.start();
  }
  window.MBGames = {
    show() {
      if (!inited) {
        inited = true;
        Board.init(document.getElementById('flappyBoard'));
        Flappy.init(document.getElementById('flappyCanvas'), { onOver: s => { Board.offer(s); if (s >= 10) window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why: 'scoring ' + s + ' in Flappy Monkey', lucky: true, count: Math.floor(s / 10) } })); } });
        Clicker.init(document.getElementById('clickerRoot'));
        if (window.MBBlocks) MBBlocks.init(document.getElementById('blocksRoot'));
        if (window.MBFlash) MBFlash.init(document.getElementById('flashRoot'));
        if (window.MBCards) MBCards.init(document.getElementById('cardsRoot'));
        if (window.MBWhack) MBWhack.init(document.getElementById('whackRoot'));
        if (window.MBRace) MBRace.init(document.getElementById('raceRoot'));
        document.querySelectorAll('.game-pick').forEach(b => b.onclick = () => pick(b.dataset.game));
      }
      pick(current);
    },
    hide() { Flappy.stop(); Clicker.stop(); if (window.MBBlocks) MBBlocks.stop(); if (window.MBFlash) MBFlash.hide(); if (window.MBCards) MBCards.hide(); if (window.MBWhack) MBWhack.hide(); if (window.MBRace) MBRace.hide(); }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.MBGames.hide(); });
})();
