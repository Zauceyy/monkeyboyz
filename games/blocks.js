/* Banana Blocks: falling-block puzzle with original music + sound effects */
(function () {
  const COLS = 10, ROWS = 20, CELL = 30;
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const SHAPES = {
    I: { c: '#4dd4ff', m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
    O: { c: '#ffd43b', m: [[1,1],[1,1]] },
    T: { c: '#b197fc', m: [[0,1,0],[1,1,1],[0,0,0]] },
    S: { c: '#69db7c', m: [[0,1,1],[1,1,0],[0,0,0]] },
    Z: { c: '#ff6b6b', m: [[1,1,0],[0,1,1],[0,0,0]] },
    J: { c: '#4c6ef5', m: [[1,0,0],[1,1,1],[0,0,0]] },
    L: { c: '#ff922b', m: [[0,0,1],[1,1,1],[0,0,0]] },
  };
  const KINDS = Object.keys(SHAPES);
  const KICKS = [[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[0,1]];

  /* ------------------------------ audio ------------------------------ */
  const Audio = (() => {
    let ctx = null, master, musicGain, sfxGain, timer = 0, step = 0, nextTime = 0;
    let musicOn = LS.get('mb_blocks_music', true), sfxOn = LS.get('mb_blocks_sfx', true), playing = false;
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    function ensure() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? .22 : 0; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? .5 : 0; sfxGain.connect(master);
    }
    function note(freq, t, dur, type, vol, dest, slide) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .02);
    }
    // Original tune in A minor, 8th-note steps (MIDI numbers, 0 = rest)
    const MEL = [
      69,0,72,76, 74,72,71,72, 69,0,64,0, 69,71,72,74,
      76,0,74,72, 71,0,72,74, 76,0,72,0, 69,0,0,0,
      74,0,77,81, 79,77,76,77, 74,0,71,0, 72,74,76,77,
      76,0,72,0, 74,0,71,0, 69,72,71,68, 69,0,0,0 ];
    const BASS = [45,45,52,52, 41,41,48,48, 43,43,50,50, 40,40,47,47];
    function schedule() {
      while (nextTime < ctx.currentTime + .12) {
        const s = step % MEL.length, dur = 60 / 150 / 2;
        if (MEL[s]) note(hz(MEL[s]), nextTime, dur * .9, 'square', .16, musicGain);
        if (s % 4 === 0) note(hz(BASS[(s / 4) % BASS.length]), nextTime, dur * 3.6, 'triangle', .35, musicGain);
        if (s % 2 === 1) note(2200, nextTime, .03, 'square', .03, musicGain);
        nextTime += dur; step++;
      }
    }
    function startMusic() { ensure(); if (!ctx || playing) return; playing = true; nextTime = ctx.currentTime + .05; timer = setInterval(schedule, 25); }
    function stopMusic() { playing = false; clearInterval(timer); timer = 0; }
    const SFX = {
      move:   () => note(330, ctx.currentTime, .04, 'square', .12, sfxGain),
      rotate: () => note(520, ctx.currentTime, .06, 'square', .14, sfxGain, 700),
      lock:   () => note(140, ctx.currentTime, .09, 'triangle', .4, sfxGain, 90),
      drop:   () => note(260, ctx.currentTime, .12, 'sawtooth', .18, sfxGain, 80),
      hold:   () => note(440, ctx.currentTime, .08, 'triangle', .25, sfxGain, 330),
      clear:  n => { const t = ctx.currentTime; [523, 659, 784, 1047].slice(0, Math.max(2, n)).forEach((f, i) => note(f, t + i * .06, .16, 'square', .16, sfxGain)); },
      four:   () => { const t = ctx.currentTime; [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => note(f, t + i * .05, .22, 'square', .17, sfxGain)); },
      level:  () => { const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => note(f, t + i * .08, .2, 'triangle', .3, sfxGain)); },
      over:   () => { const t = ctx.currentTime; [392, 330, 262, 196].forEach((f, i) => note(f, t + i * .18, .3, 'sawtooth', .18, sfxGain)); },
    };
    function sfx(name, arg) { if (!ctx || !sfxOn) return; try { SFX[name](arg); } catch (e) {} }
    function setMusic(on) { musicOn = on; LS.set('mb_blocks_music', on); if (musicGain) musicGain.gain.value = on ? .22 : 0; }
    function setSfx(on) { sfxOn = on; LS.set('mb_blocks_sfx', on); if (sfxGain) sfxGain.gain.value = on ? .5 : 0; }
    return { ensure, startMusic, stopMusic, sfx, setMusic, setSfx, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; } };
  })();

  /* ------------------------------ game ------------------------------ */
  let cv, ctx, nextCv, nextCtx, holdCv, holdCtx, el = {};
  let grid, cur, bag = [], queue = [], hold = null, canHold = true;
  let score = 0, lines = 0, level = 1, best = LS.get('mb_blocks_best', 0);
  let state = 'ready', dropAcc = 0, lockAcc = 0, lockMoves = 0, last = 0, raf = 0, running = false, flash = [], flashT = 0;

  const rotateM = (m, dir) => { const n = m.length, r = m.map(row => row.slice());
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[y][x] = dir > 0 ? m[n - 1 - x][y] : m[x][n - 1 - y]; return r; };
  function refill() { const b = KINDS.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } bag.push(...b); }
  function take() { while (queue.length < 4) { if (!bag.length) refill(); queue.push(bag.shift()); } return queue.shift(); }
  function spawn(kind) {
    const s = SHAPES[kind];
    cur = { k: kind, m: s.m.map(r => r.slice()), x: Math.floor((COLS - s.m.length) / 2), y: kind === 'I' ? -1 : 0 };
    lockAcc = 0; lockMoves = 0;
    if (collides(cur.m, cur.x, cur.y)) gameOver();
  }
  function collides(m, ox, oy) {
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
      if (!m[y][x]) continue;
      const gx = ox + x, gy = oy + y;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
      if (gy >= 0 && grid[gy][gx]) return true;
    }
    return false;
  }
  const grounded = () => collides(cur.m, cur.x, cur.y + 1);
  function move(dx) {
    if (state !== 'play') return;
    if (!collides(cur.m, cur.x + dx, cur.y)) { cur.x += dx; Audio.sfx('move'); if (grounded() && lockMoves < 15) { lockAcc = 0; lockMoves++; } }
  }
  function rotate(dir) {
    if (state !== 'play' || cur.k === 'O') return;
    const m = rotateM(cur.m, dir);
    for (const [kx, ky] of KICKS) if (!collides(m, cur.x + kx, cur.y + ky)) {
      cur.m = m; cur.x += kx; cur.y += ky; Audio.sfx('rotate');
      if (grounded() && lockMoves < 15) { lockAcc = 0; lockMoves++; }
      return;
    }
  }
  function soft() { if (state !== 'play') return; if (!grounded()) { cur.y++; score += 1; dropAcc = 0; render(); } }
  function hard() {
    if (state !== 'play') return;
    let n = 0; while (!grounded()) { cur.y++; n++; }
    score += n * 2; Audio.sfx('drop'); lock();
  }
  function doHold() {
    if (state !== 'play' || !canHold) return;
    const k = cur.k;
    if (hold) { const h = hold; hold = k; spawn(h); } else { hold = k; spawn(take()); }
    canHold = false; Audio.sfx('hold'); drawMini(holdCtx, hold);
  }
  function lock() {
    for (let y = 0; y < cur.m.length; y++) for (let x = 0; x < cur.m.length; x++)
      if (cur.m[y][x]) { const gy = cur.y + y; if (gy < 0) { gameOver(); return; } grid[gy][cur.x + x] = SHAPES[cur.k].c; }
    const full = []; for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) full.push(y);
    if (full.length) {
      flash = full; flashT = .18;
      full.forEach(y => { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); });
      const before = level;
      lines += full.length; score += [0, 100, 300, 500, 800][full.length] * level;
      level = Math.floor(lines / 10) + 1;
      full.length === 4 ? Audio.sfx('four') : Audio.sfx('clear', full.length);
      if (level > before) setTimeout(() => Audio.sfx('level'), 250);
    } else Audio.sfx('lock');
    canHold = true; spawn(take()); drawMini(nextCtx, queue[0]); updateStats();
  }
  function gameOver() {
    state = 'over'; Audio.stopMusic(); Audio.sfx('over');
    if (score > best) { best = score; LS.set('mb_blocks_best', best); }
    updateStats(); showOverlay('Game over', `Score ${score.toLocaleString()} · Best ${best.toLocaleString()}`, 'Play again');
  }
  function reset() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    bag = []; queue = []; hold = null; canHold = true; score = 0; lines = 0; level = 1; dropAcc = 0; flash = [];
    spawn(take()); drawMini(nextCtx, queue[0]); drawMini(holdCtx, null); updateStats();
  }
  function startGame() {
    Audio.ensure(); reset(); state = 'play'; hideOverlay();
    if (Audio.musicOn) Audio.startMusic();
  }
  function pause() {
    if (state === 'play') { state = 'paused'; Audio.stopMusic(); showOverlay('Paused', 'Press P or tap Resume', 'Resume'); }
    else if (state === 'paused') { state = 'play'; hideOverlay(); if (Audio.musicOn) Audio.startMusic(); }
  }
  const gravity = () => Math.max(60, 800 - (level - 1) * 70) / 1000;

  function update(dt) {
    if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    if (grounded()) { lockAcc += dt; if (lockAcc >= .5) lock(); }
    else { dropAcc += dt; if (dropAcc >= gravity()) { dropAcc = 0; cur.y++; } }
  }
  function cell(c, x, y, color, alpha) {
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.fillStyle = color; c.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + 1, y + 1, CELL - 2, 5);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 1, y + CELL - 6, CELL - 2, 5);
    c.globalAlpha = 1;
  }
  function render() {
    ctx.fillStyle = '#111214'; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, ROWS * CELL); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL + .5); ctx.lineTo(COLS * CELL, y * CELL + .5); ctx.stroke(); }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x]) cell(ctx, x * CELL, y * CELL, grid[y][x]);
    if (cur && state !== 'over') {
      let gy = cur.y; while (!collides(cur.m, cur.x, gy + 1)) gy++;
      const col = SHAPES[cur.k].c;
      for (let y = 0; y < cur.m.length; y++) for (let x = 0; x < cur.m.length; x++) if (cur.m[y][x]) {
        if (gy + y >= 0) { ctx.strokeStyle = col; ctx.globalAlpha = .45; ctx.lineWidth = 2; ctx.strokeRect((cur.x + x) * CELL + 3, (gy + y) * CELL + 3, CELL - 6, CELL - 6); ctx.globalAlpha = 1; }
        if (cur.y + y >= 0) cell(ctx, (cur.x + x) * CELL, (cur.y + y) * CELL, col);
      }
    }
    if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${flashT * 2.5})`; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL); }
  }
  function drawMini(c, kind) {
    const W = c.canvas.width, H = c.canvas.height;
    c.clearRect(0, 0, W, H);
    if (!kind) return;
    const m = SHAPES[kind].m, s = 22;
    let minX = 9, maxX = -1, minY = 9, maxY = -1;
    m.forEach((r, y) => r.forEach((v, x) => { if (v) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } }));
    const ox = (W - (maxX - minX + 1) * s) / 2, oy = (H - (maxY - minY + 1) * s) / 2;
    m.forEach((r, y) => r.forEach((v, x) => { if (v) { c.fillStyle = SHAPES[kind].c; c.fillRect(ox + (x - minX) * s + 1, oy + (y - minY) * s + 1, s - 2, s - 2); } }));
  }
  function updateStats() {
    el.score.textContent = score.toLocaleString(); el.lines.textContent = lines; el.level.textContent = level; el.best.textContent = best.toLocaleString();
  }
  function showOverlay(t, sub, btn) { el.ovT.textContent = t; el.ovS.textContent = sub; el.ovB.textContent = btn; el.ov.style.display = 'flex'; }
  function hideOverlay() { el.ov.style.display = 'none'; }
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    update(dt); render();
    if (running) raf = requestAnimationFrame(loop);
  }

  /* ------------------------------ input ------------------------------ */
  function onKey(e) {
    if (!running) return;
    const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key;
    const handled = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowDown: soft, ArrowUp: () => rotate(1),
      x: () => rotate(1), X: () => rotate(1), z: () => rotate(-1), Z: () => rotate(-1), ' ': hard,
      c: doHold, C: doHold, Shift: doHold, p: pause, P: pause, Escape: pause, Enter: () => { if (state !== 'play') el.ovB.click(); } }[k];
    if (handled) { e.preventDefault(); if (state === 'ready' || state === 'over') { if (k === 'Enter' || k === ' ') startGame(); return; } handled(); }
  }
  function holdBtn(btn, fn, repeat) {
    let t1 = 0, t2 = 0;
    const stop = () => { clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); Audio.ensure(); fn(); if (repeat) t1 = setTimeout(() => { t2 = setInterval(fn, 55); }, 170); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
  }
  function swipe(target) {
    let sx = 0, sy = 0, moved = false, t0 = 0;
    target.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; moved = false; t0 = performance.now(); });
    target.addEventListener('pointermove', e => {
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 24) { move(dx > 0 ? 1 : -1); sx = e.clientX; moved = true; }
      if (e.clientY - sy > 26) { soft(); sy = e.clientY; moved = true; }
    });
    target.addEventListener('pointerup', e => {
      if (state !== 'play') return;
      const dy = e.clientY - sy, fast = performance.now() - t0 < 250;
      if (!moved) rotate(1); else if (dy > 60 && fast) hard();
    });
  }

  function init(root) {
    root.innerHTML = `
      <div class="bb">
        <div class="bb-side">
          <div class="bb-box"><span>Hold</span><canvas class="bb-hold" width="110" height="70"></canvas></div>
          <div class="bb-box"><span>Score</span><b class="bb-score">0</b></div>
          <div class="bb-box"><span>Lines</span><b class="bb-lines">0</b></div>
          <div class="bb-box"><span>Level</span><b class="bb-level">1</b></div>
          <div class="bb-box"><span>Best</span><b class="bb-best">0</b></div>
        </div>
        <div class="bb-well">
          <canvas class="bb-board"></canvas>
          <div class="bb-ov"><div class="bb-ov-in"><h3 class="bb-ov-t">Banana Blocks</h3><p class="bb-ov-s">Stack the blocks. Clear lines. Don't let it reach the top.</p><button class="bb-ov-b">Play</button></div></div>
        </div>
        <div class="bb-side">
          <div class="bb-box"><span>Next</span><canvas class="bb-next" width="110" height="70"></canvas></div>
          <button class="bb-toggle bb-music"></button>
          <button class="bb-toggle bb-sfx"></button>
          <button class="bb-toggle bb-pause">⏸ Pause</button>
          <div class="bb-keys">← → move<br>↑ / X rotate · Z back<br>↓ soft drop<br>Space hard drop<br>C hold · P pause</div>
        </div>
      </div>
      <div class="bb-pad">
        <button data-a="left" aria-label="Left">◀</button><button data-a="rot" aria-label="Rotate">⟳</button><button data-a="right" aria-label="Right">▶</button>
        <button data-a="hold" aria-label="Hold">⇄</button><button data-a="down" aria-label="Soft drop">▼</button><button data-a="drop" aria-label="Hard drop">⤓</button>
      </div>`;
    const q = s => root.querySelector(s);
    cv = q('.bb-board'); ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = COLS * CELL * dpr; cv.height = ROWS * CELL * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nextCtx = q('.bb-next').getContext('2d'); holdCtx = q('.bb-hold').getContext('2d');
    el = { score: q('.bb-score'), lines: q('.bb-lines'), level: q('.bb-level'), best: q('.bb-best'),
           ov: q('.bb-ov'), ovT: q('.bb-ov-t'), ovS: q('.bb-ov-s'), ovB: q('.bb-ov-b') };
    el.ovB.onclick = () => { if (state === 'paused') pause(); else startGame(); };
    const mBtn = q('.bb-music'), sBtn = q('.bb-sfx');
    const syncBtns = () => { mBtn.textContent = Audio.musicOn ? '♪ Music: on' : '♪ Music: off'; sBtn.textContent = Audio.sfxOn ? '🔊 Sounds: on' : '🔈 Sounds: off'; };
    mBtn.onclick = () => { Audio.ensure(); Audio.setMusic(!Audio.musicOn); if (Audio.musicOn && state === 'play') Audio.startMusic(); syncBtns(); };
    sBtn.onclick = () => { Audio.ensure(); Audio.setSfx(!Audio.sfxOn); syncBtns(); };
    q('.bb-pause').onclick = pause;
    syncBtns();
    const acts = { left: () => move(-1), right: () => move(1), rot: () => rotate(1), down: soft, drop: hard, hold: doHold };
    root.querySelectorAll('.bb-pad button').forEach(b => holdBtn(b, acts[b.dataset.a], ['left', 'right', 'down'].includes(b.dataset.a)));
    swipe(cv);
    window.addEventListener('keydown', onKey);
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    updateStats(); render();
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() {
    if (state === 'play') pause();
    running = false; cancelAnimationFrame(raf); Audio.stopMusic();
  }
  window.MBBlocks = { init, start, stop };
})();
