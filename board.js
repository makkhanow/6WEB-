'use strict';
/* Task 2 – Option A: Kanban board of BJJ techniques */
(function () {

const DOING_LIMIT = 3;
const STATUSES = [
  { key: 'todo',  title: 'To learn' },
  { key: 'doing', title: 'Drilling' },
  { key: 'done',  title: 'Mastered' }
];
const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' };

// id: number, title: string, tag: string, priority: number, minutes: number, gi: boolean, status: string
const techniques = [
  { id: 1,  title: 'Armbar from closed guard',  tag: 'submission', priority: 1, minutes: 20, gi: false, status: 'doing' },
  { id: 2,  title: 'Triangle choke',            tag: 'submission', priority: 1, minutes: 25, gi: false, status: 'todo' },
  { id: 3,  title: 'Scissor sweep',             tag: 'guard',      priority: 2, minutes: 15, gi: false, status: 'done' },
  { id: 4,  title: 'Knee slice pass',           tag: 'passing',    priority: 1, minutes: 20, gi: false, status: 'todo' },
  { id: 5,  title: 'Collar choke from mount',   tag: 'submission', priority: 2, minutes: 15, gi: true,  status: 'todo' },
  { id: 6,  title: 'Elbow escape from mount',   tag: 'escape',     priority: 1, minutes: 10, gi: false, status: 'done' },
  { id: 7,  title: 'Double leg takedown',       tag: 'takedown',   priority: 2, minutes: 20, gi: false, status: 'todo' },
  { id: 8,  title: 'De la Riva guard',          tag: 'guard',      priority: 3, minutes: 30, gi: true,  status: 'todo' },
  { id: 9,  title: 'Kimura from side control',  tag: 'submission', priority: 2, minutes: 15, gi: false, status: 'doing' },
  { id: 10, title: 'Bridge and roll escape',    tag: 'escape',     priority: 2, minutes: 10, gi: false, status: 'todo' },
  { id: 11, title: 'Torreando pass',            tag: 'passing',    priority: 3, minutes: 20, gi: false, status: 'todo' },
  { id: 12, title: 'Single leg X guard sweep',  tag: 'guard',      priority: 3, minutes: 25, gi: false, status: 'todo' }
];

const view = { search: '', tag: 'all', sort: 'priority' };

const columnsBox = document.getElementById('board-columns');
const searchInput = document.getElementById('search');
const tagSelect = document.getElementById('filter-tag');
const sortSelect = document.getElementById('sort');
const messageBox = document.getElementById('board-msg');
const emptyBox = document.getElementById('board-empty');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');

function showMessage(text, kind) {
  messageBox.textContent = text;
  messageBox.className = 'status' + (kind ? ' status--' + kind : '');
}

// our own loop: how many cards have a given status
function countStatus(key) {
  let n = 0;
  for (let i = 0; i < techniques.length; i++) {
    if (techniques[i].status === key) {
      n++;
    }
  }
  return n;
}

// our own loop: finished cards and their total minutes
function doneStats() {
  let done = 0;
  let minutes = 0;
  for (const t of techniques) {
    if (t.status === 'done') {
      done++;
      minutes += t.minutes;
    }
  }
  return { done: done, minutes: minutes };
}

function findById(id) {
  for (const t of techniques) {
    if (t.id === id) {
      return t;
    }
  }
  return null;
}

function getVisible() {
  const q = view.search.trim().toLowerCase();
  const list = techniques.filter(function (t) {
    const tagOk = view.tag === 'all' || t.tag === view.tag;
    const textOk = q === '' || t.title.toLowerCase().includes(q);
    return tagOk && textOk;
  });
  list.sort(function (a, b) {
    if (view.sort === 'title') { return a.title.localeCompare(b.title); }
    if (view.sort === 'minutes') { return b.minutes - a.minutes; }
    return a.priority - b.priority || a.title.localeCompare(b.title);
  });
  return list;
}

function makeButton(label, action, id, ariaLabel, disabled) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.dataset.action = action;
  b.dataset.id = String(id);
  b.setAttribute('aria-label', ariaLabel);
  b.disabled = disabled;
  return b;
}

function makeCard(t, colIndex) {
  const card = document.createElement('article');
  card.className = 'card card--p' + t.priority;

  const title = document.createElement('h4');
  title.textContent = t.title;

  const meta = document.createElement('p');
  meta.className = 'meta';
  const parts = [t.tag, PRIORITY_LABELS[t.priority] + ' priority', t.minutes + ' min'];
  if (t.gi) { parts.push('gi only'); }
  meta.textContent = parts.join(' · ');

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  actions.appendChild(makeButton('←', 'left', t.id, 'Move “' + t.title + '” back', colIndex === 0));
  actions.appendChild(makeButton('→', 'right', t.id, 'Move “' + t.title + '” forward', colIndex === STATUSES.length - 1));

  card.append(title, meta, actions);
  return card;
}

// the ONLY function that draws the page; called after every change
function render() {
  const visible = getVisible();
  columnsBox.replaceChildren();

  STATUSES.forEach(function (status, colIndex) {
    const col = document.createElement('section');
    col.className = 'column column--' + status.key;

    const inCol = visible.filter(function (t) { return t.status === status.key; });
    const head = document.createElement('h3');
    const total = countStatus(status.key);
    head.textContent = status.title + ' (' + total + (status.key === 'doing' ? '/' + DOING_LIMIT : '') + ')';
    col.appendChild(head);

    if (inCol.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Nothing here.';
      col.appendChild(empty);
    }
    for (const t of inCol) {
      col.appendChild(makeCard(t, colIndex));
    }
    columnsBox.appendChild(col);
  });

  emptyBox.hidden = visible.length !== 0;

  const stats = doneStats();
  progressBar.max = techniques.length;
  progressBar.value = stats.done;
  progressText.textContent = stats.done + ' of ' + techniques.length + ' (' + stats.minutes + ' min of drilling banked)';
}

function move(id, direction) {
  const t = findById(id);
  if (t === null) { return; }
  const from = STATUSES.findIndex(function (s) { return s.key === t.status; });
  const to = from + direction;
  if (to < 0 || to >= STATUSES.length) { return; }

  const target = STATUSES[to].key;
  if (target === 'doing' && countStatus('doing') >= DOING_LIMIT) {
    showMessage('Blocked: “Drilling” already has ' + DOING_LIMIT + ' techniques. Finish one first.', 'error');
    return;
  }
  t.status = target;                // change the data first ...
  showMessage('Moved “' + t.title + '” to ' + STATUSES[to].title + '.', 'ok');
  render();                         // ... then draw it
}

// ONE listener for the buttons of all cards (event delegation)
columnsBox.addEventListener('click', function (event) {
  const btn = event.target.closest('button[data-action]');
  if (btn === null) { return; }
  move(Number(btn.dataset.id), btn.dataset.action === 'right' ? 1 : -1);
});

searchInput.addEventListener('input', function () { view.search = searchInput.value; render(); });
tagSelect.addEventListener('change', function () { view.tag = tagSelect.value; render(); });
sortSelect.addEventListener('change', function () { view.sort = sortSelect.value; render(); });

// fill the tag filter from the data
(function fillTags() {
  const seen = [];
  for (const t of techniques) {
    if (!seen.includes(t.tag)) { seen.push(t.tag); }
  }
  for (const tag of seen) {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    tagSelect.appendChild(opt);
  }
})();

render();
})();
