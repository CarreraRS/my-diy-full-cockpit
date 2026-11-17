// ============================================================
//  ขนาดหลักของ Cockpit (หน่วย: มิลลิเมตร)
//  ไฟล์นี้ใช้ร่วมกันทั้งโมเดล 3D และแบบแปลน 2D
//  แกนอ้างอิง: X = ไปด้านหน้า (เริ่ม 0 ที่ท้ายเฟรม)
//              Y = ด้านข้าง (+ = ซ้ายของผู้ขับ, − = ขวา)
//              Z = ความสูงจากพื้น
// ============================================================

export const T = 50;   // เหล็กกล่องหลัก 50x50x2.3 (2")
export const S = 38;   // เหล็กกล่องรอง 38x38x2.3 (1½")
export const W = 560;  // ความกว้างเฟรมฐาน (นอก-นอก)
export const HALF = W / 2; // 280

export const A = {           // โมดูล A : ฐานเบาะ
  x0: 0, x1: 800,
  crossRear: [0, 50],
  crossFront: [600, 650],
  seatHoles: { from: 150, to: 650, pitch: 50 },   // รูแนวตั้ง (บนราง) สำหรับคานเบาะ
  sideHoles: { from: 225, to: 525, pitch: 50 },   // รูแนวนอน (ข้างราง) สำหรับแขนเกียร์
  spliceHoles: [700, 750],                        // รูต่อประกบกับโมดูล B
};

export const B = {           // โมดูล B : ฐานหน้า + เสาพวงมาลัย
  x0: 800, x1: 1500,
  crossRear: [950, 1000],
  crossFront: [1450, 1500],
  sledHoles: { from: 925, to: 1475, pitch: 25 },  // รูแนวตั้งสำหรับชุดแป้นเหยียบ
  splice: { x0: 675, x1: 925, t: 6 },             // เหล็กแบนประกบ 50x6 ยาว 250
  foot: { x0: 1000, x1: 1350 },                   // ขาค้ำเสา (เหล็ก 50x50 ยาว 350)
  upright: { x0: 1150, x1: 1200, z0: T, z1: 700 },// เสา 50x50 ยาว 650
  uprightHoles: { from: 350, to: 650, pitch: 25 },// รูปรับความสูงแท่นพวงมาลัย
};

export const SEAT = {
  crossSpacing: 300,      // ระยะศูนย์คานเบาะหน้า-หลัง
  holeMin: 150, holeStep: 50, holeCount: 5,
  sliderLen: 400, sliderTravel: 180,
  railY: 180,             // ระยะศูนย์รางสไลด์จากกึ่งกลาง
  plateLen: 400, plateH: 100,
  rows: [0, 20, 40],      // แถวรูปรับสูงที่แผ่นข้างเบาะ
};

export const DECK = {
  plate: { x0: -30, x1: 180, z0: -30, z1: 120 },  // แผ่นยึดข้าง 6 มม. (อ้างอิงจากรูล่าง hz, x = 1020..1230)
  plateX0: 1020, plateX1: 1230,
  boltX: 1175,             // รูยึดกับเสา (2 รู ห่าง 50)
  pivotX: 1120, pivotDz: 70,
  slotR: 80, tiltMax: 20,
  arm: { x0: 850, x1: 1150 },                     // แขน 38x38 ยาว 300
  cross: [[880, 918], [1062, 1100]],              // คานแท่น 38x38
  topPlate: { x0: 860, x1: 1140, w: 280, t: 6 },  // แผ่นแท่น 6 มม. 280x280
  hMin: 350, hStep: 25, hCount: 11,
};

export const SLED = {
  rMin: 925, step: 25, count: 10,  // ตำแหน่งคานหลัง (ศูนย์รู)
  crossSpacing: 320,
  longY: 150,                      // ศูนย์คานตามยาวจากกึ่งกลาง
  plate: { len: 400, w: 460, t: 4.5 },
  angleMin: 15, angleMax: 45,
};

export const SHIFTER = {
  spMin: 195, spStep: 50, spCount: 5,  // ตำแหน่งปลายหลังแผ่นฐาน
  baseLen: 160, armLen: 250, postLen: 500,
  clampLen: 250, clampH: 120,
  plate: 180,
  hMin: 150, hMax: 400,
};

export const range = ({ from, to, pitch }) => {
  const out = [];
  for (let v = from; v <= to + 1e-6; v += pitch) out.push(v);
  return out;
};
