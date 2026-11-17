// =====================================================================
// quiz.js - Capsule style quiz (before sign-up)
// ---------------------------------------------------------------------
// How it works:
//   1. QUESTIONS below is the only thing you edit to change the quiz.
//   2. render() draws the current question into quiz.html.
//   3. Clicking a card toggles it; Next/Back move between questions.
//   4. Answers are kept in sessionStorage so they survive a refresh and
//      can be sent to the server when the user creates an account.
// =====================================================================

// ---------------------------------------------------------------------
// Quiz content
// ---------------------------------------------------------------------
// Each question:
//   id           -> key used in the saved answers object
//   title        -> big heading; wrap words in *stars* to set them in italic
//   sub          -> helper line under the heading
//   noun         -> what the cards are, for "8 PALETTES · TAP ANY THAT FIT"
//   profileTitle -> row title in the "Coming up" list
//   category     -> short tag shown at the end of that row
//   why          -> small "Why we ask" note (optional)
//   caption      -> line under the card grid (optional)
//   otherHint    -> text on the "Something else" card
//   multi        -> true = pick many, false = pick exactly one
//   allowOther   -> true = add a "Something else" card with a text box
//   options      -> { value, label, image } (image optional; a grey
//                   placeholder shows until you add one in public/images/)
//
// Content comes from the Figma frames "Style quiz 01 - Vibes" to
// "Style quiz 07 - Occasions".

// Builds the 8 options for a question whose photos live in
// public/images/quiz/<folder>/<label-in-kebab-case>.png
function photoOptions(folder, labels) {
  return labels.map(label => {
    const value = label.toLowerCase().replace(/\s+/g, '-');
    return { value, label, image: `images/quiz/${folder}/${value}.png` };
  });
}

// Same caption under every question's photos (matches question 1)
const CAPTION = 'Example photos: After sign-up. Capsule styles the clothes you actually own.';
// "Something else" text, worded like question 1's ("Describe your vibe ...")
const otherHint = thing => `Not listed? Describe your ${thing} in a few words`;

const QUESTIONS = [
  {
    id: 'vibes',
    title: 'Which vibes feel *like you*?',
    sub: 'Pick as many as you like. This teaches us your taste.',
    noun: 'styles',
    category: 'Vibes',
    why: 'Why we ask: Capsule matches these vibes to the pieces already in your closet, so your first outfit ideas feel like you.',
    caption: CAPTION,
    otherHint: otherHint('vibe'),
    multi: true,
    allowOther: true,
    options: photoOptions('vibes', ['Minimal', 'Business', 'Boho', 'Streetwear',
      'Athleisure', 'Gothic', 'Coquette', 'Y2k'])
  },
  {
    id: 'palette',
    title: 'Which colors feel *like you*?',
    sub: 'Pick as many as you like. These guide your colors.',
    noun: 'palettes',
    profileTitle: 'Your color palette',
    category: 'Palette',
    why: 'Why we ask: Your favorite colors help us suggest combinations you’ll actually want to wear.',
    caption: CAPTION,
    otherHint: otherHint('colors'),
    multi: true,
    allowOther: true,
    options: photoOptions('palette', ['Neutrals', 'Earthy', 'Pastels', 'Jewel tones',
      'Monochrome', 'Brights', 'Cool tones', 'Warm tones'])
  },
  {
    id: 'fits',
    title: 'Which shapes feel *right*?',
    sub: 'Pick as many as you like. There’s no wrong shape.',
    noun: 'fits',
    profileTitle: 'Your favorite fits',
    category: 'Fit',
    why: 'Why we ask: Your preferred silhouettes help us balance proportions in every outfit.',
    caption: CAPTION,
    otherHint: otherHint('fit'),
    multi: true,
    allowOther: true,
    options: photoOptions('fits', ['Relaxed', 'Tailored', 'Oversized', 'Fitted',
      'Wide-leg', 'Cropped', 'Flowing', 'Structured'])
  },
  {
    id: 'textures',
    title: 'Which textures *draw you in*?',
    sub: 'Pick as many as you like. Think of what you wear.',
    noun: 'textures',
    profileTitle: 'Your go-to textures',
    category: 'Fabric',
    why: 'Why we ask: Texture preferences help us combine pieces that feel as good as they look.',
    caption: CAPTION,
    otherHint: otherHint('textures'),
    multi: true,
    allowOther: true,
    options: photoOptions('textures', ['Linen', 'Denim', 'Knitwear', 'Silk',
      'Leather', 'Cotton', 'Velvet', 'Tweed'])
  },
  {
    id: 'prints',
    title: 'Which prints *catch your eye*?',
    sub: 'Pick as many as you like. Subtle or bold, all count.',
    noun: 'prints',
    profileTitle: 'Your kind of prints',
    category: 'Pattern',
    why: 'Why we ask: Your favorite prints help us make outfits as expressive or understated as you like.',
    caption: CAPTION,
    otherHint: otherHint('prints'),
    multi: true,
    allowOther: true,
    options: photoOptions('prints', ['Stripes', 'Florals', 'Checks', 'Animal print',
      'Polka dots', 'Abstract', 'Gingham', 'Solid colors'])
  },
  {
    id: 'shoes',
    title: 'Which shoes *finish the look*?',
    sub: 'Pick as many as you like. Everyday or special.',
    noun: 'pairs',
    profileTitle: 'Your everyday shoes',
    category: 'Shoes',
    why: 'Why we ask: Your go-to shoes help us build complete looks from the ground up.',
    caption: CAPTION,
    otherHint: otherHint('shoes'),
    multi: true,
    allowOther: true,
    options: photoOptions('shoes', ['Sneakers', 'Loafers', 'Ankle boots', 'Ballet flats',
      'Heels', 'Sandals', 'Tall boots', 'Mary Janes'])
  },
  {
    id: 'moments',
    title: 'What are you *dressing for*?',
    sub: 'Pick as many as you like. Think about your week.',
    noun: 'moments',
    profileTitle: 'Your daily moments',
    category: 'Lifestyle',
    why: 'Why we ask: Your routine helps us suggest outfits that fit your life, not just your mood.',
    caption: CAPTION,
    otherHint: otherHint('week'),
    multi: true,
    allowOther: true,
    options: photoOptions('moments', ['Office days', 'Coffee runs', 'Dinner dates', 'Weekend walks',
      'Evenings out', 'Travel days', 'Celebrations', 'Slow Sundays'])
  }
];

