// แบบแปลน 2D (SVG) สร้างจากขนาดใน params.js — หน่วย มม.
import { T, S, W, HALF, A, B, SEAT, DECK, SLED, SHIFTER, range } from './params.js';

class Dwg {
  constructor(minx, miny, maxx, maxy, fs = 22) {
    Object.assign(this, { minx, miny, maxx, maxy, fs });
    this.items = [];
  }
  rect(x, y, w, h, cls = 'part') { this.items.push(`<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`); return this; }
  poly(pts, cls = 'part') { this.items.push(`<polygon class="${cls}" points="${pts.map((p) => p.join(',')).join(' ')}"/>`); return this; }
  line(x1, y1, x2, y2, cls = 'thin') { this.items.push(`<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`); return this; }
  circle(cx, cy, r, cls = 'hole') { this.items.push(`<circle class="${cls}" cx="${cx}" cy="${cy}" r="${r}"/>`); return this; }
  path(d, cls = 'part') { this.items.push(`<path class="${cls}" d="${d}"/>`); return this; }
  text(x, y, str, cls = 'lbl', anchor = 'middle', size = 1) {
    this.items.push(`<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${this.fs * size}">${str}</text>`);
    return this;
  }
  // เส้นบอกขนาดแนวนอน: วัดจาก x1 ถึง x2 วางที่ระดับ y (เส้นช่วยจาก yRef)
  dimH(x1, x2, y, yRef = null, label = null) {
    const t = label ?? Math.round(Math.abs(x2 - x1));
    if (yRef !== null) { this.line(x1, yRef, x1, y, 'ext'); this.line(x2, yRef, x2, y, 'ext'); }
    this.items.push(`<line class="dim" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" marker-start="url(#arw)" marker-end="url(#arw)"/>`);
    return this.text((x1 + x2) / 2, y - this.fs * 0.35, t, 'dimt');
  }
  dimV(y1, y2, x, xRef = null, label = null) {
    const t = label ?? Math.round(Math.abs(y2 - y1));
    if (xRef !== null) { this.line(xRef, y1, x, y1, 'ext'); this.line(xRef, y2, x, y2, 'ext'); }
    this.items.push(`<line class="dim" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" marker-start="url(#arw)" marker-end="url(#arw)"/>`);
    const cy = (y1 + y2) / 2;
    this.items.push(`<text class="dimt" x="${x - this.fs * 0.35}" y="${cy}" text-anchor="middle" font-size="${this.fs}" transform="rotate(-90 ${x - this.fs * 0.35} ${cy})">${t}</text>`);
    return this;
  }
  svg() {
    const pad = this.fs * 1.2;
    const vb = [this.minx - pad, this.miny - pad, this.maxx - this.minx + 2 * pad, this.maxy - this.miny + 2 * pad];
    const sw = this.fs / 11;
    return `<svg viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" style="--sw:${sw}px">
<defs><marker id="arw" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="${this.fs * 0.45}" markerHeight="${this.fs * 0.45}" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" class="arrow"/></marker></defs>
${this.items.join('\n')}</svg>`;
  }
}

const holeR = 5.5;

