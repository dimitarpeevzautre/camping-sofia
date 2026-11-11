/* Camping Sofia: the coming-soon page is a small driving game.
   An invented campsite seen from above. Guests arrive at the gate one after another; the player drives each to
   the pitch that lights up. It never ends: when the camp fills, the longest-staying guests check out.

   Units are metres. The view is a close overhead camera that follows the vehicle and pulls back with speed;
   anything with height (trees, buildings, roofs) is drawn pushed away from the screen centre in proportion to its
   height, which is what gives the scene depth. */
(() => {
  'use strict';

  const cv = document.getElementById('camp');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- world ----------
  const W = 120, H = 94, CAMP_BOTTOM = 86;
  const TAU = Math.PI * 2;
  let seed = 20261111;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

  const roads = [
    { x: 56, y: 20, w: 8, h: 74 },   // main road from the gate
    { x: 8, y: 20, w: 104, h: 8 },   // upper lane
    { x: 8, y: 50, w: 104, h: 8 },   // lower lane
    { x: 8, y: 20, w: 7, h: 38 },    // west link
    { x: 105, y: 20, w: 7, h: 38 },  // east link
  ];

  const PITCH_W = 6, PITCH_D = 9.5;
  const pitches = [];
  [9.5, 28.5, 39.5, 58.5].forEach((y, row) => {
    [17, 67].forEach((x0, block) => {
      for (let i = 0; i < 6; i++) {
        if (row === 0 && block === 0 && i < 2) continue;   // wash house
        if (row === 0 && block === 1 && i > 2) continue;   // pond
        pitches.push({ x: x0 + i * PITCH_W, y, w: PITCH_W, d: PITCH_D, laneBelow: row % 2 === 0, n: 0, guest: null });
      }
    });
  });
  pitches.forEach((p, i) => { p.n = i + 1; });

  const buildings = [
    { x: 17.6, y: 10.4, w: 10.8, h: 8.2, z: 3.4, roof: '#4f6b7a', wall: '#e8dfc8', label: 'WC' },
    { x: 67, y: 71.5, w: 12, h: 8, z: 3.8, roof: '#2f5d49', wall: '#efe6cf', label: 'Reception' },
    { x: 54.6, y: 85.2, w: 1.2, h: 1.2, z: 2.6, roof: '#f4c531', wall: '#3a2f25' },
    { x: 64.2, y: 85.2, w: 1.2, h: 1.2, z: 2.6, roof: '#f4c531', wall: '#3a2f25' },
  ];
  const hedges = [
    { x: 17, y: 38.6, w: 36, h: 0.8 }, { x: 67, y: 38.6, w: 36, h: 0.8 },
    { x: 29, y: 8.6, w: 24, h: 0.8 }, { x: 67, y: 8.6, w: 18, h: 0.8 },
    { x: 17, y: 68.1, w: 36, h: 0.8 }, { x: 67, y: 68.1, w: 36, h: 0.8 },
  ];
  const pond = { x: 94.5, y: 14.2, rx: 8.6, ry: 4.4 };
  const fire = { x: 31, y: 77 };
  const tents = [{ x: 19, y: 75, a: 0.3, c: '#d9a13b' }, { x: 42, y: 79.5, a: -0.5, c: '#3f7fa6' }, { x: 97, y: 77, a: 1.1, c: '#c8553d' }];
  const lamps = [[54.6, 14], [65.4, 34], [54.6, 44], [65.4, 64], [16, 34], [104, 44], [65.4, 82]].map(([x, y]) => ({ x, y }));   // on the verges, clear of the corners people cut

  const trees = [];
  const onRoadOrPitch = (x, y, pad = 0) =>
    roads.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) ||
    pitches.some((p) => x > p.x - pad && x < p.x + p.w + pad && y > p.y - pad && y < p.y + p.d + pad);
  const addTree = (x, y, r) => {
    if (onRoadOrPitch(x, y, 1.6)) return;
    if (buildings.some((b) => x > b.x - 2 && x < b.x + b.w + 2 && y > b.y - 2 && y < b.y + b.h + 2)) return;
    if (((x - pond.x) / (pond.rx + 1.5)) ** 2 + ((y - pond.y) / (pond.ry + 1.5)) ** 2 < 1) return;
    if (Math.hypot(x - fire.x, y - fire.y) < 5) return;
    if (tents.some((t) => Math.hypot(x - t.x, y - t.y) < 4)) return;
    if (trees.some((t) => Math.hypot(x - t.x, y - t.y) < 3.2)) return;
    trees.push({ x, y, r, z: 4.5 + rnd() * 3, hue: rnd() });
  };
  for (let x = 3; x < W; x += 5.5) { addTree(x + rnd() * 2, 3 + rnd() * 3, 2.4 + rnd() * 1.2); addTree(x + rnd() * 2, 89 + rnd() * 3, 2.4 + rnd() * 1.2); }
  for (let y = 8; y < H; y += 5.5) { addTree(2.5 + rnd() * 3, y + rnd() * 2, 2.4 + rnd() * 1.2); addTree(114.5 + rnd() * 3, y + rnd() * 2, 2.4 + rnd() * 1.2); }
  for (let i = 0; i < 40; i++) addTree(8 + rnd() * 104, 70 + rnd() * 15, 2 + rnd() * 1.4);
  for (let i = 0; i < 12; i++) addTree(82 + rnd() * 30, 4 + rnd() * 14, 2 + rnd() * 1.2);
  [[16, 39], [54, 39], [66, 39], [104, 39], [16, 9], [54, 9], [16, 68.5], [104, 68.5]].forEach(([x, y]) => addTree(x, y, 2.6));

  // Static things a vehicle can hit.
  const solidRects = [...buildings, ...hedges].map((b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, hl: b.w / 2, hw: b.h / 2, a: 0 }));
  const solidCircles = [
    ...trees.map((t) => ({ x: t.x, y: t.y, r: 0.55 })),
    ...lamps.map((l) => ({ x: l.x, y: l.y, r: 0.3 })),
    ...tents.map((t) => ({ x: t.x, y: t.y, r: 1.7 })),
    { x: fire.x, y: fire.y, r: 1.1 },
    { x: pond.x - 5, y: pond.y, r: 3.6 }, { x: pond.x, y: pond.y, r: 4.2 }, { x: pond.x + 5, y: pond.y, r: 3.6 },
  ];

  // ---------- vehicles ----------
  const TYPES = {
    van: { name: 'campervan', L: 5.6, Wd: 2.1, wb: 3.3, rear: 1.0, vmax: 10, z: 2.3 },
    motorhome: { name: 'motorhome', L: 7.2, Wd: 2.35, wb: 4.0, rear: 1.6, vmax: 8.5, z: 2.9 },
    combo: { name: 'caravan', L: 4.5, Wd: 1.85, wb: 2.7, rear: 0.9, vmax: 8.5, z: 1.5, trailer: { hitch: 1.2, bar: 1.3, L: 5.2, Wd: 2.25, axle: 4.2, z: 2.6 } },
  };
  const PAINT = ['#f2efe6', '#e6dcc4', '#d5503c', '#3f7fa6', '#f0b83a', '#5f9070', '#c9d4da', '#8b6fae'];

  function makeVehicle(kind, x, y, th) {
    const t = TYPES[kind];
    return { kind, t, x, y, th, ph: th, v: 0, steer: 0, paint: PAINT[(rnd() * PAINT.length) | 0], parked: null, alpha: 1 };
  }
  // Body rectangle: (x, y) is the rear axle.
  function bodyRect(v) {
    const off = v.t.L / 2 - v.t.rear;
    return { cx: v.x + Math.cos(v.th) * off, cy: v.y + Math.sin(v.th) * off, hl: v.t.L / 2, hw: v.t.Wd / 2, a: v.th };
  }
  function hitchPoint(v) { const h = v.t.trailer.hitch; return { x: v.x - Math.cos(v.th) * h, y: v.y - Math.sin(v.th) * h }; }
  function trailerRect(v) {
    const tr = v.t.trailer, hp = hitchPoint(v), off = tr.bar + tr.L / 2;
    return { cx: hp.x - Math.cos(v.ph) * off, cy: hp.y - Math.sin(v.ph) * off, hl: tr.L / 2, hw: tr.Wd / 2, a: v.ph };
  }
  const rectsOf = (v) => (v.t.trailer ? [bodyRect(v), trailerRect(v)] : [bodyRect(v)]);
  // The part that has to end up on the pitch: the caravan for a car-and-caravan, the vehicle itself otherwise.
  const livingRect = (v) => (v.t.trailer ? trailerRect(v) : bodyRect(v));

  function corners(r) {
    const c = Math.cos(r.a), s = Math.sin(r.a), out = [];
    for (const [l, w] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) out.push({ x: r.cx + c * l * r.hl - s * w * r.hw, y: r.cy + s * l * r.hl + c * w * r.hw });
    return out;
  }
  function rectCircle(r, cx, cy, rad) {
    const c = Math.cos(r.a), s = Math.sin(r.a), dx = cx - r.cx, dy = cy - r.cy;
    const lx = dx * c + dy * s, ly = -dx * s + dy * c;
    const qx = clamp(lx, -r.hl, r.hl), qy = clamp(ly, -r.hw, r.hw);
    return (lx - qx) ** 2 + (ly - qy) ** 2 < rad * rad;
  }
  function rectRect(a, b) {
    const ca = corners(a), cb = corners(b);
    for (const r of [a, b]) {
      for (const ang of [r.a, r.a + Math.PI / 2]) {
        const ax = Math.cos(ang), ay = Math.sin(ang);
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const p of ca) { const d = p.x * ax + p.y * ay; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
        for (const p of cb) { const d = p.x * ax + p.y * ay; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
        if (a1 < b0 || b1 < a0) return false;
      }
    }
    return true;
  }
  const inBounds = (p) => (p.x > 1 && p.x < W - 1 && p.y > 1 && p.y < CAMP_BOTTOM - 0.4) || (p.x > 56.4 && p.x < 63.6 && p.y >= CAMP_BOTTOM - 0.4 && p.y < H - 0.3);

  function blocked(v) {
    for (const r of rectsOf(v)) {
      for (const p of corners(r)) if (!inBounds(p)) return true;
      const reach = r.hl + r.hw;
      for (const c of solidCircles) if (Math.abs(c.x - r.cx) < reach + c.r && Math.abs(c.y - r.cy) < reach + c.r && rectCircle(r, c.x, c.y, c.r)) return true;
      for (const s of solidRects) if (Math.abs(s.cx - r.cx) < reach + s.hl && Math.abs(s.cy - r.cy) < reach + s.hw && rectRect(r, s)) return true;
      for (const o of guests) {
        if (o === v || o.alpha < 0.5) continue;
        if (Math.hypot(o.x - r.cx, o.y - r.cy) > 16) continue;
        for (const q of rectsOf(o)) if (rectRect(r, q)) return true;
      }
    }
    return false;
  }

  // ---------- game state ----------
  const guests = [];           // parked vehicles, oldest first
  let car = null;              // the vehicle being driven
  let target = null;           // its pitch
  let mode = 'attract';
  let parkedCount = 0, best = 0, bumps = 0, holdT = 0, patience = 1, patienceMax = 60, bumpCool = 0, shake = 0;
  let clock = 0, lastNote = 0;
  try { best = +localStorage.getItem('camp-best') || 0; } catch (e) { /* private window */ }

  const keys = { up: false, down: false, left: false, right: false, brake: false };
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'brake' };
  addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    if (mode === 'play' || document.activeElement === document.body) e.preventDefault();
    keys[k] = true;
  });
  addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.querySelectorAll('.pad button').forEach((b) => {
    const k = b.dataset.k;
    const set = (on) => (e) => { e.preventDefault(); keys[k] = on; b.classList.toggle('on', on); if (on && b.setPointerCapture) { try { b.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } } };
    b.addEventListener('pointerdown', set(true));
    b.addEventListener('pointerup', set(false));
    b.addEventListener('pointercancel', set(false));
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  let toastTimer = 0;
  function toast(text, ms = 1800) {
    const el = $('toast');
    el.textContent = text; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), ms);
  }
  function hud() {
    $('hud-pitch').textContent = target ? target.n : '–';
    $('hud-parked').textContent = parkedCount;
    $('hud-best').textContent = best;
  }

  function freePitches() { return pitches.filter((p) => !p.guest); }
  function settle(v, p) {   // put a vehicle on a pitch without driving it there (the campers already on site)
    const cx = p.x + p.w / 2, nose = p.laneBelow ? -1 : 1;   // nose-in, away from the lane
    v.th = nose * Math.PI / 2 + (rnd() - 0.5) * 0.08; v.ph = v.th;
    const cy = p.y + p.d / 2;
    v.x = cx; v.y = cy;
    const r = livingRect(v); v.x += cx - r.cx; v.y += cy - r.cy;
    v.parked = { pitch: p, t: clock, side: rnd() < 0.5 ? 1 : -1 }; p.guest = v; guests.push(v);
  }
  [3, 12, 20, 27, 34, 40].forEach((i, n) => settle(makeVehicle(n % 3 === 2 ? 'motorhome' : 'van', 0, 0, 0), pitches[i]));

  function nextGuest() {
    const free = freePitches();
    if (free.length < 8) checkout();
    const roll = rnd();
    const kind = parkedCount < 2 ? 'van' : parkedCount < 4 ? (roll < 0.6 ? 'van' : 'motorhome') : roll < 0.45 ? 'van' : roll < 0.75 ? 'motorhome' : 'combo';
    car = makeVehicle(kind, 60, 80.5, -Math.PI / 2);
    const options = freePitches();
    target = options[(rnd() * options.length) | 0];
    bumps = 0; holdT = 0;
    patienceMax = Math.max(34, 75 - parkedCount * 2) + (kind === 'combo' ? 25 : kind === 'motorhome' ? 8 : 0);
    patience = patienceMax;
    hud();
    if (parkedCount > 0) toast(`Next: a ${car.t.name} for pitch ${target.n}`, 1500);
  }
  function checkout() {
    const leaving = guests.filter((g) => !g.leaving).slice(0, 5);
    leaving.forEach((g) => { g.leaving = true; });
    if (leaving.length) toast(`Checkout time: ${leaving.length} pitches free again`, 2200);
  }

  function start() {
    mode = 'play';
    document.body.classList.add('playing');
    $('start').hidden = true; $('hud').hidden = false;
    if (matchMedia('(pointer: coarse)').matches) $('pad').hidden = false;
    parkedCount = 0;
    nextGuest();
    toast(`First guest: pitch ${target.n}`, 2200);
    cv.focus();
  }
  $('play').addEventListener('click', start);
  if (matchMedia('(pointer: coarse)').matches) $('keys').textContent = 'Steer with the left buttons. D drives, R reverses.';

  // ---------- simulation ----------
  function step(dt) {
    clock += dt;
    for (let i = guests.length - 1; i >= 0; i--) {
      const g = guests[i];
      if (g.leaving) { g.alpha -= dt / 1.4; if (g.alpha <= 0) { g.parked.pitch.guest = null; guests.splice(i, 1); } }
    }
    if (mode !== 'play' || !car) return;

    const t = car.t, v0 = car.v;
    const onRoad = onRoadOrPitch(car.x, car.y);
    const vmax = onRoad ? t.vmax : 4.5;
    if (keys.brake) car.v -= Math.sign(car.v) * Math.min(Math.abs(car.v), 16 * dt);
    else if (keys.up) car.v += (car.v < 0 ? 14 : 6.5) * dt;
    else if (keys.down) car.v -= (car.v > 0 ? 14 : 4.5) * dt;
    else car.v -= Math.sign(car.v) * Math.min(Math.abs(car.v), (onRoad ? 2.6 : 5) * dt);
    car.v = clamp(car.v, -3.6, vmax);
    if (!onRoad && Math.abs(car.v) > 4.5) car.v *= 0.96;

    const steerMax = 0.62 / (1 + (car.v * car.v) / 70);
    const want = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * steerMax;
    car.steer += clamp(want - car.steer, -2.8 * dt, 2.8 * dt);

    const sub = 3, h = dt / sub;
    for (let i = 0; i < sub; i++) {
      const px = car.x, py = car.y, pth = car.th, pph = car.ph;
      const dth = (car.v / t.wb) * Math.tan(car.steer) * h;
      car.th = wrap(car.th + dth);
      car.x += Math.cos(car.th) * car.v * h; car.y += Math.sin(car.th) * car.v * h;
      if (t.trailer) {
        const d = car.th - car.ph, tr = t.trailer;
        car.ph = wrap(car.ph + (car.v * h / tr.axle) * Math.sin(d) - (tr.hitch / tr.axle) * dth * Math.cos(d));
        if (Math.abs(wrap(car.th - car.ph)) > 1.2) {     // jackknifed: refuse the move
          car.x = px; car.y = py; car.th = pth; car.ph = pph; car.v = 0;
          if (clock - lastNote > 3) { toast('Jackknifed. Pull forward to straighten up'); lastNote = clock; }
          break;
        }
      }
      if (blocked(car)) {
        car.x = px; car.y = py; car.th = pth; car.ph = pph;
        if (Math.abs(v0) > 1.2 && bumpCool <= 0) { bumps++; bumpCool = 0.5; shake = reduceMotion ? 0 : Math.min(1, Math.abs(v0) / 6); }
        car.v = -car.v * 0.25;
        break;
      }
    }
    bumpCool -= dt; shake = Math.max(0, shake - dt * 3);

    // Parked when the living part sits inside the pitch and has stopped for a moment.
    const p = target, r = livingRect(car);
    // A car and caravan is longer than a pitch is deep, so the caravan may stand a little out onto the lane.
    const out = car.t.trailer ? 2.4 : 0.15, top = p.laneBelow ? 0.15 : out, bottom = p.laneBelow ? out : 0.15;
    const inside = corners(r).every((c) => c.x > p.x - 0.15 && c.x < p.x + p.w + 0.15 && c.y > p.y - top && c.y < p.y + p.d + bottom);
    holdT = inside && Math.abs(car.v) < 0.3 ? holdT + dt : 0;
    if (holdT > 0.6) return arrived();

    patience -= dt;
    const bar = $('hud-patience');
    bar.style.transform = `scaleX(${clamp(patience / patienceMax, 0, 1)})`;
    bar.classList.toggle('low', patience < 10);
    if (patience <= 0) { toast('That guest got tired of waiting and left'); car = null; nextGuest(); }
  }

  function arrived() {
    const off = Math.abs(Math.sin(car.th - Math.PI / 2)) < 0.14;   // lined up with the pitch
    car.v = 0; car.steer = 0;
    car.parked = { pitch: target, t: clock, side: rnd() < 0.5 ? 1 : -1 };
    target.guest = car; guests.push(car);
    parkedCount++;
    if (parkedCount > best) { best = parkedCount; try { localStorage.setItem('camp-best', String(best)); } catch (e) { /* private window */ } }
    toast(bumps > 1 ? 'Parked. A few new dents, though' : bumps === 1 ? 'Parked, with one small bump' : off ? 'Parked dead straight' : 'Parked', 1400);
    car = null;
    setTimeout(() => { if (mode === 'play' && !car) nextGuest(); }, 1100);
    hud();
  }

  // ---------- camera and projection ----------
  let vw = 0, vh = 0, dpr = 1;
  const cam = { x: 60, y: 60, s: 14, zoom: 1 };
  const LEAN = 0.028;   // how far a point one metre up is pushed from the centre
  const P = (x, y, z = 0) => { const k = cam.s * (1 + z * LEAN); return [(x - cam.x) * k + vw / 2, (y - cam.y) * k + vh / 2]; };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  }
  addEventListener('resize', resize); resize();

  function updateCamera(dt) {
    const base = clamp(Math.min(vw, vh) / 44, 8.5, 22);
    let tx, ty, tz;
    if (mode === 'play' && car) {
      const look = clamp(car.v, -3, 10) * 0.75;
      tx = car.x + Math.cos(car.th) * look; ty = car.y + Math.sin(car.th) * look;
      tz = 1 - 0.24 * Math.min(1, Math.abs(car.v) / 10);
    } else if (mode === 'play') {      // between guests: glide back to the gate
      tx = 60; ty = 78; tz = 0.92;
    } else {                           // attract: a slow drift over the camp
      const a = reduceMotion ? 0.6 : clock * 0.06;
      tx = 60 + Math.cos(a) * 26; ty = 44 + Math.sin(a * 1.3) * 16; tz = 0.86;
    }
    const k = 1 - Math.exp(-dt * 3.2);
    cam.x = lerp(cam.x, tx, k); cam.y = lerp(cam.y, ty, k);
    cam.zoom = lerp(cam.zoom, tz, 1 - Math.exp(-dt * 1.6));
    cam.s = base * cam.zoom;
    const hx = vw / 2 / cam.s, hy = vh / 2 / cam.s;
    cam.x = hx * 2 >= W ? W / 2 : clamp(cam.x, hx, W - hx);
    cam.y = hy * 2 >= H ? H / 2 : clamp(cam.y, hy, H - hy);
  }

  // ---------- ground, painted once ----------
  const GPX = 12;
  const ground = document.createElement('canvas');
  ground.width = W * GPX; ground.height = H * GPX;
  function paintGround() {
    const g = ground.getContext('2d');
    let s = 77; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    g.setTransform(GPX, 0, 0, GPX, 0, 0);
    g.fillStyle = '#6a9447'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(118,160,78,0.35)' : 'rgba(78,118,56,0.3)';
      g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 3.5, 0.8 + r() * 2.5, r() * 3, 0, TAU); g.fill();
    }
    g.fillStyle = '#4c7a3e'; g.fillRect(0, CAMP_BOTTOM, W, H - CAMP_BOTTOM);          // outside the fence
    for (let i = 0; i < 260; i++) {                                                   // meadow flowers
      g.fillStyle = ['#f6e27a', '#ffffff', '#e59ac0'][(r() * 3) | 0];
      g.beginPath(); g.arc(6 + r() * 108, 70 + r() * 15, 0.12, 0, TAU); g.fill();
    }
    // pitches
    for (const p of pitches) {
      g.fillStyle = '#84ad55'; g.fillRect(p.x, p.y, p.w, p.d);
      g.fillStyle = 'rgba(255,255,255,0.07)';
      for (let x = p.x + 0.4; x < p.x + p.w; x += 1.6) g.fillRect(x, p.y, 0.8, p.d);
      g.strokeStyle = 'rgba(246,241,223,0.85)'; g.lineWidth = 0.14; g.setLineDash([0.7, 0.5]);
      g.strokeRect(p.x + 0.07, p.y + 0.07, p.w - 0.14, p.d - 0.14); g.setLineDash([]);
    }
    // roads: a darker shoulder, then gravel
    g.fillStyle = '#9d8f70'; for (const rd of roads) g.fillRect(rd.x - 0.25, rd.y - 0.25, rd.w + 0.5, rd.h + 0.5);
    g.fillStyle = '#cfc19f'; for (const rd of roads) g.fillRect(rd.x, rd.y, rd.w, rd.h);
    for (let i = 0; i < 9000; i++) {
      const rd = roads[(r() * roads.length) | 0];
      g.fillStyle = r() < 0.5 ? 'rgba(120,105,80,0.35)' : 'rgba(255,250,235,0.4)';
      g.fillRect(rd.x + r() * rd.w, rd.y + r() * rd.h, 0.12, 0.12);
    }
    g.fillStyle = 'rgba(90,78,58,0.16)';                                              // wheel tracks
    for (const [x, y, w, h] of [[58.2, 20, 0.7, 74], [61.1, 20, 0.7, 74], [8, 22.2, 104, 0.7], [8, 25.1, 104, 0.7], [8, 52.2, 104, 0.7], [8, 55.1, 104, 0.7]]) g.fillRect(x, y, w, h);
    // pitch number plates, on the lane side
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 1.15px Overpass, sans-serif';
    for (const p of pitches) {
      const cx = p.x + p.w / 2, cy = p.laneBelow ? p.y + p.d - 1.1 : p.y + 1.1;
      g.fillStyle = '#f4c531'; g.strokeStyle = '#12211a'; g.lineWidth = 0.14;
      g.beginPath(); g.roundRect(cx - 1.15, cy - 0.75, 2.3, 1.5, 0.3); g.fill(); g.stroke();
      g.fillStyle = '#12211a'; g.fillText(String(p.n), cx, cy + 0.08);
    }
    // pond
    g.fillStyle = '#d8c99a'; g.beginPath(); g.ellipse(pond.x, pond.y, pond.rx + 1, pond.ry + 1, 0, 0, TAU); g.fill();
    g.fillStyle = '#3b8cb0'; g.beginPath(); g.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, TAU); g.fill();
    g.fillStyle = '#58a8c7'; g.beginPath(); g.ellipse(pond.x - 1.2, pond.y - 0.6, pond.rx * 0.7, pond.ry * 0.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a5a3a'; g.fillRect(pond.x - 0.7, pond.y + pond.ry - 2.4, 1.4, 4.2);  // jetty
    // hedges
    for (const hd of hedges) {
      for (let x = hd.x; x < hd.x + hd.w; x += 0.55) {
        g.fillStyle = r() < 0.5 ? '#2f5a34' : '#3b6b3d';
        g.beginPath(); g.arc(x + 0.3, hd.y + hd.h / 2 + (r() - 0.5) * 0.25, 0.55, 0, TAU); g.fill();
      }
    }
    // fence along the bottom, open at the gate
    g.strokeStyle = '#5a452f'; g.lineWidth = 0.22;
    g.beginPath(); g.moveTo(1, CAMP_BOTTOM); g.lineTo(55, CAMP_BOTTOM); g.moveTo(65, CAMP_BOTTOM); g.lineTo(W - 1, CAMP_BOTTOM); g.stroke();
    for (let x = 2; x < W; x += 3) if (x < 55 || x > 65) { g.fillStyle = '#6b5338'; g.fillRect(x - 0.18, CAMP_BOTTOM - 0.3, 0.36, 0.6); }
    // fire circle
    g.fillStyle = '#b7a57e'; g.beginPath(); g.arc(fire.x, fire.y, 3.2, 0, TAU); g.fill();
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; g.fillStyle = '#8e8a82'; g.beginPath(); g.arc(fire.x + Math.cos(a) * 1.05, fire.y + Math.sin(a) * 1.05, 0.3, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; g.fillStyle = '#6e5137'; g.save(); g.translate(fire.x + Math.cos(a) * 2.4, fire.y + Math.sin(a) * 2.4); g.rotate(a + 1.57); g.fillRect(-0.9, -0.25, 1.8, 0.5); g.restore(); }
  }
  paintGround();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGround);

  // ---------- drawing ----------
  const poly = (pts, fill, stroke) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const shade = (hex, f) => {
    const c = (v) => clamp(Math.round(v * f), 0, 255);
    if (hex[0] !== '#') { const m = hex.match(/\d+/g); return `rgb(${c(+m[0])},${c(+m[1])},${c(+m[2])})`; }   // already an rgb() string
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  };
  // A point given in a rectangle's own frame (l along its length, w across), at height z.
  const RP = (r, l, w, z) => { const c = Math.cos(r.a), s = Math.sin(r.a); return P(r.cx + c * l - s * w, r.cy + s * l + c * w, z); };
  const quad = (r, l0, l1, w0, w1, z) => [RP(r, l0, w0, z), RP(r, l1, w0, z), RP(r, l1, w1, z), RP(r, l0, w1, z)];

  function drawBox(r, z, wall, roof) {
    const base = quad(r, -r.hl, r.hl, -r.hw, r.hw, 0), top = quad(r, -r.hl, r.hl, -r.hw, r.hw, z);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; poly([base[i], base[j], top[j], top[i]], shade(wall, 0.72 + 0.09 * i)); }
    poly(top, roof);
    return top;
  }

  function drawVehicle(v, night) {
    ctx.globalAlpha = clamp(v.alpha, 0, 1);
    const b = bodyRect(v), t = v.t;
    if (t.trailer) {
      const tr = t.trailer, r = trailerRect(v), hp = hitchPoint(v);
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = Math.max(2, cam.s * 0.16);   // drawbar
      ctx.beginPath(); ctx.moveTo(...P(hp.x, hp.y, 0.4)); ctx.lineTo(...RP(r, r.hl, -0.7, 0.4)); ctx.moveTo(...P(hp.x, hp.y, 0.4)); ctx.lineTo(...RP(r, r.hl, 0.7, 0.4)); ctx.stroke();
      drawBox(r, tr.z, '#d9d4c4', '#f4f1e8');
      poly(quad(r, -r.hl + 0.3, r.hl - 0.3, -0.18, 0.18, tr.z), shade(v.paint, 1));          // stripe
      poly(quad(r, 0.2, 1.3, -0.5, 0.5, tr.z), 'rgba(140,170,190,0.85)');                    // skylight
    }
    drawBox(b, t.z, shade(v.paint, 0.8), v.paint);
    const nose = b.hl;
    poly(quad(b, nose - (t.trailer ? 1.9 : 1.5), nose - 0.55, -b.hw + 0.18, b.hw - 0.18, t.z), '#27343c');   // windscreen
    if (t.trailer) poly(quad(b, -b.hl + 0.4, -b.hl + 1.1, -b.hw + 0.2, b.hw - 0.2, t.z), '#27343c');
    else {
      poly(quad(b, -0.9, 0.3, -0.55, 0.55, t.z), 'rgba(140,170,190,0.85)');                    // skylight
      poly(quad(b, -b.hl + 0.25, nose - 1.8, -b.hw + 0.02, -b.hw + 0.22, t.z), shade(v.paint, 0.62));
    }
    if (v.parked && v.alpha > 0.9) drawCampLife(v);
    ctx.globalAlpha = 1;
    if (!v.parked) v._lights = [RP(b, nose, -b.hw * 0.6, 0.7), RP(b, nose, b.hw * 0.6, 0.7)];
  }

  // Once parked, a guest rolls out an awning and puts two chairs under it.
  function drawCampLife(v) {
    const r = livingRect(v), z = (v.t.trailer ? v.t.trailer.z : v.t.z) - 0.2, side = v.parked.side;
    const w0 = side * r.hw, w1 = side * (r.hw + 2.1);
    const open = clamp((clock - v.parked.t) / 0.8, 0, 1), wm = lerp(w0, w1, open);
    for (let i = 0; i < 6; i++) {
      const l0 = -1.6 + i * 0.55;
      poly([RP(r, l0, w0, z), RP(r, l0 + 0.55, w0, z), RP(r, l0 + 0.55, wm, z - 0.35), RP(r, l0, wm, z - 0.35)], i % 2 ? '#f6f1df' : shade(v.paint === '#f2efe6' ? '#d5503c' : v.paint, 0.95));
    }
    if (open >= 1) for (const l of [-0.7, 0.7]) { const [x, y] = RP(r, l, side * (r.hw + 2.9), 0.3); ctx.fillStyle = '#3a2f25'; ctx.beginPath(); ctx.arc(x, y, cam.s * 0.28, 0, TAU); ctx.fill(); }
  }

  function drawTree(t, fade) {
    const [bx, by] = P(t.x, t.y, 0), [tx, ty] = P(t.x, t.y, t.z * 0.6);
    ctx.strokeStyle = '#5a4330'; ctx.lineWidth = cam.s * 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalAlpha = fade;
    const tones = t.hue < 0.33 ? ['#2f6b3a', '#3c8046', '#57994f'] : t.hue < 0.66 ? ['#2a5f3f', '#35774a', '#4c9058'] : ['#3d6a2c', '#527f33', '#6f9a3f'];
    [[0.62, 1], [0.82, 0.78], [1, 0.5]].forEach(([zf, rf], i) => {
      const [x, y] = P(t.x, t.y, t.z * zf);
      ctx.fillStyle = tones[i]; ctx.beginPath(); ctx.arc(x, y, t.r * rf * cam.s * (1 + t.z * zf * LEAN), 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function frame(night) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1c3327'; ctx.fillRect(0, 0, vw, vh);
    const sx = shake ? (Math.random() - 0.5) * shake * 10 : 0, sy = shake ? (Math.random() - 0.5) * shake * 10 : 0;
    ctx.translate(sx, sy);
    const [gx, gy] = P(0, 0);
    ctx.drawImage(ground, gx, gy, W * cam.s, H * cam.s);

    // the pitch to park on
    if (mode === 'play' && target && car) {
      const pulse = 0.5 + 0.5 * Math.sin(clock * 5), p = target;
      const [x0, y0] = P(p.x, p.y), [x1, y1] = P(p.x + p.w, p.y + p.d);
      ctx.fillStyle = `rgba(244,197,49,${0.22 + pulse * 0.2})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = '#f4c531'; ctx.lineWidth = 3 + pulse * 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      if (holdT > 0) {
        const [cx, cy] = P(p.x + p.w / 2, p.y + p.d / 2);
        ctx.strokeStyle = '#12211a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, cam.s * 1.6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(holdT / 0.6, 0, 1)); ctx.stroke();
      }
    }

    // soft ground shadows
    ctx.fillStyle = 'rgba(15,30,20,0.22)';
    for (const t of trees) { const [x, y] = P(t.x + 1.6, t.y + 1.6); if (x < -80 || x > vw + 80 || y < -80 || y > vh + 80) continue; ctx.beginPath(); ctx.arc(x, y, t.r * cam.s, 0, TAU); ctx.fill(); }
    for (const b of buildings) { const [x, y] = P(b.x + 1.2, b.y + 1.2); ctx.fillRect(x, y, b.w * cam.s, b.h * cam.s); }
    const all = car ? [...guests, car] : guests;
    for (const v of all) for (const r of rectsOf(v)) { ctx.globalAlpha = clamp(v.alpha, 0, 1); poly(corners(r).map((c) => P(c.x + 0.5, c.y + 0.5)), 'rgba(15,30,20,0.3)'); }
    ctx.globalAlpha = 1;

    // campfire embers
    { const [x, y] = P(fire.x, fire.y); ctx.fillStyle = '#e8792c'; ctx.beginPath(); ctx.arc(x, y, cam.s * (0.5 + 0.08 * Math.sin(clock * 9)), 0, TAU); ctx.fill(); ctx.fillStyle = '#f9d34c'; ctx.beginPath(); ctx.arc(x, y, cam.s * 0.25, 0, TAU); ctx.fill(); }

    for (const v of all) drawVehicle(v, night);

    // tents
    for (const t of tents) {
      const r = { cx: t.x, cy: t.y, hl: 1.7, hw: 1.3, a: t.a }, base = quad(r, -1.7, 1.7, -1.3, 1.3, 0);
      const r0 = RP(r, -1.7, 0, 1.5), r1 = RP(r, 1.7, 0, 1.5);
      poly([base[0], base[1], r1, r0], shade(t.c, 0.8)); poly([base[3], base[2], r1, r0], t.c);
    }
    // buildings
    for (const b of buildings) {
      const r = { cx: b.x + b.w / 2, cy: b.y + b.h / 2, hl: b.w / 2, hw: b.h / 2, a: 0 };
      const top = drawBox(r, b.z, b.wall, b.roof);
      if (b.label) {
        poly([RP(r, -r.hl, 0, b.z + 0.9), RP(r, r.hl, 0, b.z + 0.9), top[2], top[3]], shade(b.roof, 1.12));     // sunny side of a pitched roof
        poly([RP(r, -r.hl, 0, b.z + 0.9), RP(r, r.hl, 0, b.z + 0.9), top[1], top[0]], shade(b.roof, 0.9));
        const [x, y] = RP(r, 0, r.hw * 0.5, b.z + 0.45);
        ctx.fillStyle = '#f6f1df'; ctx.font = `800 ${Math.round(cam.s * 1.15)}px Overpass, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.label, x, y);
      }
    }
    // lamp posts
    for (const l of lamps) {
      const [x0, y0] = P(l.x, l.y), [x1, y1] = P(l.x, l.y, 4.2);
      ctx.strokeStyle = '#2a2f33'; ctx.lineWidth = Math.max(2, cam.s * 0.14); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = night > 0.2 ? '#ffe9a8' : '#d8d2bf'; ctx.beginPath(); ctx.arc(x1, y1, cam.s * 0.32, 0, TAU); ctx.fill();
    }
    // trees last: canopies hang over everything, and thin out above the vehicle being driven
    for (const t of trees) {
      const [x, y] = P(t.x, t.y, t.z); if (x < -120 || x > vw + 120 || y < -120 || y > vh + 120) continue;
      drawTree(t, car && Math.hypot(car.x - t.x, car.y - t.y) < t.r + 3.5 ? 0.4 : 1);
    }

    // night: darken, then add light back
    if (night > 0.01) {
      ctx.fillStyle = `rgba(8,14,44,${night * 0.66})`; ctx.fillRect(-20, -20, vw + 40, vh + 40);
      ctx.globalCompositeOperation = 'lighter';
      const glow = (x, y, rad, col, a) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, col.replace('A', String(a * night))); g.addColorStop(1, col.replace('A', '0'));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      };
      for (const l of lamps) { const [x, y] = P(l.x, l.y, 1); glow(x, y, cam.s * 11, 'rgba(255,214,130,A)', 0.5); }
      { const [x, y] = P(fire.x, fire.y); glow(x, y, cam.s * (8 + Math.sin(clock * 11) * 0.6), 'rgba(255,150,60,A)', 0.7); }
      for (const g of guests) { const r = livingRect(g), [x, y] = P(r.cx, r.cy, 1); glow(x, y, cam.s * 4.5, 'rgba(255,200,120,A)', 0.4 * g.alpha); }
      if (car && car._lights) {
        for (const [x, y] of car._lights) {
          const a = car.th, len = cam.s * 17;
          const g = ctx.createRadialGradient(x, y, 0, x, y, len);
          g.addColorStop(0, `rgba(255,244,205,${0.6 * night})`); g.addColorStop(1, 'rgba(255,244,205,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, len, a - 0.36, a + 0.36); ctx.closePath(); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // keep the pitch outline readable after dark
    if (night > 0.2 && mode === 'play' && target && car) {
      const p = target, [x0, y0] = P(p.x, p.y), [x1, y1] = P(p.x + p.w, p.y + p.d);
      ctx.strokeStyle = `rgba(244,197,49,${0.55 + 0.35 * Math.sin(clock * 5)})`; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }

    // if the pitch is off screen, point at it
    if (mode === 'play' && target && car) {
      const [tx, ty] = P(target.x + target.w / 2, target.y + target.d / 2), m = 46;
      if (tx < m || tx > vw - m || ty < m + 60 || ty > vh - m) {
        const ax = clamp(tx, m, vw - m), ay = clamp(ty, m + 70, vh - m - 90), a = Math.atan2(ty - ay, tx - ax);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
        ctx.fillStyle = '#f4c531'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -16); ctx.lineTo(-4, 0); ctx.lineTo(-12, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ---------- loop ----------
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);
    updateCamera(dt);
    const cycle = (clock % 200) / 200;                                     // a day lasts a little over three minutes
    const night = clamp((Math.cos(cycle * TAU + Math.PI) - 0.25) / 0.5, 0, 1);   // 0 by day, 1 at night
    frame(night);
    requestAnimationFrame(tick);
  }
  hud();
  requestAnimationFrame(tick);

  // For automated checks only: /?debug exposes the state.
  if (location.search.includes('debug')) window.camp = { get car() { return car; }, get target() { return target; }, get parked() { return parkedCount; }, guests, pitches, keys, blocked, livingRect, corners, setClock: (t) => { clock = t; } };
})();