// Where the thank-you pop-up sends people after the last question
const CLOSET_URL = '/app/closet';   // logged in
const SIGNUP_URL = 'register.html'; // not logged in yet
const STORAGE_KEY = 'capsule.quiz';
const OTHER = '__other';      // value saved when "Something else" is picked
const UPCOMING_MAX = 4;       // rows shown under "Coming up"

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
// answers looks like: { vibes: ['minimal', '__other'], q2: ['a'], ... }
// other   looks like: { vibes: 'quiet luxury' }
const state = loadState() || { step: 0, answers: {}, other: {} };
state.other = state.other || {};
if (!(state.step >= 0 && state.step < QUESTIONS.length)) state.step = 0;

function loadState() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}

function saveState() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* private mode etc. - the quiz still works, it just won't persist */ }
}

// ---------------------------------------------------------------------
// Page elements
// ---------------------------------------------------------------------
const $ = id => document.getElementById(id);
const el = {
  step: $('quiz-step'), progress: $('quiz-progress'),
  eyebrow: $('quiz-eyebrow'), title: $('quiz-title'), sub: $('quiz-sub'),
  picks: $('quiz-picks'),
  upcomingBlock: $('quiz-upcoming-block'), upcomingLabel: $('quiz-upcoming-label'),
  upcoming: $('quiz-upcoming'),
  why: $('quiz-why'), whyText: $('quiz-why-text'),
  count: $('quiz-count'), grid: $('quiz-grid'), caption: $('quiz-caption'),
  hint: $('quiz-hint'), back: $('quiz-back'), next: $('quiz-next'), nextLabel: $('quiz-next-label')
};

const pad = n => String(n).padStart(2, '0');

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "Which vibes feel *like you*?" -> Which vibes feel <em>like you</em>?
function titleHtml(text) {
  return escapeHtml(text).replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Selected-state check mark drawn on top of the circle
const CHECK_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M3 8.5l3.2 3L13 4.5" stroke="#0e0e0e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function render() {
  const total = QUESTIONS.length;
  const q = QUESTIONS[state.step];
  const picked = state.answers[q.id] || [];
  const isLast = state.step === total - 1;

  // Header + segmented progress
  el.step.textContent = `Style quiz  · Step ${state.step + 1} of ${total}`;
  el.progress.innerHTML = QUESTIONS
    .map((_, i) => `<span${i <= state.step ? ' class="is-done"' : ''}></span>`).join('');
  el.progress.setAttribute('aria-valuemax', total);
  el.progress.setAttribute('aria-valuenow', state.step + 1);

  // Question text
  el.eyebrow.textContent = `Question ${state.step + 1} of ${total}`;
  el.title.innerHTML = titleHtml(q.title);
  el.sub.textContent = q.sub;

  renderPicks(q, picked);
  renderUpcoming(q);
  renderGrid(q, picked);

  // Footer
  const ready = picked.length > 0;
  el.back.disabled = state.step === 0;
  el.next.disabled = !ready;
  el.nextLabel.textContent = isLast ? 'Finish' : 'Next';
  el.hint.textContent = ready
    ? `${picked.length} selected`
    : (q.multi ? 'Pick at least one to continue' : 'Pick one to continue');
}