// 1) มุมมองด้านบนทั้งคัน
function overallTop() {
  const d = new Dwg(-60, -HALF - 420, 1560, HALF + 330, 32);
  const Y = (y) => -y; // ซ้ายผู้ขับอยู่ด้านบนของภาพ
  for (const s of [1, -1]) {
    const y0 = Y(s * HALF), y1 = Y(s * (HALF - T));
    d.rect(A.x0, Math.min(y0, y1), A.x1, T, 'part a');
    d.rect(B.x0, Math.min(y0, y1), B.x1 - B.x0, T, 'part b');
    const oy = s > 0 ? Y(HALF + T) : Y(-HALF);
    d.rect(B.foot.x0, oy, B.foot.x1 - B.foot.x0, T, 'part b');
    d.rect(B.upright.x0, oy, 50, T, 'part b dark');
  }
  for (const [x0, x1] of [A.crossRear, A.crossFront]) d.rect(x0, -HALF + T, x1 - x0, W - 2 * T, 'part a');
  for (const [x0, x1] of [B.crossRear, B.crossFront]) d.rect(x0, -HALF + T, x1 - x0, W - 2 * T, 'part b');
  // splice
  for (const s of [1, -1]) {
    d.rect(B.splice.x0, Y(s * (HALF + 6)) - (s > 0 ? 0 : 6), 250, 6, 'part b');
  }
  // seat crossbars (default) + sled outline
  for (const x of [250, 550]) d.rect(x - S / 2, -HALF, S, W, 'ghost');
  d.rect(1025 - S / 2, -HALF, SLED.crossSpacing + S, W, 'ghost');
  // shifter
  const sp = 295;
  d.rect(sp, HALF, SHIFTER.baseLen, 6, 'part s');
  d.rect(sp + 55, HALF + 6, T, SHIFTER.armLen, 'part s');
  d.rect(sp + 55, HALF + 6 + SHIFTER.armLen - T, T, T, 'part s dark');
  d.text(400, 20, 'A · ฐานเบาะ', 'tag');
  d.text(1150, 20, 'B · ฐานหน้า', 'tag');
  d.text(sp + 80, HALF + 300, 'S · ขาเกียร์', 'tag');
  d.text(1175, -HALF - 80, 'เสา', 'tag', 'middle', 0.8);
  d.dimH(0, 1500, -HALF - 300, -HALF);
  d.dimH(0, 800, -HALF - 200, -HALF);
  d.dimH(800, 1500, -HALF - 200, -HALF);
  d.dimH(B.upright.x0, B.upright.x1, -HALF - 120, -HALF - 50, '50');
  d.dimH(0, B.upright.x0, -HALF - 120, null, '1150');
  d.dimV(-HALF, HALF, -40, 0, '560');
  d.dimV(-HALF - T, HALF + T, 1540, 1350, '660');
  d.dimV(HALF, HALF + 6 + SHIFTER.armLen, sp - 40, sp, String(6 + SHIFTER.armLen));
  d.text(750, HALF + 200, 'มุมมองด้านบน (ด้านหน้ารถอยู่ทางขวา)', 'cap', 'middle', 0.9);
  return d.svg();
}

// 2) มุมมองด้านข้าง
function overallSide() {
  const d = new Dwg(-60, -1000, 1560, 120, 32);
  const Z = (z) => -z;
  d.rect(0, Z(T), 1500, T, 'part a');
  d.rect(800, Z(T), 700, T, 'part b');
  d.rect(B.foot.x0, Z(T), B.foot.x1 - B.foot.x0, T, 'part b dark');
  d.rect(B.upright.x0, Z(B.upright.z1), 50, B.upright.z1 - T, 'part b');
  d.poly([[B.upright.x1, Z(T)], [B.upright.x1 + 150, Z(T)], [B.upright.x1, Z(T + 150)]], 'part b');
  d.poly([[B.upright.x0, Z(T)], [B.upright.x0 - 150, Z(T)], [B.upright.x0, Z(T + 150)]], 'part b');
  for (const z of range(B.uprightHoles)) d.circle(1175, Z(z), holeR);
  // deck (default hole 475)
  const hz = 475, pz = hz + DECK.pivotDz; // ตำแหน่งตั้งต้น
  d.rect(DECK.plateX0, Z(hz + 120), DECK.plateX1 - DECK.plateX0, 150, 'ghost c');
  d.rect(DECK.arm.x0, Z(pz + S / 2 + 6), DECK.arm.x1 - DECK.arm.x0, S + 6, 'part c');
  // sled
  const r = 1025;
  d.rect(r - S / 2, Z(T + S), S, S, 'part p'); d.rect(r + 320 - S / 2, Z(T + S), S, S, 'part p');
  const th = 30 * Math.PI / 180;
  d.poly([[r, Z(T + S)], [r + 400 * Math.cos(th), Z(T + S + 400 * Math.sin(th))],
    [r + 400 * Math.cos(th) - 5, Z(T + S + 400 * Math.sin(th)) + 5], [r, Z(T + S) + 5]], 'part p');
  // seat
  d.rect(250 - S / 2, Z(T + S), S, S, 'part sx'); d.rect(550 - S / 2, Z(T + S), S, S, 'part sx');
  d.path(`M190,${Z(160)} L640,${Z(190)} L640,${Z(230)} L190,${Z(230)} L60,${Z(880)} L-20,${Z(860)} L120,${Z(160)} Z`, 'ghost');
  // shifter post
  d.rect(350, Z(T + SHIFTER.postLen), 50, SHIFTER.postLen, 'ghost s');
  d.text(1175, Z(740), 'แท่นพวงมาลัย C', 'tag', 'middle', 0.8);
  d.text(r + 200, Z(330), 'แป้น P', 'tag', 'middle', 0.8);
  d.text(300, Z(950), 'เบาะ (ตัวอย่าง)', 'tag', 'middle', 0.8);
  d.dimV(0, Z(700), 1290, 1200, '700');
  d.dimV(Z(350), Z(650), 1100, 1150, '350–650 (รูทุก 25)');
  d.dimV(0, Z(T), -30, 0, '50');
  d.dimV(Z(T), Z(T + SHIFTER.postLen), 450, 400, '500');
  d.dimH(0, 1500, 70, 0);
  d.text(750, Z(-100) + 20, 'มุมมองด้านข้าง (ตำแหน่งตั้งต้น)', 'cap', 'middle', 0.9);
  return d.svg();
}

