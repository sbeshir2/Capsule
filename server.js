// =====================================================================
// server.js - Capsule register / login server with session support
// ---------------------------------------------------------------------
// Routes:
//   POST /register -> create an account (password stored as bcrypt hash)
//   POST /login    -> check credentials and start a session
//   GET  /profile  -> shows the logged-in user's username (needs a session)
//   GET  /logout   -> destroys the session and logs the user out
//
// Run:  npm install   then   node server.js
// Open: http://localhost:3000/register.html
// =====================================================================

require('dotenv').config();                 // loads DB_* and SESSION_SECRET from .env
const express = require('express');         // web framework
const session = require('express-session'); // session middleware (stores data per visitor)
const path = require('path');               // builds file paths that work on any OS
const bcrypt = require('bcryptjs');         // hashes and checks passwords
const pool = require('./db');               // MySQL connection pool (db.js)

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;                     // how much work bcrypt does per hash

// ---------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------

// Read form data (application/x-www-form-urlencoded) sent by the HTML forms
app.use(express.urlencoded({ extended: true }));

// Session setup.
// express-session gives each visitor a session ID stored in a cookie.
// Whatever we put on req.session (e.g. req.session.user) is kept on the
// server and is available on every later request from that browser.
app.use(session({
  name: 'capsule.sid',                                 // name of the session cookie
  secret: process.env.SESSION_SECRET || 'dev-only-change-me', // signs the cookie so it can't be faked
  resave: false,                                       // don't re-save sessions that didn't change
  saveUninitialized: false,                            // don't create a session until we store something
  cookie: {
    httpOnly: true,                                    // browser JavaScript can't read the cookie
    sameSite: 'lax',                                   // basic protection against cross-site requests
    maxAge: 1000 * 60 * 60                             // session lasts 1 hour by default
  }
}));

// Serve register.html, login.html, styles.css and images from /public
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------

// Escape user input before putting it into HTML (prevents HTML/script injection)
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Top navigation bar.
// If a user is logged in we show "Profile" and "Log out",
// otherwise we show "Log in" and "Get started".
function navBar(user) {
  const links = user
    ? `<a href="/profile">Profile</a>
       <a href="/logout" class="btn btn-dark">Log out</a>`
    : `<a href="login.html">Log in</a>
       <a href="register.html" class="btn btn-dark">Get started</a>`;
  return `<nav class="nav">
    <a href="${user ? '/profile' : 'login.html'}" class="brand">Capsule</a>
    <div class="nav-links">${links}</div>
  </nav>`;
}

// Builds a small styled response page: a white card with a title,
// a message and one button link (used for success and error messages)
function messagePage(title, text, linkHref, linkText, success, user) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · Capsule</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  ${navBar(user)}
  <div class="message-wrap">
    <div class="message ${success ? 'success' : 'error'}">
      <div class="icon">${success ? '&check;' : '!'}</div>
      <h1>${title}</h1>
      <p>${text}</p>
      <a href="${linkHref}" class="btn btn-dark btn-block">${linkText}</a>
    </div>
  </div>
