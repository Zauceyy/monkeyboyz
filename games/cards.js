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
  if (S.lucky == null) S.lucky = 0;
  // Lucky Packs (won from games): much better odds, and slot 5 is always Rare or better
  const LUCKY_ODDS = { common: .30, uncommon: .30, rare: .25, epic: .10, legendary: .04, mythic: .01 };
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
  .tc.back.lucky .in{background:repeating-linear-gradient(45deg,#69db7c 0 10px,#40c057 10px 20px)}
  .tc .cnt{position:absolute;top:-.5em;left:-.5em;background:#111;color:#fff;border-radius:1em;font-size:.75em;font-weight:800;padding:.15em .5em;z-index:2}
  .tc .new{position:absolute;top:-.6em;right:-.4em;background:#ff3b30;color:#fff;border-radius:1em;font-size:.7em;font-weight:800;padding:.15em .55em;z-index:2}
  @keyframes tcHolo{0%{background-position:0% 50%}100%{background-position:250% 50%}}
  @keyframes tcGlow{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.25),0 0 0 rgba(255,215,0,0)}50%{box-shadow:0 6px 18px rgba(0,0,0,.25),0 0 28px rgba(255,200,0,.8)}}
  @keyframes tcBg{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes tcSpk{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}
  @keyframes tcSpin{to{filter:hue-rotate(360deg)}}
  @keyframes tcBob{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}

  .cards-ui{max-width:1180px;margin:0 auto;text-align:left}
  .cards-views{display:flex;gap:8px;justify-content:center;margin:18px 0 4px}
  .cards-views button{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:980px;font:inherit;font-size:15px;padding:8px 18px;cursor:pointer}
  .cards-views button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .battle{text-align:center;padding:10px 0 30px}
  .bt-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;max-width:760px;margin:10px auto}
  .bt-mode{background:var(--tile);border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:10px;align-items:center}
  .bt-mode h4{margin:0;font-size:19px}
  .bt-mode p{margin:0;color:var(--ink2);font-size:14px;line-height:1.45}
  .newtag{background:#ff3b30;color:#fff;font-size:11px;border-radius:8px;padding:2px 7px;vertical-align:middle}
  /* ---- full battle ---- */
  .fb{max-width:760px;margin:0 auto}
  .fb-field{position:relative;border-radius:24px;padding:16px;background:linear-gradient(180deg,#bde0fe 0%,#dff3e4 55%,#9bd08b 56%,#7bbf6a 100%);min-height:430px;overflow:hidden}
  body.dark .fb-field,html[data-theme=dark] .fb-field{background:linear-gradient(180deg,#1b2a4a 0%,#25385a 55%,#2f5a2a 56%,#244a20 100%)}
  .fb-side{position:absolute;display:flex;gap:12px;align-items:flex-end}
  .fb-side.opp{top:16px;right:16px;flex-direction:row-reverse;align-items:flex-start}
  .fb-side.me{bottom:16px;left:16px}
  .fb-hud{background:rgba(255,255,255,.92);color:#111;border-radius:14px;padding:8px 12px;min-width:170px;box-shadow:0 4px 14px rgba(0,0,0,.15);text-align:left}
  .fb-hud b{font-size:14px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}
  .fb-hud .ty{font-size:12px;color:#555}
  .fb-hp{height:9px;border-radius:9px;background:#dee2e6;overflow:hidden;margin:6px 0 3px}
  .fb-hp i{display:block;height:100%;width:100%;background:#2ea043;transition:width .5s ease, background .3s}
  .fb-hp i.mid{background:#f0b232} .fb-hp i.low{background:#e5484d}
  .fb-hud small{font-size:11px;color:#555}
  .fb-hud .fx{font-size:11px;color:#a371f7;font-weight:700}
  .fb-card{transition:transform .25s ease, filter .25s}
  .fb-card.lunge-r{transform:translate(40px,-30px) scale(1.05)}
  .fb-card.lunge-l{transform:translate(-40px,30px) scale(1.05)}
  .fb-card.hit{animation:fbShake .45s ease}
  .fb-card.faint{transform:translateY(40px) scale(.7);filter:grayscale(1);opacity:.3}
  .fb-card.enter{animation:fbIn .4s ease}
  @keyframes fbShake{0%,100%{transform:none;filter:none}20%{transform:translateX(-10px);filter:brightness(1.8) sepia(1) hue-rotate(-40deg) saturate(5)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
  @keyframes fbIn{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}
  .fb-bench{display:flex;gap:6px;margin-top:6px}
  .fb-bench i{width:12px;height:12px;border-radius:50%;background:#2ea043;box-shadow:0 0 0 2px #fff} .fb-bench i.out{background:#adb5bd}
  .fb-log{background:#111;color:#fff;border-radius:16px;padding:14px 16px;margin:12px 0;min-height:52px;font-size:16px;line-height:1.4;text-align:left;border:3px solid #ffd43b}
  .fb-moves{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .fb-move{border:0;border-radius:16px;padding:12px 14px;text-align:left;cursor:pointer;font:inherit;color:#fff;display:flex;flex-direction:column;gap:2px;box-shadow:0 3px 0 rgba(0,0,0,.25)}
  .fb-move b{font-size:16px} .fb-move span{font-size:12px;opacity:.9}
  .fb-move:disabled{opacity:.45;cursor:default}
  .fb-move.sw{background:#495057}
  .fb-team{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0}
  .fb-team .tc{cursor:pointer}
  .fb-team .tc.pick{transform:translateY(-8px);box-shadow:0 0 0 4px #2f81f7,0 10px 24px rgba(0,0,0,.25)}
  .fb-team .tc.out{opacity:.3;filter:grayscale(1);cursor:default}
  .tybadge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);color:#fff;border-radius:999px;font-size:12px;font-weight:800;padding:3px 10px;z-index:3;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)}
  .fb-team{gap:16px;padding-top:12px}
  .fb-chart{font-size:13px;color:var(--ink2);margin-top:12px;line-height:1.6}
  @media (max-width:600px){ .fb-field{min-height:380px;padding:10px} .fb-side.opp{top:10px;right:10px} .fb-side.me{bottom:10px;left:10px} .fb-hud{min-width:120px;padding:6px 9px} .fb-hud b{font-size:12px;max-width:120px} .fb-moves{grid-template-columns:1fr 1fr} .fb-move b{font-size:14px} }
  .bt-score{font-size:20px;font-weight:700;margin:8px 0 14px}
  .bt-table{display:flex;gap:22px;justify-content:center;align-items:center;flex-wrap:wrap;perspective:1000px}
  .bt-side h5{margin:0 0 8px;font-size:13px;color:var(--ink2);text-transform:uppercase;letter-spacing:.06em}
  .bt-slot{min-height:266px;display:flex;align-items:center;justify-content:center}
  .bt-slot .empty{width:190px;aspect-ratio:5/7;border-radius:14px;border:2px dashed var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink2);font-size:14px;padding:10px;box-sizing:border-box}
  .bt-vs{font-size:28px;font-weight:900;color:var(--ink2)}
  @media (max-width:600px){ .bt-table{flex-wrap:nowrap;gap:8px} .bt-vs{font-size:18px} .bt-slot{min-height:0} .bt-slot .empty{width:140px;font-size:12px} }
  .bt-pick{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 0 6px;min-height:44px}
  .bt-pick button{border:0;border-radius:14px;background:var(--ink);color:var(--bg);font:inherit;font-size:16px;font-weight:700;padding:11px 18px;cursor:pointer}
  .bt-msg{min-height:24px;font-size:16px;margin:8px 0}
  .bt-msg .w{color:#2ea043;font-weight:700} .bt-msg .l{color:#e5484d;font-weight:700}
  .bt-hand{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
  .bt-hand .tc{cursor:pointer} .bt-hand .tc.used{opacity:.25;cursor:default;filter:grayscale(1)}
  .bt-hand .tc.sel{transform:translateY(-8px);box-shadow:0 0 0 3px var(--link),0 10px 24px rgba(0,0,0,.25)}
  .bt-dots{display:flex;gap:6px;justify-content:center;margin-top:4px}
  .bt-dots i{width:12px;height:12px;border-radius:50%;background:var(--line)} .bt-dots i.w{background:#2ea043} .bt-dots i.l{background:#e5484d} .bt-dots i.t{background:#adb5bd}
  .tc .loan{position:absolute;top:-.6em;left:50%;transform:translateX(-50%);background:#495057;color:#fff;border-radius:1em;font-size:.6em;font-weight:800;padding:.15em .6em;z-index:2;white-space:nowrap}
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
  function rollCard(lucky) {
    if (Math.random() < TOKEN_ODDS) return TOKEN;
    const ms = members(); const m = ms[Math.floor(Math.random() * ms.length)];
    let x = Math.random(), rar = RAR[0];
    for (const r of RAR.slice().reverse()) { const o = lucky ? LUCKY_ODDS[r.id] : r.odds; if (x < o) { rar = r; break; } x -= o; }
    const v = rar.from + Math.floor(Math.random() * (rar.to - rar.from + 1));
    return makeCard(m, v);
  }
  function openPack(lucky) {
    lucky = lucky === true;
    accrue();
    if (lucky) { if (S.lucky < 1) return; S.lucky--; }
    else { if (S.packs < 1) return; S.packs--; if (S.packs < PACK_MAX && S.last > Date.now()) S.last = Date.now(); }
    S.opened++;
    const cards = Array.from({ length: 5 }, () => rollCard(lucky));
    // at least one uncommon or better in every pack; Lucky Packs: at least one Rare or better
    if (lucky && cards.every(c => c.lvl < 2)) { const m = members()[Math.floor(Math.random() * members().length)]; cards[4] = makeCard(m, 76 + Math.floor(Math.random() * 13)); }
    if (cards.every(c => c.lvl === 0)) { const m = cards[4].member; cards[4] = makeCard(m, 51 + Math.floor(Math.random() * 25)); }
    cards.sort((a, b) => a.lvl - b.lvl);
    const fresh = cards.map(c => !S.own[c.id]);
    cards.forEach(c => addCard(c.id)); save(); render();
    const M = modal(); M.row.innerHTML = ''; M.hint.textContent = lucky ? '🍀 Lucky Pack! Tap each card to flip it' : 'Tap each card to flip it';
    let left = cards.length;
    cards.forEach((c, i) => {
      const slot = document.createElement('div'); slot.className = 'flip';
      const back = document.createElement('div'); back.className = 'tc back' + (lucky ? ' lucky' : ''); back.innerHTML = '<div class="in">' + (lucky ? '🍀' : '🐒') + '</div>';
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
    root.querySelector('.lucky-n').textContent = S.lucky || 0;
    root.querySelector('.lucky-btn').disabled = !(S.lucky > 0);
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
        <div class="packinfo"><span>🍀 Lucky: <b class="lucky-n">0</b></span><button class="cards-btn lucky-btn" style="background:#40c057;color:#fff">Open Lucky Pack</button></div>
        <div class="cards-prog"><small class="prog-t"></small><div class="bar"><i class="prog-bar"></i></div></div>
      </div>
      <p class="cards-odds" style="margin-top:12px">Every member has 100 cards: #1–50 Common · 51–75 Uncommon · 76–88 Holo Rare · 89–95 Shiny Epic · 96–99 Legendary · #100 Golden one-of-one · 🏴‍☠️ Pirate Token: 1 in 137,500. 3 free packs every 3 minutes (saves up to 10). 🍀 <b>Lucky Packs</b> have way better odds and always have a Rare or better: win them in Card Battle, Whack-a-Monkey, the Monkey Race, Flappy Monkey (10+) and Banana Blocks (10+ lines).</p>
      <div class="cards-views"><button class="v-col on">📒 Collection</button><button class="v-bt">⚔️ Card Battle</button></div>
      <div class="battle" hidden></div>
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
    root.querySelector('.open-btn').onclick = () => openPack(false);
    root.querySelector('.lucky-btn').onclick = () => openPack(true);
    root.querySelector('.trade-btn').onclick = tradeIn;
    root.querySelector('.sort').onchange = e => { sort = e.target.value; render(); };
    const setView = v => {
      root.querySelector('.v-col').classList.toggle('on', v === 'col'); root.querySelector('.v-bt').classList.toggle('on', v === 'bt');
      root.querySelector('.cards-main').hidden = v !== 'col'; root.querySelector('.battle').hidden = v !== 'bt';
      if (v === 'bt' && !Battle.on) Battle.intro();
    };
    root.querySelector('.v-col').onclick = () => setView('col');
    root.querySelector('.v-bt').onclick = () => setView('bt');
    render(); tick();
  }
  function show() {
    if (!timerT) timerT = setInterval(tick, 1000);
    if (root) render();
    Feed.load(); clearInterval(Feed.poll); Feed.poll = setInterval(() => Feed.load(), 20000);
  }
  function hide() { clearInterval(timerT); timerT = 0; clearInterval(Feed.poll); Feed.poll = 0; }

  /* ------------------------------ Card Battle ------------------------------ */
  // Every card secretly has all 8 stats (the 3 printed ones are the real values), so any stat can be compared.
  function allStats(c) {
    const out = {}, r = rng(hash(c.id + '#all'));
    STATS.forEach(n => { out[n] = Math.min(99, 8 + Math.floor(r() * 70) + c.lvl * 6); });
    c.stats.forEach(x => { out[x.name] = x.val; });
    return out;
  }
  const Battle = {
    on: false,
    el() { return root.querySelector('.battle'); },
    intro() {
      const n = owned().filter(id => !id.startsWith('secret:')).length;
      this.el().innerHTML = `<div class="bt-score">⚔️ Card Battle</div>
        <div class="bt-modes">
          <div class="bt-mode"><h4>🐉 Full Battle <span class="newtag">NEW</span></h4>
            <p>Pokémon style. Pick 3 cards, each with HP, 2 moves and a type. Take turns attacking and switching until one side is knocked out.</p>
            <button class="cards-btn fb-start">🤖 Vs computer</button></div>
          <div class="bt-mode"><h4>⚡ Quick Battle</h4>
            <p>5 rounds. Pick a card and a stat each round, higher number wins. About a minute.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="cards-btn bt-start">🤖 Vs computer</button><button class="cards-btn bt-pvp" style="background:#5865f2;color:#fff">🌐 Vs a friend</button></div></div>
        </div>
        <p class="bt-msg">Win either one for a <b>🍀 Lucky Pack</b>.</p>
        ${n < 6 ? `<p class="bt-msg" style="color:var(--ink2);font-size:14px">You have ${n} card${n === 1 ? '' : 's'}, so you'll borrow some Commons (marked LOAN) if you need them.</p>` : ''}`;
      this.el().querySelector('.bt-start').onclick = () => { PvP.close(); this.start(); };
      this.el().querySelector('.bt-pvp').onclick = () => PvP.lobby();
      this.el().querySelector('.fb-start').onclick = () => { PvP.close(); Full.pick(); };
    },
    deal() {
      const ms = members(), pool = owned().filter(id => !id.startsWith('secret:')).map(cardById).filter(Boolean);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const hand = pool.slice(0, 5);
      while (hand.length < 5) { const c = makeCard(ms[Math.floor(Math.random() * ms.length)], 1 + Math.floor(Math.random() * 50)); c.loan = true; hand.push(c); }
      return hand;
    },
    start() {
      this.on = true;
      const ms = members();
      this.mine = this.deal();
      // computer gets cards around the same rarity as yours
      this.cpu = this.mine.map(c => { const lvl = Math.max(0, Math.min(5, c.lvl + Math.floor(Math.random() * 3) - 1)), rar = RAR[lvl];
        return makeCard(ms[Math.floor(Math.random() * ms.length)], rar.from + Math.floor(Math.random() * (rar.to - rar.from + 1))); });
      this.used = []; this.results = []; this.round = 0; this.cur = null;
      this.board('Computer');
      this.draw();
    },
    board(opp) {
      this.el().innerHTML = `<div class="bt-score"></div><div class="bt-dots"></div>
        <div class="bt-table">
          <div class="bt-side"><h5>Your card</h5><div class="bt-slot me"></div></div>
          <div class="bt-vs">VS</div>
          <div class="bt-side"><h5 class="bt-oppname">${esc(opp)}</h5><div class="bt-slot cpu"></div></div>
        </div>
        <div class="bt-pick"></div><p class="bt-msg"></p><div class="bt-act"></div>
        <h5 style="margin:18px 0 0;font-size:13px;color:var(--ink2);text-transform:uppercase;letter-spacing:.06em">Your hand</h5><div class="bt-hand"></div>`;
    },
    w() { return window.innerWidth < 600 ? Math.min(150, Math.floor((window.innerWidth - 80) / 2)) : 190; },
    draw() {
      const E = s => this.el().querySelector(s), you = this.results.filter(r => r === 'w').length, them = this.results.filter(r => r === 'l').length;
      E('.bt-score').textContent = this.round < 5 ? `You ${you} – ${them} Computer · Round ${this.round + 1} of 5` : `Final: You ${you} – ${them} Computer`;
      E('.bt-dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${this.results[i] || ''}"></i>`).join('');
      const me = E('.bt-slot.me'), cpu = E('.bt-slot.cpu');
      me.innerHTML = ''; cpu.innerHTML = '';
      if (this.cur != null) { const c = cardEl(this.mine[this.cur], this.w()); tiltIf(c); me.appendChild(c); }
      else me.innerHTML = '<div class="empty">Pick a card from your hand below</div>';
      if (this.round < 5) { const b = document.createElement('div'); b.className = 'tc back'; b.style.setProperty('--w', this.w() + 'px'); b.innerHTML = '<div class="in">🐒</div>'; cpu.appendChild(b); }
      // stat buttons
      const pk = E('.bt-pick'); pk.innerHTML = '';
      if (this.cur != null && this.round < 5) this.mine[this.cur].stats.forEach(st => {
        const b = document.createElement('button'); b.textContent = `${st.name} ${st.val}`; b.onclick = () => this.play(st.name); pk.appendChild(b); });
      E('.bt-msg').innerHTML = this.round < 5 ? (this.cur == null ? 'Choose a card to play.' : 'Now pick the stat you think beats theirs.') : '';
      E('.bt-act').innerHTML = '';
      // hand
      const hand = E('.bt-hand'); hand.innerHTML = '';
      this.mine.forEach((c, i) => {
        const el = cardEl(c, window.innerWidth < 600 ? 96 : 118);
        if (c.loan) { const t = document.createElement('span'); t.className = 'loan'; t.textContent = 'LOAN'; el.appendChild(t); }
        if (this.used.includes(i)) el.classList.add('used');
        else { if (i === this.cur) el.classList.add('sel'); el.onclick = () => { if (this.round < 5) { this.cur = i; this.draw(); } }; }
        hand.appendChild(el);
      });
    },
    play(stat) {
      const E = s => this.el().querySelector(s), mine = this.mine[this.cur], theirs = this.cpu[this.round];
      const a = allStats(mine)[stat], b = allStats(theirs)[stat], res = a > b ? 'w' : a < b ? 'l' : 't';
      this.results.push(res); this.used.push(this.cur);
      const cpu = E('.bt-slot.cpu'); cpu.innerHTML = ''; const c = cardEl(theirs, this.w()); tiltIf(c); cpu.appendChild(c);
      E('.bt-pick').innerHTML = '';
      beep(res === 'w' ? [523, 784] : res === 'l' ? [330, 220] : [440, 440], .1);
      E('.bt-msg').innerHTML = `Your ${esc(stat)} <b>${a}</b> vs their ${esc(stat)} <b>${b}</b>: ` +
        (res === 'w' ? '<span class="w">you win the round!</span>' : res === 'l' ? '<span class="l">they win the round.</span>' : 'tie.');
      this.round++; const done = this.round >= 5;
      const you = this.results.filter(r => r === 'w').length, them = this.results.filter(r => r === 'l').length;
      E('.bt-score').textContent = `You ${you} – ${them} Computer` + (done ? '' : ` · next: round ${this.round + 1} of 5`);
      E('.bt-dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${this.results[i] || ''}"></i>`).join('');
      const act = E('.bt-act'); const btn = document.createElement('button'); btn.className = 'cards-btn';
      if (!done) { btn.textContent = 'Next round'; btn.onclick = () => { this.cur = null; this.draw(); }; }
      else {
        btn.textContent = 'Play again'; btn.onclick = () => this.start();
        setTimeout(() => {
          const m = E('.bt-msg');
          if (you > them) { m.innerHTML += '<br><b class="w">🏆 You won the battle! +1 🍀 Lucky Pack</b>'; window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why: 'winning a Card Battle', lucky: true } })); }
          else if (you < them) m.innerHTML += '<br><b class="l">The computer won this one. Run it back?</b>';
          else m.innerHTML += '<br><b>It\'s a draw. No pack this time.</b>';
        }, 500);
      }
      act.appendChild(btn);
      E('.bt-hand').querySelectorAll('.tc').forEach((el, i) => { if (this.used.includes(i)) { el.classList.add('used'); el.classList.remove('sel'); el.onclick = null; } });
    }
  };
  /* ---- online Card Battle: each player brings their own cards; you take turns choosing the stat ---- */
  const PvP = {
    peer: null, conn: null, host: false, opp: 'Friend', hb: 0, seen: 0, me: '',
    E(s) { return Battle.el().querySelector(s); },
    load() {
      if (window.Peer) return Promise.resolve();
      const srcs = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
      return srcs.reduce((p, src) => p.catch(() => new Promise((ok, bad) => {
        const sc = document.createElement('script'); sc.src = src; sc.onload = () => window.Peer ? ok() : bad(); sc.onerror = bad; document.head.appendChild(sc);
      })), Promise.reject());
    },
    close() { clearInterval(this.hb); this.hb = 0; try { this.conn && this.conn.close(); } catch (e) {} try { this.peer && this.peer.destroy(); } catch (e) {} this.conn = this.peer = null; },
    send(m) { try { if (this.conn && this.conn.open) this.conn.send(m); } catch (e) {} },
    lobby(msg) {
      this.close(); Battle.on = false;
      Battle.el().innerHTML = `<div class="bt-score">🌐 Card Battle online</div>
        <p class="bt-msg">Battle a friend with your real cards. One of you makes a room, the other joins with the code. You take turns choosing the stat. The winner gets a <b>🍀 Lucky Pack</b>.</p>
        <div style="max-width:340px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
          <input class="pv-name" maxlength="16" placeholder="Your name" style="font:inherit;font-size:16px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-align:center">
          <button class="cards-btn pv-create">Create room</button>
          <div style="display:flex;gap:8px"><input class="pv-code" maxlength="4" placeholder="CODE" autocomplete="off" style="flex:1;min-width:0;font:inherit;font-size:16px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-align:center;letter-spacing:.3em;text-transform:uppercase;font-weight:700"><button class="cards-btn ghost pv-join">Join</button></div>
          <button class="cards-btn ghost pv-back">← Back</button>
          <p class="bt-msg pv-msg" style="color:#e5484d">${esc(msg || '')}</p>
        </div>`;
      const nm = this.E('.pv-name'); nm.value = Feed.name();
      const code = this.E('.pv-code'); code.oninput = () => { code.value = code.value.toUpperCase().replace(/[^A-Z]/g, ''); };
      code.onkeydown = e => { if (e.key === 'Enter') this.join(); };
      this.E('.pv-create').onclick = () => this.create();
      this.E('.pv-join').onclick = () => this.join();
      this.E('.pv-back').onclick = () => { this.close(); Battle.intro(); };
    },
    nameOk() {
      const v = (this.E('.pv-name').value || '').trim().slice(0, 16);
      if (!v) { this.E('.pv-msg').textContent = 'Type your name first.'; return false; }
      this.me = v; LS.set('mb_flappy_name', v); const fn = root.querySelector('.feed-name'); if (fn) fn.value = v; return true;
    },
    room: c => 'monkeyboyz-cb-' + c.toLowerCase(),
    create() {
      if (!this.nameOk()) return; this.E('.pv-msg').textContent = 'Making a room…';
      const L = 'ABCDEFGHJKMNPQRSTUVWXYZ', code = Array.from({ length: 4 }, () => L[Math.floor(Math.random() * L.length)]).join('');
      this.load().then(() => {
        this.close(); this.host = true;
        const peer = this.peer = new Peer(this.room(code));
        peer.on('open', () => {
          Battle.el().innerHTML = `<div class="bt-score">Room code</div><div style="font-size:44px;font-weight:900;letter-spacing:.25em;color:#f5b700">${code}</div>
            <p class="bt-msg">Send this to your friend. They open Monkey Cards → Card Battle → Vs a friend, and type it in.</p>
            <div style="display:flex;gap:10px;justify-content:center"><button class="cards-btn ghost pv-copy">Copy code</button><button class="cards-btn ghost pv-cancel">Cancel</button></div>
            <p class="bt-msg pv-wait" style="color:var(--ink2)">Waiting for your friend…</p>`;
          this.E('.pv-copy').onclick = () => { try { navigator.clipboard.writeText(code); this.E('.pv-wait').textContent = 'Copied! Waiting for your friend…'; } catch (e) {} };
          this.E('.pv-cancel').onclick = () => this.lobby();
        });
        peer.on('connection', conn => {
          if (this.conn && this.conn.open) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 400); }); return; }
          this.wire(conn); conn.on('open', () => this.send({ t: 'hi', name: this.me || Feed.name() || 'Friend' }));
        });
        peer.on('error', e => { if (e.type === 'unavailable-id') return this.create(); if (!this.conn) this.lobby('Couldn\'t make a room (' + (e.type || 'network') + ').'); });
      }).catch(() => this.lobby('Couldn\'t load online play. Check your connection.'));
    },
    join() {
      const code = (this.E('.pv-code').value || '').toUpperCase().trim();
      if (!/^[A-Z]{4}$/.test(code)) { this.E('.pv-msg').textContent = 'Type the 4-letter room code.'; return; }
      if (!this.nameOk()) return; this.E('.pv-msg').textContent = 'Connecting…';
      this.load().then(() => {
        this.close(); this.host = false;
        const peer = this.peer = new Peer(); let done = false;
        const fail = m => { if (done) return; done = true; this.lobby(m); };
        const t = setTimeout(() => fail('Couldn\'t reach that room. Check the code.'), 15000);
        peer.on('open', () => { const conn = peer.connect(this.room(code), { reliable: true }); this.wire(conn);
          conn.on('open', () => { done = true; clearTimeout(t); this.send({ t: 'hi', name: this.me || Feed.name() || 'Friend' }); }); });
        peer.on('error', e => { clearTimeout(t); fail(e.type === 'peer-unavailable' ? 'No room with that code.' : 'Connection problem (' + (e.type || 'network') + ').'); });
      }).catch(() => this.lobby('Couldn\'t load online play. Check your connection.'));
    },
    wire(conn) {
      this.conn = conn; this.seen = Date.now();
      conn.on('data', m => { this.seen = Date.now(); this.onMsg(m); });
      conn.on('close', () => { if (this.conn === conn) { this.conn = null; this.left(); } });
      clearInterval(this.hb);
      this.hb = setInterval(() => { if (this.conn !== conn) return; this.send({ t: 'hb' }); if (conn.open && Date.now() - this.seen > 30000) { this.conn = null; this.left(); } }, 3000);
    },
    left() { if (!this.peer && !this.conn) return; const n = this.opp; this.close(); if (root && !root.querySelector('.battle').hidden) this.lobby(n + ' left the battle.'); },
    ready() {
      Battle.el().innerHTML = `<div class="bt-score">Vs ${esc(this.opp)}</div><p class="bt-msg">You're connected! Best of 5. You'll take turns picking the stat.</p>
        <button class="cards-btn pv-go">Start battle</button>`;
      this.E('.pv-go').onclick = () => { this.send({ t: 'go' }); this.start(); };
    },
    onMsg(m) {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'hi') { this.opp = String(m.name || 'Friend').slice(0, 16); if (!this.st) this.ready(); }
      else if (m.t === 'full') this.lobby('That room already has two players.');
      else if (m.t === 'go') this.start();
      else if (m.t === 'play' && this.st) { const r = Number(m.round); if (r >= 0 && r < 5 && typeof m.card === 'string' && /^[a-z0-9 _.-]+:\d{1,3}$/i.test(m.card)) { this.st.opp[r] = { card: m.card, stat: STATS.includes(m.stat) ? m.stat : null }; this.resolve(); this.draw(); } }
    },
    start() {
      this.st = { mine: Battle.deal(), used: [], results: [], round: 0, cur: null, my: [], opp: [], shown: -1 };
      Battle.on = true; Battle.board(this.opp); this.draw();
    },
    chooserIsMe(r) { return (r % 2 === 0) === this.host; },
    w() { return window.innerWidth < 600 ? Math.min(150, Math.floor((window.innerWidth - 80) / 2)) : 190; },
    draw() {
      const st = this.st, E = s => this.E(s); if (!st || !E('.bt-score')) return;
      const r = st.round, you = st.results.filter(x => x === 'w').length, them = st.results.filter(x => x === 'l').length;
      E('.bt-score').textContent = r < 5 ? `You ${you} – ${them} ${this.opp} · Round ${r + 1} of 5` : `Final: You ${you} – ${them} ${this.opp}`;
      E('.bt-dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${st.results[i] || ''}"></i>`).join('');
      if (st.shown === r - 1 && r > 0 && st.revealed) return;   // keep the last reveal on screen until "Next round"
      const me = E('.bt-slot.me'), op = E('.bt-slot.cpu'); me.innerHTML = ''; op.innerHTML = '';
      const showIdx = st.my[r] ? st.my[r].idx : st.cur;
      if (showIdx != null) me.appendChild(cardEl(st.mine[showIdx], this.w())); else me.innerHTML = '<div class="empty">Pick a card from your hand below</div>';
      const b = document.createElement('div'); b.className = 'tc back'; b.style.setProperty('--w', this.w() + 'px'); b.innerHTML = '<div class="in">' + (st.opp[r] ? '✅' : '🐒') + '</div>'; op.appendChild(b);
      const pk = E('.bt-pick'); pk.innerHTML = ''; const act = E('.bt-act'); act.innerHTML = '';
      const chooser = this.chooserIsMe(r);
      if (r < 5 && !st.my[r]) {
        if (st.cur != null && chooser) st.mine[st.cur].stats.forEach(s2 => { const bt = document.createElement('button'); bt.textContent = `${s2.name} ${s2.val}`; bt.onclick = () => this.play(s2.name); pk.appendChild(bt); });
        if (st.cur != null && !chooser) { const bt = document.createElement('button'); bt.className = 'cards-btn'; bt.textContent = 'Lock in this card'; bt.onclick = () => this.play(null); act.appendChild(bt); }
        E('.bt-msg').innerHTML = (chooser ? '<b>You choose the stat this round.</b> ' : `<b>${esc(this.opp)} chooses the stat this round.</b> `) + (st.cur == null ? 'Pick a card from your hand.' : chooser ? 'Now pick the stat.' : 'Lock it in when you\'re ready.');
      } else if (r < 5) E('.bt-msg').innerHTML = `Locked in. Waiting for ${esc(this.opp)}…`;
      const hand = E('.bt-hand'); hand.innerHTML = '';
      st.mine.forEach((c, i) => {
        const el = cardEl(c, window.innerWidth < 600 ? 96 : 118);
        if (c.loan) { const t = document.createElement('span'); t.className = 'loan'; t.textContent = 'LOAN'; el.appendChild(t); }
        if (st.used.includes(i)) el.classList.add('used');
        else if (!st.my[r]) { if (i === st.cur) el.classList.add('sel'); el.onclick = () => { st.cur = i; this.draw(); }; }
        hand.appendChild(el);
      });
    },
    play(stat) {
      const st = this.st, r = st.round; if (st.cur == null || st.my[r]) return;
      const c = st.mine[st.cur]; st.my[r] = { card: c.id, stat, idx: st.cur }; st.used.push(st.cur); st.cur = null;
      this.send({ t: 'play', round: r, card: c.id, stat }); beep([520], .05);
      this.resolve(); this.draw();
    },
    resolve() {
      const st = this.st, r = st.round, a = st.my[r], b = st.opp[r];
      if (!a || !b || st.revealedRound === r) return;
      const stat = this.chooserIsMe(r) ? a.stat : b.stat; if (!stat) return;
      st.revealedRound = r;
      const mineC = st.mine[a.idx], theirs = cardById(b.card) || makeCard(members()[0], 1);
      const x = allStats(mineC)[stat], y = allStats(theirs)[stat], res = x > y ? 'w' : x < y ? 'l' : 't';
      st.results.push(res); st.round++; st.shown = r; st.revealed = true;
      const E = s => this.E(s);
      setTimeout(() => {
        E('.bt-slot.me').innerHTML = ''; E('.bt-slot.me').appendChild(cardEl(mineC, this.w()));
        E('.bt-slot.cpu').innerHTML = ''; E('.bt-slot.cpu').appendChild(cardEl(theirs, this.w()));
        E('.bt-pick').innerHTML = ''; E('.bt-hand').querySelectorAll('.tc').forEach(el => { el.onclick = null; el.classList.remove('sel'); });
        beep(res === 'w' ? [523, 784] : res === 'l' ? [330, 220] : [440, 440], .1);
        E('.bt-msg').innerHTML = `${esc(stat)}: your <b>${x}</b> vs ${esc(this.opp)}'s <b>${y}</b>: ` + (res === 'w' ? '<span class="w">you win the round!</span>' : res === 'l' ? `<span class="l">${esc(this.opp)} wins the round.</span>` : 'tie.');
        const you = st.results.filter(z => z === 'w').length, them = st.results.filter(z => z === 'l').length;
        E('.bt-score').textContent = `You ${you} – ${them} ${this.opp}` + (st.round < 5 ? ` · next: round ${st.round + 1} of 5` : '');
        E('.bt-dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${st.results[i] || ''}"></i>`).join('');
        const act = E('.bt-act'); act.innerHTML = ''; const btn = document.createElement('button'); btn.className = 'cards-btn';
        if (st.round < 5) { btn.textContent = 'Next round'; btn.onclick = () => { st.revealed = false; this.draw(); }; }
        else {
          btn.textContent = 'Rematch'; btn.onclick = () => { this.send({ t: 'go' }); this.start(); };
          if (you > them) { E('.bt-msg').innerHTML += `<br><b class="w">🏆 You beat ${esc(this.opp)}! +1 🍀 Lucky Pack</b>`; window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why: 'beating ' + this.opp + ' in Card Battle', lucky: true } })); }
          else if (you < them) E('.bt-msg').innerHTML += `<br><b class="l">${esc(this.opp)} won the battle.</b>`;
          else E('.bt-msg').innerHTML += '<br><b>Draw! No pack this time.</b>';
        }
        act.appendChild(btn);
      }, 450);
    }
  };

  /* ---- Full Battle (Pokémon style) ---- */
  // Each card's background theme is its type. Every type beats 2 and loses to 2.
  const TYPES = {
    Fire:   { e: '🔥', c: '#e8590c', beats: ['Jungle', 'Ice'] },
    Water:  { e: '💧', c: '#1c7ed6', beats: ['Fire', 'Cosmic'] },
    Jungle: { e: '🌿', c: '#2f9e44', beats: ['Water', 'Neon'] },
    Ice:    { e: '❄️', c: '#3bc9db', beats: ['Jungle', 'Cosmic'] },
    Neon:   { e: '⚡', c: '#ae3ec9', beats: ['Water', 'Ice'] },
    Cosmic: { e: '🌌', c: '#5f3dc4', beats: ['Fire', 'Neon'] },
  };
  const THEME_TYPE = { Jungle: 'Jungle', Banana: 'Jungle', Toxic: 'Jungle', Sakura: 'Jungle', Lava: 'Fire', Sunset: 'Fire', Desert: 'Fire', 'Gold Rush': 'Fire',
    Ocean: 'Water', Storm: 'Water', Midnight: 'Water', Ice: 'Ice', Cloud: 'Ice', Neon: 'Neon', Candy: 'Neon', Retro: 'Neon', Matrix: 'Neon',
    Space: 'Cosmic', Void: 'Cosmic', Rainbow: 'Cosmic' };
  const typeOf = c => c.token ? 'Cosmic' : THEME_TYPE[c.theme ? c.theme[0] : ''] || 'Jungle';
  const eff = (atk, def) => TYPES[atk].beats.includes(def) ? 1.6 : TYPES[def].beats.includes(atk) ? .6 : 1;
  // second move comes from the card's best stat
  const SPECIALS = {
    Rizz:          { name: 'Rizz Up',      d: 'Next hit does 1.8× damage' },
    Rage:          { name: 'Tilt',         d: 'Big hit, but hurts you a bit' },
    Aura:          { name: 'Aura Shield',  d: 'Halves the next hit, heals a little' },
    Yapping:       { name: 'Yap Barrage',  d: '3 quick hits, each can miss' },
    'Brain Cells': { name: 'Big Brain',    d: 'Ignores types, may stun' },
    Luck:          { name: 'Lucky Shot',   d: '50%: double damage, or a dud' },
    Skill:         { name: 'Quick Combo',  d: 'Always goes first' },
    Clutch:        { name: 'Clutch Heal',  d: 'Heals 35% HP' },
  };
  function fighter(c) {
    const a = allStats(c), lvl = c.token ? 6 : c.lvl, power = c.token ? 180 : c.power;
    const best = Object.keys(a).sort((x, y) => a[y] - a[x])[0];
    const hp = Math.round(90 + power * 1.1);
    return { c, name: c.token ? 'Pirate Token' : c.member.name, title: c.token ? 'Pirate Token' : c.title, type: typeOf(c), hp, max: hp,
      atk: 30 + Math.round((c.token ? 160 : c.dmg) * .28) + lvl * 3, spd: (a.Skill + a.Clutch) / 2 + Math.random() * 6,
      sig: { name: c.token ? 'X Marks the Spot' : c.move }, sp: Object.assign({ key: best }, SPECIALS[best]),
      boost: 1, shield: false, stun: false };
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const Full = {
    E(s) { return Battle.el().querySelector(s); },
    pick() {
      Battle.on = true;
      const pool = Battle.deal().concat(Battle.deal()).filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i).slice(0, 6);
      this.choices = pool; this.chosen = [];
      Battle.el().innerHTML = `<div class="bt-score">🐉 Pick your team of 3</div>
        <p class="bt-msg">Tap 3 cards. The first one you pick goes out first. Types matter: 🔥 beats 🌿❄️ · 💧 beats 🔥🌌 · 🌿 beats 💧⚡ · ❄️ beats 🌿🌌 · ⚡ beats 💧❄️ · 🌌 beats 🔥⚡</p>
        <div class="fb-team"></div><button class="cards-btn fb-go" disabled>Battle!</button> <button class="cards-btn ghost fb-back">← Back</button>`;
      const team = this.E('.fb-team');
      pool.forEach((c, i) => {
        const el = cardEl(c, window.innerWidth < 600 ? 104 : 132);
        const t = document.createElement('span'); t.className = 'tybadge'; t.style.background = TYPES[typeOf(c)].c; t.textContent = TYPES[typeOf(c)].e + ' ' + typeOf(c) + (c.loan ? ' · LOAN' : ''); el.appendChild(t);
        el.onclick = () => {
          const k = this.chosen.indexOf(i);
          if (k >= 0) this.chosen.splice(k, 1); else if (this.chosen.length < 3) this.chosen.push(i);
          team.querySelectorAll('.tc').forEach((x, j) => x.classList.toggle('pick', this.chosen.includes(j)));
          this.E('.fb-go').disabled = this.chosen.length !== 3;
          this.E('.fb-go').textContent = this.chosen.length === 3 ? 'Battle!' : `Pick ${3 - this.chosen.length} more`;
        };
        team.appendChild(el);
      });
      this.E('.fb-go').textContent = 'Pick 3 cards';
      this.E('.fb-go').onclick = () => this.start(this.chosen.map(i => pool[i]));
      this.E('.fb-back').onclick = () => { Battle.on = false; Battle.intro(); };
    },
    start(cards) {
      const ms = members();
      this.me = cards.map(fighter);
      // the computer gets cards around the same rarity, with a random mix of types
      this.cpu = cards.map(c => { const lvl = Math.max(0, Math.min(5, (c.token ? 5 : c.lvl) + Math.floor(Math.random() * 3) - 1)), rar = RAR[lvl];
        return fighter(makeCard(ms[Math.floor(Math.random() * ms.length)], rar.from + Math.floor(Math.random() * (rar.to - rar.from + 1)))); });
      this.mi = 0; this.ci = 0; this.busy = false; this.over = false;
      Battle.el().innerHTML = `<div class="fb">
        <div class="fb-field">
          <div class="fb-side opp"><div class="fb-slot o"></div><div class="fb-hud o"></div></div>
          <div class="fb-side me"><div class="fb-slot m"></div><div class="fb-hud m"></div></div>
        </div>
        <div class="fb-log"></div><div class="fb-moves"></div></div>`;
      this.place('m', true); this.place('o', true);
      this.say(`The computer sends out ${this.cpu[0].name}! Go, ${this.me[0].name}!`).then(() => this.menu());
    },
    cardW(side) { const small = window.innerWidth < 600; return side === 'o' ? (small ? 96 : 130) : (small ? 112 : 150); },
    place(side, enter) {
      const f = side === 'm' ? this.me[this.mi] : this.cpu[this.ci];
      const slot = this.E('.fb-slot.' + side); slot.innerHTML = '';
      const el = cardEl(f.c, this.cardW(side)); el.classList.add('fb-card'); if (enter) el.classList.add('enter'); slot.appendChild(el);
      this.hud(side);
    },
    hud(side) {
      const team = side === 'm' ? this.me : this.cpu, f = team[side === 'm' ? this.mi : this.ci], pct = Math.max(0, f.hp / f.max * 100);
      const fx = [f.boost > 1 ? '💘 charged' : '', f.shield ? '🛡 shielded' : '', f.stun ? '💫 stunned' : ''].filter(Boolean).join(' · ');
      this.E('.fb-hud.' + side).innerHTML = `<b>${esc(f.title)}</b><span class="ty">${TYPES[f.type].e} ${f.type}</span>
        <div class="fb-hp"><i class="${pct < 25 ? 'low' : pct < 55 ? 'mid' : ''}" style="width:${pct}%"></i></div>
        <small>${Math.max(0, Math.ceil(f.hp))} / ${f.max} HP</small>${fx ? `<div class="fx">${fx}</div>` : ''}
        <div class="fb-bench">${team.map(x => `<i class="${x.hp <= 0 ? 'out' : ''}"></i>`).join('')}</div>`;
    },
    async say(t, ms) { const l = this.E('.fb-log'); if (l) l.innerHTML = t; await wait(ms || 1100); },
    menu() {
      if (this.over) return;
      const f = this.me[this.mi], box = this.E('.fb-moves'); box.innerHTML = '';
      this.E('.fb-log').innerHTML = `What will <b>${esc(f.name)}</b> do?`;
      const mk = (label, sub, color, fn, cls) => { const b = document.createElement('button'); b.className = 'fb-move ' + (cls || ''); b.style.background = color;
        b.innerHTML = `<b>${esc(label)}</b><span>${esc(sub)}</span>`; b.onclick = () => { if (!this.busy) fn(); }; box.appendChild(b); return b; };
      mk(f.sig.name, `${TYPES[f.type].e} ${f.type} attack · ${f.atk} power`, TYPES[f.type].c, () => this.turn({ kind: 'sig' }));
      mk(f.sp.name, f.sp.d, '#343a40', () => this.turn({ kind: 'sp' }));
      const bench = this.me.map((x, i) => ({ x, i })).filter(o => o.i !== this.mi && o.x.hp > 0);
      const sw = mk('Switch', bench.length ? 'Swap in another card (uses your turn)' : 'No one left to switch to', '#495057', () => this.switchMenu(), 'sw');
      sw.disabled = !bench.length;
    },
    switchMenu(forced) {
      const box = this.E('.fb-moves'); box.innerHTML = '';
      this.E('.fb-log').innerHTML = forced ? 'Who goes out next?' : 'Switch to who?';
      this.me.forEach((x, i) => {
        if (i === this.mi || x.hp <= 0) return;
        const b = document.createElement('button'); b.className = 'fb-move'; b.style.background = TYPES[x.type].c;
        b.innerHTML = `<b>${esc(x.name)}</b><span>${TYPES[x.type].e} ${x.type} · ${Math.ceil(x.hp)}/${x.max} HP</span>`;
        b.onclick = () => { if (this.busy) return; if (forced) this.sendNext(i); else this.turn({ kind: 'switch', to: i }); };
        box.appendChild(b);
      });
      if (!forced) { const b = document.createElement('button'); b.className = 'fb-move sw'; b.innerHTML = '<b>← Back</b><span>Pick a move instead</span>'; b.onclick = () => this.menu(); box.appendChild(b); }
    },
    cpuChoice() {
      const f = this.cpu[this.ci], foe = this.me[this.mi];
      if (f.sp.key === 'Clutch' && f.hp / f.max < .4 && Math.random() < .8) return { kind: 'sp' };
      if (f.sp.key === 'Rizz' && f.boost === 1 && f.hp / f.max > .6 && Math.random() < .5) return { kind: 'sp' };
      if (f.sp.key === 'Aura' && !f.shield && Math.random() < .25) return { kind: 'sp' };
      if (['Rage', 'Yapping', 'Luck', 'Skill', 'Brain Cells'].includes(f.sp.key) && (eff(f.type, foe.type) < 1 || Math.random() < .35)) return { kind: 'sp' };
      return { kind: 'sig' };
    },
    async turn(mine) {
      this.busy = true; this.E('.fb-moves').innerHTML = '';
      const theirs = this.cpuChoice(), me = this.me[this.mi], cp = this.cpu[this.ci];
      if (mine.kind === 'switch') { await this.doSwitch(mine.to); await this.act('o', theirs); }
      else {
        const pri = x => x.kind === 'sp' && x.f.sp.key === 'Skill' ? 1 : 0;
        const a = { side: 'm', m: mine, f: me }, b = { side: 'o', m: theirs, f: cp };
        a.f = me; b.f = cp; a.kind = mine.kind; b.kind = theirs.kind;
        const order = pri(a) !== pri(b) ? (pri(a) > pri(b) ? [a, b] : [b, a]) : (me.spd >= cp.spd ? [a, b] : [b, a]);
        for (const o of order) { if (this.over) break; const f = o.side === 'm' ? this.me[this.mi] : this.cpu[this.ci]; if (f !== o.f || f.hp <= 0) continue; await this.act(o.side, o.m); }
      }
      this.busy = false;
      if (!this.over) {
        if (this.me[this.mi].hp <= 0) this.switchMenu(true); else this.menu();
      }
    },
    async doSwitch(i) {
      await this.say(`${esc(this.me[this.mi].name)}, come back!`, 700);
      this.mi = i; this.place('m', true); await this.say(`Go, <b>${esc(this.me[i].name)}</b>!`, 900);
    },
    async sendNext(i) { this.busy = true; this.mi = i; this.place('m', true); await this.say(`Go, <b>${esc(this.me[i].name)}</b>!`, 900); this.busy = false; this.menu(); },
    dmg(att, def, mult, ignoreType) {
      const e = ignoreType ? 1 : eff(att.type, def.type);
      let d = att.atk * mult * e * att.boost * (.85 + Math.random() * .15);
      att.boost = 1;
      if (def.shield) { d *= .5; def.shield = false; }
      return { d: Math.max(1, Math.round(d)), e };
    },
    async hit(side, d, e) {
      const tSide = side === 'm' ? 'o' : 'm', t = tSide === 'm' ? this.me[this.mi] : this.cpu[this.ci];
      t.hp = Math.max(0, t.hp - d);
      const el = this.E('.fb-slot.' + tSide + ' .fb-card'); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      beep(e > 1 ? [300, 200, 150] : [220, 160], .06, 'sawtooth');
      this.hud(tSide); await wait(500);
      if (e > 1) await this.say('It\'s super effective! 🔥', 800);
      else if (e < 1) await this.say('It\'s not very effective…', 800);
    },
    async act(side, m) {
      const me = side === 'm', f = me ? this.me[this.mi] : this.cpu[this.ci], foe = me ? this.cpu[this.ci] : this.me[this.mi];
      const who = (me ? '' : 'The computer\'s ') + '<b>' + esc(f.name) + '</b>';
      if (f.stun) { f.stun = false; this.hud(side); await this.say(`${who} is stunned and can't move! 💫`); return; }
      const el = this.E('.fb-slot.' + side + ' .fb-card');
      const lunge = async () => { if (el) { el.classList.add(me ? 'lunge-r' : 'lunge-l'); await wait(220); el.classList.remove('lunge-r', 'lunge-l'); } };
      if (m.kind === 'sig') {
        await this.say(`${who} used <b>${esc(f.sig.name)}</b>!`, 650);
        if (Math.random() < .07) { await this.say('But it missed!'); return; }
        await lunge(); const r = this.dmg(f, foe, 1); await this.hit(side, r.d, r.e);
      } else {
        const k = f.sp.key; await this.say(`${who} used <b>${esc(f.sp.name)}</b>!`, 650);
        if (k === 'Rizz') { f.boost = 1.8; beep([660, 880], .07, 'triangle'); this.hud(side); await this.say(`${esc(f.name)} is feeling himself. Next hit is charged! 💘`); }
        else if (k === 'Aura') { f.shield = true; f.hp = Math.min(f.max, f.hp + f.max * .1); beep([523, 784], .07, 'triangle'); this.hud(side); await this.say(`${esc(f.name)} is surrounded by aura. 🛡`); }
        else if (k === 'Clutch') { f.hp = Math.min(f.max, f.hp + f.max * .35); beep([523, 659, 784], .07, 'triangle'); this.hud(side); await this.say(`${esc(f.name)} clutched up and healed! 💚`); }
        else if (k === 'Rage') { await lunge(); const r = this.dmg(f, foe, 1.45); await this.hit(side, r.d, r.e); f.hp = Math.max(0, f.hp - Math.round(r.d * .2)); this.hud(side); await this.say(`${esc(f.name)} hurt himself in the rage! 😤`, 900); }
        else if (k === 'Yapping') { let n = 0; for (let i = 0; i < 3; i++) { if (Math.random() < .75) { n++; await lunge(); const r = this.dmg(f, foe, .42); f.boost = 1; await this.hit(side, r.d, i === 2 ? r.e : 1); } } await this.say(n ? `Hit ${n} time${n > 1 ? 's' : ''}!` : 'All the yapping missed!'); }
        else if (k === 'Brain Cells') { await lunge(); const r = this.dmg(f, foe, 1.05, true); await this.hit(side, r.d, 1); if (Math.random() < .3 && foe.hp > 0) { foe.stun = true; this.hud(me ? 'o' : 'm'); await this.say(`${esc(foe.name)} is confused and stunned! 💫`); } }
        else if (k === 'Luck') { await lunge(); if (Math.random() < .5) { await this.say('🍀 Lucky!', 600); const r = this.dmg(f, foe, 2); await this.hit(side, r.d, r.e); } else { const r = this.dmg(f, foe, .3); await this.hit(side, r.d, 1); await this.say('…it was a dud. 🥲'); } }
        else if (k === 'Skill') { await lunge(); const r = this.dmg(f, foe, .8); await this.hit(side, r.d, r.e); }
      }
      await this.faints();
    },
    async faints() {
      const cp = this.cpu[this.ci], me = this.me[this.mi];
      if (cp.hp <= 0) {
        const el = this.E('.fb-slot.o .fb-card'); if (el) el.classList.add('faint');
        await this.say(`The computer's <b>${esc(cp.name)}</b> fainted! 💀`);
        const next = this.cpu.findIndex(x => x.hp > 0);
        if (next < 0) return this.end(true);
        this.ci = next; this.place('o', true); await this.say(`The computer sends out <b>${esc(this.cpu[next].name)}</b>!`);
      }
      if (me.hp <= 0 && !this.over) {
        const el = this.E('.fb-slot.m .fb-card'); if (el) el.classList.add('faint');
        await this.say(`<b>${esc(me.name)}</b> fainted! 💀`);
        if (!this.me.some(x => x.hp > 0)) return this.end(false);
      }
    },
    async end(won) {
      this.over = true; this.E('.fb-moves').innerHTML = '';
      if (won) { beep([523, 659, 784, 1047, 1319], .1); await this.say('🏆 <b>You won the battle!</b> +1 🍀 Lucky Pack', 400);
        window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why: 'winning a Full Battle', lucky: true } })); }
      else { beep([392, 330, 262], .15); await this.say('💀 <b>All your cards fainted.</b> The computer wins this one.', 400); }
      const box = this.E('.fb-moves');
      const a = document.createElement('button'); a.className = 'fb-move'; a.style.background = '#2f9e44'; a.innerHTML = '<b>Play again</b><span>Pick a new team</span>'; a.onclick = () => this.pick();
      const b = document.createElement('button'); b.className = 'fb-move sw'; b.innerHTML = '<b>Back</b><span>Other battle modes</span>'; b.onclick = () => { Battle.on = false; Battle.intro(); };
      box.append(a, b);
    }
  };

  function tiltIf(c) { if (matchMedia('(hover: hover)').matches) tilt(c); }

  /* ------------------------------ toasts & bonus packs ------------------------------ */
  function toast(t) { const d = document.createElement('div'); d.className = 'gb-toast'; d.textContent = t; css(); document.body.appendChild(d); setTimeout(() => d.remove(), 4600); }
  // other games call this: window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why, lucky: true, count: 1 } }))
  window.addEventListener('mb:pack', e => {
    const d = e.detail || {}, n = Math.max(1, Math.min(5, d.count || 1));
    S = LS.get('mb_cards', S); if (S.lucky == null) S.lucky = 0;
    if (d.lucky) S.lucky = Math.min(50, S.lucky + n); else S.packs = Math.min(20, (S.packs || 0) + n);
    save(); render();
    toast((d.lucky ? '🍀 +' + n + ' Lucky Pack' + (n > 1 ? 's' : '') : '🃏 +' + n + ' card pack' + (n > 1 ? 's' : '')) + (d.why ? ' for ' + d.why : '') + '! Open in Games → Monkey Cards');
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
