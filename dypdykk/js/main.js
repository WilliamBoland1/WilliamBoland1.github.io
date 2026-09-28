// Dypdykk 110: game state, fixed-step loop and input.
// Game rules are unchanged from Flakse Fugl; the render/ modules only draw.
import { W, H, GH, PW, GAP, GR, JP, PS, PINT, STEP } from './constants.js';
import { submitScore } from './scoreboard.js';
import { Background } from './render/background.js';
import { Obstacle } from './render/obstacle.js';
import { Rov } from './render/rov.js';

// ── Game ──
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let state='idle', score=0, best=parseInt(localStorage.getItem('fb_best')||'0');
let bird, pipes, lastPipe, lastTime, playerName='';

function makeBird(){ return {x:90,y:H/2-30,vy:0,angle:0,flap:0}; }

function makePipe(x){ return {x, topH:Math.random()*(H-GH-GAP-120)+70, scored:false}; }

// ── Canvas sizing ──
// CSS decides how big the canvas is on screen. The backing store matches that
// size in device pixels (sharp on high-DPI screens), and the transform maps the
// game's fixed 360×540 coordinates onto it, so the game itself never changes.
let renderScale = 0;              // 0 = sprites not built yet

function fitCanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const bw = Math.round((canvas.clientWidth || W) * dpr), bh = Math.round(bw * H / W);
  if(canvas.width===bw && canvas.height===bh && renderScale===bw/W) return;
  canvas.width = bw; canvas.height = bh;          // resets the context, so set the transform after
  renderScale = bw / W;
  ctx.setTransform(renderScale, 0, 0, bh / H, 0, 0);
  buildSprites();
  if(bird) render(lastTime||0, 0, 0);             // resizing clears the canvas; redraw now to avoid a blank frame
}

function buildSprites(){ Background.build(renderScale); Obstacle.build(renderScale); Rov.build(renderScale); }

function collides(b){
  if(b.y-12<=0||b.y+12>=H-GH) return true;
  for(const p of pipes){
    if(b.x+14>p.x-6&&b.x-14<p.x+PW+6) if(b.y-10<p.topH||b.y+10>p.topH+GAP) return true;
  }
  return false;
}

function updScore(n){ document.getElementById('score-display').textContent=n; }
function medal(s){ if(s>=40)return'🏆'; if(s>=20)return'🥇'; if(s>=10)return'🥈'; if(s>=5)return'🥉'; return'💀'; }

function reset(){ score=0; bird=makeBird(); pipes=[]; lastPipe=simStep; acc=0; updScore(0); }

function showScreen(id){
  ['start-screen','over-screen','pause-screen'].forEach(s=>document.getElementById(s).classList.add('hidden'));
  document.getElementById('score-display').style.display='none';
  document.getElementById('saving-msg').textContent='';
  if(id) document.getElementById(id).classList.remove('hidden');
  else document.getElementById('score-display').style.display='block';
}

function flap(){
  if(state==='idle'){
    const nameEl=document.getElementById('player-name');
    if(!nameEl.value.trim()){
      nameEl.classList.remove('shake');
      void nameEl.offsetWidth;
      nameEl.classList.add('shake');
      nameEl.focus();
      return;
    }
    playerName=nameEl.value.trim();
    state='playing'; bird.vy=JP; bird.flap=8; showScreen(null); return;
  }
  if(state==='playing'){ bird.vy=JP; bird.flap=8; }
}

async function gameOver(){
  state='dead';
  if(score>best){ best=score; localStorage.setItem('fb_best',best); }
  document.getElementById('final-score').textContent=score;
  document.getElementById('best-score').textContent=best;
  document.getElementById('medal').textContent=medal(score);
  setTimeout(()=>showScreen('over-screen'), 600);

  const msg=document.getElementById('saving-msg');
  if(score>0){
    msg.style.color='rgba(243,233,210,0.5)'; msg.textContent='Lagrer…';
    try {
      const isNewBest = await submitScore(playerName, score);
      if(isNewBest){
        msg.style.color='#DCC08A';
        msg.textContent='Ny personlig rekord lagret!';
      } else {
        msg.style.color='rgba(243,233,210,0.5)';
        msg.textContent='Poeng lagret (ikke din beste)';
      }
    } catch(e){
      msg.style.color='#D9957A';
      msg.textContent='Kunne ikke lagre poeng';
    }
  }
}