</body>
</html>`;
}

// Route guard: only lets the request continue if someone is logged in.
// If there is no user in the session, send them back to the login page.
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  res.status(401).send(messagePage(
    'Please log in',
    'You need to be logged in to see your profile.',
    'login.html', 'Go to login', false
  ));
}

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

// Home -> profile if logged in, otherwise the login page
app.get('/', (req, res) => {
  res.redirect(req.session.user ? '/profile' : '/login.html');
});

// ----- REGISTER -----
app.post('/register', async (req, res) => {
  // Clean up the form values
  const username = (req.body.username || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  // All three fields are required
  if (!username || !email || !password) {
    return res.status(400).send(messagePage(
      'Missing information',
      'Please fill in your username, e-mail and password.',
      'register.html', 'Back to sign up', false
    ));
  }

  try {
    // Only the bcrypt hash is stored, never the plain password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ? placeholders let mysql2 escape the values (prevents SQL injection)
    await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    console.log('Registered:', username);
    res.send(messagePage(
      'Registration complete',
      `${escapeHtml(username)}, you have successfully registered.`,
      'login.html', 'Go to login', true
    ));
  } catch (err) {
    // username and email are UNIQUE in schema.sql, so a duplicate throws ER_DUP_ENTRY
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).send(messagePage(
        'Account already exists',
        'That username or e-mail is already registered. Try another one or log in.',
        'register.html', 'Back to sign up', false
      ));
    }
    console.error('Register error:', err.message);
    res.status(500).send(messagePage(
      'Something went wrong',
      'We could not create your account. Please try again.',
      'register.html', 'Back to sign up', false
    ));
  }
});

// ----- LOGIN -----
app.post('/login', async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  // One shared response for every kind of failed login
  const failed = () => res.status(401).send(messagePage(
    'Login failed',
    'The login credentials were incorrect.',
    'login.html', 'Back to login', false
  ));

  if (!username || !password) return failed();

  try {
    // Look up the user by username
    const [rows] = await pool.query(
      'SELECT user_id, username, email, password_hash FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );
    if (rows.length === 0) return failed();

    const user = rows[0];
    let match;

    if (user.password_hash.startsWith('$2')) {
      // Normal case: the stored value is a bcrypt hash
      match = await bcrypt.compare(password, user.password_hash);
    } else {
      // The sample users in schema.sql have plain-text passwords.
      // Accept them once, then replace them with a real bcrypt hash.
      match = password === user.password_hash;
      if (match) {
        const newHash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, user.user_id]);
        console.log('Upgraded plain-text password to bcrypt for:', user.username);
      }
    }

    if (!match) return failed();

    // Credentials are correct -> start the session.
    // regenerate() gives the user a brand-new session ID at login,
    // which protects against "session fixation" attacks.
    req.session.regenerate(err => {
      if (err) {
        console.error('Session error:', err.message);
        return res.status(500).send(messagePage(
          'Something went wrong', 'We could not log you in. Please try again.',
          'login.html', 'Back to login', false
        ));
      }

      // Store ONLY what we need in the session (never the password)
      req.session.user = {
        id: user.user_id,
        username: user.username,
        email: user.email
      };

      // "Remember me" checked -> keep the session for 30 days instead of 1 hour
      if (req.body.remember) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
      }

      console.log('Logged in:', user.username);
      res.send(messagePage(
        'Welcome back',
        `You have logged in successfully, ${escapeHtml(user.username)}.`,
        '/profile', 'Go to my profile', true, req.session.user
      ));
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send(messagePage(
      'Something went wrong',
      'We could not log you in. Please try again.',
      'login.html', 'Back to login', false
    ));
  }
});

// ----- PROFILE (requires a session) -----
// requireLogin runs first; this only runs if req.session.user exists.
app.get('/profile', requireLogin, async (req, res) => {
  const user = req.session.user;   // username/email saved at login
  let memberSince = '';

  try {
    // Extra details from the database (optional - the page still works without them)
    const [rows] = await pool.query(
      'SELECT created_at FROM users WHERE user_id = ?',
      [user.id]
    );
    if (rows.length && rows[0].created_at) {
      memberSince = new Date(rows[0].created_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
    }
  } catch (err) {
    console.error('Profile lookup error:', err.message);
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(user.username)} · Capsule</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  ${navBar(user)}
  <div class="message-wrap">
    <div class="message profile">
      <p class="profile-eyebrow">Your profile</p>
      <!-- The username comes from the session -->
      <h1>Hello, ${escapeHtml(user.username)}</h1>
      <p>You are logged in. This page reads your name from the session.</p>

      <dl class="profile-list">
        <div><dt>Username</dt><dd>${escapeHtml(user.username)}</dd></div>
        <div><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
        ${memberSince ? `<div><dt>Member since</dt><dd>${memberSince}</dd></div>` : ''}
      </dl>

      <!-- Clicking this link calls /logout, which destroys the session -->
      <a href="/logout" class="btn btn-dark btn-block">Log out</a>
    </div>
  </div>
</body>
</html>`);
});

// ----- LOGOUT -----
// Destroys the session on the server and deletes the session cookie.
app.get('/logout', (req, res) => {
  const name = req.session.user ? req.session.user.username : null;

  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err.message);
      return res.status(500).send(messagePage(
        'Something went wrong', 'We could not log you out. Please try again.',
        '/profile', 'Back to profile', false
      ));
    }

    res.clearCookie('capsule.sid');   // remove the cookie from the browser
    if (name) console.log('Logged out:', name);

    res.send(messagePage(
      'Logged out',
      'You have been logged out and your session has ended.',
      'login.html', 'Back to login', true
    ));
  });
});

// ---------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Capsule running at http://localhost:${PORT}/register.html`);
});
