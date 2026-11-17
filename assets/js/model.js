// โมเดล 3D ของ Cockpit (Three.js) — หน่วยมิลลิเมตร
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { T, S, HALF, A, B, SEAT, DECK, SLED, SHIFTER, range } from './params.js';

export const MODULES = {
  A:    { name: 'A · ฐานเบาะ',            color: 0x2f6fde },
  SEAT: { name: 'ชุดเบาะ + รางสไลด์',      color: 0x6b7280 },
  B:    { name: 'B · ฐานหน้า + เสา',       color: 0xe0782a },
  C:    { name: 'C · แท่นพวงมาลัย',        color: 0x22a06b },
  P:    { name: 'P · ชุดแป้นเหยียบ',        color: 0x8b5cf6 },
  S:    { name: 'S · ขาติดเกียร์',          color: 0xd9344f },
  GEAR: { name: 'อุปกรณ์ (พวงมาลัย/แป้น/เกียร์)', color: 0xbfc5cc },
};

const EXPLODE = {
  A: [-260, 0, 0], SEAT: [-260, 0, 420], B: [0, 0, 0],
  C: [0, 0, 380], P: [180, 0, 260], S: [0, -320, 120],
};

export function createViewer(container) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(40, 1, 10, 20000);
  camera.position.set(-1100, 1300, 1900);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(750, 300, 0);
  controls.enableDamping = true;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(800, 2500, 1200);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1500, right: 1500, top: 1500, bottom: -1500, near: 100, far: 6000 });
  sun.target.position.set(750, 0, 0);
  scene.add(sun, sun.target);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000),
    new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(4000, 40, 0x888888, 0x888888);
  grid.material.opacity = 0.18; grid.material.transparent = true;
  grid.position.set(750, 0.5, 0);
  scene.add(grid);

  // ---------- วัสดุ ----------
  const mats = {};
  const steel = new THREE.MeshStandardMaterial({ color: 0x2b2f36, metalness: 0.6, roughness: 0.45 });
  for (const k in MODULES) {
    mats[k] = new THREE.MeshStandardMaterial({
      color: MODULES[k].color, metalness: k === 'GEAR' ? 0.1 : 0.45, roughness: 0.5,
    });
  }
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x0b0d10 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
  let colorMode = true;

  // ---------- helpers (พิกัดออกแบบ x,y,z → three: x, z, -y) ----------
  const groups = {};
  const root = new THREE.Group();
  scene.add(root);
  for (const k of Object.keys(MODULES)) { groups[k] = new THREE.Group(); root.add(groups[k]); }

  function box(parent, x0, x1, y0, y1, z0, z1, key, edges = true) {
    const g = new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0);
    const m = new THREE.Mesh(g, colorMode ? mats[key] : (key === 'GEAR' ? mats.GEAR : steel));
    m.userData.key = key;
    m.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2);
    m.castShadow = true; m.receiveShadow = true;
    if (edges && key !== 'GEAR') m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat));
    parent.add(m);
    return m;
  }
  // รูบนผิวด้านบน (axis = 'z') หรือผิวด้านข้าง (axis = 'y')
  function hole(parent, x, y, z, axis = 'z', r = 5.5) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.2, 16), holeMat);
    m.position.set(x, z, -y);
    if (axis === 'y') m.rotation.x = Math.PI / 2;
    if (axis === 'x') m.rotation.z = Math.PI / 2;
    parent.add(m);
  }
  function bar(parent, p1, p2, y, w, t, key) { // แท่งแบนจาก p1(x,z) ถึง p2(x,z)
    const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
    const len = Math.hypot(dx, dz);
    const g = new THREE.BoxGeometry(len, w, t);
    const m = new THREE.Mesh(g, colorMode ? mats[key] : steel);
    m.userData.key = key; m.castShadow = true;
    m.position.set((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, -y);
    m.rotation.z = Math.atan2(dz, dx);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat));
    parent.add(m);
  }
  const sides = [1, -1];

  // ---------- สถานะที่ปรับได้ ----------
  const st = {
    seatHole: 2, seatSlide: 90, seatRow: 1, seatTilt: 4,
    deckHole: 5, deckTilt: 10,
    sledHole: 4, pedalAngle: 30,
    shifterHole: 2, shifterH: 280,
    explode: 0, showGear: true,
  };
  let explodeCur = 0;

  // ================== โมดูล A ==================
  function buildA() {
    const g = groups.A;
    for (const s of sides) {
      box(g, A.x0, A.x1, s > 0 ? HALF - T : -HALF, s > 0 ? HALF : -HALF + T, 0, T, 'A');
      const yc = s * (HALF - T / 2);
      for (const x of range(A.seatHoles)) hole(g, x, yc, T + 0.6, 'z');
      for (const x of range(A.sideHoles)) hole(g, x, s * (HALF + 0.6), T / 2, 'y');
      for (const x of A.spliceHoles) hole(g, x, s * (HALF + B.splice.t + 0.6), T / 2, 'y');
    }
    for (const [x0, x1] of [A.crossRear, A.crossFront]) box(g, x0, x1, -HALF + T, HALF - T, 0, T, 'A');
  }

  // ================== ชุดเบาะ ==================
  const seatGroup = new THREE.Group(); groups.SEAT.add(seatGroup);
  function buildSeat() {
    seatGroup.clear();
    const g = seatGroup;
    const h = SEAT.holeMin + SEAT.holeStep * st.seatHole;
    const zc = T + S; // ด้านบนคานเบาะ
    for (const x of [h, h + SEAT.crossSpacing]) box(g, x - S / 2, x + S / 2, -HALF, HALF, T, zc, 'SEAT');
    const s0 = st.seatSlide;
    for (const s of sides) {
      const y = s * SEAT.railY;
      box(g, h - 50, h + 350, y - 15, y + 15, zc, zc + 15, 'SEAT');                   // รางล่าง (ยึดคาน)
      box(g, h - 50 + s0, h + 350 + s0, y - 12, y + 12, zc + 15, zc + 28, 'SEAT'); // รางบน (เลื่อน)
      // เหล็กฉาก + แผ่นข้างเบาะ
      const xa = h - 30 + s0, xb = xa + SEAT.plateLen;
      box(g, xa, xb, s > 0 ? y - 12 : y - 38, s > 0 ? y + 38 : y + 12, zc + 28, zc + 33, 'SEAT');
      const py0 = s > 0 ? y + 32 : y - 38, py1 = py0 + 6;
      box(g, xa, xb, py0, py1, zc + 28, zc + 28 + SEAT.plateH, 'SEAT');
      for (const r of SEAT.rows) for (let x = xa + 25; x < xb - 10; x += 25)
        hole(g, x, s > 0 ? py1 + 0.6 : py0 - 0.6, zc + 28 + 55 + r, 'y', 4.5);
    }
    // ตัวเบาะ (บัคเก็ตซีททั่วไป)
    const seat = new THREE.Group();
    const xs = h - 40 + s0, zs = zc + 40 + SEAT.rows[st.seatRow];
    seat.position.set(xs, zs, 0);
    seat.rotation.z = THREE.MathUtils.degToRad(st.seatTilt);
    g.add(seat);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.85 });
    const red = new THREE.MeshStandardMaterial({ color: 0xc0262d, roughness: 0.7 });
    const add = (geo, mat, x, y, z, rz = 0, parent = seat) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz;
      m.castShadow = true; parent.add(m); return m;
    };
    add(new THREE.BoxGeometry(460, 70, 380), seatMat, 230, 35, 0);           // ที่นั่ง
    for (const s of sides) add(new THREE.BoxGeometry(420, 60, 40), red, 250, 95, -s * 170); // ปีกข้าง
    const back = new THREE.Group(); back.position.set(40, 40, 0);
    back.rotation.z = THREE.MathUtils.degToRad(22); seat.add(back);
    add(new THREE.BoxGeometry(80, 700, 400), seatMat, -40, 350, 0, 0, back);
    for (const s of sides) add(new THREE.BoxGeometry(70, 420, 40), red, 0, 260, -s * 190, 0, back);
    add(new THREE.BoxGeometry(70, 130, 260), seatMat, -10, 640, 0, 0, back);
  }

  // ================== โมดูล B ==================
  function buildB() {
    const g = groups.B;
    for (const s of sides) {
      const y0 = s > 0 ? HALF - T : -HALF, y1 = y0 + T;
      box(g, B.x0, B.x1, y0, y1, 0, T, 'B');
      // เหล็กแบนประกบ (เชื่อมติดโมดูล B)
      box(g, B.splice.x0, B.splice.x1, s > 0 ? HALF : -HALF - 6, s > 0 ? HALF + 6 : -HALF, 0, T, 'B');
      box(g, B.splice.x0, B.splice.x1, s > 0 ? HALF - T - 6 : -HALF + T, s > 0 ? HALF - T : -HALF + T + 6, 0, T, 'B');
      const yc = s * (HALF - T / 2);
      for (const x of range(B.sledHoles)) hole(g, x, yc, T + 0.6, 'z');
      // ขาค้ำ + เสา + เหล็กเสริมมุม
      const oy0 = s > 0 ? HALF : -HALF - T, oy1 = oy0 + T;
      box(g, B.foot.x0, B.foot.x1, oy0, oy1, 0, T, 'B');
      box(g, B.upright.x0, B.upright.x1, oy0, oy1, B.upright.z0, B.upright.z1, 'B');
      for (const z of range(B.uprightHoles)) {
        hole(g, (B.upright.x0 + B.upright.x1) / 2, s * (HALF - 0.6), z, 'y');
        hole(g, (B.upright.x0 + B.upright.x1) / 2, s * (HALF + T + 0.6), z, 'y');
      }
      const yG = s * (HALF + T / 2);
      for (const dir of [-1, 1]) {
        const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(150, 0), new THREE.Vector2(0, 150)]);
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false });
        const m = new THREE.Mesh(geo, colorMode ? mats.B : steel); m.userData.key = 'B'; m.castShadow = true;
        const xEdge = dir > 0 ? B.upright.x1 : B.upright.x0;
        m.position.set(xEdge, T, -yG - 3);
        m.scale.x = dir;
        g.add(m);
      }
    }
    for (const [x0, x1] of [B.crossRear, B.crossFront]) box(g, x0, x1, -HALF + T, HALF - T, 0, T, 'B');
  }

  // ================== โมดูล C (แท่นพวงมาลัย) ==================
  const deckStatic = new THREE.Group(); groups.C.add(deckStatic);
  const deckPivot = new THREE.Group(); groups.C.add(deckPivot);
  const wheelGroup = new THREE.Group(); deckPivot.add(wheelGroup);
  function buildC() {
    deckStatic.clear(); deckPivot.clear(); wheelGroup.clear(); deckPivot.add(wheelGroup);
    const hz = DECK.hMin + DECK.hStep * st.deckHole;
    const px = DECK.pivotX, pz = hz + DECK.pivotDz;
    for (const s of sides) {
      const y0 = s > 0 ? HALF - 6 : -HALF, y1 = y0 + 6;
      box(deckStatic, DECK.plateX0, DECK.plateX1, y0, y1, hz - 30, hz + 120, 'C');
    }
    deckPivot.position.set(px, pz, 0);
    deckPivot.rotation.z = -THREE.MathUtils.degToRad(st.deckTilt); // ยกท้ายแท่นขึ้น (หน้าแท่นต่ำ) แบบคอพวงมาลัยรถยนต์
    const L = (x) => x - px;
    for (const s of sides) {
      const y0 = s > 0 ? HALF - 6 - S : -HALF + 6, y1 = y0 + S;
      box(deckPivot, L(DECK.arm.x0), L(DECK.arm.x1), y0, y1, -S / 2, S / 2, 'C');
    }
    const inner = HALF - 6 - S;
    for (const [a, b] of DECK.cross) box(deckPivot, L(a), L(b), -inner, inner, -S / 2, S / 2, 'C');
    const tp = DECK.topPlate;
    box(deckPivot, L(tp.x0), L(tp.x1), -tp.w / 2, tp.w / 2, S / 2, S / 2 + tp.t, 'C');
    // ฐานพวงมาลัย + วงพวงมาลัย (ตัวแทน)
    const zt = S / 2 + tp.t;
    box(wheelGroup, L(900), L(1120), -70, 70, zt, zt + 140, 'GEAR', false);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 70, 24), mats.GEAR);
    shaft.userData.key = 'GEAR'; shaft.rotation.z = Math.PI / 2; shaft.position.set(L(865), zt + 75, 0); wheelGroup.add(shaft);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.6 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(150, 15, 16, 64), rimMat);
    rim.userData.key = 'GEAR'; rim.rotation.y = Math.PI / 2; rim.position.set(L(825), zt + 75, 0); rim.castShadow = true;
    wheelGroup.add(rim);
    const hub = new THREE.Mesh(new THREE.BoxGeometry(20, 40, 300), rimMat);
    hub.userData.key = 'GEAR'; hub.position.set(L(825), zt + 75, 0); wheelGroup.add(hub);
  }

  // ================== โมดูล P (แป้นเหยียบ) ==================
  const sled = new THREE.Group(); groups.P.add(sled);
  function buildP() {
    sled.clear();
    const r = SLED.rMin + SLED.step * st.sledHole;
    sled.position.set(r, T + S, 0);
    const sp = SLED.crossSpacing;
    for (const x of [0, sp]) box(sled, x - S / 2, x + S / 2, -HALF, HALF, -S, 0, 'P');
    for (const s of sides) box(sled, S / 2, sp - S / 2, s * SLED.longY - S / 2, s * SLED.longY + S / 2, -S, 0, 'P');
    const th = THREE.MathUtils.degToRad(st.pedalAngle);
    const plate = new THREE.Group(); plate.rotation.z = th; sled.add(plate);
    const pl = SLED.plate;
    box(plate, 0, pl.len, -pl.w / 2, pl.w / 2, 4, 4 + pl.t, 'P');
    // บานพับ (แผ่นหู + สลัก)
    for (const s of sides) box(sled, -25, 25, s * 200 - 3, s * 200 + 3, -5, 12, 'P');
    // ค้ำปรับองศา (เหล็กแบน 50x6) จากคานหน้าไปใต้แผ่น
    const d = 300;
    const p2 = [d * Math.cos(th), d * Math.sin(th) + 4];
    for (const s of sides) bar(sled, [sp, 0], p2, s * 205, 50, 6, 'P');
    // แป้นเหยียบ (ตัวแทน): คลัตช์ / เบรก / คันเร่ง
    const pedalsY = [130, 0, -130];
    pedalsY.forEach((y, i) => {
      box(plate, 60, 280, y - 40, y + 40, 4 + pl.t, 4 + pl.t + 30, 'GEAR', false);
      const face = new THREE.Group(); face.position.set(250, 4 + pl.t + 30, -y);
      face.rotation.z = THREE.MathUtils.degToRad(60 - st.pedalAngle * 0.4); plate.add(face);
      box(face, 0, 14, -35, 35, 0, i === 2 ? 210 : 170, 'GEAR', false);
    });
  }

  // ================== โมดูล S (ขาติดเกียร์) ==================
  const shifter = new THREE.Group(); groups.S.add(shifter);
  function buildS() {
    shifter.clear();
    const sp = SHIFTER.spMin + SHIFTER.spStep * st.shifterHole;
    const g = shifter;
    box(g, sp, sp + SHIFTER.baseLen, -HALF - 6, -HALF, 0, T, 'S');                  // แผ่นฐาน 6 มม.
    const ax0 = sp + 55, ax1 = ax0 + T, yOut = -HALF - 6 - SHIFTER.armLen;
    box(g, ax0, ax1, yOut, -HALF - 6, 0, T, 'S');                                     // แขนออกข้าง
    box(g, ax0, ax1, yOut, yOut + T, T, T + SHIFTER.postLen, 'S');                      // เสาตั้ง
    for (const x of [sp + 30, sp + 130]) hole(g, x, -HALF - 6.6, T / 2, 'y');
    const sh = st.shifterH;
    const cy0 = yOut - 20, cy1 = cy0 + SHIFTER.clampLen;
    box(g, ax0 - 6, ax0, cy0, cy1, sh, sh + SHIFTER.clampH, 'S');                    // แผ่นแคลมป์หน้า
    box(g, ax1, ax1 + 6, cy0, cy1, sh, sh + SHIFTER.clampH, 'S');                    // แผ่นแคลมป์หลัง
    const pc = (ax0 + ax1) / 2;
    box(g, pc - 90, pc + 90, yOut + T, yOut + T + 180, sh + SHIFTER.clampH, sh + SHIFTER.clampH + 4.5, 'S');
    // เกียร์ (ตัวแทน)
    const zt = sh + SHIFTER.clampH + 4.5, yc = yOut + T + 90;
    box(g, pc - 60, pc + 60, yc - 55, yc + 55, zt, zt + 90, 'GEAR', false);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 170, 12), mats.GEAR);
    stick.userData.key = 'GEAR'; stick.position.set(pc, zt + 175, -yc); g.add(stick);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(26, 20, 16), new THREE.MeshStandardMaterial({ color: 0x15171b }));
    knob.userData.key = 'GEAR'; knob.position.set(pc, zt + 265, -yc); g.add(knob);
  }

  function rebuildStatic() {
    for (const k of ['A', 'B']) groups[k].clear();
    buildA(); buildB();
  }
  function rebuildAll() { rebuildStatic(); buildSeat(); buildC(); buildP(); buildS(); applyVisibility(); }

  // gear meshes visibility
  const visible = Object.fromEntries(Object.keys(MODULES).map((k) => [k, true]));
  function applyVisibility() {
    for (const k in groups) groups[k].visible = visible[k];
    root.traverse((o) => { if (o.userData.key === 'GEAR') o.visible = st.showGear; });
  }

  // ---------- render loop ----------
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  function tick() {
    explodeCur += (st.explode - explodeCur) * 0.12;
    for (const k in EXPLODE) {
      const [ex, ey, ez] = EXPLODE[k];
      groups[k].position.set(ex * explodeCur, ez * explodeCur, -ey * explodeCur);
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  rebuildAll();
  tick();

  const views = {
    iso:   [[-1100, 1300, 1900], [750, 300, 0]],
    side:  [[750, 450, 2900], [750, 400, 0]],
    top:   [[750, 3200, 1], [750, 0, 0]],
    front: [[3400, 600, 0], [750, 400, 0]],
    driver:[[250, 1050, 0], [1100, 550, 0]],
  };

  return {
    state: st,
    set(key, val) {
      st[key] = val;
      if (key.startsWith('seat')) buildSeat();
      else if (key.startsWith('deck')) buildC();
      else if (key.startsWith('sled') || key === 'pedalAngle') buildP();
      else if (key.startsWith('shifter')) buildS();
      applyVisibility();
    },
    setVisible(k, v) { if (k === 'GEAR') st.showGear = v; else visible[k] = v; applyVisibility(); },
    setColorMode(v) { colorMode = v; rebuildAll(); },
    view(name) {
      const [p, t] = views[name];
      camera.position.set(...p); controls.target.set(...t); controls.update();
    },
    measures() {
      const h = SEAT.holeMin + SEAT.holeStep * st.seatHole;
      const hz = DECK.hMin + DECK.hStep * st.deckHole;
      const r = SLED.rMin + SLED.step * st.sledHole;
      return {
        seatX: h, deckTop: hz + DECK.pivotDz + S / 2 + DECK.topPlate.t, deckHole: hz,
        sledX: r, shifterX: SHIFTER.spMin + SHIFTER.spStep * st.shifterHole,
      };
    },
  };
}