function labelFor(q, value) {
  if (value === OTHER) return state.other[q.id] || 'Something else';
  const opt = q.options.find(o => o.value === value);
  return opt ? opt.label : value;
}

// "Your picks" chips - clicking one removes it
function renderPicks(q, picked) {
  el.picks.innerHTML = '';
  if (!picked.length) {
    el.picks.innerHTML = '<p class="quiz-picks-empty">Nothing picked yet</p>';
    return;
  }
  picked.forEach(value => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'quiz-pick';
    chip.textContent = labelFor(q, value);
    chip.setAttribute('aria-label', `Remove ${chip.textContent}`);
    chip.addEventListener('click', () => toggle(q, value));
    el.picks.appendChild(chip);
  });
}

// "Coming up" list under the picks - the same on every question, like
// question 1: the next questions (up to 4), numbered by question number.
// On the last question there is nothing left, so it shows a finish note.
// The list keeps a fixed height in quiz.css so the buttons never move.
function renderUpcoming(q) {
  const rows = QUESTIONS.slice(state.step + 1, state.step + 1 + UPCOMING_MAX)
    .map((nq, i) => ({ num: state.step + 2 + i, q: nq }));

  el.upcomingLabel.textContent = 'Coming up';
  el.upcoming.innerHTML = rows.length
    ? rows.map(row => `
    <li>
      <span class="quiz-up-num">${pad(row.num)}</span>
      <span class="quiz-up-title">${escapeHtml(row.q.profileTitle)}</span>
      <span class="quiz-up-cat">${escapeHtml(row.q.category || '')}</span>
    </li>`).join('')
    : `
    <li>
      <span class="quiz-up-num"></span>
      <span class="quiz-up-title">Last one. Tap Finish to save your picks.</span>
      <span class="quiz-up-cat"></span>
    </li>`;

  el.why.hidden = !q.why;
  el.whyText.textContent = q.why || '';
}

function renderGrid(q, picked) {
  const n = q.options.length;
  const noun = q.noun || 'options';
  el.count.textContent = q.multi
    ? `${n} ${noun} · Tap any that fit`
    : `${n} ${noun} · Pick one`;
  el.caption.textContent = q.caption || '';
  el.caption.hidden = !q.caption;

  el.grid.innerHTML = '';
  el.grid.setAttribute('role', q.multi ? 'group' : 'radiogroup');
  el.grid.setAttribute('aria-labelledby', 'quiz-title');

  q.options.forEach((opt, i) => {
    const card = makeCard(q, opt.value, picked.includes(opt.value));
    const img = opt.image
      ? `<img class="quiz-card-img" src="${opt.image}" alt="" loading="lazy">`
      : '';
    card.innerHTML = `${img}
      <span class="quiz-card-check" aria-hidden="true">
        <img src="images/quiz/circle-empty.svg" width="38" height="38" alt="">${CHECK_SVG}
      </span>
      <span class="quiz-card-label">
        <span class="quiz-card-name">${escapeHtml(opt.label)}</span>
        <span class="quiz-card-num">${pad(i + 1)}</span>
      </span>`;
    card.addEventListener('click', () => toggle(q, opt.value));
    el.grid.appendChild(card);
  });

  if (q.allowOther) el.grid.appendChild(makeOtherCard(q, picked.includes(OTHER)));
}

function makeCard(q, value, selected) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'quiz-card' + (selected ? ' is-selected' : '');
  if (q.multi) {
    card.setAttribute('aria-pressed', selected);
  } else {
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', selected);
  }
  return card;
}

