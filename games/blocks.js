/* Banana Blocks: falling-block puzzle with original music + sound effects.
   Modes: solo, 2 players on one keyboard, online versus (PeerJS, browser-to-browser). */
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
      garbage:() => { const t = ctx.currentTime; note(110, t, .16, 'sawtooth', .3, sfxGain, 60); note(90, t + .06, .16, 'square', .15, sfxGain, 55); },
      count:  n => note(n ? 660 : 990, ctx.currentTime, n ? .12 : .3, 'square', .2, sfxGain),
      win:    () => { const t = ctx.currentTime; [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => note(f, t + i * .1, .24, 'square', .17, sfxGain)); },
      over:   () => { const t = ctx.currentTime; [392, 330, 262, 196].forEach((f, i) => note(f, t + i * .18, .3, 'sawtooth', .18, sfxGain)); },
    };
    function sfx(name, arg) { if (!ctx || !sfxOn) return; try { SFX[name](arg); } catch (e) {} }
    function setMusic(on) { musicOn = on; LS.set('mb_blocks_music', on); if (musicGain) musicGain.gain.value = on ? .22 : 0; }
    function setSfx(on) { sfxOn = on; LS.set('mb_blocks_sfx', on); if (sfxGain) sfxGain.gain.value = on ? .5 : 0; }
    return { ensure, startMusic, stopMusic, sfx, setMusic, setSfx, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; } };
  })();


  /* ------------------------------ helpers ------------------------------ */
  const COLOR = { G: '#6b6f76' }; KINDS.forEach(k => COLOR[k] = SHAPES[k].c);
  const ATTACK = [0, 0, 1, 2, 4];           // garbage lines sent for 1/2/3/4 lines cleared
  const rotateM = (m, dir) => { const n = m.length, r = m.map(row => row.slice());
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[y][x] = dir > 0 ? m[n - 1 - x][y] : m[x][n - 1 - y]; return r; };
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  function setupCanvas(cv, cs) { const d = dpr(), c = cv.getContext('2d'); cv.width = COLS * cs * d; cv.height = ROWS * cs * d; c.setTransform(d, 0, 0, d, 0, 0); return c; }

  function cell(c, x, y, cs, color, alpha) {
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.fillStyle = color; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    const hi = Math.max(2, cs / 6);
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + 1, y + 1, cs - 2, hi);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 1, y + cs - 1 - hi, cs - 2, hi);
    c.globalAlpha = 1;
  }
  function drawWell(c, cs, at, flashT) {
    c.fillStyle = '#111214'; c.fillRect(0, 0, COLS * cs, ROWS * cs);
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { c.beginPath(); c.moveTo(x * cs + .5, 0); c.lineTo(x * cs + .5, ROWS * cs); c.stroke(); }
    for (let y = 1; y < ROWS; y++) { c.beginPath(); c.moveTo(0, y * cs + .5); c.lineTo(COLS * cs, y * cs + .5); c.stroke(); }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const k = at(x, y); if (k) cell(c, x * cs, y * cs, cs, COLOR[k] || COLOR.G); }
    if (flashT > 0) { c.fillStyle = `rgba(255,255,255,${flashT * 2.5})`; c.fillRect(0, 0, COLS * cs, ROWS * cs); }
  }
  function drawMini(c, kind) {
    if (!c) return;
    const W = c.canvas.width, H = c.canvas.height;
    c.clearRect(0, 0, W, H);
    if (!kind) return;
    const m = SHAPES[kind].m, s = 22;
    let minX = 9, maxX = -1, minY = 9, maxY = -1;
    m.forEach((r, y) => r.forEach((v, x) => { if (v) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } }));
    const ox = (W - (maxX - minX + 1) * s) / 2, oy = (H - (maxY - minY + 1) * s) / 2;
    m.forEach((r, y) => r.forEach((v, x) => { if (v) { c.fillStyle = SHAPES[kind].c; c.fillRect(ox + (x - minX) * s + 1, oy + (y - minY) * s + 1, s - 2, s - 2); } }));
  }

  /* ------------------------------ one board ------------------------------ */
  // o: { cv, cs, hold, next, els:{score,lines,level,meter}, versus, onAttack(n), onDead(b) }
  function Board(o) {
    const b = this;
    b.o = o; b.ctx = setupCanvas(o.cv, o.cs || CELL); b.cs = o.cs || CELL;
    b.grid = emptyGrid(); b.cur = null; b.dead = false; b.score = 0; b.lines = 0; b.level = 1; b.pending = 0; b.sent = 0;

    const take = () => { while (b.queue.length < 4) { if (!b.bag.length) { const x = KINDS.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(b.rand() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } b.bag.push(...x); } b.queue.push(b.bag.shift()); } return b.queue.shift(); };
    const collides = (m, ox, oy) => {
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
        if (!m[y][x]) continue;
        const gx = ox + x, gy = oy + y;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
        if (gy >= 0 && b.grid[gy][gx]) return true;
      }
      return false;
    };
    const grounded = () => collides(b.cur.m, b.cur.x, b.cur.y + 1);
    const live = () => G.state === 'play' && !b.dead;
    const touch = () => { if (grounded() && b.lockMoves < 15) { b.lockAcc = 0; b.lockMoves++; } };

    function spawn(kind) {
      const s = SHAPES[kind];
      b.cur = { k: kind, m: s.m.map(r => r.slice()), x: Math.floor((COLS - s.m.length) / 2), y: kind === 'I' ? -1 : 0 };
      b.lockAcc = 0; b.lockMoves = 0;
      if (collides(b.cur.m, b.cur.x, b.cur.y)) topOut();
    }
    function topOut() { if (b.dead) return; b.dead = true; Audio.sfx('over'); o.onDead && o.onDead(b); }
    function stats() {
      const e = o.els || {};
      if (e.score) e.score.textContent = b.score.toLocaleString();
      if (e.lines) e.lines.textContent = b.lines;
      if (e.level) e.level.textContent = b.level;
      if (e.meter) e.meter.style.height = Math.min(100, b.pending * 5) + '%';
    }
    b.stats = stats;
    function addGarbage() {
      const n = Math.min(b.pending, 10); if (!n) return;
      b.pending -= n;
      const removed = b.grid.splice(0, n);
      const hole = Math.floor(Math.random() * COLS);
      for (let i = 0; i < n; i++) { const row = Array(COLS).fill('G'); row[hole] = null; b.grid.push(row); }
      Audio.sfx('garbage');
      if (removed.some(r => r.some(Boolean))) topOut();
    }
    function lock() {
      const c = b.cur;
      for (let y = 0; y < c.m.length; y++) for (let x = 0; x < c.m.length; x++)
        if (c.m[y][x]) { const gy = c.y + y; if (gy < 0) { topOut(); return; } b.grid[gy][c.x + x] = c.k; }
      const full = []; for (let y = 0; y < ROWS; y++) if (b.grid[y].every(Boolean)) full.push(y);
      if (full.length) {
        b.flashT = .18;
        full.forEach(y => { b.grid.splice(y, 1); b.grid.unshift(Array(COLS).fill(null)); });
        const before = b.level, n = full.length;
        b.lines += n; b.score += [0, 100, 300, 500, 800][n] * b.level;
        b.level = Math.floor(b.lines / 10) + 1;
        n === 4 ? Audio.sfx('four') : Audio.sfx('clear', n);
        if (b.level > before && !o.versus) setTimeout(() => Audio.sfx('level'), 250);
        if (o.versus) {
          let atk = ATTACK[n];
          const cancel = Math.min(atk, b.pending); b.pending -= cancel; atk -= cancel;
          if (atk > 0) { b.sent += atk; o.onAttack && o.onAttack(atk); }
        }
      } else { Audio.sfx('lock'); if (b.pending) addGarbage(); }
      if (b.dead) { stats(); return; }
      b.canHold = true; spawn(take()); drawMini(o.next, b.queue[0]); stats();
    }

    b.reset = seed => {
      b.rand = seed != null ? mulberry(seed) : Math.random;
      b.grid = emptyGrid(); b.bag = []; b.queue = []; b.hold = null; b.canHold = true;
      b.score = 0; b.lines = 0; b.level = 1; b.pending = 0; b.sent = 0; b.dead = false;
      b.dropAcc = 0; b.lockAcc = 0; b.lockMoves = 0; b.flashT = 0;
      spawn(take()); drawMini(o.next, b.queue[0]); drawMini(o.hold, null); stats();
    };
    b.move = dx => { if (!live()) return; if (!collides(b.cur.m, b.cur.x + dx, b.cur.y)) { b.cur.x += dx; Audio.sfx('move'); touch(); } };
    b.rotate = dir => {
      if (!live() || b.cur.k === 'O') return;
      const m = rotateM(b.cur.m, dir);
      for (const [kx, ky] of KICKS) if (!collides(m, b.cur.x + kx, b.cur.y + ky)) { b.cur.m = m; b.cur.x += kx; b.cur.y += ky; Audio.sfx('rotate'); touch(); return; }
    };
    b.soft = () => { if (!live()) return; if (!grounded()) { b.cur.y++; b.score += 1; b.dropAcc = 0; } };
    b.hard = () => { if (!live()) return; let n = 0; while (!grounded()) { b.cur.y++; n++; } b.score += n * 2; Audio.sfx('drop'); lock(); };
    b.doHold = () => {
      if (!live() || !b.canHold) return;
      const k = b.cur.k;
      if (b.hold) { const h = b.hold; b.hold = k; spawn(h); } else { b.hold = k; spawn(take()); }
      b.canHold = false; Audio.sfx('hold'); drawMini(o.hold, b.hold);
    };
    b.receive = n => { b.pending = Math.min(20, b.pending + n); stats(); };
    b.update = dt => {
      if (b.flashT > 0) b.flashT -= dt;
      if (!live()) return;
      const grav = Math.max(60, 800 - (b.level - 1) * 70) / 1000;
      if (grounded()) { b.lockAcc += dt; if (b.lockAcc >= .5) lock(); }
      else { b.dropAcc += dt; if (b.dropAcc >= grav) { b.dropAcc = 0; b.cur.y++; } }
    };
    b.render = () => {
      const c = b.ctx, cs = b.cs, cur = b.cur;
      drawWell(c, cs, (x, y) => b.grid[y][x], b.flashT);
      if (cur && !b.dead && G.state !== 'ready') {
        let gy = cur.y; while (!collides(cur.m, cur.x, gy + 1)) gy++;
        const col = COLOR[cur.k];
        for (let y = 0; y < cur.m.length; y++) for (let x = 0; x < cur.m.length; x++) if (cur.m[y][x]) {
          if (gy + y >= 0) { c.strokeStyle = col; c.globalAlpha = .45; c.lineWidth = 2; c.strokeRect((cur.x + x) * cs + 3, (gy + y) * cs + 3, cs - 6, cs - 6); c.globalAlpha = 1; }
          if (cur.y + y >= 0) cell(c, (cur.x + x) * cs, (cur.y + y) * cs, cs, col);
        }
      }
      if (b.dead) { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, COLS * cs, ROWS * cs); }
    };
    // compact 200-char picture of the board (current piece merged in), sent to the online opponent
    b.snapshot = () => {
      const a = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) a.push(b.grid[y][x] || '.');
      const c = b.cur;
      if (c && !b.dead) for (let y = 0; y < c.m.length; y++) for (let x = 0; x < c.m.length; x++)
        if (c.m[y][x] && c.y + y >= 0 && c.y + y < ROWS) a[(c.y + y) * COLS + c.x + x] = c.k;
      return a.join('');
    };
  }

  /* ------------------------------ game controller ------------------------------ */
  const G = { mode: 'solo', state: 'ready', boards: [], me: null, countT: 0, seed: 0, best: LS.get('mb_blocks_best', 0) };
  let root, el = {}, running = false, raf = 0, last = 0;
  let sessionName = null;   // name typed in this window (so two tabs on one PC keep their own names)
  const myName = () => (sessionName != null ? sessionName : (LS.get('mb_flappy_name', '') || '').toString()).slice(0, 16);

  const CSS = `
  .bb-modes{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 18px}
  .bb-modes button{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:980px;font:inherit;font-size:14px;padding:8px 16px;cursor:pointer}
  .bb-modes button.on{background:#ffd43b;border-color:#ffd43b;color:#111;font-weight:700}
  .bb-vs{position:relative;display:flex;gap:22px;justify-content:center;align-items:flex-start;min-height:420px}
  .bb-p{display:flex;flex-direction:column;gap:8px}
  .bb-p-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:14px;color:var(--ink2)}
  .bb-p-head b{color:var(--ink);font-size:16px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bb-p-row{display:flex;gap:8px;align-items:flex-start}
  .bb-p-mini{display:flex;flex-direction:column;gap:4px;width:74px;font-size:11px;color:var(--ink2);text-transform:uppercase;letter-spacing:.06em}
  .bb-p-mini canvas{width:100%;height:auto;background:var(--tile);border-radius:10px;margin-bottom:6px}
  .bb-p .bb-board{width:min(260px,34vw)}
  .bb-p.opp .bb-board{width:min(180px,26vw)}
  .bb-meter{position:absolute;left:0;bottom:0;width:6px;height:0;background:#ff6b6b;z-index:2;transition:height .15s}
  .bb-vs > .bb-ov{border-radius:18px}
  .bb-ov-in input{display:block;width:100%;box-sizing:border-box;margin:0 0 10px;border:0;border-radius:12px;padding:11px 14px;font:inherit;font-size:16px;background:#fff;color:#111;text-align:center}
  .bb-ov-in .bb-code{letter-spacing:.3em;text-transform:uppercase;font-weight:700}
  .bb-ov-in .bb-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .bb-ov-in .bb-row input{flex:1;min-width:0;margin:0}
  .bb-ov-in .bb-alt{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5)}
  .bb-ov-in .bb-big{font-size:64px;font-weight:800;color:#ffd43b;margin:0}
  .bb-ov-in .bb-roomcode{font-size:40px;font-weight:800;letter-spacing:.25em;color:#ffd43b;margin:4px 0 8px}
  .bb-ov-in .bb-or{color:#a1a1a6;font-size:13px;margin:12px 0}
  .bb-ov-in{max-width:300px}
  .bb-ov-in .bb-msg{min-height:20px;color:#ffd43b;font-size:13px;margin:10px 0 0}
  .bb-vs-bar{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
  .bb-vs-bar .bb-toggle{text-align:center}
  .bb-vs-keys{color:var(--ink2);font-size:12px;text-align:center;margin-top:8px;line-height:1.6}
  .bb-rivals{max-width:420px;margin:22px auto 0;background:var(--tile);border-radius:18px;padding:16px 18px;text-align:left}
  .bb-rivals h4{margin:0 0 8px;font-size:15px}
  .bb-rivals ul{list-style:none;margin:0;padding:0}
  .bb-rivals li{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line);font-size:15px}
  .bb-rivals li:last-child{border-bottom:0}
  .bb-rivals li span:last-child{text-align:right}
  .bb-rivals li .lead{font-weight:700}
  .bb-rivals li b{font-variant-numeric:tabular-nums}
  .bb-riv-empty{color:var(--ink2);font-size:14px;margin:0}
  .bb-ov-in .bb-alltime{color:#ffd43b;font-weight:600;min-height:20px}
  @media (max-width:760px){
    .bb-vs{gap:10px;min-height:360px}
    .bb-p-mini{width:46px;font-size:9px}
    .bb-p .bb-board{width:min(220px,46vw)}
    .bb-p.opp .bb-board{width:min(150px,26vw)}
    .bb-p-head b{max-width:90px;font-size:14px}
    .bb-p-head{font-size:12px}
  }`;

  /* ---------- markup ---------- */
  const PAD = `<div class="bb-pad">
        <button data-a="left" aria-label="Left">◀</button><button data-a="rot" aria-label="Rotate">⟳</button><button data-a="right" aria-label="Right">▶</button>
        <button data-a="hold" aria-label="Hold">⇄</button><button data-a="down" aria-label="Soft drop">▼</button><button data-a="drop" aria-label="Hard drop">⤓</button>
      </div>`;
  const OV = `<div class="bb-ov"><div class="bb-ov-in"></div></div>`;
  const panel = (cls, mini) => `
      <div class="bb-p ${cls}">
        <div class="bb-p-head"><b class="bb-n"></b><span><span class="bb-ln">0</span> lines</span></div>
        <div class="bb-p-row">
          ${mini ? `<div class="bb-p-mini">Hold<canvas class="bb-hold" width="110" height="70"></canvas>Next<canvas class="bb-next" width="110" height="70"></canvas></div>` : ''}
          <div class="bb-well"><div class="bb-meter"></div><canvas class="bb-board"></canvas></div>
        </div>
      </div>`;
  function soloMarkup() {
    return `
      <div class="bb">
        <div class="bb-side">
          <div class="bb-box"><span>Hold</span><canvas class="bb-hold" width="110" height="70"></canvas></div>
          <div class="bb-box"><span>Score</span><b class="bb-score">0</b></div>
          <div class="bb-box"><span>Lines</span><b class="bb-lines">0</b></div>
          <div class="bb-box"><span>Level</span><b class="bb-level">1</b></div>
          <div class="bb-box"><span>Best</span><b class="bb-best">0</b></div>
        </div>
        <div class="bb-well"><canvas class="bb-board"></canvas>${OV}</div>
        <div class="bb-side">
          <div class="bb-box"><span>Next</span><canvas class="bb-next" width="110" height="70"></canvas></div>
          <button class="bb-toggle bb-music"></button>
          <button class="bb-toggle bb-sfx"></button>
          <button class="bb-toggle bb-pause">⏸ Pause</button>
          <div class="bb-keys">← → move<br>↑ / X rotate · Z back<br>↓ soft drop<br>Space hard drop<br>C hold · P pause</div>
        </div>
      </div>${PAD}`;
  }
  function vsMarkup(online) {
    const keys = online
      ? '← → move · ↑ / X rotate · ↓ soft drop · Space hard drop · C hold. Clear 2+ lines at once to send junk rows to your friend.'
      : '<b>Player 1:</b> A D move · W rotate · S soft drop · Space hard drop · Q hold<br><b>Player 2:</b> ← → move · ↑ rotate · ↓ soft drop · Enter hard drop · Right Shift hold<br>Clear 2+ lines at once to send junk rows to the other player.';
    return `
      <div class="bb-vs">
        ${panel('p0', true)}
        ${online ? panel('opp', false) : panel('p1', true)}
        ${OV}
      </div>
      <div class="bb-vs-bar"><button class="bb-toggle bb-music"></button><button class="bb-toggle bb-sfx"></button>${online ? '' : '<button class="bb-toggle bb-pause">⏸ Pause</button>'}</div>
      <div class="bb-vs-keys bb-keys">${keys}</div>
      ${online ? PAD + '<div class="bb-rivals"></div>' : ''}`;
  }

  /* ---------- overlay ---------- */
  function overlay(html, binds) {
    el.ovIn.innerHTML = html; el.ov.style.display = 'flex';
    Object.entries(binds || {}).forEach(([sel, fn]) => { const n = el.ovIn.querySelector(sel); if (n) n.onclick = fn; });
  }
  function hideOverlay() { el.ov.style.display = 'none'; }
  const ovMsg = t => { const m = el.ovIn.querySelector('.bb-msg'); if (m) m.textContent = t; };

  /* ---------- building a mode ---------- */
  function build(mode) {
    Net.close();
    Audio.stopMusic();
    G.mode = mode; G.state = 'ready'; G.boards = []; G.me = null; G.opp = null; G.keys = {};
    root.querySelectorAll('.bb-modes button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    const stage = root.querySelector('.bb-stage');
    stage.innerHTML = mode === 'solo' ? soloMarkup() : vsMarkup(mode === 'online');
    const q = s => stage.querySelector(s);
    el.ov = q('.bb-ov'); el.ovIn = q('.bb-ov-in');
    const mBtn = q('.bb-music'), sBtn = q('.bb-sfx');
    const syncBtns = () => { mBtn.textContent = Audio.musicOn ? '♪ Music: on' : '♪ Music: off'; sBtn.textContent = Audio.sfxOn ? '🔊 Sounds: on' : '🔈 Sounds: off'; };
    mBtn.onclick = () => { Audio.ensure(); Audio.setMusic(!Audio.musicOn); if (Audio.musicOn && G.state === 'play') Audio.startMusic(); syncBtns(); };
    sBtn.onclick = () => { Audio.ensure(); Audio.setSfx(!Audio.sfxOn); syncBtns(); };
    syncBtns();
    const pz = q('.bb-pause'); if (pz) pz.onclick = pause;

    if (mode === 'solo') {
      el.best = q('.bb-best'); el.best.textContent = G.best.toLocaleString();
      const b = new Board({ cv: q('.bb-board'), hold: q('.bb-hold').getContext('2d'), next: q('.bb-next').getContext('2d'),
        els: { score: q('.bb-score'), lines: q('.bb-lines'), level: q('.bb-level') }, onDead: soloOver });
      G.boards = [b]; G.me = b; b.render();
      overlay(`<h3>Banana Blocks</h3><p>Stack the blocks. Clear lines. Don't let it reach the top.</p><button class="bb-ov-b bb-go">Play</button>`, { '.bb-go': () => countdown(null) });
    } else {
      const mk = (p, extra) => {
        const P = q('.' + p), hq = P.querySelector('.bb-hold'), nq = P.querySelector('.bb-next');
        return new Board(Object.assign({ cv: P.querySelector('.bb-board'), hold: hq && hq.getContext('2d'), next: nq && nq.getContext('2d'), versus: true,
          els: { lines: P.querySelector('.bb-ln'), meter: P.querySelector('.bb-meter') } }, extra));
      };
      if (mode === 'local') {
        const a = mk('p0', { onDead: () => vsOver(1) }), b = mk('p1', { onDead: () => vsOver(0) });
        a.o.onAttack = n => b.receive(n); b.o.onAttack = n => a.receive(n);
        q('.p0 .bb-n').textContent = 'Player 1'; q('.p1 .bb-n').textContent = 'Player 2';
        G.boards = [a, b]; G.wins = [0, 0];
        G.boards.forEach(x => x.render());
        overlay(`<h3>2 players</h3><p>Same keyboard, side by side. Player 1 uses W A S D, Player 2 uses the arrow keys. First to top out loses.</p><button class="bb-ov-b bb-go">Start</button>`, { '.bb-go': () => countdown(Date.now() % 1e9) });
      } else {
        const me = mk('p0', { onDead: () => { Net.send({ t: 'ko' }); vsOver(1); }, onAttack: n => Net.send({ t: 'atk', n }) });
        G.boards = [me]; G.me = me; me.render();
        G.opp = { cv: q('.opp .bb-board'), name: q('.opp .bb-n'), lines: q('.opp .bb-ln'), meter: q('.opp .bb-meter'), snap: '' };
        G.opp.ctx = setupCanvas(G.opp.cv, 18);
        q('.p0 .bb-n').textContent = myName() || 'You'; G.opp.name.textContent = 'Friend';
        drawOpp(); lobby(); Rec.render(); Rec.load();
      }
    }
    // touch pad acts on your own board (solo / online)
    stage.querySelectorAll('.bb-pad button').forEach(btn => holdBtn(btn, btn.dataset.a));
    const cv = G.me && G.me.o.cv; if (cv) swipe(cv);
  }

  /* ---------- flow ---------- */
  function countdown(seed) {
    Audio.ensure(); Audio.stopMusic(); hideOverlay();
    G.seed = seed; G.boards.forEach(b => b.reset(seed));
    if (G.opp) { G.opp.snap = ''; drawOpp(); }
    G.state = 'count'; G.countT = G.mode === 'solo' ? 0 : 3; G.lastCount = -1;
    if (G.mode === 'solo') startPlay();
  }
  function startPlay() { G.state = 'play'; hideOverlay(); if (Audio.musicOn) Audio.startMusic(); }
  function soloOver() {
    G.state = 'over'; G.overAt = performance.now(); Audio.stopMusic();
    const s = G.me.score;
    if (G.me.lines >= 10) window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why: 'clearing ' + G.me.lines + ' lines in Banana Blocks', lucky: true } }));
    if (s > G.best) { G.best = s; LS.set('mb_blocks_best', s); el.best.textContent = s.toLocaleString(); }
    overlay(`<h3>Game over</h3><p>Score ${s.toLocaleString()} · Best ${G.best.toLocaleString()}</p><button class="bb-ov-b bb-go">Play again</button>`, { '.bb-go': () => countdown(null) });
  }
  function vsOver(winner) {
    if (G.state !== 'play') return;
    G.state = 'over'; G.overAt = performance.now(); Audio.stopMusic();
    if (G.mode === 'local') {
      G.wins[winner]++;
      setTimeout(() => Audio.sfx('win'), 600);
      overlay(`<h3>🏆 Player ${winner + 1} wins!</h3><p>Score: Player 1 ${G.wins[0]} – ${G.wins[1]} Player 2</p><button class="bb-ov-b bb-go">Rematch</button>`, { '.bb-go': () => countdown(Date.now() % 1e9) });
    } else {
      const won = winner === 0;
      if (won) setTimeout(() => Audio.sfx('win'), 300);
      Net.score[won ? 0 : 1]++;
      overlay(`<h3>${won ? '🏆 You win!' : 'You lost 🙈'}</h3><p>Tonight: You ${Net.score[0]} – ${Net.score[1]} ${esc(Net.oppName)}</p><p class="bb-alltime"></p><button class="bb-ov-b bb-go">Rematch</button><p class="bb-msg"></p>`, { '.bb-go': rematch });
      const me = myName(), opp = Net.oppName;
      // the winner's browser saves the result; the match ID (same on both sides) stops double counting
      if (won) Rec.post(me, opp, 'bb-' + G.seed + '-' + [me, opp].map(x => x.toLowerCase()).sort().join('-'));
      else setTimeout(() => Rec.load(), 3500);
    }
  }

  /* ---------- all-time head-to-head records (saved in the site's Google Sheet) ---------- */
  const Rec = {
    list: [],
    device() { let id = null; try { id = localStorage.getItem('mb_voter'); } catch (e) {}
      if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', id); } catch (e) {} } return id; },
    load() {
      if (!window.MB_API) return;
      fetch(window.MB_API + '?action=rivals').then(r => r.json()).then(d => { if (d.ok) { this.list = d.rivals || []; this.render(); } }).catch(() => {});
    },
    post(winner, loser, matchId) {
      if (!window.MB_API || !winner || !loser) return;
      fetch(window.MB_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'match', winner, loser, matchId, voter: this.device() }) })
        .then(r => r.json()).then(d => { if (d.ok && d.rivals) { this.list = d.rivals; this.render(); } }).catch(() => {});
    },
    h2h(a, b) {
      const A = (a || '').toLowerCase(), B = (b || '').toLowerCase();
      const r = this.list.find(x => (x.a.toLowerCase() === A && x.b.toLowerCase() === B) || (x.a.toLowerCase() === B && x.b.toLowerCase() === A));
      if (!r) return null;
      return r.a.toLowerCase() === A ? [r.aw, r.bw] : [r.bw, r.aw];
    },
    render() {
      const box = root && root.querySelector('.bb-rivals');
      if (box) {
        if (!this.list.length) box.innerHTML = '<h4>Rivalries</h4><p class="bb-riv-empty">No online matches yet. Win one to get on the board.</p>';
        else {
          box.innerHTML = '<h4>Rivalries</h4>';
          const ul = document.createElement('ul');
          this.list.slice(0, 12).forEach(r => {
            const li = document.createElement('li');
            const lead = r.aw === r.bw ? 0 : r.aw > r.bw ? 1 : 2;
            li.innerHTML = `<span class="${lead === 1 ? 'lead' : ''}">${esc(r.a)}</span><b>${r.aw} – ${r.bw}</b><span class="${lead === 2 ? 'lead' : ''}">${esc(r.b)}</span>`;
            ul.appendChild(li);
          });
          box.appendChild(ul);
        }
      }
      const at = el.ovIn && el.ovIn.querySelector('.bb-alltime');
      if (at && G.mode === 'online') { const h = this.h2h(myName(), Net.oppName); at.textContent = h ? `All-time: You ${h[0]} – ${h[1]} ${Net.oppName}` : ''; }
    }
  };
  function rematch() { const seed = 1 + Math.floor(Math.random() * 1e9); Net.send({ t: 'go', seed }); countdown(seed); }
  function pause() {
    if (G.mode === 'online') return;              // can't pause a live match
    if (G.state === 'play') {
      G.state = 'paused'; Audio.stopMusic();
      overlay(`<h3>Paused</h3><p>Press P or tap Resume</p><button class="bb-ov-b bb-go">Resume</button>`, { '.bb-go': pause });
    } else if (G.state === 'paused') { startPlay(); }
  }

  /* ---------- online (PeerJS: direct browser-to-browser) ---------- */
  const Net = {
    peer: null, conn: null, score: [0, 0], oppName: 'Friend', lastSent: 0, lastSnap: '', seen: 0, hb: 0,
    load() {
      if (window.Peer) return Promise.resolve();
      const srcs = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
      return srcs.reduce((p, src) => p.catch(() => new Promise((ok, bad) => {
        const s = document.createElement('script'); s.src = src; s.onload = () => window.Peer ? ok() : bad(); s.onerror = bad; document.head.appendChild(s);
      })), Promise.reject());
    },
    close() {
      try { this.conn && this.conn.close(); } catch (e) {}
      try { this.peer && this.peer.destroy(); } catch (e) {}
      this.conn = null; this.peer = null; this.score = [0, 0];
      clearInterval(this.hb); this.hb = 0;
    },
    send(m) { try { if (this.conn && this.conn.open) this.conn.send(m); } catch (e) {} },
    wire(conn) {
      this.conn = conn; this.seen = Date.now();
      conn.on('data', m => { this.seen = Date.now(); onNet(m); });
      conn.on('open', () => { this.seen = Date.now(); });
      // heartbeat: if we hear nothing for a while, the friend closed their tab or lost connection
      clearInterval(this.hb);
      this.hb = setInterval(() => {
        if (this.conn !== conn) return;
        this.send({ t: 'hb' });
        const quiet = Date.now() - this.seen, limit = G.state === 'play' ? 15000 : 90000;
        if (conn.open && quiet > limit) { this.conn = null; friendLeft(); }
      }, 2000);
      conn.on('close', () => { if (this.conn !== conn) return; this.conn = null; friendLeft(); });
      conn.on('error', () => {});
    }
  };
  const ROOM = c => 'monkeyboyz-bb-' + c.toLowerCase();
  function lobby(msg) {
    overlay(`<h3>Online versus</h3>
      <p>Play a friend live, each on your own device. One of you makes a room, the other joins with the code.</p>
      <input class="bb-name" maxlength="16" placeholder="Your name" value="${esc(myName())}">
      <button class="bb-ov-b bb-create">Create room</button>
      <div class="bb-or">or join a friend's room</div>
      <div class="bb-row"><input class="bb-code" maxlength="4" placeholder="CODE" autocomplete="off"><button class="bb-ov-b bb-alt bb-join">Join</button></div>
      <p class="bb-msg">${esc(msg || '')}</p>`, { '.bb-create': createRoom, '.bb-join': joinRoom });
    const code = el.ovIn.querySelector('.bb-code');
    code.addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });
    code.addEventListener('input', () => { code.value = code.value.toUpperCase().replace(/[^A-Z]/g, ''); });
  }
  function saveName() {
    const n = el.ovIn.querySelector('.bb-name'); const v = n ? n.value.trim().replace(/\s+/g, ' ').slice(0, 16) : '';
    sessionName = v; if (v) LS.set('mb_flappy_name', v);
    root.querySelector('.p0 .bb-n').textContent = v || 'You';
    if (!v) { ovMsg('Type your name first so your wins get saved.'); if (n) n.focus(); }
    return v;
  }
  function createRoom() {
    if (!saveName()) return; ovMsg('Making a room…');
    const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    Net.load().then(() => {
      Net.close();
      const peer = Net.peer = new Peer(ROOM(code));
      peer.on('open', () => {
        overlay(`<h3>Room code</h3><div class="bb-roomcode">${code}</div><p>Send this code to your friend. They pick <b>Online</b> in Banana Blocks and type it in.</p>
          <div class="bb-row"><button class="bb-ov-b bb-alt bb-copy">Copy code</button><button class="bb-ov-b bb-alt bb-cancel">Cancel</button></div><p class="bb-msg">Waiting for your friend…</p>`,
          { '.bb-copy': () => { try { navigator.clipboard.writeText(code); ovMsg('Copied! Waiting for your friend…'); } catch (e) {} }, '.bb-cancel': () => { Net.close(); lobby(); } });
      });
      peer.on('connection', conn => {
        if (Net.conn && Net.conn.open) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 500); }); return; }
        Net.wire(conn);
        conn.on('open', () => Net.send({ t: 'hi', name: myName() || 'Friend' }));
      });
      peer.on('error', e => {
        if (e.type === 'unavailable-id') return createRoom();
        if (!Net.conn) lobby('Couldn\'t make a room (' + (e.type || 'network') + '). Try again.');
      });
    }).catch(() => lobby('Couldn\'t load online play. Check your connection and try again.'));
  }
  function joinRoom() {
    const code = (el.ovIn.querySelector('.bb-code').value || '').toUpperCase().trim();
    if (!/^[A-Z]{4}$/.test(code)) { ovMsg('Type the 4-letter room code.'); return; }
    if (!saveName()) return; ovMsg('Connecting…');
    Net.load().then(() => {
      Net.close();
      const peer = Net.peer = new Peer();
      let done = false;
      const fail = m => { if (done) return; done = true; Net.close(); lobby(m); };
      const timer = setTimeout(() => fail('Couldn\'t reach that room. Check the code, or have your friend make a new one.'), 15000);
      peer.on('open', () => {
        const conn = peer.connect(ROOM(code), { reliable: true });
        Net.wire(conn);
        conn.on('open', () => { done = true; clearTimeout(timer); Net.send({ t: 'hi', name: myName() || 'Friend' }); });
      });
      peer.on('error', e => { clearTimeout(timer); fail(e.type === 'peer-unavailable' ? 'No room with that code. Check it and try again.' : 'Connection problem (' + (e.type || 'network') + '). Try again.'); });
    }).catch(() => lobby('Couldn\'t load online play. Check your connection and try again.'));
  }
  function ready() {
    overlay(`<h3>Vs ${esc(Net.oppName)}</h3><p>You're connected. Either of you can start, and you'll both get the same blocks in the same order.</p><p class="bb-alltime"></p><button class="bb-ov-b bb-go">Start match</button><p class="bb-msg"></p>`, { '.bb-go': rematch });
    Rec.render();
  }
  function friendLeft() {
    if (G.mode !== 'online') return;
    Audio.stopMusic(); G.state = 'ready';
    Net.close();
    lobby(`${Net.oppName} left the room.`);
  }
  function onNet(m) {
    if (!m || typeof m !== 'object' || G.mode !== 'online') return;
    if (m.t === 'hi') {
      Net.oppName = String(m.name || 'Friend').slice(0, 16); G.opp.name.textContent = Net.oppName;
      if (G.state === 'ready' || G.state === 'over') ready();
    } else if (m.t === 'full') { Net.close(); lobby('That room already has two players.'); }
    else if (m.t === 'go') {
      const seed = Number(m.seed) || 1;
      if (G.state === 'count' && G.seed != null && seed >= G.seed) return;   // both pressed start: lower seed wins
      if (G.state === 'play') return;
      countdown(seed);
    } else if (m.t === 's') {
      if (typeof m.g === 'string' && m.g.length === COLS * ROWS) G.opp.snap = m.g;
      G.opp.lines.textContent = Number(m.ln) || 0;
      G.opp.meter.style.height = Math.min(100, (Number(m.pd) || 0) * 5) + '%';
    } else if (m.t === 'atk') {
      if (G.state === 'play' && G.me) G.me.receive(Math.max(0, Math.min(4, Number(m.n) || 0)));
    } else if (m.t === 'ko') {
      if (G.state === 'play') vsOver(0);
    }
  }
  function drawOpp() {
    const o = G.opp; if (!o) return;
    const s = o.snap;
    drawWell(o.ctx, 18, (x, y) => { const ch = s ? s[y * COLS + x] : '.'; return ch && ch !== '.' ? ch : null; }, 0);
  }

  /* ---------- loop ---------- */
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (G.state === 'count') {
      G.countT -= dt;
      const n = Math.ceil(G.countT);
      if (n !== G.lastCount) {
        G.lastCount = n;
        if (n > 0) { Audio.sfx('count', 1); overlay(`<p class="bb-big">${n}</p><p>${G.mode === 'online' ? 'Vs ' + esc(Net.oppName) : 'Get ready…'}</p>`); }
      }
      if (G.countT <= 0) { Audio.sfx('count', 0); startPlay(); }
    }
    if (G.state === 'play') repeatKeys(dt);
    G.boards.forEach(b => { b.update(dt); b.render(); });
    if (G.mode === 'online' && G.me && Net.conn && (G.state === 'play' || G.state === 'over') && now - Net.lastSent > 100) {
      const g = G.me.snapshot(), key = g + G.me.lines + ':' + G.me.pending;
      if (key !== Net.lastSnap) { Net.lastSnap = key; Net.lastSent = now; Net.send({ t: 's', g, ln: G.me.lines, pd: G.me.pending }); }
    }
    if (G.opp) drawOpp();
    if (running) raf = requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  // key code -> [player index, action]; move/soft auto-repeat is handled here so two players can hold keys at once
  const KEYMAP = {
    single: { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', KeyX: 'rot', KeyZ: 'back', Space: 'drop', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold' },
    p0: { KeyA: 'left', KeyD: 'right', KeyS: 'down', KeyW: 'rot', Space: 'drop', KeyQ: 'hold', KeyE: 'back' },
    p1: { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', Enter: 'drop', NumpadEnter: 'drop', ShiftRight: 'hold', Slash: 'back' }
  };
  const REPEAT = { left: 1, right: 1, down: 1 };
  function act(b, a) {
    if (!b) return;
    ({ left: () => b.move(-1), right: () => b.move(1), down: b.soft, rot: () => b.rotate(1), back: () => b.rotate(-1), drop: b.hard, hold: b.doHold })[a]();
  }
  function lookup(code) {
    if (G.mode === 'local') { if (KEYMAP.p0[code]) return [0, KEYMAP.p0[code]]; if (KEYMAP.p1[code]) return [1, KEYMAP.p1[code]]; return null; }
    return KEYMAP.single[code] ? [0, KEYMAP.single[code]] : null;
  }
  function onKey(e) {
    if (!running) return;
    const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'KeyP' || e.code === 'Escape') { if (G.state === 'play' || G.state === 'paused') { e.preventDefault(); pause(); } return; }
    const hit = lookup(e.code);
    if (G.state !== 'play') {
      if ((e.code === 'Enter' || e.code === 'Space') && el.ov.style.display !== 'none' && (G.mode === 'solo' || G.state === 'ready' && G.mode === 'local') && performance.now() - (G.overAt || 0) > 1200) {
        const go = el.ovIn.querySelector('.bb-go'); if (go) { e.preventDefault(); go.click(); }
      } else if (hit) e.preventDefault();
      return;
    }
    if (!hit) return;
    e.preventDefault();
    if (e.repeat) return;
    const [p, a] = hit;
    act(G.boards[p], a);
    if (REPEAT[a]) G.keys[e.code] = { p, a, t: 0, r: 0 };
  }
  function onKeyUp(e) { if (G.keys) delete G.keys[e.code]; }
  function repeatKeys(dt) {
    for (const k in G.keys) {
      const h = G.keys[k]; h.t += dt;
      const delay = h.a === 'down' ? .05 : .17;
      if (h.t >= delay) { h.r += dt; while (h.r >= .05) { h.r -= .05; act(G.boards[h.p], h.a); } }
    }
  }
  function holdBtn(btn, a) {
    let t1 = 0, t2 = 0;
    const stop = () => { clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); Audio.ensure(); act(G.me, a); if (REPEAT[a]) t1 = setTimeout(() => { t2 = setInterval(() => act(G.me, a), 55); }, 170); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
  }
  function swipe(target) {
    let sx = 0, sy = 0, moved = false, t0 = 0;
    let y0 = 0;
    target.addEventListener('pointerdown', e => { sx = e.clientX; sy = y0 = e.clientY; moved = false; t0 = performance.now(); });
    target.addEventListener('pointermove', e => {
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 24) { act(G.me, dx > 0 ? 'right' : 'left'); sx = e.clientX; moved = true; }
      if (e.clientY - sy > 26) { act(G.me, 'down'); sy = e.clientY; moved = true; }
    });
    target.addEventListener('pointerup', e => {
      if (G.state !== 'play') return;
      const fast = performance.now() - t0 < 250;
      if (!moved) act(G.me, 'rot'); else if (fast && e.clientY - y0 > 60) act(G.me, 'drop');
    });
  }

  /* ---------- public ---------- */
  function init(r) {
    root = r;
    if (!document.getElementById('bb-vs-css')) { const st = document.createElement('style'); st.id = 'bb-vs-css'; st.textContent = CSS; document.head.appendChild(st); }
    root.innerHTML = `<div class="bb-modes">
        <button data-m="solo">🍌 Solo</button><button data-m="local">👥 2 players</button><button data-m="online">🌐 Online versus</button>
      </div><div class="bb-stage"></div>`;
    root.querySelectorAll('.bb-modes button').forEach(b => b.onclick = () => { if (b.dataset.m !== G.mode || G.state !== 'ready') build(b.dataset.m); });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => { G.keys = {}; });
    build('solo');
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() {
    if (G.mode === 'online') { if (Net.conn || Net.peer) build('online'); }
    else if (G.state === 'play') pause();
    else if (G.state === 'count') { G.state = 'ready'; build(G.mode); }
    running = false; cancelAnimationFrame(raf); Audio.stopMusic(); G.keys = {};
  }
  window.MBBlocks = { init, start, stop };
})();
