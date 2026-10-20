'use strict';
/* Task 3 – Option A: ticket builder with live validation */
(function () {

const MAX_QTY = 10;
const EVENTS = [
  { id: 'open-mat',  name: 'Open Mat',                soldOut: ['2026-11-21'] },
  { id: 'seminar',   name: 'Guest Seminar: Leg Locks', soldOut: ['2026-11-28', '2026-12-05'] },
  { id: 'promotion', name: 'Belt Promotion Day',       soldOut: ['2026-12-12'] }
];
const TICKET_TYPES = [
  { id: 'spectator', label: 'Spectator',            price: 2000,  seats: 12 },
  { id: 'mat',       label: 'Mat pass',             price: 6000,  seats: 8 },
  { id: 'vip',       label: 'Mat pass + rashguard', price: 10000, seats: 3 }
];
const PROMOS = [
  { code: 'BJJ10',  discount: 0.10 },
  { code: 'BLUE15', discount: 0.15 },
  { code: 'OSS20',  discount: 0.20 }
];
const BLOCKED_DOMAINS = ['mailinator.com', 'tempmail.com', '10minutemail.com'];
const SATURDAY = 6;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

const form = document.getElementById('booking-form');
form.noValidate = true;            // browser bubbles off, HTML attributes stay

const f = {
  event: document.getElementById('event'),
  date: document.getElementById('date'),
  type: document.getElementById('type'),
  qty: document.getElementById('qty'),
  name: document.getElementById('name'),
  email: document.getElementById('email'),
  promo: document.getElementById('promo')
};
const fields = [f.event, f.date, f.type, f.qty, f.name, f.email, f.promo];
const summary = document.getElementById('form-summary');
const qtyHint = document.getElementById('qty-hint');
const resultBox = document.getElementById('ticket-result');
const touched = new Set();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function findEvent(id) { return EVENTS.find(function (e) { return e.id === id; }) || null; }
function findType(id) { return TICKET_TYPES.find(function (t) { return t.id === id; }) || null; }
function findPromo(code) {
  const c = code.trim().toUpperCase();
  return PROMOS.find(function (p) { return p.code === c; }) || null;
}
function money(n) { return Math.round(n).toLocaleString('en-US') + ' ₸'; }
function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

/* ---------- rules: each returns an error text or '' ---------- */
const rules = {
  event: function (el) {
    return el.validity.valueMissing ? 'Choose an event.' : '';
  },
  date: function (el) {
    if (el.validity.valueMissing || el.validity.badInput) { return 'Pick a date.'; }
    if (el.validity.rangeUnderflow) { return 'The date cannot be in the past.'; }
    const day = new Date(el.value + 'T00:00:00').getDay();
    if (day !== SATURDAY) { return 'Events take place on Saturdays only.'; }          // custom rule 1
    const ev = findEvent(f.event.value);
    if (ev !== null && ev.soldOut.includes(el.value)) {                               // custom rule 2
      return 'This date is sold out for “' + ev.name + '”.';
    }
    return '';
  },
  type: function (el) {
    return el.validity.valueMissing ? 'Choose a ticket type.' : '';
  },
  qty: function (el) {
    if (el.validity.valueMissing || el.validity.badInput) { return 'Enter how many tickets you need.'; }
    if (el.validity.stepMismatch) { return 'Use a whole number.'; }
    if (el.validity.rangeUnderflow) { return 'At least 1 ticket.'; }
    if (el.validity.rangeOverflow) { return 'No more than ' + MAX_QTY + ' tickets per booking.'; }
    const type = findType(f.type.value);
    if (type !== null && Number(el.value) > type.seats) {                              // custom rule 3
      return type.seats === 0 ? 'This ticket type is sold out.' : 'Only ' + type.seats + ' seat(s) left for “' + type.label + '”.';
    }
    return '';
  },
  name: function (el) {
    if (el.validity.valueMissing) { return 'Enter your name.'; }
    if (el.validity.tooShort) { return 'The name is too short.'; }
    const words = el.value.trim().split(/\s+/);
    const lettersOnly = words.every(function (w) { return /^[\p{L}'-]{2,}$/u.test(w); });
    if (words.length < 2 || !lettersOnly) {                                            // custom rule 4
      return 'Enter first and last name (letters only, 2+ letters each).';
    }
    return '';
  },
  email: function (el) {
    if (el.validity.valueMissing) { return 'Enter your email.'; }
    if (el.validity.typeMismatch) { return 'Enter a valid email like name@example.com.'; }
    const domain = el.value.trim().toLowerCase().split('@')[1];
    if (BLOCKED_DOMAINS.includes(domain)) { return 'Disposable email addresses are not accepted.'; }  // custom rule 5
    return '';
  },
  promo: function (el) {
    if (el.value.trim() === '') { return ''; }
    return findPromo(el.value) === null ? 'Unknown promo code.' : '';                  // custom rule 6
  }
};

function showError(el, message) {
  const box = document.getElementById(el.id + '-error');
  box.textContent = message;
  el.setAttribute('aria-invalid', message === '' ? 'false' : 'true');
  el.classList.toggle('invalid', message !== '');
  el.classList.toggle('valid', message === '' && el.value.trim() !== '');
}

function checkField(el) {
  const message = rules[el.name](el);
  showError(el, message);
  return message === '';
}

function recheckIfTouched(el) {
  if (touched.has(el)) { checkField(el); }
}

/* ---------- live preview ---------- */
function discountFor(promoValue) {
  const p = findPromo(promoValue);
  return p === null ? 0 : p.discount;
}

function updatePreview() {
  const ev = findEvent(f.event.value);
  const type = findType(f.type.value);
  const qty = Number(f.qty.value);
  const promo = findPromo(f.promo.value);
  const dash = '—';
  document.getElementById('pv-event').textContent = ev ? ev.name : dash;
  document.getElementById('pv-date').textContent = f.date.value || dash;
  document.getElementById('pv-type').textContent = type ? type.label + ' (' + money(type.price) + ')' : dash;
  document.getElementById('pv-qty').textContent = qty > 0 ? String(qty) : dash;
  document.getElementById('pv-name').textContent = f.name.value.trim() || dash;
  document.getElementById('pv-email').textContent = f.email.value.trim() || dash;
  document.getElementById('pv-promo').textContent = promo ? promo.code + ' (−' + Math.round(promo.discount * 100) + '%)' : dash;
  const total = type && qty > 0 ? type.price * qty * (1 - discountFor(f.promo.value)) : 0;
  document.getElementById('pv-total').textContent = total > 0 ? money(total) : dash;

  qtyHint.textContent = type ? 'Seats left for this ticket type: ' + type.seats : '';
}

/* ---------- build the form lists from the data ---------- */
function fillSelect(select, placeholder, items, label) {
  select.replaceChildren();
  const first = document.createElement('option');
  first.value = '';
  first.textContent = placeholder;
  select.appendChild(first);
  for (const item of items) {
    const o = document.createElement('option');
    o.value = item.id;
    o.textContent = label(item);
    select.appendChild(o);
  }
}
function fillLists() {
  const keepType = f.type.value;
  fillSelect(f.event, 'Choose an event', EVENTS, function (e) { return e.name; });
  fillSelect(f.type, 'Choose a ticket type', TICKET_TYPES, function (t) {
    return t.label + ' — ' + money(t.price) + ' (' + t.seats + ' left)';
  });
  f.type.value = keepType;
}

/* ---------- events ---------- */
fields.forEach(function (el) {
  el.addEventListener('blur', function () {
    touched.add(el);
    checkField(el);
  });
  const evt = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(evt, function () {
    updatePreview();
    recheckIfTouched(el);
    if (el === f.event) { recheckIfTouched(f.date); }                // sold-out dates depend on the event
    if (el === f.type) { recheckIfTouched(f.qty); }                  // seats depend on the type
  });
});

form.addEventListener('submit', function (event) {
  event.preventDefault();
  let firstInvalid = null;
  let errors = 0;
  fields.forEach(function (el) {
    touched.add(el);
    if (!checkField(el)) {
      errors++;
      if (firstInvalid === null) { firstInvalid = el; }
    }
  });

  if (errors > 0) {
    summary.hidden = false;
    summary.textContent = errors + (errors === 1 ? ' error' : ' errors') + ' found. Please fix the highlighted fields.';
    firstInvalid.focus();
    return;
  }
  summary.hidden = true;
  summary.textContent = '';
  bookTicket();
});

function makeCode() {
  let code = 'BJJ-';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randInt(0, CODE_ALPHABET.length - 1)];
  }
  return code;
}

function bookTicket() {
  const ev = findEvent(f.event.value);
  const type = findType(f.type.value);
  const qty = Number(f.qty.value);
  const total = type.price * qty * (1 - discountFor(f.promo.value));
  const data = [
    ['Event', ev.name], ['Date', f.date.value], ['Ticket', type.label + ' × ' + qty],
    ['Name', f.name.value.trim()], ['Total', money(total)]
  ];

  type.seats -= qty;                         // update the data first

  const ticket = document.createElement('article');
  ticket.className = 'ticket';
  const title = document.createElement('h4');
  title.textContent = 'Booking confirmed';
  const code = document.createElement('p');
  code.className = 'code';
  code.textContent = makeCode();
  ticket.append(title, code);
  for (const row of data) {
    const p = document.createElement('p');
    p.textContent = row[0] + ': ' + row[1];
    ticket.appendChild(p);
  }
  resultBox.replaceChildren(ticket);

  form.reset();
  touched.clear();
  fields.forEach(function (el) { showError(el, ''); el.classList.remove('valid'); });
  fillLists();
  updatePreview();
}

/* ---------- start ---------- */
f.date.min = todayIso();
fillLists();
updatePreview();
})();