// "Something else" card: a dashed card that reveals a text box when picked.
// It is a <div> (not a <button>) so the text box inside stays usable.
function makeOtherCard(q, selected) {
  const card = document.createElement('div');
  card.className = 'quiz-card quiz-card-other' + (selected ? ' is-selected' : '');
  card.tabIndex = 0;
  card.setAttribute('role', q.multi ? 'button' : 'radio');
  card.setAttribute(q.multi ? 'aria-pressed' : 'aria-checked', selected);

  card.innerHTML = `
    <span class="quiz-add" aria-hidden="true">
      <img src="images/quiz/add-ring.svg" width="70" height="70" alt="">
      <img class="quiz-add-icon" src="images/quiz/add.svg" width="24" height="24" alt="">
    </span>
    <span class="quiz-card-check" aria-hidden="true">
      <img src="images/quiz/circle-other.svg" width="38" height="38" alt="">${CHECK_SVG}
    </span>
    <span class="quiz-card-name">Something else</span>
    ${selected
      ? `<input class="quiz-other-input" type="text" maxlength="60"
           placeholder="Tell us in a few words" aria-label="Something else: tell us in a few words"
           value="${escapeHtml(state.other[q.id] || '')}">`
      : `<span class="quiz-other-hint">${escapeHtml(q.otherHint || otherHint('pick'))}</span>`}`;

  const input = card.querySelector('input');
  if (input) {
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('keydown', e => e.stopPropagation());
    input.addEventListener('input', () => {
      state.other[q.id] = input.value.trim();
      saveState();
      renderPicks(q, state.answers[q.id] || []);
    });
  }

  card.addEventListener('click', () => toggle(q, OTHER));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(q, OTHER); }
  });
  return card;
}

// ---------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------
function toggle(q, value) {
  const current = state.answers[q.id] || [];
  const adding = !current.includes(value);
  if (q.multi) {
    state.answers[q.id] = adding ? [...current, value] : current.filter(v => v !== value);
  } else {
    state.answers[q.id] = [value];
  }
  saveState();
  render();

  // Put the cursor in the text box right after picking "Something else"
  if (value === OTHER && adding) {
    const input = el.grid.querySelector('.quiz-other-input');
    if (input) input.focus();
  }
}

function goNext() {
  if (state.step < QUESTIONS.length - 1) {
    state.step++;
    saveState();
    render();
    window.scrollTo(0, 0);
  } else {
    finish();
  }
}

function goBack() {
  if (state.step > 0) {
    state.step--;
    saveState();
    render();
  }
}

// ---------------------------------------------------------------------
// Thank-you pop-up
// ---------------------------------------------------------------------
// Ask the server who is logged in as soon as the page opens, so the name
// is ready by the time Finish is tapped. /api/me answers 401 when nobody
// is logged in, which gives null here.
const whoIsLoggedIn = fetch('/api/me', { credentials: 'same-origin' })
  .then(res => (res.ok ? res.json() : null))
  .catch(() => null);

const done = {
  dialog: $('quiz-done'), bar: $('quiz-done-bar'),
  title: $('quiz-done-title'), text: $('quiz-done-text'),
  back: $('quiz-done-back'), login: $('quiz-done-login'),
  go: $('quiz-done-go'), goLabel: $('quiz-done-go-label')
};

// "sabrina" -> "sabrina’s"
const possessive = name => `${name}’s`;

async function showThankYou() {
  const user = await whoIsLoggedIn;
  const name = user && user.username;

  // A full progress bar: every question answered
  done.bar.innerHTML = QUESTIONS.map(() => '<span></span>').join('');

  // textContent (not innerHTML) so a username can never inject HTML
  if (name) {
    done.title.innerHTML = 'Thank you, <em></em>';
    done.title.querySelector('em').textContent = name;
    done.text.textContent =
      `Thank you for completing our quiz. Click the button below to go to ${possessive(name)} closet.`;
    done.goLabel.textContent = `Go to ${possessive(name)} closet`;
    done.go.href = CLOSET_URL;
    done.login.hidden = true;
  } else {
    // Not logged in yet: the closet needs an account, so offer sign-up / log in
    done.title.innerHTML = 'Thank <em>you!</em>';
    done.text.textContent =
      'Thank you for completing our quiz. Create your account (or log in) to go to your closet.';
    done.goLabel.textContent = 'Create account';
    done.go.href = SIGNUP_URL;
    done.login.hidden = false;
  }

  // showModal() dims the page, keeps Tab inside the pop-up and lets Esc close it
  if (typeof done.dialog.showModal === 'function') {
    done.dialog.showModal();
    done.go.focus();
  } else {
    window.location.href = done.go.href; // very old browsers: just go there
  }
}

done.back.addEventListener('click', () => done.dialog.close());
// Clicking the dimmed area outside the box also closes it
done.dialog.addEventListener('click', e => { if (e.target === done.dialog) done.dialog.close(); });

// Called after the last question.
// For now the answers stay in sessionStorage. TODO: once there is a
// POST /quiz route, send state.answers (and state.other) to the server.
function finish() {
  state.done = true;
  saveState();
  showThankYou();
}

el.next.addEventListener('click', goNext);
el.back.addEventListener('click', goBack);

// Start the quiz
render();
