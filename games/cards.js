/* MonkeyBoyz trading cards: 100 variants of every member, packs, a binder, and the Gerson easter egg.
   Collections are saved in each player's browser. */
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------ card design data ------------------------------ */
  // Variant numbers decide rarity: #1–50 common … #100 is the one-of-one.
  const RAR = [
    { id: 'common',    name: 'Common',    from: 1,   to: 50,  odds: .60,  color: '#8e949c' },
    { id: 'uncommon',  name: 'Uncommon',  from: 51,  to: 75,  odds: .25,  color: '#2ea043' },
    { id: 'rare',      name: 'Rare',      from: 76,  to: 88,  odds: .10,  color: '#2f81f7' },
    { id: 'epic',      name: 'Epic',      from: 89,  to: 95,  odds: .04,  color: '#a371f7' },
    { id: 'legendary', name: 'Legendary', from: 96,  to: 99,  odds: .009, color: '#f0b232' },
    { id: 'mythic',    name: 'Mythic',    from: 100, to: 100, odds: .001, color: '#ff4fd8' },
  ];
  const THEMES = [
    ['Jungle', 'linear-gradient(160deg,#1e5631,#4c9a2a 60%,#a4de02)'],
    ['Banana', 'linear-gradient(160deg,#ffe066,#ffd43b 50%,#f59f00)'],
    ['Space', 'radial-gradient(circle at 30% 20%,#3b2c85,#0b0c2a 60%,#000)'],
    ['Lava', 'linear-gradient(160deg,#2b0a00,#c92a2a 55%,#ff922b)'],
    ['Ice', 'linear-gradient(160deg,#e3fafc,#99e9f2 50%,#3bc9db)'],
    ['Ocean', 'linear-gradient(160deg,#0b3954,#087e8b 55%,#66d9e8)'],
    ['Neon', 'linear-gradient(135deg,#ff00cc,#3333ff)'],
    ['Sunset', 'linear-gradient(170deg,#ff7e5f,#feb47b 55%,#6a3093)'],
    ['Toxic', 'linear-gradient(160deg,#0b2b0b,#38d900 60%,#d8f5a2)'],
    ['Candy', 'linear-gradient(160deg,#ffdeeb,#f783ac 55%,#cc5de8)'],
    ['Midnight', 'linear-gradient(160deg,#0f2027,#203a43 50%,#2c5364)'],
    ['Desert', 'linear-gradient(170deg,#f4d58d,#e09f3e 55%,#9e2a2b)'],
    ['Storm', 'linear-gradient(160deg,#343a40,#495057 50%,#adb5bd)'],
    ['Sakura', 'linear-gradient(160deg,#fff0f6,#fcc2d7 55%,#e64980)'],
    ['Retro', 'repeating-linear-gradient(135deg,#ff6b6b 0 14px,#ffd43b 14px 28px,#4dabf7 28px 42px)'],
    ['Matrix', 'repeating-linear-gradient(0deg,#001a00 0 6px,#003300 6px 7px),linear-gradient(#000,#0a3)'],
    ['Gold Rush', 'linear-gradient(160deg,#5c3d00,#c9a24a 50%,#fff3bf)'],
    ['Void', 'radial-gradient(circle,#2b2b2b,#000 70%)'],
    ['Rainbow', 'linear-gradient(135deg,#ff6b6b,#ffd43b,#69db7c,#4dabf7,#b197fc)'],
    ['Cloud', 'linear-gradient(170deg,#e7f5ff,#a5d8ff 60%,#ffffff)'],
  ];
  const PHOTO_FX = [ // uncommon
    ['Vintage', 'sepia(.75) contrast(1.05)'], ['Noir', 'grayscale(1) contrast(1.25)'],
    ['Vivid', 'saturate(1.8) contrast(1.15)'], ['Sunburnt', 'saturate(1.4) hue-rotate(-15deg) brightness(1.1)'],
    ['Faded', 'contrast(.8) brightness(1.15) saturate(.6)'],
  ];
  const FUN = [ // rare+ silly twists
    ['Mirror', 'scaleX(-1)'], ['Big Head', 'scale(1.35)'], ['Tiny', 'scale(.7)'], ['Tilted', 'rotate(-9deg) scale(1.08)'],
    ['Upside Down', 'rotate(180deg)'], ['Squished', 'scaleY(.75)'], ['Stretched', 'scaleY(1.25)'], ['Zoomed', 'scale(1.7)'],
  ];
  const STATS = ['Yapping', 'Skill', 'Clutch', 'Aura', 'Luck', 'Rage', 'Rizz', 'Brain Cells'];
  const MOVES = ['Rage Quit', 'Mic Spam', 'Clutch 1v4', 'Disconnect', 'Yap Attack', 'Banana Slip', 'AFK Strike', 'Trash Talk', 'Lag Spike',
    'Last Second Save', 'Accidental Team Kill', 'Back Seat Gaming', 'Laugh Track', 'Loud Breathing', 'Excuse Barrage', 'Bobble Bash'];
  const FLAVOR = ['Has never once admitted defeat.', 'Was "lagging" every single time.', 'Muted for a reason.', 'Showed up 45 minutes late.',
    'Thinks he is the main character.', 'Will tell you he was carrying.', 'Banana powered.', 'Do not let him pick the game.',
    'Somehow always on the losing team.', 'Has three excuses ready at all times.', 'Peak performance, allegedly.', 'One of a kind. Unfortunately.',
    'Certified freak.', 'Professional yapper.', 'Was right there the whole time.', 'Asleep on call again.'];

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const okImg = u => /^(https:\/\/|members\/|games\/)/.test(u || '') ? u : '';

  function members() {
    let content = null; try { content = C; } catch (e) {}   // the site's live content (members, photos)
    const list = (content && Array.isArray(content.members) && content.members.length) ? content.members
      : ['Armen', 'Zay', 'Blackdog', 'Dylan', 'Geordie', 'Kansas', 'Erick', 'Freddy', 'Gerson'].map(n => ({ name: n, img: 'members/' + n.toLowerCase() + '.webp' }));
    return list.filter(m => m && m.name);
  }
  const keyOf = name => String(name).trim().toLowerCase();
  const rarityOf = v => RAR.find(r => v >= r.from && v <= r.to);

  // Everything about a card comes from (member, number), so every player sees the same card for the same number.
  function makeCard(m, v) {
    const r = rng(hash(keyOf(m.name) + '#' + v)), rar = rarityOf(v), lvl = RAR.indexOf(rar);
    const theme = THEMES[(hash(keyOf(m.name)) + v * 7) % THEMES.length];
    let photoFx = '', fun = null, prefix = '', hue = 0;
    if (lvl === 1) { const fx = pick(r, PHOTO_FX); photoFx = fx[1]; prefix = fx[0]; }
    if (lvl >= 2) { fun = pick(r, FUN); prefix = lvl === 2 ? 'Holo' : ''; }
    if (lvl >= 3) { hue = 40 + Math.floor(r() * 280); photoFx = `hue-rotate(${hue}deg) saturate(1.3)`; prefix = 'Shiny'; }
    if (lvl === 4) prefix = pick(r, ['Legendary', 'Ascended', 'Cosmic', 'Ultra']);
    if (lvl === 4 && r() < .35) photoFx += ' invert(1)';
    if (lvl === 5) { prefix = 'Golden'; photoFx = 'sepia(.6) saturate(2.2) brightness(1.1) contrast(1.1)'; fun = null; }
    const stats = pick(r, [[0, 1, 2], [3, 4, 5], [0, 3, 6], [1, 2, 7], [6, 5, 3], [4, 7, 0]]).map(i => ({
      name: STATS[i], val: Math.min(99, 8 + Math.floor(r() * 70) + lvl * 6)
    }));
    const power = Math.round(stats.reduce((a, s) => a + s.val, 0) / 3 * (1 + lvl * .12));
    const title = lvl === 5 ? `Golden ${m.name}` : [prefix, theme[0], m.name].filter(Boolean).join(' ');
    return { id: keyOf(m.name) + ':' + v, member: m, v, rar, lvl, theme, photoFx, fun, title, stats, power,
      move: pick(r, MOVES), dmg: 10 * (2 + Math.floor(r() * 8) + lvl * 2), flavor: pick(r, FLAVOR) };
  }
  const SECRET = { id: 'secret:gerson-bobble', secret: true, lvl: 8 };
  // the rarest thing in the game: any card in a pack has a 1 in 137,500 chance to be this instead
  const TOKEN_ODDS = 1 / 137500;
  const TOKEN = { id: 'secret:pirate-token', token: true, lvl: 9, rar: { id: 'token', name: 'Pirate Token', color: '#f5b700' } };

  /* ------------------------------ saved state ------------------------------ */
  const PACK_EVERY = 3 * 60 * 1000, PACK_MAX = 10, PACKS_PER_DROP = 3;
  let S = LS.get('mb_cards', null);
  if (!S) S = { own: {}, firstAt: {}, packs: 3, last: Date.now(), opened: 0 };
  function save() { LS.set('mb_cards', S); }
  function accrue() {
    const now = Date.now();
    if (S.packs >= PACK_MAX) { S.last = now; return; }
    const n = Math.floor((now - S.last) / PACK_EVERY);
    if (n > 0) { S.packs = Math.min(PACK_MAX, S.packs + n * PACKS_PER_DROP); S.last += n * PACK_EVERY; if (S.packs >= PACK_MAX) S.last = now; save(); }
  }
  function addCard(id) { S.own[id] = (S.own[id] || 0) + 1; if (!S.firstAt[id]) S.firstAt[id] = Date.now(); }
  function cardById(id) {
    if (id === SECRET.id) return SECRET;
    if (id === TOKEN.id) return TOKEN;
    const [k, v] = id.split(':'); const m = members().find(x => keyOf(x.name) === k);
    return m ? makeCard(m, +v) : null;
  }

  /* ------------------------------ looks ------------------------------ */
  const CSS = `
  .tc{--w:150px;width:var(--w);aspect-ratio:5/7;border-radius:calc(var(--w)*.07);position:relative;flex:none;font-size:calc(var(--w)*.075);
      background:var(--rc);padding:calc(var(--w)*.04);box-sizing:border-box;box-shadow:0 6px 18px rgba(0,0,0,.25);color:#111;user-select:none;-webkit-user-select:none;
      transform-style:preserve-3d;transition:transform .15s ease}
  .tc .in{position:absolute;inset:calc(var(--w)*.04);border-radius:calc(var(--w)*.045);overflow:hidden;background:#fffdf4;display:flex;flex-direction:column}
  .tc .top{display:flex;justify-content:space-between;align-items:baseline;padding:.35em .5em .2em;font-weight:800;gap:.3em}
  .tc .top .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.95em}
  .tc .top .pw{font-size:.8em;color:#c92a2a;white-space:nowrap}
  .tc .art{position:relative;margin:0 .45em;height:46%;border-radius:.4em;overflow:hidden;background:var(--bg);box-shadow:inset 0 0 0 2px rgba(0,0,0,.15)}
  .tc .art img{position:absolute;left:12%;right:12%;bottom:0;width:76%;height:88%;object-fit:cover;border-radius:50% 50% .3em .3em;filter:var(--fx);transform:var(--tf);transform-origin:50% 60%}
  .tc .sub{font-size:.62em;padding:.3em .7em 0;color:#555;display:flex;justify-content:space-between;gap:.4em;white-space:nowrap}
  .tc .sub b{color:var(--rc);font-weight:800;text-transform:uppercase;letter-spacing:.04em}
  .tc .mv{margin:.25em .6em 0;font-size:.72em;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:.25em}
  .tc .mv b{font-weight:800}
  .tc .st{margin:.2em .6em 0;display:grid;gap:.18em}
  .tc .st div{display:grid;grid-template-columns:4.6em 1fr 1.6em;align-items:center;font-size:.58em;gap:.4em}
  .tc .st i{height:.45em;border-radius:1em;background:#e9ecef;overflow:hidden;display:block}
  .tc .st i::after{content:"";display:block;height:100%;width:var(--p);background:var(--rc)}
  .tc .fl{font-size:.55em;font-style:italic;color:#666;padding:.35em .7em 0;line-height:1.25;overflow:hidden;flex:1}
  .tc .no{position:absolute;bottom:.35em;right:.6em;font-size:.55em;color:#888;font-weight:700}
  .tc .glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;mix-blend-mode:color-dodge;opacity:0}
  .tc.holo .glare{opacity:.55;background:linear-gradient(115deg,transparent 20%,rgba(255,0,170,.45) 35%,rgba(0,255,255,.45) 45%,rgba(255,255,0,.45) 55%,transparent 70%);background-size:250% 250%;background-position:var(--gx,50%) var(--gy,50%);animation:tcHolo 5s linear infinite}
  .tc.shiny .art::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at var(--gx,30%) var(--gy,30%),rgba(255,255,255,.55),transparent 45%);mix-blend-mode:overlay}
  .tc.legendary{animation:tcGlow 2.2s ease-in-out infinite}
  .tc.legendary .art{animation:tcBg 6s linear infinite;background-size:200% 200%}
  .tc .spk{position:absolute;color:#fff;text-shadow:0 0 6px #fff;font-size:1.1em;animation:tcSpk 1.8s ease-in-out infinite;pointer-events:none}
  .tc.mythic{background:linear-gradient(135deg,#ffd700,#fff3bf,#c9a24a,#ffd700,#fff8dc,#b8860b);background-size:300% 300%;animation:tcBg 4s linear infinite, tcGlow 2s ease-in-out infinite}
  .tc.mythic .in{background:linear-gradient(160deg,#fff8dc,#fff3bf)}
  .tc.secret{background:conic-gradient(from 0deg,#ff6b6b,#ffd43b,#69db7c,#4dabf7,#b197fc,#ff6b6b);animation:tcSpin 4s linear infinite}
  .tc.secret .in{background:#111;color:#fff}
  .tc.secret .art{background:radial-gradient(circle,#ffd43b,#f08c00)}
  .tc.secret .art img{animation:tcBob .5s ease-in-out infinite alternate}
  .tc.secret .fl,.tc.secret .sub{color:#ddd}
  .tc.token{background:linear-gradient(135deg,#7a4a00,#f5b700,#fff3bf,#f5b700,#7a4a00);background-size:300% 300%;animation:tcBg 3s linear infinite, tcGlowGold 1.6s ease-in-out infinite}
  .tc.token .in{background:linear-gradient(170deg,#3b2400,#1a1000);color:#ffe8a3}
  .tc.token .art{background:radial-gradient(circle,#fff3bf,#c98a00 70%)}
  .tc.token .art img{left:6%;right:6%;width:88%;height:96%;top:2%;bottom:auto;border-radius:50%;object-fit:cover;animation:tcSpinSlow 9s linear infinite}
  .tc.token .pw{color:#ffd43b}
  .tc.token .sub,.tc.token .fl,.tc.token .no{color:#e9c46a}
  .tc.token .sub b{color:#ffd43b}
  .tc.token .mv{border-top-color:#5c3d00}
  @keyframes tcGlowGold{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.3),0 0 10px rgba(245,183,0,.4)}50%{box-shadow:0 6px 18px rgba(0,0,0,.3),0 0 40px rgba(255,200,0,1)}}
  @keyframes tcSpinSlow{to{transform:rotate(360deg)}}
  @keyframes tcFall{to{transform:translateY(110vh) rotate(540deg)}}
  .token-flash{position:fixed;inset:0;z-index:150;pointer-events:none;background:radial-gradient(circle,rgba(255,215,0,.9),rgba(255,140,0,.4) 40%,transparent 70%);animation:tokFlash 1.6s ease-out forwards}
  @keyframes tokFlash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
  .tc.missing{background:var(--tile);box-shadow:none;border:2px dashed var(--line)}
  .tc.missing .in{background:transparent;align-items:center;justify-content:center;color:var(--ink2);font-weight:700;font-size:1.4em}
  .tc.back{background:#1d1d1f;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .tc.back .in{background:repeating-linear-gradient(45deg,#ffd43b 0 10px,#f5c518 10px 20px);align-items:center;justify-content:center;font-size:2.6em}
  .tc .cnt{position:absolute;top:-.5em;left:-.5em;background:#111;color:#fff;border-radius:1em;font-size:.75em;font-weight:800;padding:.15em .5em;z-index:2}
  .tc .new{position:absolute;top:-.6em;right:-.4em;background:#ff3b30;color:#fff;border-radius:1em;font-size:.7em;font-weight:800;padding:.15em .55em;z-index:2}
  @keyframes tcHolo{0%{background-position:0% 50%}100%{background-position:250% 50%}}
  @keyframes tcGlow{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.25),0 0 0 rgba(255,215,0,0)}50%{box-shadow:0 6px 18px rgba(0,0,0,.25),0 0 28px rgba(255,200,0,.8)}}
  @keyframes tcBg{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes tcSpk{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}
  @keyframes tcSpin{to{filter:hue-rotate(360deg)}}
  @keyframes tcBob{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}

  .cards-ui{max-width:1180px;margin:0 auto;text-align:left}
  .cards-main{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:20px;align-items:start}
  .feed{position:sticky;top:70px;background:var(--tile);border-radius:20px;padding:16px;max-height:calc(100vh - 100px);display:flex;flex-direction:column;gap:10px}
  .feed h4{margin:0;font-size:16px;display:flex;align-items:center;gap:8px}
  .feed h4 .live{width:8px;height:8px;border-radius:50%;background:#ff3b30;box-shadow:0 0 0 3px rgba(255,59,48,.2);animation:tcSpk 2s ease-in-out infinite}
  .feed .me{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--ink2)}
  .feed .me input{flex:1;min-width:0;font:inherit;font-size:14px;padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}
  .feed ul{list-style:none;margin:0;padding:0;overflow:auto;display:flex;flex-direction:column;gap:8px;min-height:60px}
  .feed li{display:grid;grid-template-columns:36px 1fr;gap:9px;align-items:center;font-size:13px;line-height:1.3;cursor:pointer;padding:6px;border-radius:12px}
  .feed li:hover{background:rgba(128,128,128,.12)}
  .feed li.fresh{animation:feedIn 1.2s ease}
  .feed li img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:var(--line);box-shadow:0 0 0 2px var(--rc)}
  .feed li b{font-weight:700}
  .feed li .c{font-weight:700;color:var(--rc)}
  .feed li small{display:block;color:var(--ink2);font-size:11px;margin-top:1px}
  .feed li.big{background:linear-gradient(90deg,rgba(245,183,0,.18),transparent)}
  .feed .empty{color:var(--ink2);font-size:13px;margin:0}
  @keyframes feedIn{0%{background:rgba(255,212,59,.6);transform:translateX(-6px)}100%{background:transparent;transform:none}}
  @media (max-width:860px){ .cards-main{grid-template-columns:1fr} .feed{position:static;max-height:none;order:-1} .feed ul{max-height:260px} }
  .cards-top{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;background:var(--tile);border-radius:20px;padding:16px 18px}
  .cards-top .packinfo{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .cards-top .packinfo b{font-size:22px}
  .cards-top .timer{color:var(--ink2);font-size:14px}
  .cards-btn{border:0;border-radius:980px;background:#ffd43b;color:#111;font:inherit;font-weight:700;font-size:16px;padding:10px 20px;cursor:pointer}
  .cards-btn:disabled{opacity:.45;cursor:default}
  .cards-btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line);font-weight:600}
  .cards-prog{flex:1;min-width:220px}
  .cards-prog .bar{height:8px;border-radius:8px;background:var(--line);overflow:hidden;margin-top:6px}
  .cards-prog .bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd43b,#ff8fab)}
  .cards-prog small{color:var(--ink2);font-size:13px}
  .cards-filters{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 10px;align-items:center}
  .cards-filters button{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:980px;font:inherit;font-size:14px;padding:7px 14px;cursor:pointer}
  .cards-filters button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .cards-filters select{font:inherit;font-size:14px;padding:7px 10px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);margin-left:auto}
  .cards-grid{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;padding:12px 4px 30px}
  .cards-grid .tc{cursor:pointer}
  .cards-grid .tc:hover{transform:translateY(-4px)}
  .cards-empty{color:var(--ink2);text-align:center;padding:30px 10px}
  .cards-odds{color:var(--ink2);font-size:13px;text-align:center;margin:0 0 10px}
  .tc-modal{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px}
  .tc-modal.show{display:flex}
  .tc-modal .x{position:absolute;top:14px;right:16px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:18px;cursor:pointer}
  .tc-modal .row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;perspective:1000px}
  .tc-modal .hint{color:#d2d2d7;font-size:14px;text-align:center}
  .tc-modal .big{perspective:900px}
  .flip{transition:transform .5s ease;transform-style:preserve-3d}
  .flip.done{transform:rotateY(360deg)}
  .gb-rain{position:fixed;top:-120px;z-index:200;width:90px;height:90px;border-radius:50%;background:url(games/bobble.jpg) center/cover;box-shadow:0 6px 18px rgba(0,0,0,.35);pointer-events:none;animation:gbFall linear forwards}
  .gb-rain i{position:absolute;inset:0;border-radius:50%;animation:gbBob .35s ease-in-out infinite alternate}
  .gb-big{position:fixed;inset:0;margin:auto;z-index:201;width:min(60vw,360px);height:min(60vw,360px);border-radius:50%;overflow:hidden;pointer-events:none;box-shadow:0 0 0 8px #ffd43b,0 30px 80px rgba(0,0,0,.5);animation:gbPop 3.2s ease forwards}
  .gb-big video{width:100%;height:100%;object-fit:cover}
  .gb-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:202;background:#111;color:#fff;border-radius:16px;padding:12px 18px;font-size:15px;box-shadow:0 12px 30px rgba(0,0,0,.35);text-align:center;max-width:90vw;animation:gbToast 4.5s ease forwards}
  @keyframes gbFall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(calc(100vh + 240px)) rotate(var(--rot))}}
  @keyframes gbBob{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
  @keyframes gbPop{0%{transform:scale(0) rotate(-30deg);opacity:0}12%{transform:scale(1.1) rotate(8deg);opacity:1}20%{transform:scale(1) rotate(0)}85%{transform:scale(1);opacity:1}100%{transform:scale(0) rotate(30deg);opacity:0}}
  @keyframes gbToast{0%{opacity:0;transform:translate(-50%,20px)}8%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,10px)}}
  .cards-grid .tc.missing{--w:110px}
  @media (max-width:600px){ .tc{--w:132px} .cards-grid{gap:12px} .cards-grid .tc.missing{--w:96px} .cards-top .packinfo b{font-size:19px} }`;
  function css() { if (!document.getElementById('tc-css')) { const st = document.createElement('style'); st.id = 'tc-css'; st.textContent = CSS; document.head.appendChild(st); } }

  function cardEl(c, w) {
    const d = document.createElement('div');
    if (c.token) {
      d.className = 'tc token holo'; if (w) d.style.setProperty('--w', w + 'px');
      d.innerHTML = `<div class="in"><div class="top"><span class="nm">Pirate Token</span><span class="pw">∞ PWR</span></div>
        <div class="art"><img src="games/pirate-token.webp" alt=""></div>
        <div class="sub"><span>1 in 137,500</span><b>Pirate Token</b></div>
        <div class="mv"><b>X Marks the Spot</b><span>∞</span></div>
        <div class="fl">Rarer than anything in the game. If you have this, screenshot it immediately.</div><span class="no">1/137500</span></div><div class="glare"></div>`;
      for (let i = 0; i < 7; i++) { const s = document.createElement('span'); s.className = 'spk'; s.textContent = '✦';
        s.style.left = (6 + Math.random() * 82) + '%'; s.style.top = (6 + Math.random() * 50) + '%'; s.style.animationDelay = (Math.random() * 1.8) + 's'; d.appendChild(s); }
      return d;
    }
    if (c.secret) {
      d.className = 'tc secret holo'; if (w) d.style.setProperty('--w', w + 'px');
      d.innerHTML = `<div class="in"><div class="top"><span class="nm">Bobblehead Gerson</span><span class="pw" style="color:#ffd43b">??? PWR</span></div>
        <div class="art"><img src="games/bobble.jpg" alt=""></div>
        <div class="sub"><span>Secret card</span><b style="color:#ffd43b">Secret</b></div>
        <div class="mv"><b>Endless Bobble</b><span>∞</span></div>
        <div class="fl">You found him. He has been bobbling this whole time.</div><span class="no">000/000</span></div><div class="glare"></div>`;
      return d;
    }
    d.className = 'tc ' + c.rar.id + (c.lvl >= 2 ? ' holo' : '') + (c.lvl >= 3 ? ' shiny' : '');
    if (w) d.style.setProperty('--w', w + 'px');
    d.style.setProperty('--rc', c.rar.color); d.style.setProperty('--bg', c.theme[1]);
    d.style.setProperty('--fx', c.photoFx || 'none'); d.style.setProperty('--tf', c.fun ? c.fun[1] : 'none');
    const img = okImg(c.member.img);
    d.innerHTML = `<div class="in">
        <div class="top"><span class="nm">${esc(c.title)}</span><span class="pw">${c.power} PWR</span></div>
        <div class="art">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}</div>
        <div class="sub"><span>${esc(c.theme[0])}${c.fun ? ' · ' + esc(c.fun[0]) : ''}</span><b>${c.rar.name}</b></div>
        <div class="mv"><b>${esc(c.move)}</b><span>${c.dmg}</span></div>
        <div class="st">${c.stats.map(s => `<div><span>${s.name}</span><i style="--p:${s.val}%"></i><span>${s.val}</span></div>`).join('')}</div>
        <div class="fl">${esc(c.flavor)}</div>
        <span class="no">${String(c.v).padStart(3, '0')}/100</span>
      </div><div class="glare"></div>`;
    if (c.lvl >= 4) for (let i = 0; i < 5; i++) { const s = document.createElement('span'); s.className = 'spk'; s.textContent = '✦';
      s.style.left = (10 + Math.random() * 75) + '%'; s.style.top = (8 + Math.random() * 45) + '%'; s.style.animationDelay = (Math.random() * 1.8) + 's'; d.appendChild(s); }
    return d;
  }
  // tilt + moving shine that follows the finger / mouse
  function tilt(card) {
    const move = e => { const r = card.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.transform = `rotateY(${(x - .5) * 22}deg) rotateX(${(.5 - y) * 22}deg)`; card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%'); };
    card.addEventListener('pointermove', move); card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }

  /* ------------------------------ sounds ------------------------------ */
  let actx = null;
  function beep(freqs, step, type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * step;
        o.type = type || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + .3); });
    } catch (e) {}
  }
  const FLIP_SOUND = [[440], [523, 659], [523, 659, 784], [523, 659, 784, 1047], [523, 659, 784, 1047, 1319], [392, 523, 659, 784, 1047, 1319, 1568]];

  /* ------------------------------ packs ------------------------------ */
  function rollCard() {
    if (Math.random() < TOKEN_ODDS) return TOKEN;
    const ms = members(); const m = ms[Math.floor(Math.random() * ms.length)];
    let x = Math.random(), rar = RAR[0];
    for (const r of RAR.slice().reverse()) { if (x < r.odds) { rar = r; break; } x -= r.odds; }
    const v = rar.from + Math.floor(Math.random() * (rar.to - rar.from + 1));
    return makeCard(m, v);
  }
  function openPack() {
    accrue(); if (S.packs < 1) return;
    S.packs--; S.opened++;
    if (S.packs < PACK_MAX && S.last > Date.now()) S.last = Date.now();
    const cards = Array.from({ length: 5 }, rollCard);
    // at least one uncommon or better in every pack
    if (cards.every(c => c.lvl === 0)) { const m = cards[4].member; cards[4] = makeCard(m, 51 + Math.floor(Math.random() * 25)); }
    cards.sort((a, b) => a.lvl - b.lvl);
    const fresh = cards.map(c => !S.own[c.id]);
    cards.forEach(c => addCard(c.id)); save(); render();
    const M = modal(); M.row.innerHTML = ''; M.hint.textContent = 'Tap each card to flip it';
    let left = cards.length;
    cards.forEach((c, i) => {
      const slot = document.createElement('div'); slot.className = 'flip';
      const back = document.createElement('div'); back.className = 'tc back'; back.innerHTML = '<div class="in">🐒</div>';
      if (window.innerWidth < 600) back.style.setProperty('--w', '120px');
      slot.appendChild(back);
      slot.onclick = () => {
        if (slot.dataset.open) { bigView(c); return; }
        slot.dataset.open = 1; left--;
        const face = cardEl(c, window.innerWidth < 600 ? 120 : 0);
        if (fresh[i]) { const n = document.createElement('span'); n.className = 'new'; n.textContent = 'NEW'; face.appendChild(n); }
        slot.classList.add('done'); setTimeout(() => { slot.innerHTML = ''; slot.appendChild(face); tilt(face); }, 160);
        if (c.token) tokenParty(); else beep(FLIP_SOUND[c.lvl], .07, c.lvl >= 4 ? 'square' : 'triangle');
        Feed.post(c);
        M.hint.textContent = c.token ? '🏴‍☠️ PIRATE TOKEN!!! That was a 1 in 137,500 pull.'
          : left ? `${left} left to flip` : (cards.some(x => x.lvl >= 3) ? '🔥 Nice pull! Tap a card to see it big.' : 'Tap a card to see it big.');
      };
      M.row.appendChild(slot);
    });
    M.box.classList.add('show'); document.body.style.overflow = 'hidden';
  }
  let modalEls = null;
  function modal() {
    if (modalEls) return modalEls;
    const box = document.createElement('div'); box.className = 'tc-modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button class="x" aria-label="Close">✕</button><div class="row"></div><p class="hint"></p>';
    document.body.appendChild(box);
    const close = () => { box.classList.remove('show'); document.body.style.overflow = ''; };
    box.querySelector('.x').onclick = close;
    box.addEventListener('click', e => { if (e.target === box) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('show')) close(); });
    modalEls = { box, row: box.querySelector('.row'), hint: box.querySelector('.hint'), close };
    return modalEls;
  }
  function tokenParty() {
    css();
    const f = document.createElement('div'); f.className = 'token-flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 1700);
    beep([523, 659, 784, 1047, 784, 1047, 1319, 1568, 2093], .1, 'square');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) for (let i = 0; i < 40; i++) {
      const c = document.createElement('div'); c.textContent = ['🏴‍☠️', '💰', '🪙', '✨', '🟡'][i % 5];
      c.style.cssText = `position:fixed;top:-30px;z-index:160;font-size:24px;pointer-events:none;left:${Math.random() * 100}vw;animation:tcFall ${2.5 + Math.random() * 2.5}s linear ${Math.random() * 1.2}s forwards`;
      document.body.appendChild(c); setTimeout(() => c.remove(), 6500);
    }
    toast('🏴‍☠️ YOU PULLED THE PIRATE TOKEN. 1 in 137,500. Screenshot it!');
  }
  function bigView(c) {
    const M = modal(); M.row.innerHTML = '';
    const w = Math.min(320, window.innerWidth - 60, (window.innerHeight - 160) * 5 / 7);
    const wrap = document.createElement('div'); wrap.className = 'big';
    const card = cardEl(c, Math.round(w)); wrap.appendChild(card); M.row.appendChild(wrap); tilt(card);
    const n = S.own[c.id] || 0;
    M.hint.textContent = c.token ? `🏴‍☠️ The Pirate Token. 1 in 137,500 per card. You have ${n}.` :
      c.secret ? 'The secret card. Only people who found the easter egg have this.' :
      `${c.rar.name} · #${c.v} of 100 · you have ${n}${n > 1 ? ' (' + (n - 1) + ' extra)' : ''}`;
    M.box.classList.add('show'); document.body.style.overflow = 'hidden';
  }

  /* ------------------------------ rare-pull feed (shared with everyone) ------------------------------ */
  const Feed = {
    list: [], seen: null, poll: 0,
    name() { return String(LS.get('mb_flappy_name', '') || '').slice(0, 16); },
    device() { let id = null; try { id = localStorage.getItem('mb_voter'); } catch (e) {}
      if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { localStorage.setItem('mb_voter', id); } catch (e) {} } return id; },
    load() {
      if (!window.MB_API) return;
      fetch(window.MB_API + '?action=pulls').then(r => r.json()).then(d => { if (d.ok) this.show(d.pulls || []); }).catch(() => {});
    },
    // only Epic and up get announced
    post(c) {
      const rarity = c.token ? 'Pirate Token' : c.secret ? 'Secret' : c.lvl >= 3 ? c.rar.name : null;
      if (!rarity || !window.MB_API) return;
      const title = c.token ? 'the Pirate Token' : c.secret ? 'Bobblehead Gerson (secret)' : c.title;
      const mine = { t: Date.now(), name: this.name() || 'Someone', card: c.id, title, rarity, mine: true };
      this.show([mine].concat(this.list));
      fetch(window.MB_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'pull', name: this.name(), card: c.id, title, rarity, voter: this.device() }) })
        .then(r => r.json()).then(d => { if (d.ok && d.pulls) this.show(d.pulls); }).catch(() => {});
    },
    show(pulls) {
      const old = this.seen; this.list = pulls.slice(0, 30);
      const ul = root && root.querySelector('.feed-list'); if (!ul) return;
      ul.innerHTML = '';
      if (!this.list.length) { ul.innerHTML = '<li class="empty" style="cursor:default">Nobody has pulled anything rare yet. Be the first!</li>'; return; }
      const colors = { Epic: '#a371f7', Legendary: '#f0b232', Mythic: '#ff4fd8', 'Pirate Token': '#f5b700', Secret: '#20c997' };
      this.list.forEach(p => {
        const li = document.createElement('li'); li.style.setProperty('--rc', colors[p.rarity] || '#888');
        const c = cardById(p.card || '');
        const img = p.rarity === 'Pirate Token' ? 'games/pirate-token.webp' : p.rarity === 'Secret' ? 'games/bobble.jpg' : (c && c.member ? okImg(c.member.img) : '');
        const ago = Math.max(0, Date.now() - p.t), mins = Math.floor(ago / 60000);
        const when = mins < 1 ? 'just now' : mins < 60 ? mins + 'm ago' : mins < 1440 ? Math.floor(mins / 60) + 'h ago' : Math.floor(mins / 1440) + 'd ago';
        li.innerHTML = `<img alt="" src="${esc(img)}"><div><b>${esc(p.name)}</b> pulled <span class="c">${esc(p.title)}</span><small>${esc(p.rarity)} · ${when}</small></div>`;
        if (['Mythic', 'Pirate Token'].includes(p.rarity)) li.classList.add('big');
        if (old && !old.has(p.t + p.card)) li.classList.add('fresh');
        if (c) li.onclick = () => bigView(c);
        ul.appendChild(li);
      });
      this.seen = new Set(this.list.map(p => p.t + p.card));
    }
  };

  /* ------------------------------ binder ------------------------------ */
  let root = null, filter = 'all', sort = 'new', timerT = 0;
  function owned() { return Object.keys(S.own).filter(id => S.own[id] > 0); }
  function dupes() { return Object.keys(S.own).filter(id => !id.startsWith('secret:')).reduce((n, id) => n + Math.max(0, S.own[id] - 1), 0); }
  function render() {
    if (!root) return;
    accrue();
    const ms = members(), total = ms.length * 100, have = owned().filter(id => id !== SECRET.id);
    const haveReal = have.filter(id => ms.some(m => id.startsWith(keyOf(m.name) + ':'))).length;
    root.querySelector('.packs-n').textContent = S.packs;
    root.querySelector('.open-btn').disabled = S.packs < 1;
    root.querySelector('.prog-t').textContent = `${haveReal} / ${total} cards collected` + (S.own[SECRET.id] ? ' · 🤫 secret found' : '') + (S.own[TOKEN.id] ? ' · 🏴‍☠️ PIRATE TOKEN' : '');
    root.querySelector('.prog-bar').style.width = (haveReal / total * 100).toFixed(2) + '%';
    const d = dupes(), tr = root.querySelector('.trade-btn');
    tr.textContent = `Trade 5 extras for a pack (${d} extra${d === 1 ? '' : 's'})`; tr.disabled = d < 5;
    // filter chips
    const chips = root.querySelector('.chips'); chips.innerHTML = '';
    [['all', 'All']].concat(ms.map(m => [keyOf(m.name), m.name])).forEach(([k, n]) => {
      const b = document.createElement('button'); b.textContent = n; b.className = filter === k ? 'on' : '';
      if (k !== 'all') { const c = have.filter(id => id.startsWith(k + ':')).length; b.textContent = `${n} ${c}/100`; }
      b.onclick = () => { filter = k; render(); }; chips.appendChild(b);
    });
    const grid = root.querySelector('.cards-grid'); grid.innerHTML = '';
    let list;
    if (filter === 'all') {
      list = owned().map(cardById).filter(Boolean);
    } else {
      const m = ms.find(x => keyOf(x.name) === filter);
      list = m ? Array.from({ length: 100 }, (_, i) => makeCard(m, i + 1)).map(c => S.own[c.id] ? c : { missing: true, v: c.v, rar: c.rar }) : [];
    }
    if (filter === 'all') {
      if (sort === 'new') list.sort((a, b) => (S.firstAt[b.id] || 0) - (S.firstAt[a.id] || 0));
      if (sort === 'rarity') list.sort((a, b) => b.lvl - a.lvl || (b.power || 0) - (a.power || 0));
      if (sort === 'number') list.sort((a, b) => (a.member ? a.member.name : '').localeCompare(b.member ? b.member.name : '') || a.v - b.v);
    }
    if (!list.length) { grid.innerHTML = '<p class="cards-empty">No cards yet. Open a pack to start your collection!</p>'; return; }
    list.forEach(c => {
      if (c.missing) { const d = document.createElement('div'); d.className = 'tc missing'; d.innerHTML = `<div class="in">#${c.v}</div>`; d.title = c.rar.name + ' #' + c.v; grid.appendChild(d); return; }
      const el = cardEl(c); const n = S.own[c.id];
      if (n > 1) { const b = document.createElement('span'); b.className = 'cnt'; b.textContent = '×' + n; el.appendChild(b); }
      el.onclick = () => bigView(c); grid.appendChild(el);
    });
  }
  function tradeIn() {
    if (dupes() < 5) return;
    let need = 5;
    // give up the most common extras first
    const ids = Object.keys(S.own).filter(id => S.own[id] > 1 && !id.startsWith('secret:')).sort((a, b) => (cardById(a) || { lvl: 9 }).lvl - (cardById(b) || { lvl: 9 }).lvl);
    for (const id of ids) { while (need && S.own[id] > 1) { S.own[id]--; need--; } if (!need) break; }
    S.packs++; save(); render(); toast('🃏 Traded 5 extras for a new pack!');
  }
  function tick() {
    if (!root) return;
    accrue();
    const t = root.querySelector('.timer');
    if (S.packs >= PACK_MAX) t.textContent = `Pack storage full (${PACK_MAX})`;
    else { const ms = Math.max(0, S.last + PACK_EVERY - Date.now()); const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60;
      t.textContent = `+${PACKS_PER_DROP} free packs in ${m}:${String(s).padStart(2, '0')}`; }
    const pn = root.querySelector('.packs-n'); if (pn.textContent !== String(S.packs)) render();
  }
  function init(r) {
    css(); root = r;
    root.innerHTML = `<div class="cards-ui">
      <div class="cards-top">
        <div class="packinfo"><span>🎁 Packs: <b class="packs-n">0</b></span><button class="cards-btn open-btn">Open a pack</button><span class="timer"></span></div>
        <div class="cards-prog"><small class="prog-t"></small><div class="bar"><i class="prog-bar"></i></div></div>
      </div>
      <p class="cards-odds" style="margin-top:12px">Every member has 100 cards: #1–50 Common · 51–75 Uncommon · 76–88 Holo Rare · 89–95 Shiny Epic · 96–99 Legendary · #100 Golden one-of-one · 🏴‍☠️ Pirate Token: 1 in 137,500. 3 free packs every 3 minutes (saves up to 10), plus bonus packs for scoring 10+ in Flappy Monkey or clearing 10+ lines in Banana Blocks.</p>
      <div class="cards-main">
        <div>
          <div class="cards-filters"><span class="chips" style="display:contents"></span>
            <select class="sort" aria-label="Sort"><option value="new">Newest first</option><option value="rarity">Rarest first</option><option value="number">By member & number</option></select>
          </div>
          <div class="cards-grid"></div>
          <div style="text-align:center"><button class="cards-btn ghost trade-btn"></button></div>
        </div>
        <aside class="feed" aria-label="Rare pulls">
          <h4><span class="live"></span>Rare pulls</h4>
          <label class="me">You: <input class="feed-name" maxlength="16" placeholder="Your name"></label>
          <ul class="feed-list"><li class="empty" style="cursor:default">Loading…</li></ul>
        </aside>
      </div>
    </div>`;
    const nm = root.querySelector('.feed-name'); nm.value = Feed.name();
    nm.onchange = () => { LS.set('mb_flappy_name', nm.value.trim().slice(0, 16)); };
    root.querySelector('.open-btn').onclick = openPack;
    root.querySelector('.trade-btn').onclick = tradeIn;
    root.querySelector('.sort').onchange = e => { sort = e.target.value; render(); };
    render(); tick();
  }
  function show() {
    if (!timerT) timerT = setInterval(tick, 1000);
    if (root) render();
    Feed.load(); clearInterval(Feed.poll); Feed.poll = setInterval(() => Feed.load(), 20000);
  }
  function hide() { clearInterval(timerT); timerT = 0; clearInterval(Feed.poll); Feed.poll = 0; }

  /* ------------------------------ toasts & bonus packs ------------------------------ */
  function toast(t) { const d = document.createElement('div'); d.className = 'gb-toast'; d.textContent = t; css(); document.body.appendChild(d); setTimeout(() => d.remove(), 4600); }
  window.addEventListener('mb:pack', e => {
    S = LS.get('mb_cards', S); S.packs = Math.min(20, (S.packs || 0) + 1); save(); render();
    toast('🃏 +1 card pack' + (e.detail && e.detail.why ? ' for ' + e.detail.why : '') + '! Open it in Games → Monkey Cards');
  });

  /* ------------------------------ Gerson easter egg ------------------------------ */
  // Type ↑ ↑ ↓ ↓ ← → ← → B A, or tap the 🐒 logo 7 times quickly.
  const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0, busy = false;
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === CODE[pos] ? pos + 1 : (k === CODE[0] ? 1 : 0);
    if (pos === CODE.length) { pos = 0; bobbleTime(); }
  });
  let taps = [];
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('.brand')) return;
    const now = Date.now(); taps = taps.filter(t => now - t < 2500); taps.push(now);
    if (taps.length >= 7) { taps = []; bobbleTime(); }
  }, true);
  function bobbleTime() {
    if (busy) return; busy = true; css();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const big = document.createElement('div'); big.className = 'gb-big';
    const v = document.createElement('video'); v.src = 'games/bobble.mp4'; v.poster = 'games/bobble.jpg'; v.muted = true; v.playsInline = true; v.loop = true; v.autoplay = true;
    big.appendChild(v); document.body.appendChild(big); v.play().catch(() => {});
    if (!reduce) for (let i = 0; i < 26; i++) {
      const h = document.createElement('div'); h.className = 'gb-rain'; h.appendChild(document.createElement('i'));
      const size = 50 + Math.random() * 70; h.style.width = h.style.height = size + 'px';
      h.style.left = (Math.random() * 100) + 'vw'; h.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      h.style.animationDuration = (2.4 + Math.random() * 2.2) + 's'; h.style.animationDelay = (Math.random() * 1.6) + 's';
      document.body.appendChild(h); setTimeout(() => h.remove(), 6500);
    }
    beep([392, 523, 659, 784, 659, 784, 1047], .09, 'square');
    setTimeout(() => { big.remove(); busy = false; }, 3300);
    S = LS.get('mb_cards', S);
    if (!S.own[SECRET.id]) { addCard(SECRET.id); save(); render(); Feed.post(SECRET); toast('🤫 You found the secret! The Bobblehead Gerson card is now in your collection.'); }
    else toast('🎧 Bobble bobble bobble.');
  }

  window.MBCards = { init, show, hide };
})();
