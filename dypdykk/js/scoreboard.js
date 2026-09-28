// Firebase leaderboard for Dypdykk 110.
// Moved verbatim from game.html; do not change the logic here.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set, onValue, query, orderByChild }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const app = initializeApp({
  apiKey: "AIzaSyAELM2Q4U7HUX0VbTIxrVZ6m-8HkbItzng",
  authDomain: "floppy-boland.firebaseapp.com",
  projectId: "floppy-boland",
  storageBucket: "floppy-boland.firebasestorage.app",
  messagingSenderId: "872985134661",
  appId: "1:872985134661:web:6e120333bf32e50f2f052c",
  databaseURL: "https://floppy-boland-default-rtdb.europe-west1.firebasedatabase.app"
});
const db = getDatabase(app);

// ── Key: one record per player name, only their best score is kept ──
// Path: scores/<sanitised_name> = { name, score }
function nameKey(n) {
  // turn "John Doe!" → "john_doe" — safe Firebase key
  return n.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
}

// Submit: only write if this score beats the stored best for that name
async function submitScore(name, score) {
  if (!name || score < 1) return;
  const key = nameKey(name);
  const entryRef = ref(db, 'scores/' + key);
  const snap = await get(entryRef);
  if (!snap.exists() || score > snap.val().score) {
    await set(entryRef, { name: name.trim(), score, ts: Date.now() });
    return true; // new best
  }
  return false; // not a new best
}

const scoresRef = ref(db, 'scores');
onValue(query(scoresRef, orderByChild('score')), snap => {
  const rows = [];
  snap.forEach(child => { rows.push(child.val()); });
  rows.sort((a, b) => b.score - a.score);
  renderLB(rows.slice(0, 10));
});



function renderLB(rows) {
  const myName = document.getElementById('player-name').value.trim().toLowerCase();
  const list = document.getElementById('lb-list');

  if (!rows.length) {
    list.innerHTML = '<div class="lb-empty">Ingen poeng ennå –<br>bli den første!</div>';
    return;
  }

  list.innerHTML = rows.map((r, i) => {
    const rc = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const me = myName && r.name.toLowerCase() === myName;
    return `<div class="lb-row${me ? ' me' : ''}">
      <div class="lb-rank ${rc}">${i + 1}</div>
      <div class="lb-name${me ? ' me-name' : ''}">${esc(r.name)}</div>
      <div class="lb-score">${r.score}</div>
    </div>`;
  }).join('');
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export { submitScore };
