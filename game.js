'use strict';
/* Task 1 – Option B: turn-based battle (a sparring round) */
(function () {

// ---- all game numbers live here ----
const MAX_HP = 100;
const ATTACK_MIN = 8;
const ATTACK_MAX = 15;
const ENEMY_MIN = 5;
const ENEMY_MAX = 14;
const HEAL_AMOUNT = 20;
const MAX_HEALS = 3;
const CRIT_CHANCE = 0.1;      // 10 %
const CRIT_MULTIPLIER = 2;
const DEFEND_DIVISOR = 2;     // defending halves the next hit
const LOG_SIZE = 5;

const ui = {
  heroBar: document.getElementById('hero-hp'),
  enemyBar: document.getElementById('enemy-hp'),
  heroText: document.getElementById('hero-hp-text'),
  enemyText: document.getElementById('enemy-hp-text'),
  status: document.getElementById('game-status'),
  log: document.getElementById('game-log'),
  attack: document.getElementById('btn-attack'),
  defend: document.getElementById('btn-defend'),
  heal: document.getElementById('btn-heal'),
  restart: document.getElementById('btn-restart')
};

let state;

// whole number from min to max, both included
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollCrit() {
  return Math.random() < CRIT_CHANCE;
}

function newGame() {
  state = { heroHp: MAX_HP, enemyHp: MAX_HP, healsLeft: MAX_HEALS, defending: false, over: false, log: [] };
  setStatus('Round started. Your move!', '');
  render();
}

function setStatus(text, kind) {
  ui.status.textContent = text;
  ui.status.className = 'status' + (kind ? ' status--' + kind : '');
}

function addLog(text, kind) {
  state.log.unshift({ text: text, kind: kind });
  if (state.log.length > LOG_SIZE) {
    state.log.length = LOG_SIZE;
  }
}

// invalid move: message only, the state is NOT changed
function reject(message) {
  setStatus(message, 'error');
}

function heroAttack() {
  let dmg = randInt(ATTACK_MIN, ATTACK_MAX);
  const crit = rollCrit();
  if (crit) {
    dmg *= CRIT_MULTIPLIER;
  }
  state.enemyHp = Math.max(0, state.enemyHp - dmg);
  addLog(crit ? 'CRITICAL! You hit for ' + dmg : 'You attack for ' + dmg, crit ? 'crit' : 'hero');
}

function enemyTurn() {
  let dmg = randInt(ENEMY_MIN, ENEMY_MAX);
  const crit = rollCrit();
  let note = '';
  if (crit) {
    dmg *= CRIT_MULTIPLIER;
  }
  if (state.defending === true) {
    dmg = Math.floor(dmg / DEFEND_DIVISOR);
    state.defending = false;
    note = ' (halved by your defense)';
  }
  state.heroHp = Math.max(0, state.heroHp - dmg);
  addLog((crit ? 'CRITICAL! Opponent hits for ' : 'Opponent hits for ') + dmg + note, crit ? 'crit' : 'enemy');
}

function checkEnd() {
  if (state.enemyHp === 0 && state.heroHp === MAX_HP) {
    state.over = true;
    setStatus('Flawless victory! The opponent taps out and you took no damage.', 'win');
  } else if (state.enemyHp === 0 && state.heroHp > 0) {
    state.over = true;
    setStatus('You win! The opponent taps out.', 'win');
  } else if (state.heroHp === 0 || state.enemyHp === 0) {
    state.over = true;
    setStatus('You tapped out. Press “New round” to try again.', 'loss');
  }
}

function play(action) {
  if (state.over === true) {
    reject('The round is over. Press “New round”.');
    return;
  }
  if (action === 'heal' && (state.healsLeft === 0 || state.heroHp === MAX_HP)) {
    reject(state.healsLeft === 0 ? 'No breaths left.' : 'You are already at full HP.');
    return;
  }

  if (action === 'attack') {
    heroAttack();
  } else if (action === 'defend') {
    state.defending = true;
    addLog('You defend: the next hit is halved', 'hero');
  } else if (action === 'heal') {
    const before = state.heroHp;
    state.heroHp = Math.min(MAX_HP, state.heroHp + HEAL_AMOUNT);
    state.healsLeft -= 1;
    addLog('You catch your breath: +' + (state.heroHp - before) + ' HP', 'heal');
  }

  if (state.enemyHp > 0) {
    enemyTurn();
  }
  setStatus('Your move.', '');
  checkEnd();
  render();
}

function render() {
  ui.heroBar.max = MAX_HP;
  ui.enemyBar.max = MAX_HP;
  ui.heroBar.value = state.heroHp;
  ui.enemyBar.value = state.enemyHp;
  ui.heroText.textContent = state.heroHp + ' / ' + MAX_HP;
  ui.enemyText.textContent = state.enemyHp + ' / ' + MAX_HP;
  ui.attack.textContent = 'Attack (' + ATTACK_MIN + '–' + ATTACK_MAX + ')';
  ui.defend.textContent = 'Defend (halves next hit)';
  ui.heal.textContent = 'Catch breath +' + HEAL_AMOUNT + ' (' + state.healsLeft + ' left)';
  ui.attack.disabled = state.over;
  ui.defend.disabled = state.over;
  ui.heal.disabled = state.over;

  ui.log.replaceChildren();
  for (const entry of state.log) {
    const li = document.createElement('li');
    li.textContent = entry.text;
    li.className = 'log--' + entry.kind;
    ui.log.appendChild(li);
  }
  if (state.log.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No actions yet.';
    li.className = 'log--empty';
    ui.log.appendChild(li);
  }
}

ui.attack.addEventListener('click', function () { play('attack'); });
ui.defend.addEventListener('click', function () { play('defend'); });
ui.heal.addEventListener('click', function () { play('heal'); });
ui.restart.addEventListener('click', newGame);

newGame();
})();
