// Leaderboard highlight, kept apart from scoreboard.js (whose logic is frozen).
// scoreboard.js redraws the whole list on every Firebase update. This watches for
// those redraws and marks the rows whose score is new since the previous one, so
// the CSS can flash them. The first redraw after loading only records the scores.
const list = document.getElementById('lb-list');
let seen = null;   // lowercased name → score text, as of the previous redraw

new MutationObserver(() => {
  const now = new Map();
  for (const row of list.querySelectorAll('.lb-row')) {
    const name = row.querySelector('.lb-name').textContent.toLowerCase();
    const score = row.querySelector('.lb-score').textContent;
    if (seen && seen.get(name) !== score) row.classList.add('fresh');
    now.set(name, score);
  }
  seen = now;
}).observe(list, { childList: true });