// 3) โมดูล A : รายละเอียดรู
function moduleA() {
  const d = new Dwg(-40, -HALF - 200, 960, HALF + 120, 22);
  for (const s of [1, -1]) d.rect(0, s > 0 ? -HALF : HALF - T, 800, T, 'part a');
  for (const [x0, x1] of [A.crossRear, A.crossFront]) d.rect(x0, -HALF + T, x1 - x0, W - 2 * T, 'part a');
  for (const s of [1, -1]) {
    const yc = s * (HALF - T / 2);
    for (const x of range(A.seatHoles)) d.circle(x, yc, holeR);
  }
  // side holes (shown as small ticks on outer edge)
  for (const x of range(A.sideHoles)) { d.circle(x, HALF + 14, 4, 'hole side'); d.circle(x, -HALF - 14, 4, 'hole side'); }
  for (const x of A.spliceHoles) { d.circle(x, HALF + 14, 4, 'hole sp'); d.circle(x, -HALF - 14, 4, 'hole sp'); }
  d.dimH(0, 800, -HALF - 150, -HALF);
  d.dimH(0, 150, -HALF - 70, -HALF);
  d.dimH(150, 650, -HALF - 70, -HALF, '11 รู @50 = 500');
  d.dimH(225, 525, HALF + 60, HALF + 20, '7 รู @50 (รูข้าง)');
  d.dimH(650, 750, HALF + 60, HALF + 20, '700 / 750');
  d.dimV(-HALF, HALF, 880, 800, '560');
  d.dimH(600, 650, 0, null, '600');
  d.text(400, HALF + 105, '● รูบน-ล่าง Ø11 (ทะลุ 2 ผิว)   ○ รูข้าง Ø11 (ทะลุ 2 ผิว)', 'cap', 'middle', 0.85);
  return d.svg();
}

// 4) โมดูล B
function moduleB() {
  const d = new Dwg(620, -HALF - 210, 1560, HALF + 140, 22);
  for (const s of [1, -1]) {
    d.rect(800, s > 0 ? -HALF : HALF - T, 700, T, 'part b');
    d.rect(B.splice.x0, s > 0 ? -HALF - 6 : HALF, 250, 6, 'part b dark');
    d.rect(B.splice.x0, s > 0 ? -HALF + T : HALF - T - 6, 250, 6, 'part b dark');
    d.rect(B.foot.x0, s > 0 ? -HALF - T : HALF, 350, T, 'part b');
    d.rect(B.upright.x0, s > 0 ? -HALF - T : HALF, 50, T, 'part b dark');
    for (const x of range(B.sledHoles)) d.circle(x, s * (HALF - T / 2), holeR);
  }
  for (const [x0, x1] of [B.crossRear, B.crossFront]) d.rect(x0, -HALF + T, x1 - x0, W - 2 * T, 'part b');
  d.dimH(800, 1500, -HALF - 170, -HALF);
  d.dimH(675, 925, -HALF - 100, -HALF - 6, '250 (ประกบ)');
  d.dimH(925, 1475, 0, null, '23 รู @25 = 550');
  d.dimH(1000, 1350, HALF + 100, HALF + T, '350 (ขาค้ำ)');
  d.dimH(800, 950, -60, null, '150');
  d.text(1090, HALF + 135, 'แผ่นประกบเชื่อมติดโมดูล B ด้านเดียว — ปลาย 125 มม. สวมรางโมดูล A', 'cap', 'middle', 0.8);
  return d.svg();
}