// ── Pause: the run freezes when the tab is hidden ──
function pause(){ state='paused'; showScreen('pause-screen'); }
function resume(){ state='playing'; acc=0; lastTime=0; showScreen(null); }

// ── Fixed timestep ──
// The update below is the original once-per-frame update, unchanged. It now
// runs at exactly 60 steps per second on every display (60, 90, 120, 144 Hz),
// so fall speed, pipe speed and pipe spacing are the same on every device.
// Pipe spawning counts simulated steps instead of wall-clock ms; PINT is unchanged.
let acc = 0, simStep = 0;

function step(){
  simStep++;
  if((simStep-lastPipe)*STEP>PINT){ pipes.push(makePipe(W+10)); lastPipe=simStep; }
  for(const p of pipes){
    p.px=p.x;                     // previous x, for smooth rendering between steps
    p.x-=PS;
    if(!p.scored&&p.x+PW<bird.x){ p.scored=true; score++; updScore(score); }
  }
  pipes=pipes.filter(p=>p.x>-PW-20);
  bird.py=bird.y;                 // previous y, for smooth rendering between steps
  bird.vy+=GR; bird.y+=bird.vy; bird.angle=bird.vy*4;
  if(bird.flap>0) bird.flap--;
  if(collides(bird)) gameOver();
}

function loop(ts){
  const dt = lastTime ? Math.min(ts-lastTime, 100) : STEP;   // real ms since last frame (visual effects)
  lastTime=ts;

  if(state==='playing'){
    acc+=dt;
    // Snap small timer jitter so a 60 Hz display gets exactly one step per frame.
    const whole=Math.round(acc/STEP);
    if(Math.abs(acc-whole*STEP)<1) acc=whole*STEP;
    let n=0;
    while(acc>=STEP && state==='playing' && n<5){ step(); acc-=STEP; n++; }
    if(acc>=STEP) acc=0;          // after a long hitch, drop the backlog instead of fast-forwarding
  } else acc=0;

  // Between steps (90/120 Hz screens), project positions forward by the fraction of a step.
  // On 60 Hz this is 0, so what you see is exactly the simulated state.
  const a = state==='playing' ? acc/STEP : 0;
  if(state==='idle'){ bird.y=H/2-30+Math.sin(ts/400)*8; bird.py=bird.y; }
  render(ts, dt, a);
  requestAnimationFrame(loop);
}

// Draws one frame. dt is real ms for the visual effects (0 = redraw without animating).
function render(ts, dt, a){
  // How far the world has scrolled: pipes move PS per step, so the seabed matches them exactly.
  const worldX = (simStep + a) * PS;
  Background.update(dt, score, ts, worldX);
  Background.drawBack(ctx, ts, worldX);
  for(const p of pipes) Obstacle.draw(ctx, p, p.x + (p.x-(p.px??p.x))*a);
  Background.drawFront(ctx);
  Background.drawGround(ctx, ts, worldX);
  const ry = bird.y + (bird.y-(bird.py??bird.y))*a;
  Rov.frame(ctx, bird, bird.x, ry, ts, dt, state, Background.lamp);
}

// ── Input: keyboard, mouse and touch all go through press() ──
function press(){
  if(state==='paused'){ resume(); return; }
  flap();
}

document.addEventListener('keydown',e=>{ if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();press();} });
canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); press(); });
// Start screen: a tap anywhere except the name field or a button starts the dive.
document.getElementById('start-screen').addEventListener('pointerdown',e=>{
  if(e.target.closest('input,button')) return;
  e.preventDefault(); flap();
});
document.getElementById('pause-screen').addEventListener('pointerdown',e=>{ e.preventDefault(); resume(); });
document.getElementById('player-name').addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('start-btn').click(); });
document.getElementById('start-btn').addEventListener('click',()=>{ flap(); });
document.getElementById('retry-btn').addEventListener('click',()=>{ reset(); state='playing'; bird.vy=JP; bird.flap=8; showScreen(null); });
document.getElementById('menu-btn').addEventListener('click',()=>{ reset(); state='idle'; showScreen('start-screen'); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden && state==='playing') pause(); });

new ResizeObserver(fitCanvas).observe(canvas);
window.addEventListener('resize', fitCanvas);   // also catches devicePixelRatio changes (browser zoom)

fitCanvas(); reset(); state='idle'; showScreen('start-screen');
requestAnimationFrame(loop);
