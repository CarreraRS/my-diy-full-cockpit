import { createViewer, MODULES } from './model.js';
import { DRAWINGS } from './drawings.js';
import { SEAT, DECK, SLED, SHIFTER } from './params.js';

// ---------- tabs ----------
const tabs = document.querySelectorAll('[data-tab]');
function showTab(id) {
  tabs.forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === id));
  document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('active', s.id === id));
  try { localStorage.setItem('tab', id); } catch (e) { /* ignore */ }
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
}
tabs.forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
let initial = location.hash.slice(1);
if (!document.getElementById(initial)) { try { initial = localStorage.getItem('tab'); } catch (e) { initial = null; } }
if (initial && document.getElementById(initial)) showTab(initial);

// ---------- 3D ----------
const viewer = createViewer(document.getElementById('viewer'));
document.getElementById('loadmsg').remove();

const hex = (c) => '#' + c.toString(16).padStart(6, '0');
const legend = document.getElementById('legend');
for (const [k, m] of Object.entries(MODULES)) {
  const row = document.createElement('label');
  row.className = 'leg';
  row.innerHTML = `<input type="checkbox" checked><span class="chip" style="background:${hex(m.color)}"></span><span>${m.name}</span>`;
  row.querySelector('input').addEventListener('change', (e) => viewer.setVisible(k, e.target.checked));
  legend.appendChild(row);
}

const fmt = {
  mm: (v) => `${v} มม.`,
  deg: (v) => `${v}°`,
  row: (v) => `แถว ${v + 1} (+${SEAT.rows[v]} มม.)`,
  seatHole: (v) => { const h = SEAT.holeMin + SEAT.holeStep * v; return `รู x=${h} / ${h + SEAT.crossSpacing}`; },
  deckHole: (v) => { const h = DECK.hMin + DECK.hStep * v; return `รู ${v + 1} · แท่นสูง ~${h + DECK.pivotDz + 25} มม.`; },
  sledHole: (v) => { const r = SLED.rMin + SLED.step * v; return `รู x=${r} (+${SLED.step * v})`; },
  shHole: (v) => { const p = SHIFTER.spMin + SHIFTER.spStep * v + 30; return `รู x=${p} / ${p + 100}`; },
  shH: (v) => `${v} มม. (ไม่มีขั้น)`,
};

document.querySelectorAll('.ctl').forEach((el) => {
  const key = el.dataset.key;
  const label = el.textContent;
  el.innerHTML = `<div class="ctl-row"><span>${label}</span><output></output></div>
    <input type="range" min="${el.dataset.min}" max="${el.dataset.max}" step="${el.dataset.step}" value="${viewer.state[key]}" aria-label="${label}">`;
  const input = el.querySelector('input'), out = el.querySelector('output');
  const f = fmt[el.dataset.fmt];
  const upd = () => { const v = Number(input.value); out.textContent = f(v); viewer.set(key, v); };
  input.addEventListener('input', upd);
  out.textContent = f(Number(input.value));
});

document.getElementById('explode').addEventListener('change', (e) => viewer.set('explode', e.target.checked ? 1 : 0));
document.getElementById('colormode').addEventListener('change', (e) => viewer.setColorMode(e.target.checked));
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => viewer.view(b.dataset.view)));

// ---------- drawings ----------
const dwgWrap = document.getElementById('drawings');
for (const d of DRAWINGS) {
  const fig = document.createElement('figure');
  fig.className = 'dwg';
  fig.id = 'dwg-' + d.id;
  fig.innerHTML = `<figcaption>${d.title}</figcaption>${d.svg()}`;
  dwgWrap.appendChild(fig);
}
document.getElementById('printbtn').addEventListener('click', () => window.print());

// ---------- guide (markdown) ----------
const doc = document.getElementById('doc');
fetch('docs/PLAN.md')
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then((md) => {
    doc.innerHTML = window.marked.parse(md);
    const toc = document.getElementById('toc');
    doc.querySelectorAll('h2').forEach((h, i) => {
      h.id = 'sec-' + i;
      const a = document.createElement('a');
      a.href = '#sec-' + i; a.textContent = h.textContent;
      a.addEventListener('click', (e) => { e.preventDefault(); h.scrollIntoView({ behavior: 'smooth' }); });
      toc.appendChild(a);
    });
    doc.querySelectorAll('table').forEach((t) => {
      const w = document.createElement('div'); w.className = 'tblwrap';
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
  })
  .catch(() => {
    doc.innerHTML = '<p>โหลดเอกสารไม่สำเร็จ — ถ้าเปิดไฟล์จากเครื่องโดยตรง ให้รันเว็บเซิร์ฟเวอร์ (เช่น <code>python -m http.server</code>) หรือเปิดไฟล์ <a href="docs/PLAN.md">docs/PLAN.md</a> บน GitHub</p>';
  });