// 5) เสา + แผ่นยึดแท่น
function deckBracket() {
  const d = new Dwg(-120, -760, 560, 30, 16);
  const Z = (z) => -z;
  const ux = 60;
  d.rect(ux, Z(700), 50, 650, 'part b');
  d.rect(ux - 150, Z(50), 350, 50, 'part b');
  for (const z of range(B.uprightHoles)) d.circle(ux + 25, Z(z), holeR);
  d.dimV(Z(350), Z(650), ux - 40, ux, '13 รู @25');
  d.dimV(0, Z(350), ux - 40, ux, '350');
  d.dimV(0, Z(700), ux - 100, ux, '700');
  d.text(ux + 25, Z(730), 'เสา 50x50x2.3', 'tag', 'middle', 0.9);
  // bracket plate detail (drawn to right)
  const ox = 260, base = 480; // local: hz -> Z(base)
  const px = (x) => ox + (x - DECK.plateX0) * 1;
  d.rect(px(1020), Z(base + 120), 210, 150, 'part c');
  d.circle(px(1175), Z(base), holeR); d.circle(px(1175), Z(base + 50), holeR);
  const pdz = DECK.pivotDz;
  d.circle(px(DECK.pivotX), Z(base + pdz), holeR);
  const R = DECK.slotR, a2 = 20 * Math.PI / 180;
  const cx = px(DECK.pivotX), cy = Z(base + pdz);
  const p1 = [cx - R, cy], p2 = [cx - R * Math.cos(a2), cy - R * Math.sin(a2)];
  d.path(`M${p1[0]},${p1[1]} A${R},${R} 0 0 1 ${p2[0]},${p2[1]}`, 'slot');
  d.dimV(Z(base - 30), Z(base + pdz), px(1020) - 25, px(1020), String(pdz + 30));
  d.dimH(px(1020), px(1230), Z(base + 160), Z(base + 120), '210');
  d.dimV(Z(base - 30), Z(base + 120), px(1230) + 40, px(1230), '150');
  d.dimV(Z(base), Z(base + 50), px(1175) + 70, px(1175), '50');
  d.dimH(px(DECK.pivotX), px(1175), Z(base - 60), Z(base - 30), '55');
  d.dimH(px(1020), px(DECK.pivotX), Z(base - 60), Z(base - 30), '100');
  d.text(px(1100), Z(base - 110), 'แผ่นยึดแท่น 6 มม. (2 ชิ้น)', 'tag', 'middle', 0.9);
  d.text(px(1100), Z(base - 135), 'รูหมุน R80 · ร่องโค้ง 0–20°', 'cap', 'middle', 0.85);
  return d.svg();
}

// 6) ชุดแป้นเหยียบ
function sled() {
  const d = new Dwg(-60, -320, 1000, 330, 18);
  for (const x of [0, 320]) d.rect(x - S / 2, -HALF, S, W, 'part p');
  for (const s of [1, -1]) d.rect(S / 2, s * SLED.longY - S / 2, 320 - S, S, 'part p');
  for (const s of [1, -1]) { d.circle(0, s * (HALF - 25), holeR); d.circle(320, s * (HALF - 25), holeR); }
  d.dimH(0, 320, -HALF - 25, -HALF, '320');
  d.dimV(-HALF, HALF, -40, -S / 2, '560');
  d.dimV(-SLED.longY, SLED.longY, 200, null, '300');
  d.text(160, HALF + 30, 'โครงแป้น (มองบน)', 'tag', 'middle', 0.9);
  // side: plate angle
  const ox = 520, oy = 220;
  const th = 30 * Math.PI / 180;
  d.rect(ox - S / 2, oy, S, S, 'part p'); d.rect(ox + 320 - S / 2, oy, S, S, 'part p');
  d.line(ox, oy, ox + 400 * Math.cos(th), oy - 400 * Math.sin(th), 'thick');
  d.line(ox + 320, oy, ox + 300 * Math.cos(th), oy - 300 * Math.sin(th), 'thickp');
  d.circle(ox, oy, 6, 'hole');
  d.path(`M${ox + 110},${oy} A110,110 0 0 0 ${ox + 110 * Math.cos(th)},${oy - 110 * Math.sin(th)}`, 'thin');
  d.text(ox + 150, oy - 20, '15°–45°', 'dimt');
  d.text(ox + 210, oy - 230, 'แผ่นแป้น 4.5 มม. 460x400', 'tag', 'middle', 0.8);
  d.text(ox + 330, oy - 60, 'ค้ำ 50x6 (รู @20)', 'cap', 'start', 0.8);
  d.text(ox, oy + 70, 'บานพับ', 'cap', 'middle', 0.8);
  d.dimH(ox, ox + 320, oy + 100, oy + S);
  return d.svg();
}

