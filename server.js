// server.js - Capsule register / login server (uses the MySQL pool in db.js)
// Run: node server.js  ->  open http://localhost:3000/register.html

const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// Read form data from the HTML forms
app.use(express.urlencoded({ extended: true }));

// Serve register.html, login.html and styles.css from /public
app.use(express.static(path.join(__dirname, 'public')));

// Escape user input before putting it into HTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Builds a small styled response page with a message and a link
function messagePage(title, text, linkHref, linkText, success) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · Capsule</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav class="nav">
    <a href="login.html" class="brand">Capsule</a>
    <div class="nav-links">
      <a href="login.html">Log in</a>
      <a href="register.html" class="btn btn-dark">Get started</a>
    </div>
  </nav>
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

// Home -> send people to the login page
app.get('/', (req, res) => res.redirect('/login.html'));

// ----- REGISTER -----
app.post('/register', async (req, res) => {
  const username = (req.body.username || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

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

    // ? placeholders protect against SQL injection
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
    // username and email are UNIQUE in schema.sql
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

  const failed = () => res.status(401).send(messagePage(
    'Login failed',
    'The login credentials were incorrect.',
    'login.html', 'Back to login', false
  ));

  if (!username || !password) return failed();

  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, password_hash FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );
    if (rows.length === 0) return failed();

    const user = rows[0];
    let match;

    if (user.password_hash.startsWith('$2')) {
      // Normal case: stored value is a bcrypt hash
      match = await bcrypt.compare(password, user.password_hash);
    } else {
      // Sample users in schema.sql have plain-text passwords.
      // Accept them once, then replace with a real bcrypt hash.
      match = password === user.password_hash;
      if (match) {
        const newHash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, user.user_id]);
        console.log('Upgraded plain-text password to bcrypt for:', user.username);
      }
    }

    if (!match) return failed();

    console.log('Logged in:', user.username);
    res.send(messagePage(
      'Welcome back',
      'You have logged in successfully.',
      'login.html', 'Back to login', true
    ));
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send(messagePage(
      'Something went wrong',
      'We could not log you in. Please try again.',
      'login.html', 'Back to login', false
    ));
  }
});

app.listen(PORT, () => {
  console.log(`Capsule running at http://localhost:${PORT}/register.html`);
});