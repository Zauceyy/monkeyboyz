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
  .fb-audio{position:absolute;top:10px;left:10px;display:flex;gap:6px;z-index:3}
  .fb-audio button{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.85);cursor:pointer;font-size:16px}
  .fb-move em{font-style:normal;font-size:11px;opacity:.85;align-self:flex-end;margin-top:-16px}
  .fb-extra{display:flex;justify-content:center;margin-top:10px;min-height:10px}
  .fb-part{position:absolute;z-index:4;font-size:22px;pointer-events:none;transform:translate(-50%,-50%);animation:fbPart .75s ease-out forwards}
  @keyframes fbPart{0%{opacity:1;transform:translate(-50%,-50%) scale(.6)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.3)}}
  .fb-side.opp{top:56px}
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
      if (v !== 'bt') FX.stopMusic();
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
  function hide() { clearInterval(timerT); timerT = 0; clearInterval(Feed.poll); Feed.poll = 0; FX.stopMusic(); }

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
      FX.stopMusic(); this.on = false;
      const n = owned().filter(id => !id.startsWith('secret:')).length;
      this.el().innerHTML = `<div class="bt-score">🐉 Card Battle</div>
        <p class="bt-msg">Pokémon style. Pick 3 of your cards. Each one has HP, a type and 4 moves. Take turns attacking and switching until one side is knocked out. Win for a <b>🍀 Lucky Pack</b>.</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="cards-btn fb-start">🤖 Vs computer</button><button class="cards-btn bt-pvp" style="background:#5865f2;color:#fff">🌐 Vs a friend (online)</button></div>
        ${n < 6 ? `<p class="bt-msg" style="color:var(--ink2);font-size:14px">You have ${n} card${n === 1 ? '' : 's'}, so you'll borrow some Commons (marked LOAN) if you need them.</p>` : ''}`;
      this.el().querySelector('.fb-start').onclick = () => { PvP.close(); Full.pick('cpu'); };
      this.el().querySelector('.bt-pvp').onclick = () => PvP.lobby();
    },
    deal() {
      const ms = members(), pool = owned().filter(id => !id.startsWith('secret:')).map(cardById).filter(Boolean);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const hand = pool.slice(0, 5);
      while (hand.length < 5) { const c = makeCard(ms[Math.floor(Math.random() * ms.length)], 1 + Math.floor(Math.random() * 50)); c.loan = true; hand.push(c); }
      return hand;
    }
  };

  /* ---- online battles: room codes, browser to browser (PeerJS) ---- */
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
    online() { return !!(this.conn && this.conn.open); },
    close() { clearInterval(this.hb); this.hb = 0; try { this.conn && this.conn.close(); } catch (e) {} try { this.peer && this.peer.destroy(); } catch (e) {} this.conn = this.peer = null; },
    send(m) { try { if (this.conn && this.conn.open) this.conn.send(m); } catch (e) {} },
    lobby(msg) {
      this.close(); Battle.on = false; FX.stopMusic();
      Battle.el().innerHTML = `<div class="bt-score">🌐 Battle a friend</div>
        <p class="bt-msg">Battle with your real cards. One of you makes a room, the other joins with the code. The winner gets a <b>🍀 Lucky Pack</b>.</p>
        <div style="max-width:340px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
          <input class="pv-name" maxlength="16" placeholder="Your name" style="font:inherit;font-size:16px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-align:center">
          <button class="cards-btn pv-create">Create room</button>
          <div style="display:flex;gap:8px"><input class="pv-code" maxlength="4" placeholder="CODE" autocomplete="off" style="flex:1;min-width:0;font:inherit;font-size:16px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);text-align:center;letter-spacing:.3em;text-transform:uppercase;font-weight:700"><button class="cards-btn ghost pv-join">Join</button></div>
          <button class="cards-btn ghost pv-back">← Back</button>
          <p class="bt-msg pv-msg" style="color:#e5484d">${esc(msg || '')}</p>
        </div>`;
      const nm = this.E('.pv-name'); nm.value = this.me || Feed.name();
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
          this.wire(conn); conn.on('open', () => this.send({ t: 'hi', name: this.me || 'Friend' }));
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
          conn.on('open', () => { done = true; clearTimeout(t); this.send({ t: 'hi', name: this.me || 'Friend' }); }); });
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
    left() {
      if (!this.peer && !this.conn) return; const n = this.opp; this.close(); Full.mode = null;
      if (root && !root.querySelector('.battle').hidden) this.lobby(n + ' left the battle.');
    },
    onMsg(m) {
      if (!m || typeof m !== 'object') return;
      const okId = x => typeof x === 'string' && /^[a-z0-9 _.-]+:\d{1,3}$/i.test(x);
      if (m.t === 'hi') { this.opp = String(m.name || 'Friend').slice(0, 16); Full.pick('online'); }
      else if (m.t === 'full') this.lobby('That room already has two players.');
      else if (m.t === 'team' && Array.isArray(m.ids) && m.ids.length === 3 && m.ids.every(okId)) Full.gotOppTeam(m.ids);
      else if (m.t === 'begin' && !this.host) Full.beginOnline(Number(m.seed) >>> 0);
      else if (m.t === 'act' && m.a) Full.gotOppAct(Number(m.turn), m.a);
      else if (m.t === 'next') Full.gotOppNext(Number(m.turn), Number(m.to));
      else if (m.t === 'again') { if (Full.over || !Full.mode) Full.pick('online'); }
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
  // ---- moves: every card gets 4, Pokémon style (with PP) ----
  // 1) its printed move  2) a move from its type  3) a special from its best stat  4) a special from its 2nd best stat
  const TYPE_MOVES = {
    Fire:   [{ name: 'Banana Flamethrower', pow: 1.25, acc: .85 }, { name: 'Ember Rant', pow: 1.0, acc: 1 }],
    Water:  [{ name: 'Hydro Yap', pow: 1.25, acc: .85 }, { name: 'Spit Take', pow: 1.0, acc: 1 }],
    Jungle: [{ name: 'Vine Slap', pow: 1.25, acc: .85 }, { name: 'Banana Peel', pow: 1.0, acc: 1 }],
    Ice:    [{ name: 'Brain Freeze', pow: 1.25, acc: .85 }, { name: 'Cold Shoulder', pow: 1.0, acc: 1 }],
    Neon:   [{ name: 'Thunder Spam', pow: 1.25, acc: .85 }, { name: 'RGB Flash', pow: 1.0, acc: 1 }],
    Cosmic: [{ name: 'Void Pulse', pow: 1.25, acc: .85 }, { name: 'Star Toss', pow: 1.0, acc: 1 }],
  };
  const SPECIALS = {
    Rizz:          { name: 'Rizz Up',      d: 'Next hit does 1.8×', status: true },
    Rage:          { name: 'Tilt',         d: 'Huge hit, some recoil' },
    Aura:          { name: 'Aura Shield',  d: 'Halve next hit, small heal', status: true },
    Yapping:       { name: 'Yap Barrage',  d: '3 quick hits, can miss' },
    'Brain Cells': { name: 'Big Brain',    d: 'Ignores types, may stun' },
    Luck:          { name: 'Lucky Shot',   d: '50/50: double or a dud' },
    Skill:         { name: 'Quick Combo',  d: 'Always goes first' },
    Clutch:        { name: 'Clutch Heal',  d: 'Heal 35% HP', status: true },
  };
  function fighter(c) {
    const a = allStats(c), lvl = c.token ? 6 : c.lvl, power = c.token ? 180 : c.power, type = typeOf(c);
    const ranked = Object.keys(a).sort((x, y) => a[y] - a[x]);
    const hp = Math.round(100 + power * 1.15);
    const r = rng(hash(c.id + '#moves'));
    const tm = TYPE_MOVES[type][r() < .5 ? 0 : 1];
    const moves = [
      { kind: 'sig', name: c.token ? 'X Marks the Spot' : c.move, type, pow: 1, acc: .95, pp: 15, d: `${TYPES[type].e} ${type} · reliable` },
      { kind: 'type', name: tm.name, type, pow: tm.pow, acc: tm.acc, pp: tm.pow > 1 ? 5 : 10, d: `${TYPES[type].e} ${type} · ${tm.pow > 1 ? 'strong, can miss' : 'never misses'}` },
      Object.assign({ kind: 'sp', key: ranked[0], pp: 5 }, SPECIALS[ranked[0]]),
      Object.assign({ kind: 'sp', key: ranked[1], pp: 5 }, SPECIALS[ranked[1]]),
    ].map(m => Object.assign(m, { max: m.pp }));
    return { c, name: c.token ? 'Pirate Token' : c.member.name, title: c.token ? 'Pirate Token' : c.title, type, hp, max: hp,
      atk: 30 + Math.round((c.token ? 160 : c.dmg) * .28) + lvl * 3, spd: (a.Skill + a.Clutch) / 2 + (hash(c.id + '#spd') % 600) / 100,
      moves, boost: 1, shield: false, stun: false };
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---- battle music + Pokémon-ish sound effects ---- */
  const FX = {
    ctx: null, music: null, musicOn: LS.get('mb_battle_music', true), sfxOn: LS.get('mb_battle_sfx', true),
    ac() { try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) {} return this.ctx; },
    startMusic() {
      if (!this.musicOn) return;
      if (!this.music) { this.music = new Audio('games/audio/battle.mp3'); this.music.loop = true; this.music.volume = .45; this.music.preload = 'auto'; }
      try { this.music.currentTime = 0; this.music.play().catch(() => {}); } catch (e) {}
    },
    stopMusic() { try { this.music && this.music.pause(); } catch (e) {} },
    fadeMusic() { const m = this.music; if (!m) return; let v = m.volume; const t = setInterval(() => { v -= .05; if (v <= 0) { clearInterval(t); m.pause(); m.volume = .45; } else m.volume = v; }, 60); },
    tone(f, t0, dur, type, vol, slideTo) {
      const c = this.ac(); if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
    },
    noise(t0, dur, vol, freq, q) {
      const c = this.ac(); if (!c) return; const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0;
      s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || .8; g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
    },
    play(name, arg) {
      if (!this.sfxOn) return;
      const T = this;
      ({
        select() { T.tone(880, 0, .06, 'square', .06); },
        hit() { T.noise(0, .18, .5, 900, .6); T.tone(140, 0, .15, 'square', .18, 60); },
        bigHit() { T.noise(0, .3, .7, 600, .5); T.tone(220, 0, .3, 'sawtooth', .2, 40); T.noise(.08, .2, .4, 2400, 1); },
        weak() { T.noise(0, .12, .3, 1800, 1.2); },
        miss() { T.noise(0, .25, .25, 3000, .4); T.tone(600, 0, .25, 'sine', .05, 1400); },
        whoosh() { T.noise(0, .22, .25, 2600, .5); },
        // each type gets its own "attack" sound
        Fire() { T.noise(0, .45, .45, 500, .4); T.tone(300, 0, .45, 'sawtooth', .07, 90); },
        Water() { [0, .07, .14, .21].forEach((t, i) => T.tone(500 - i * 60, t, .12, 'sine', .12, 200)); T.noise(0, .3, .2, 1500, .7); },
        Jungle() { T.noise(0, .08, .4, 2000, 2); T.noise(.1, .08, .4, 1600, 2); T.tone(180, .02, .2, 'triangle', .15, 90); },
        Ice() { [1760, 2093, 2637, 3136].forEach((f, i) => T.tone(f, i * .05, .25, 'triangle', .06)); T.noise(0, .3, .15, 5000, 2); },
        Neon() { for (let i = 0; i < 6; i++) T.tone(200 + Math.random() * 1600, i * .04, .05, 'square', .08); T.noise(0, .3, .3, 3500, 3); },
        Cosmic() { T.tone(200, 0, .6, 'sine', .15, 900); T.tone(203, 0, .6, 'sine', .1, 920); T.tone(1200, .25, .4, 'triangle', .05, 300); },
        buff() { [523, 659, 784, 1047].forEach((f, i) => T.tone(f, i * .07, .18, 'square', .07)); },
        heal() { [784, 988, 1175, 1568, 1976].forEach((f, i) => T.tone(f, i * .06, .3, 'triangle', .08)); },
        shield() { T.tone(400, 0, .5, 'sine', .14, 800); T.tone(600, .05, .5, 'triangle', .06, 1200); },
        stun() { [880, 660, 880, 660].forEach((f, i) => T.tone(f, i * .08, .08, 'square', .06)); },
        super() { T.tone(523, 0, .1, 'square', .08); T.tone(784, .08, .2, 'square', .08); },
        faint() { T.tone(600, 0, .8, 'square', .1, 60); T.noise(.2, .5, .25, 400, .5); },
        sendOut() { T.tone(1200, 0, .05, 'square', .07); T.noise(.05, .12, .3, 3000, 1); T.tone(400, .1, .2, 'triangle', .12, 800); },
        lowhp() { T.tone(988, 0, .08, 'square', .05); T.tone(988, .16, .08, 'square', .05); },
        win() { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => T.tone(f, i * .12, .2, 'square', .09)); },
        lose() { [392, 370, 349, 330, 262].forEach((f, i) => T.tone(f, i * .22, .3, 'triangle', .1)); },
      })[name]?.(arg);
    }
  };
  // little burst of emoji on the card that gets hit
  function burst(el, emoji, n) {
    if (!el) return; const r = el.getBoundingClientRect(), field = el.closest('.fb-field'); if (!field) return; const f = field.getBoundingClientRect();
    for (let i = 0; i < (n || 8); i++) {
      const s = document.createElement('span'); s.className = 'fb-part'; s.textContent = emoji;
      s.style.left = (r.left - f.left + r.width / 2) + 'px'; s.style.top = (r.top - f.top + r.height / 2) + 'px';
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      field.appendChild(s); setTimeout(() => s.remove(), 750);
    }
  }

  const Full = {
    mode: null, over: false,
    E(s) { return Battle.el().querySelector(s); },
    oppName() { return this.mode === 'online' ? PvP.opp : 'The computer'; },
    foeOf() { return this.mode === 'online' ? esc(PvP.opp) + '\'s ' : 'The foe\'s '; },
    // ---------- team picking ----------
    pick(mode) {
      if (mode === 'online' && !PvP.online()) return PvP.lobby();
      Battle.on = true; FX.stopMusic();
      this.mode = mode; this.over = false; this.phase = 'pick'; this.myTeam = null; this.oppTeam = null;
      const pool = Battle.deal().concat(Battle.deal()).filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i).slice(0, 6);
      this.chosen = [];
      Battle.el().innerHTML = `<div class="bt-score">🐉 Pick your team of 3${mode === 'online' ? ' · vs ' + esc(PvP.opp) : ''}</div>
        <p class="bt-msg">Tap 3 cards. The first one you pick goes out first. Types matter: 🔥 beats 🌿❄️ · 💧 beats 🔥🌌 · 🌿 beats 💧⚡ · ❄️ beats 🌿🌌 · ⚡ beats 💧❄️ · 🌌 beats 🔥⚡</p>
        <div class="fb-team"></div><button class="cards-btn fb-go" disabled>Pick 3 cards</button> <button class="cards-btn ghost fb-back">${mode === 'online' ? 'Leave' : '← Back'}</button>
        <p class="bt-msg fb-wait" style="color:var(--ink2)"></p>`;
      const team = this.E('.fb-team');
      pool.forEach((c, i) => {
        const el = cardEl(c, window.innerWidth < 600 ? 104 : 132);
        const t = document.createElement('span'); t.className = 'tybadge'; t.style.background = TYPES[typeOf(c)].c; t.textContent = TYPES[typeOf(c)].e + ' ' + typeOf(c) + (c.loan ? ' · LOAN' : ''); el.appendChild(t);
        el.onclick = () => {
          if (this.myTeam) return;
          const k = this.chosen.indexOf(i);
          if (k >= 0) this.chosen.splice(k, 1); else if (this.chosen.length < 3) this.chosen.push(i);
          FX.play('select');
          team.querySelectorAll('.tc').forEach((x, j) => x.classList.toggle('pick', this.chosen.includes(j)));
          this.E('.fb-go').disabled = this.chosen.length !== 3;
          this.E('.fb-go').textContent = this.chosen.length === 3 ? 'Battle!' : `Pick ${3 - this.chosen.length} more`;
        };
        team.appendChild(el);
      });
      this.E('.fb-go').onclick = () => {
        const cards = this.chosen.map(i => pool[i]);
        if (mode === 'cpu') return this.startCpu(cards);
        this.myTeam = cards; PvP.send({ t: 'team', ids: cards.map(c => c.id) });
        this.E('.fb-go').disabled = true; this.E('.fb-go').textContent = 'Team locked ✓';
        this.E('.fb-wait').textContent = this.oppTeam ? 'Starting…' : `Waiting for ${PvP.opp} to pick their team…`;
        if (PvP.host && this.oppTeam) this.beginHost();
      };
      this.E('.fb-back').onclick = () => { if (mode === 'online') { PvP.close(); this.mode = null; } Battle.intro(); };
      if (mode === 'online') this.E('.fb-wait').textContent = `${PvP.opp} is picking their team too.`;
    },
    gotOppTeam(ids) {
      if (this.phase !== 'pick') return;
      this.oppTeam = ids;
      const w = this.E('.fb-wait'); if (w) w.textContent = this.myTeam ? 'Starting…' : `${PvP.opp} has picked their team. Your turn!`;
      if (PvP.host && this.myTeam) this.beginHost();
    },
    beginHost() { const seed = (Math.random() * 4294967296) >>> 0; PvP.send({ t: 'begin', seed }); this.beginOnline(seed); },
    beginOnline(seed) {
      if (this.phase !== 'pick' || !this.myTeam || !this.oppTeam) return;
      const ms = members();
      const opp = this.oppTeam.map(id => cardById(id) || makeCard(ms[0], 1));
      this.start(this.myTeam, opp, seed);
    },
    startCpu(cards) {
      const ms = members();
      const opp = cards.map(c => { const lvl = Math.max(0, Math.min(5, (c.token ? 5 : c.lvl) + Math.floor(Math.random() * 3) - 1)), rar = RAR[lvl];
        return makeCard(ms[Math.floor(Math.random() * ms.length)], rar.from + Math.floor(Math.random() * (rar.to - rar.from + 1))); });
      this.start(cards, opp, null);
    },
    // ---------- the battle ----------
    start(myCards, oppCards, seed) {
      this.phase = 'battle';
      // online: both screens use the same random numbers, so every roll comes out the same
      const r = seed != null ? rng(seed) : null; this.R = r || Math.random;
      this.me = myCards.map(fighter); this.op = oppCards.map(fighter);
      this.mi = 0; this.ci = 0; this.busy = false; this.over = false; this.warned = false;
      this.turnNo = 0; this.myAct = null; this.oppActs = {}; this.needMine = false; this.needOpp = false; this.oppNext = {};
      Battle.el().innerHTML = `<div class="fb">
        <div class="fb-field">
          <div class="fb-audio"><button class="fb-mus" title="Music"></button><button class="fb-sfx" title="Sound effects"></button></div>
          <div class="fb-side opp"><div class="fb-slot o"></div><div class="fb-hud o"></div></div>
          <div class="fb-side me"><div class="fb-slot m"></div><div class="fb-hud m"></div></div>
        </div>
        <div class="fb-log"></div><div class="fb-moves"></div><div class="fb-extra"></div></div>`;
      const mb = this.E('.fb-mus'), sb = this.E('.fb-sfx');
      const sync = () => { mb.textContent = FX.musicOn ? '🎵' : '🔇'; sb.textContent = FX.sfxOn ? '🔊' : '🔈'; };
      mb.onclick = () => { FX.musicOn = !FX.musicOn; LS.set('mb_battle_music', FX.musicOn); FX.musicOn && !this.over ? FX.startMusic() : FX.stopMusic(); sync(); };
      sb.onclick = () => { FX.sfxOn = !FX.sfxOn; LS.set('mb_battle_sfx', FX.sfxOn); sync(); };
      sync(); FX.startMusic();
      this.place('o', true); FX.play('sendOut');
      this.say(`${esc(this.oppName())} wants to battle! ${this.mode === 'online' ? 'They send' : 'It sends'} out <b>${esc(this.op[0].name)}</b>!`, 1300)
        .then(() => { this.place('m', true); FX.play('sendOut'); return this.say(`Go, <b>${esc(this.me[0].name)}</b>!`, 900); })
        .then(() => this.menu());
    },
    cardW(side) { const small = window.innerWidth < 600; return side === 'o' ? (small ? 96 : 130) : (small ? 112 : 150); },
    place(side, enter) {
      const f = side === 'm' ? this.me[this.mi] : this.op[this.ci];
      const slot = this.E('.fb-slot.' + side); if (!slot) return; slot.innerHTML = '';
      const el = cardEl(f.c, this.cardW(side)); el.classList.add('fb-card'); if (enter) el.classList.add('enter'); slot.appendChild(el);
      this.hud(side);
    },
    hud(side) {
      const team = side === 'm' ? this.me : this.op, f = team[side === 'm' ? this.mi : this.ci], pct = Math.max(0, f.hp / f.max * 100);
      const fx = [f.boost > 1 ? '💘 charged' : '', f.shield ? '🛡 shielded' : '', f.stun ? '💫 stunned' : ''].filter(Boolean).join(' · ');
      const h = this.E('.fb-hud.' + side); if (!h) return;
      h.innerHTML = `<b>${esc(f.title)}</b><span class="ty">${TYPES[f.type].e} ${f.type}</span>
        <div class="fb-hp"><i class="${pct < 25 ? 'low' : pct < 55 ? 'mid' : ''}" style="width:${pct}%"></i></div>
        <small>${Math.max(0, Math.ceil(f.hp))} / ${f.max} HP</small>${fx ? `<div class="fx">${fx}</div>` : ''}
        <div class="fb-bench">${team.map(x => `<i class="${x.hp <= 0 ? 'out' : ''}"></i>`).join('')}</div>`;
    },
    async say(t, ms) { const l = this.E('.fb-log'); if (l) l.innerHTML = t; await wait(ms || 1100); },
    clearButtons() { const a = this.E('.fb-moves'), b = this.E('.fb-extra'); if (a) a.innerHTML = ''; if (b) b.innerHTML = ''; },
    menu() {
      if (this.over || this.busy) return;
      if (this.needMine) return this.switchMenu(true);
      if (this.needOpp) { this.clearButtons(); this.E('.fb-log').innerHTML = `Waiting for ${esc(PvP.opp)} to send out their next card…`; return; }
      const f = this.me[this.mi], box = this.E('.fb-moves'), extra = this.E('.fb-extra'); this.clearButtons();
      this.E('.fb-log').innerHTML = `What will <b>${esc(f.name)}</b> do?`;
      if (f.hp / f.max < .25 && !this.warned) { this.warned = true; FX.play('lowhp'); }
      f.moves.forEach((m, i) => {
        const b = document.createElement('button'); b.className = 'fb-move';
        b.style.background = m.kind === 'sp' ? '#343a40' : TYPES[m.type].c;
        b.innerHTML = `<b>${esc(m.name)}</b><span>${esc(m.d)}</span><em>PP ${m.pp}/${m.max}</em>`;
        b.disabled = m.pp <= 0;
        b.onclick = () => { if (!this.busy) { FX.play('select'); this.choose({ kind: 'move', i }); } };
        box.appendChild(b);
      });
      if (f.moves.every(m => m.pp <= 0)) { const b = document.createElement('button'); b.className = 'fb-move'; b.style.background = '#868e96';
        b.innerHTML = '<b>Struggle</b><span>Out of PP! Weak hit with recoil</span>'; b.onclick = () => { if (!this.busy) this.choose({ kind: 'move', i: -1 }); }; box.appendChild(b); }
      const bench = this.me.filter((x, i) => i !== this.mi && x.hp > 0);
      const sw = document.createElement('button'); sw.className = 'cards-btn ghost'; sw.textContent = bench.length ? '🔄 Switch card' : 'No one left to switch to';
      sw.disabled = !bench.length; sw.onclick = () => { if (!this.busy) this.switchMenu(); }; extra.appendChild(sw);
    },
    switchMenu(forced) {
      const box = this.E('.fb-moves'), extra = this.E('.fb-extra'); this.clearButtons();
      this.E('.fb-log').innerHTML = forced ? 'Who goes out next?' : 'Switch to who?';
      this.me.forEach((x, i) => {
        if (i === this.mi || x.hp <= 0) return;
        const b = document.createElement('button'); b.className = 'fb-move'; b.style.background = TYPES[x.type].c;
        b.innerHTML = `<b>${esc(x.name)}</b><span>${TYPES[x.type].e} ${x.type} · ${Math.ceil(x.hp)}/${x.max} HP</span>`;
        b.onclick = () => { if (this.busy) return; if (forced) this.sendNext(i); else this.choose({ kind: 'switch', to: i }); };
        box.appendChild(b);
      });
      if (!forced) { const b = document.createElement('button'); b.className = 'cards-btn ghost'; b.textContent = '← Back to moves'; b.onclick = () => this.menu(); extra.appendChild(b); }
    },
    // you picked what to do this turn
    choose(a) {
      if (this.mode === 'cpu') return this.resolve(a, this.cpuChoice());
      this.myAct = a; this.clearButtons();
      PvP.send({ t: 'act', turn: this.turnNo, a });
      this.E('.fb-log').innerHTML = `Waiting for ${esc(PvP.opp)}…`;
      if (this.oppActs[this.turnNo]) this.resolve(a, this.oppActs[this.turnNo]);
    },
    gotOppAct(turn, a) {
      if (this.phase !== 'battle' || this.over) return;
      const ok = (a.kind === 'move' && Number.isInteger(a.i) && a.i >= -1 && a.i <= 3) || (a.kind === 'switch' && Number.isInteger(a.to) && a.to >= 0 && a.to <= 2);
      if (!ok) return;
      this.oppActs[turn] = a;
      if (turn === this.turnNo && this.myAct && !this.busy) this.resolve(this.myAct, a);
    },
    cpuChoice() {
      const f = this.op[this.ci], foe = this.me[this.mi], ok = f.moves.map((m, i) => ({ m, i })).filter(o => o.m.pp > 0);
      if (!ok.length) return { kind: 'move', i: -1 };
      const has = k => ok.find(o => o.m.kind === 'sp' && o.m.key === k);
      if (has('Clutch') && f.hp / f.max < .4 && Math.random() < .8) return { kind: 'move', i: has('Clutch').i };
      if (has('Rizz') && f.boost === 1 && f.hp / f.max > .55 && Math.random() < .45) return { kind: 'move', i: has('Rizz').i };
      if (has('Aura') && !f.shield && Math.random() < .2) return { kind: 'move', i: has('Aura').i };
      const attacks = ok.filter(o => !o.m.status);
      if (!attacks.length) return { kind: 'move', i: ok[0].i };
      const score = o => (o.m.pow || 1.1) * (o.m.kind === 'sp' && o.m.key === 'Brain Cells' ? 1 : eff(f.type, foe.type)) * (o.m.acc || .9) * (.8 + Math.random() * .4);
      attacks.sort((a, b) => score(b) - score(a));
      return { kind: 'move', i: attacks[0].i };
    },
    // both sides have chosen: play out the turn the same way on both screens
    async resolve(mine, theirs) {
      if (this.busy) return;
      this.busy = true; this.clearButtons();
      // "first" = host's side when it's a tie, so both screens agree
      const iAmFirst = this.mode === 'online' ? PvP.host : true;
      const A = { side: 'm', a: mine }, B = { side: 'o', a: theirs };
      const tiePair = iAmFirst ? [A, B] : [B, A];
      // switches happen before attacks
      for (const o of tiePair) if (o.a.kind === 'switch') await this.doSwitch(o.side, o.a.to);
      const movers = [A, B].filter(o => o.a.kind === 'move');
      const pri = o => { const f = o.side === 'm' ? this.me[this.mi] : this.op[this.ci]; return o.a.i >= 0 && f.moves[o.a.i].kind === 'sp' && f.moves[o.a.i].key === 'Skill' ? 1 : 0; };
      const spd = o => (o.side === 'm' ? this.me[this.mi] : this.op[this.ci]).spd;
      movers.sort((x, y) => pri(y) - pri(x) || spd(y) - spd(x) || tiePair.indexOf(x) - tiePair.indexOf(y));
      const actors = movers.map(o => ({ o, f: o.side === 'm' ? this.me[this.mi] : this.op[this.ci] }));
      for (const { o, f } of actors) {
        if (this.over) break;
        const cur = o.side === 'm' ? this.me[this.mi] : this.op[this.ci];
        if (cur !== f || f.hp <= 0) continue;
        await this.act(o.side, o.a);
      }
      this.turnNo++; this.myAct = null; this.busy = false;
      if (this.over) return;
      if (this.mode === 'online') {
        this.needMine = this.me[this.mi].hp <= 0;
        this.needOpp = this.op[this.ci].hp <= 0;
        if (this.needOpp && this.oppNext[this.turnNo] != null) this.applyOppNext(this.oppNext[this.turnNo]);
      } else this.needMine = this.me[this.mi].hp <= 0;
      this.menu();
    },
    async doSwitch(side, i) {
      if (side === 'm') {
        await this.say(`${esc(this.me[this.mi].name)}, come back!`, 700);
        this.mi = i; this.warned = false; this.place('m', true); FX.play('sendOut'); await this.say(`Go, <b>${esc(this.me[i].name)}</b>!`, 900);
      } else {
        await this.say(`${esc(this.oppName())} withdrew ${esc(this.op[this.ci].name)}!`, 700);
        this.ci = i; this.place('o', true); FX.play('sendOut'); await this.say(`${esc(this.oppName())} sent out <b>${esc(this.op[i].name)}</b>!`, 900);
      }
    },
    async sendNext(i) {
      this.busy = true; this.mi = i; this.warned = false; this.needMine = false;
      if (this.mode === 'online') PvP.send({ t: 'next', turn: this.turnNo, to: i });
      this.place('m', true); FX.play('sendOut'); await this.say(`Go, <b>${esc(this.me[i].name)}</b>!`, 900);
      this.busy = false; this.menu();
    },
    gotOppNext(turn, to) {
      if (this.phase !== 'battle' || this.over || !(to >= 0 && to <= 2)) return;
      this.oppNext[turn] = to;
      if (this.needOpp && turn === this.turnNo && !this.busy) this.applyOppNext(to);
    },
    async applyOppNext(to) {
      if (!this.op[to] || this.op[to].hp <= 0) return;
      this.needOpp = false; this.busy = true;
      this.ci = to; this.place('o', true); FX.play('sendOut');
      await this.say(`${esc(PvP.opp)} sent out <b>${esc(this.op[to].name)}</b>!`, 1000);
      this.busy = false; this.menu();
    },
    dmg(att, def, mult, ignoreType, type) {
      const e = ignoreType ? 1 : eff(type || att.type, def.type);
      let d = att.atk * mult * e * att.boost * (.85 + this.R() * .15);
      const crit = this.R() < .0625; if (crit) d *= 1.5;
      att.boost = 1;
      if (def.shield) { d *= .5; def.shield = false; }
      return { d: Math.max(1, Math.round(d)), e, crit };
    },
    async hit(side, r, type, quiet) {
      const tSide = side === 'm' ? 'o' : 'm', t = tSide === 'm' ? this.me[this.mi] : this.op[this.ci];
      t.hp = Math.max(0, t.hp - r.d);
      const el = this.E('.fb-slot.' + tSide + ' .fb-card');
      if (type) { FX.play(type); burst(el, TYPES[type].e, 9); await wait(260); }
      if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      FX.play(r.e > 1 || r.crit ? 'bigHit' : r.e < 1 ? 'weak' : 'hit');
      this.hud(tSide); await wait(520);
      if (quiet) return;
      if (r.crit) await this.say('A critical hit! 💥', 750);
      if (r.e > 1) { FX.play('super'); await this.say('It\'s super effective!', 850); }
      else if (r.e < 1) await this.say('It\'s not very effective…', 850);
    },
    async act(side, choice) {
      const me = side === 'm', f = me ? this.me[this.mi] : this.op[this.ci], foe = me ? this.op[this.ci] : this.me[this.mi];
      const who = (me ? '' : this.foeOf()) + '<b>' + esc(f.name) + '</b>';
      if (f.stun) { f.stun = false; this.hud(side); FX.play('stun'); await this.say(`${who} is stunned and can't move! 💫`); return; }
      const el = this.E('.fb-slot.' + side + ' .fb-card');
      const lunge = async () => { FX.play('whoosh'); if (el) { el.classList.add(me ? 'lunge-r' : 'lunge-l'); await wait(200); el.classList.remove('lunge-r', 'lunge-l'); } };
      if (choice.i < 0 || !f.moves[choice.i]) {   // Struggle
        await this.say(`${who} has no moves left and used <b>Struggle</b>!`, 700);
        await lunge(); const r = this.dmg(f, foe, .5, true); await this.hit(side, r, null, true);
        f.hp = Math.max(0, f.hp - Math.round(f.max * .12)); this.hud(side); await this.say(`${esc(f.name)} is hurt by recoil!`, 800);
        return this.faints();
      }
      const m = f.moves[choice.i]; m.pp = Math.max(0, m.pp - 1);
      await this.say(`${who} used <b>${esc(m.name)}</b>!`, 700);
      if (m.kind !== 'sp') {
        if (this.R() > m.acc) { await lunge(); FX.play('miss'); await this.say(`${esc(foe.name)} dodged it! The attack missed!`); return; }
        await lunge(); await this.hit(side, this.dmg(f, foe, m.pow, false, m.type), m.type);
      } else {
        const k = m.key, fs = side;
        if (k === 'Rizz') { f.boost = 1.8; FX.play('buff'); burst(el, '💘', 7); this.hud(fs); await this.say(`${esc(f.name)}'s confidence rose sharply! Next hit is charged!`); }
        else if (k === 'Aura') { f.shield = true; f.hp = Math.min(f.max, f.hp + f.max * .1); FX.play('shield'); burst(el, '✨', 8); this.hud(fs); await this.say(`${esc(f.name)} is surrounded by aura! 🛡`); }
        else if (k === 'Clutch') { f.hp = Math.min(f.max, f.hp + f.max * .35); FX.play('heal'); burst(el, '💚', 8); this.hud(fs); await this.say(`${esc(f.name)} clutched up and restored HP!`); }
        else if (k === 'Rage') { await lunge(); const r = this.dmg(f, foe, 1.5, false); await this.hit(side, r, f.type); f.hp = Math.max(0, f.hp - Math.round(r.d * .2)); this.hud(fs); await this.say(`${esc(f.name)} is hurt by recoil! 😤`, 900); }
        else if (k === 'Yapping') { let n = 0; for (let i = 0; i < 3; i++) { if (foe.hp <= 0) break; if (this.R() < .75) { n++; await lunge(); const r = this.dmg(f, foe, .42, false); await this.hit(side, r, i === 0 ? f.type : null, true); } } await this.say(n ? `Hit ${n} time${n > 1 ? 's' : ''}!` : 'All the yapping missed!'); }
        else if (k === 'Brain Cells') { await lunge(); const r = this.dmg(f, foe, 1.05, true); await this.hit(side, r, 'Cosmic'); if (this.R() < .3 && foe.hp > 0) { foe.stun = true; FX.play('stun'); this.hud(me ? 'o' : 'm'); await this.say(`${esc(foe.name)} is confused and stunned! 💫`); } }
        else if (k === 'Luck') { await lunge(); if (this.R() < .5) { await this.say('🍀 Lucky!', 600); await this.hit(side, this.dmg(f, foe, 2, false), f.type); } else { await this.hit(side, this.dmg(f, foe, .3, false), null, true); await this.say('…it was a dud. 🥲'); } }
        else if (k === 'Skill') { await lunge(); await this.hit(side, this.dmg(f, foe, .85, false), f.type); }
      }
      await this.faints();
    },
    async faints() {
      const cp = this.op[this.ci], me = this.me[this.mi];
      if (cp.hp <= 0 && !cp.down) { cp.down = true; const el = this.E('.fb-slot.o .fb-card'); if (el) el.classList.add('faint'); FX.play('faint'); await this.say(`${this.foeOf()}<b>${esc(cp.name)}</b> fainted!`, 1200); }
      if (me.hp <= 0 && !me.down) { me.down = true; const el = this.E('.fb-slot.m .fb-card'); if (el) el.classList.add('faint'); FX.play('faint'); await this.say(`<b>${esc(me.name)}</b> fainted!`, 1200); }
      const myAlive = this.me.some(x => x.hp > 0), opAlive = this.op.some(x => x.hp > 0);
      if (!myAlive || !opAlive) return this.end(!myAlive && !opAlive ? 'draw' : !opAlive ? 'win' : 'lose');
      if (cp.hp <= 0 && this.mode === 'cpu') {
        const next = this.op.findIndex(x => x.hp > 0);
        this.ci = next; this.place('o', true); FX.play('sendOut'); await this.say(`The computer sends out <b>${esc(this.op[next].name)}</b>!`);
      }
    },
    async end(result) {
      this.over = true; this.busy = false; this.phase = 'over'; this.clearButtons(); FX.fadeMusic();
      const opp = esc(this.oppName());
      if (result === 'win') { FX.play('win'); await this.say(`🏆 <b>You defeated ${this.mode === 'online' ? opp : 'the computer'}!</b> +1 🍀 Lucky Pack`, 400);
        window.dispatchEvent(new CustomEvent('mb:pack', { detail: { why: this.mode === 'online' ? 'beating ' + PvP.opp + ' in Card Battle' : 'winning a Card Battle', lucky: true } })); }
      else if (result === 'draw') { await this.say('Both sides are out of cards! It\'s a draw.', 400); }
      else { FX.play('lose'); await this.say(`💀 <b>You're out of usable cards!</b> ${this.mode === 'online' ? opp + ' wins.' : 'You blacked out…'}`, 400); }
      const box = this.E('.fb-moves');
      const a = document.createElement('button'); a.className = 'fb-move'; a.style.background = '#2f9e44';
      a.innerHTML = this.mode === 'online' ? '<b>Rematch</b><span>Both pick new teams</span>' : '<b>Play again</b><span>Pick a new team</span>';
      a.onclick = () => { if (this.mode === 'online') { if (!PvP.online()) return PvP.lobby(PvP.opp + ' left.'); PvP.send({ t: 'again' }); this.pick('online'); } else this.pick('cpu'); };
      const b = document.createElement('button'); b.className = 'fb-move'; b.style.background = '#495057';
      b.innerHTML = this.mode === 'online' ? '<b>Leave</b><span>Back to battle menu</span>' : '<b>Back</b><span>Battle menu</span>';
      b.onclick = () => { if (this.mode === 'online') { PvP.close(); this.mode = null; } Battle.intro(); };
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