// 7) ขาเกียร์ (มองจากหน้า)
function shifter() {
  const d = new Dwg(-80, -640, 460, 40, 16);
  const Z = (z) => -z;
  // y axis to right = outward
  const y = (v) => -(v + HALF) ; // -280 => 0 at rail outer face... outward positive
  d.rect(-T, Z(T), T, T, 'part a'); // rail section
  d.rect(0, Z(T), 6, T, 'part s');
  d.rect(6, Z(T), SHIFTER.armLen, T, 'part s');
  d.rect(6 + SHIFTER.armLen - T, Z(T + SHIFTER.postLen), T, SHIFTER.postLen, 'part s');
  const sh = 280, cy0 = 6 + SHIFTER.armLen + 20 - SHIFTER.clampLen;
  d.rect(cy0, Z(sh + 120), SHIFTER.clampLen, 120, 'ghost s');
  d.rect(6 + SHIFTER.armLen - T - 180, Z(sh + 125), 180, 5, 'part s');
  for (const v of [6 + SHIFTER.armLen - T - 10, 6 + SHIFTER.armLen + 10]) for (const z of [sh + 25, sh + 95]) d.circle(v, Z(z), holeR);
  d.dimH(0, 6 + SHIFTER.armLen, 30, Z(0) , '256');
  d.dimV(Z(T), Z(T + SHIFTER.postLen), 6 + SHIFTER.armLen + 60, 6 + SHIFTER.armLen, '500');
  d.dimH(cy0, cy0 + SHIFTER.clampLen, Z(sh + 150), Z(sh + 120), '250');
  d.dimV(Z(sh), Z(sh + 120), cy0 - 20, cy0, '120');
  d.text(80, Z(560), 'มองจากด้านหน้า (ข้างขวาผู้ขับ)', 'cap', 'middle', 0.85);
  d.text(-25, Z(T) - 12, 'ราง A', 'cap', 'middle', 0.75);
  d.text(110, Z(sh + 140), 'แผ่นวางเกียร์ 180x180', 'tag', 'middle', 0.8);
  return d.svg();
}

// 8) ชุดยึดเบาะ
function seatBracket() {
  const d = new Dwg(-30, -170, 440, 40, 13);
  d.rect(0, -100, 400, 100, 'part sx');
  for (const [i, r] of SEAT.rows.entries()) for (let x = 25; x < 395; x += 25) d.circle(x, -(55 + r) + 0, 4.5);
  d.dimH(0, 400, -125, -100);
  d.dimV(0, -100, -15, 0, '100');
  d.dimV(-55, -95, 415, 400, '3 แถว @20');
  d.dimH(0, 25, 25, 0, '25');
  d.text(200, -150, 'แผ่นข้างเบาะ 6 มม. 400x100 (2 ชิ้น) เชื่อมบนเหล็กฉาก 50x50x5', 'tag', 'middle', 0.9);
  return d.svg();
}

export const DRAWINGS = [
  { id: 'top', title: '01 · มุมมองด้านบน (ภาพรวม)', svg: overallTop },
  { id: 'side', title: '02 · มุมมองด้านข้าง (ภาพรวม)', svg: overallSide },
  { id: 'a', title: '03 · โมดูล A ฐานเบาะ — ตำแหน่งรู', svg: moduleA },
  { id: 'b', title: '04 · โมดูล B ฐานหน้า — ตำแหน่งรู', svg: moduleB },
  { id: 'c', title: '05 · เสาพวงมาลัย + แผ่นยึดแท่น (C)', svg: deckBracket },
  { id: 'p', title: '06 · ชุดแป้นเหยียบ (P)', svg: sled },
  { id: 's', title: '07 · ขาติดเกียร์ (S)', svg: shifter },
  { id: 'seat', title: '08 · แผ่นยึดข้างเบาะ', svg: seatBracket },
];
