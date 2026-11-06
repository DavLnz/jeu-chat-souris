"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

const ENVIRONNEMENTS = [
  {
    nom: "La Chambre",
    ciel: ["#ffd9ec", "#fff3f9"],
    sol: "#c98a5b",
    decor: ["🛏️", "🧸", "🪀", "🧦", "📚"],
    objets: ["🗄️", "🪑"],
    couleurObjet: "#8a5a3b"
  },
  {
    nom: "L'Appartement",
    ciel: ["#cfe8ff", "#eef7ff"],
    sol: "#9c8465",
    decor: ["🛋️", "🖼️", "🪴", "💡", "🕰️"],
    objets: ["📺", "🚪"],
    couleurObjet: "#5b6b7c"
  },
  {
    nom: "La Maison",
    ciel: ["#ffe9c9", "#fff8ee"],
    sol: "#a9744f",
    decor: ["🪴", "🖼️", "🧺", "🕯️", "🐾"],
    objets: ["🍽️", "🚪"],
    couleurObjet: "#7c5a3a"
  },
  {
    nom: "Le Jardin",
    ciel: ["#b8f1c0", "#eafbe7"],
    sol: "#5da244",
    decor: ["🌳", "🌷", "🌼", "🦋", "🍄"],
    objets: ["⛲", "🪨"],
    couleurObjet: "#3f7a34"
  },
  {
    nom: "La Rue",
    ciel: ["#bcd7f5", "#eef4fb"],
    sol: "#6f6f78",
    decor: ["🏢", "🏠", "🚦", "🚗", "🐈"],
    objets: ["🚧", "🗑️"],
    couleurObjet: "#4a4a55"
  }
];

const DUREE_PARTIE = 60;
const RAYON_CHAT = 26;
const RAYON_SOURIS = 18;
const CATCH_PAR_NIVEAU = 5;

const etat = {
  mode: "menu",
  score: 0,
  niveau: 0,
  tempsRestant: DUREE_PARTIE,
  record: 0,
  message: "",
  messageTemps: 0
};

try {
  etat.record = parseInt(localStorage.getItem("chatSourisRecord") || "0", 10) || 0;
} catch (e) {
  etat.record = 0;
}

const chat = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
const souris = { x: 0, y: 0, angle: 0, t: 0 };
let obstacles = [];
let decor = [];
let particules = [];

const touches = { actif: false, x: 0, y: 0 };
const touchesClavier = {};

let audioCtx = null;
function bip(frequence, duree) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = frequence;
    g.gain.setValueAtTime(0.18, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duree);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + duree);
  } catch (e) {}
}

function genererNiveau() {
  const env = ENVIRONNEMENTS[etat.niveau % ENVIRONNEMENTS.length];
  const marge = 70;
  const nbObjets = 2 + Math.min(etat.niveau, 3);
  obstacles = [];
  for (let i = 0; i < nbObjets; i++) {
    const w = 60 + Math.random() * 90;
    const h = 50 + Math.random() * 70;
    obstacles.push({
      x: marge + Math.random() * Math.max(1, W - marge * 2 - w),
      y: marge + Math.random() * Math.max(1, H * 0.6 - h),
      w: w,
      h: h,
      emoji: env.objets[i % env.objets.length]
    });
  }
  decor = [];
  const nbDecor = 5;
  for (let i = 0; i < nbDecor; i++) {
    decor.push({
      x: 30 + Math.random() * Math.max(1, W - 60),
      y: H * 0.62 + Math.random() * Math.max(1, H * 0.32 - 30),
      emoji: env.decor[i % env.decor.length],
      taille: 22 + Math.random() * 14
    });
  }
  positionnerSourisLoinDuChat();
}

function positionAleatoireLoin(rayonMin) {
  for (let essai = 0; essai < 40; essai++) {
    const x = 40 + Math.random() * Math.max(1, W - 80);
    const y = 90 + Math.random() * Math.max(1, H - 140);
    const d = Math.hypot(x - chat.x, y - chat.y);
    if (d > rayonMin) {
      let bloque = false;
      for (const o of obstacles) {
        if (x > o.x - 30 && x < o.x + o.w + 30 && y > o.y - 30 && y < o.y + o.h + 30) {
          bloque = true;
          break;
        }
      }
      if (!bloque) return { x: x, y: y };
    }
  }
  return { x: W / 2, y: H - 80 };
}

function positionnerSourisLoinDuChat() {
  const p = positionAleatoireLoin(180);
  souris.x = p.x;
  souris.y = p.y;
  souris.t = 0;
}

