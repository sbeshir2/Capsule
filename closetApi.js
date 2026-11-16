// =====================================================================
// closetApi.js - data routes used by the React app (client/)
// ---------------------------------------------------------------------
// Everything here answers with JSON and needs a logged-in session.
//   GET    /api/me          -> who is logged in
//   GET    /api/items       -> every piece in the user's closet
//   POST   /api/items       -> add a piece (with a photo)
//   PUT    /api/items/:id   -> change a piece (photo optional)
//   DELETE /api/items/:id   -> remove a piece and its photo
//
// Photos arrive as text ("data:image/jpeg;base64,...") inside the JSON,
// are saved as files in /uploads, and the database keeps only the path.
// =====================================================================

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('./db');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;   // 5 MB after decoding
const CATEGORIES = ['tops', 'bottoms', 'dress', 'coats', 'outerwear', 'shoes', 'accessories'];
const SEASONS = ['all', 'fw', 'ss'];        // all seasons / fall-winter / spring-summer
const ITEM_COLUMNS =
  'item_id, name, category, color, brand, season, image_url, price, times_worn, created_at';

// Read JSON bodies (photos make them bigger than Express's 100kb default)
router.use(express.json({ limit: '8mb' }));

// Every route below needs a session. The React app sends the browser to
// the login page when it sees this 401.
router.use((req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ error: 'Please log in.' });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

// Checks the fields sent by the form. Returns { fields } when they are
// fine, or { error } with a message to show the user.
function readItemFields(body) {
  const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);

  const name = text(body.name, 100);
  if (!name) return { error: 'Give the piece a name.' };

  const category = text(body.category, 20);
  if (!CATEGORIES.includes(category)) return { error: 'Choose a category.' };

  const season = SEASONS.includes(body.season) ? body.season : 'all';

  let price = null;
  if (body.price !== null && body.price !== undefined && body.price !== '') {
    price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 999999.99) {
      return { error: 'Enter the price as a number, like 120 or 59.99.' };
    }
  }

  const timesWorn = Number(body.times_worn || 0);
  if (!Number.isInteger(timesWorn) || timesWorn < 0 || timesWorn > 100000) {
    return { error: 'Times worn must be a whole number.' };
  }

  return {
    fields: {
      name,
      category,
      season,
      color: text(body.color, 30) || null,
      brand: text(body.brand, 50) || null,
      price,
      times_worn: timesWorn
    }
  };
}

// Saves a photo sent as "data:image/...;base64,..." and returns its
// address (/uploads/<file>). Throws an Error with a readable message
// if it isn't a real JPG, PNG or WebP image.
async function savePhoto(userId, dataUrl) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new Error('The photo must be a JPG, PNG or WebP image.');

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) {
    throw new Error('The photo is too large. Try a smaller one.');
  }

  // Don't trust the label: check the first bytes really are that kind of image
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
                 bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  const kind = isJpeg ? 'jpg' : isPng ? 'png' : isWebp ? 'webp' : null;
  if (!kind) throw new Error('The photo must be a JPG, PNG or WebP image.');

  // u<user id>-<time>-<random>.jpg : server.js only lets a user open
  // files that start with their own id
  const fileName = `u${userId}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${kind}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, fileName), bytes);
  return `/uploads/${fileName}`;
}

// Deletes a photo file that this app saved. Anything else is ignored.
async function removePhoto(imageUrl) {
  const match = /^\/uploads\/(u\d+-\d+-[a-f0-9]+\.(?:jpg|png|webp))$/.exec(String(imageUrl || ''));
  if (!match) return;
  try { await fs.unlink(path.join(UPLOAD_DIR, match[1])); }
  catch { /* already gone - nothing to do */ }
}

async function findItem(userId, itemId) {
  const [rows] = await pool.query(
    `SELECT ${ITEM_COLUMNS} FROM clothing_items WHERE item_id = ? AND user_id = ?`,
    [itemId, userId]
  );
  return rows[0] || null;
}

// Wraps a route so database errors become a JSON 500 instead of a crash
const safe = handler => (req, res) =>
  handler(req, res).catch(err => {
    console.error('Closet API error:', err.message);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

router.get('/me', (req, res) => {
  res.json(req.session.user);            // { id, username, email }
});

// Newest pieces first
router.get('/items', safe(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ${ITEM_COLUMNS} FROM clothing_items
     WHERE user_id = ? ORDER BY created_at DESC, item_id DESC`,
    [req.session.user.id]
  );
  res.json(rows);
}));

router.post('/items', safe(async (req, res) => {
  const userId = req.session.user.id;
  const { fields, error } = readItemFields(req.body);
  if (error) return res.status(400).json({ error });
  if (!req.body.image) return res.status(400).json({ error: 'Add a photo of the piece.' });

  let imageUrl;
  try { imageUrl = await savePhoto(userId, req.body.image); }
  catch (err) { return res.status(400).json({ error: err.message }); }

  try {
    const [result] = await pool.query(
      `INSERT INTO clothing_items (user_id, name, category, color, brand, season, image_url, price, times_worn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fields.name, fields.category, fields.color, fields.brand, fields.season,
       imageUrl, fields.price, fields.times_worn]
    );
    res.status(201).json(await findItem(userId, result.insertId));
  } catch (err) {
    await removePhoto(imageUrl);         // don't leave a photo with no piece
    throw err;
  }
}));

router.put('/items/:id', safe(async (req, res) => {
  const userId = req.session.user.id;
  const existing = await findItem(userId, req.params.id);
  if (!existing) return res.status(404).json({ error: 'That piece is no longer in your closet.' });

  const { fields, error } = readItemFields(req.body);
  if (error) return res.status(400).json({ error });

  // A new photo is optional when editing
  let imageUrl = existing.image_url;
  if (req.body.image) {
    try { imageUrl = await savePhoto(userId, req.body.image); }
    catch (err) { return res.status(400).json({ error: err.message }); }
  }

  try {
    await pool.query(
      `UPDATE clothing_items
       SET name = ?, category = ?, color = ?, brand = ?, season = ?, image_url = ?, price = ?, times_worn = ?
       WHERE item_id = ? AND user_id = ?`,
      [fields.name, fields.category, fields.color, fields.brand, fields.season,
       imageUrl, fields.price, fields.times_worn, existing.item_id, userId]
    );
  } catch (err) {
    if (imageUrl !== existing.image_url) await removePhoto(imageUrl);
    throw err;
  }

  if (imageUrl !== existing.image_url) await removePhoto(existing.image_url); // old photo
  res.json(await findItem(userId, existing.item_id));
}));

router.delete('/items/:id', safe(async (req, res) => {
  const userId = req.session.user.id;
  const existing = await findItem(userId, req.params.id);
  if (!existing) return res.status(404).json({ error: 'That piece is no longer in your closet.' });

  await pool.query('DELETE FROM clothing_items WHERE item_id = ? AND user_id = ?',
    [existing.item_id, userId]);
  await removePhoto(existing.image_url);
  res.json({ ok: true });
}));

// Unknown /api address
router.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Problems reading the request itself (bad JSON, photo too big)
router.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The photo is too large. Try a smaller one.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request could not be read.' });
  }
  next(err);
});

module.exports = { router, UPLOAD_DIR };