function demarrerPartie() {
  etat.mode = "jouer";
  etat.score = 0;
  etat.niveau = 0;
  etat.tempsRestant = DUREE_PARTIE;
  etat.message = "";
  etat.messageTemps = 0;
  particules = [];
  chat.x = W / 2;
  chat.y = H - 100;
  chat.vx = 0;
  chat.vy = 0;
  genererNiveau();
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameover").classList.add("hidden");
  dernierTemps = performance.now();
}

function finirPartie() {
  etat.mode = "fin";
  if (etat.score > etat.record) {
    etat.record = etat.score;
    try {
      localStorage.setItem("chatSourisRecord", String(etat.record));
    } catch (e) {}
  }
  document.getElementById("scoreFinal").textContent = "🐭 Souris attrapées : " + etat.score;
  document.getElementById("recordFinal").textContent = "🏆 Record : " + etat.record;
  document.getElementById("gameover").classList.remove("hidden");
}

function collideObstacle(x, y, r) {
  for (const o of obstacles) {
    const px = Math.max(o.x, Math.min(x, o.x + o.w));
    const py = Math.max(o.y, Math.min(y, o.y + o.h));
    if (Math.hypot(x - px, y - py) < r) return true;
  }
  return false;
}

function deplacerAvecCollisions(entite, nx, ny, r) {
  if (!collideObstacle(nx, entite.y, r)) entite.x = nx;
  if (!collideObstacle(entite.x, ny, r)) entite.y = ny;
  entite.x = Math.max(r, Math.min(W - r, entite.x));
  entite.y = Math.max(70, Math.min(H - r, entite.y));
}

function mettreAJour(dt) {
  etat.tempsRestant -= dt;
  if (etat.tempsRestant <= 0) {
    etat.tempsRestant = 0;
    finirPartie();
    return;
  }
  if (etat.messageTemps > 0) etat.messageTemps -= dt;

  const vitesseChat = Math.min(340 + etat.niveau * 25, 460);
  let dx = 0;
  let dy = 0;
  if (touchesClavier["ArrowLeft"] || touchesClavier["q"] || touchesClavier["a"]) dx -= 1;
  if (touchesClavier["ArrowRight"] || touchesClavier["d"]) dx += 1;
  if (touchesClavier["ArrowUp"] || touchesClavier["z"] || touchesClavier["w"]) dy -= 1;
  if (touchesClavier["ArrowDown"] || touchesClavier["s"]) dy += 1;
  if (touches.actif) {
    const vx = touches.x - chat.x;
    const vy = touches.y - chat.y;
    const d = Math.hypot(vx, vy);
    if (d > 12) {
      dx = vx / d;
      dy = vy / d;
    }
  }
  const norme = Math.hypot(dx, dy);
  if (norme > 0) {
    dx /= norme;
    dy /= norme;
    chat.angle = Math.atan2(dy, dx);
  }
  deplacerAvecCollisions(chat, chat.x + dx * vitesseChat * dt, chat.y + dy * vitesseChat * dt, RAYON_CHAT);

  const vitesseSouris = vitesseChat * (0.72 + Math.min(etat.niveau * 0.04, 0.2));
  souris.t += dt;
  let fx = souris.x - chat.x;
  let fy = souris.y - chat.y;
  const fd = Math.hypot(fx, fy) || 1;
  fx /= fd;
  fy /= fd;
  const wobble = Math.sin(souris.t * 6) * 0.5;
  const wx = -fy * wobble;
  const wy = fx * wobble;
  let mx = fx + wx;
  let my = fy + wy;
  const bord = 60;
  if (souris.x < bord) mx += 1.5;
  if (souris.x > W - bord) mx -= 1.5;
  if (souris.y < 90) my += 1.5;
  if (souris.y > H - bord) my -= 1.5;
  const mn = Math.hypot(mx, my) || 1;
  mx /= mn;
  my /= mn;
  souris.angle = Math.atan2(my, mx);
  const nx = souris.x + mx * vitesseSouris * dt;
  const ny = souris.y + my * vitesseSouris * dt;
  if (!collideObstacle(nx, ny, RAYON_SOURIS)) {
    souris.x = nx;
    souris.y = ny;
  } else {
    souris.t += 1.2;
  }
  souris.x = Math.max(RAYON_SOURIS, Math.min(W - RAYON_SOURIS, souris.x));
  souris.y = Math.max(70, Math.min(H - RAYON_SOURIS, souris.y));

  if (Math.hypot(chat.x - souris.x, chat.y - souris.y) < RAYON_CHAT + RAYON_SOURIS - 6) {
    attraperSouris();
  }

  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vie -= dt;
    if (p.vie <= 0) particules.splice(i, 1);
  }
}

function attraperSouris() {
  etat.score++;
  bip(660 + etat.score * 30, 0.12);
  setTimeout(() => bip(880 + etat.score * 20, 0.15), 90);
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 60 + Math.random() * 140;
    particules.push({
      x: souris.x,
      y: souris.y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      vie: 0.5 + Math.random() * 0.4,
      emoji: ["✨", "⭐", "💛"][Math.floor(Math.random() * 3)]
    });
  }
  const ancienNiveau = etat.niveau;
  etat.niveau = Math.floor(etat.score / CATCH_PAR_NIVEAU);
  if (etat.niveau !== ancienNiveau) {
    const env = ENVIRONNEMENTS[etat.niveau % ENVIRONNEMENTS.length];
    etat.message = "🌟 " + env.nom + " !";
    etat.messageTemps = 2.2;
    bip(520, 0.2);
    setTimeout(() => bip(780, 0.25), 150);
    genererNiveau();
  } else {
    positionnerSourisLoinDuChat();
  }
}

function dessiner() {
  const env = ENVIRONNEMENTS[etat.niveau % ENVIRONNEMENTS.length];
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, env.ciel[0]);
  grad.addColorStop(1, env.ciel[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const hauteurSol = H * 0.32;
  ctx.fillStyle = env.sol;
  ctx.fillRect(0, H - hauteurSol, W, hauteurSol);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, H - hauteurSol, W, 6);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const d of decor) {
    ctx.font = d.taille + "px serif";
    ctx.fillText(d.emoji, d.x, d.y);
  }

  for (const o of obstacles) {
    ctx.fillStyle = env.couleurObjet;
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 10);
    ctx.fill();
    ctx.font = Math.min(o.w, o.h) * 0.7 + "px serif";
    ctx.fillText(o.emoji, o.x + o.w / 2, o.y + o.h / 2);
  }

  for (const p of particules) {
    ctx.globalAlpha = Math.max(0, p.vie * 1.6);
    ctx.font = "18px serif";
    ctx.fillText(p.emoji, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  if (etat.mode !== "menu") {
    ctx.save();
    ctx.translate(souris.x, souris.y);
    ctx.rotate(souris.angle);
    ctx.font = RAYON_SOURIS * 2 + "px serif";
    ctx.fillText("🐭", 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(chat.x, chat.y);
    ctx.rotate(chat.angle);
    ctx.font = RAYON_CHAT * 2 + "px serif";
    ctx.fillText("🐱", 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.roundRect(10, 10, 230, 52, 12);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("🐭 " + etat.score + "   ⏱️ " + Math.ceil(etat.tempsRestant) + "s", 22, 30);
  ctx.font = "14px sans-serif";
  ctx.fillText("📍 " + env.nom, 22, 52);

  if (etat.messageTemps > 0 && etat.mode === "jouer") {
    ctx.globalAlpha = Math.min(1, etat.messageTemps);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold " + Math.min(34, W / 12) + "px sans-serif";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 5;
    ctx.strokeText(etat.message, W / 2, H * 0.3);
    ctx.fillText(etat.message, W / 2, H * 0.3);
    ctx.globalAlpha = 1;
  }

  if (touches.actif && etat.mode === "jouer") {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(touches.x, touches.y, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(touches.x, touches.y, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

let dernierTemps = performance.now();
function boucle(temps) {
  const dt = Math.min((temps - dernierTemps) / 1000, 0.05);
  dernierTemps = temps;
  if (etat.mode === "jouer") mettreAJour(dt);
  dessiner();
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

window.addEventListener("keydown", (e) => {
  touchesClavier[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  touchesClavier[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false;
});

function touchStart(x, y) {
  touches.actif = true;
  touches.x = x;
  touches.y = y;
}
function touchMove(x, y) {
  if (touches.actif) {
    touches.x = x;
    touches.y = y;
  }
}
function touchEnd() {
  touches.actif = false;
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  touchStart(t.clientX, t.clientY);
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  touchMove(t.clientX, t.clientY);
}, { passive: false });
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  touchEnd();
}, { passive: false });
canvas.addEventListener("touchcancel", touchEnd);

canvas.addEventListener("mousedown", (e) => touchStart(e.clientX, e.clientY));
window.addEventListener("mousemove", (e) => touchMove(e.clientX, e.clientY));
window.addEventListener("mouseup", touchEnd);

document.getElementById("btnJouer").addEventListener("click", demarrerPartie);
document.getElementById("btnRejouer").addEventListener("click", demarrerPartie);
