// ItemForm.jsx - the pop-up used for both "+ Add item" and "Edit".
// `item` is the piece being edited, or null when adding a new one.
// When the save works it calls onSaved(savedItem); onClose closes it.
//
// It must sit inside a Radix <Dialog.Root> (see Closet.jsx). Radix handles
// Esc, clicking outside, keeping Tab inside the pop-up and screen-reader
// labels; Motion fades the backdrop and lifts the form in and out.
import { useRef, useState } from 'react';
import { Dialog } from 'radix-ui';
import { motion } from 'motion/react';
import { addItem, updateItem } from '../api.js';
import { CATEGORIES, SEASONS, COLORS, categoryOf, colorHex } from '../closetOptions.js';
import Picker from './Picker.jsx';

const MAX_PHOTO_SIDE = 1200; // photos are shrunk to this many pixels before upload

// Shrinks a chosen photo in the browser and returns it as text
// ("data:image/jpeg;base64,...") that can be sent to the server as JSON.
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as a photo.'));
    };
    img.src = url;
  });
}

export default function ItemForm({ item, onSaved, onClose }) {
  const editing = Boolean(item);

  // One piece of state per field, filled in from the item when editing
  const [name, setName] = useState(item ? item.name : '');
  const [brand, setBrand] = useState(item ? item.brand || '' : '');
  const [category, setCategory] = useState(item ? categoryOf(item) : 'tops');
  const [color, setColor] = useState(item ? item.color || '' : '');
  const [season, setSeason] = useState(item ? item.season || 'all' : 'all');
  const [price, setPrice] = useState(item && item.price != null ? String(item.price) : '');
  const [timesWorn, setTimesWorn] = useState(item ? String(item.times_worn || 0) : '0');
  const [photo, setPhoto] = useState(null);                       // new photo, as text
  const [preview, setPreview] = useState(item ? item.image_url : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const firstField = useRef(null);

  async function choosePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    try {
      const data = await shrinkPhoto(file);
      setPhoto(data);
      setPreview(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Give the piece a name.');
    if (!editing && !photo) return setError('Add a photo of the piece.');

    const fields = {
      name: name.trim(),
      brand: brand.trim(),
      category,
      color,
      season,
      price: price === '' ? null : Number(price),
      times_worn: Number(timesWorn) || 0
    };
    if (photo) fields.image = photo;   // only sent when a new photo was chosen

    setSaving(true);
    setError('');
    try {
      const saved = editing ? await updateItem(item.item_id, fields) : await addItem(fields);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  // A saved color that isn't in the list (older data) still shows as a choice
  const colorNames = COLORS.map(c => c.name);
  if (color && !colorNames.includes(color)) colorNames.push(color);

  return (
    // forceMount keeps it on screen while Motion plays the closing animation
    <Dialog.Portal forceMount>
      <Dialog.Overlay asChild forceMount>
        <motion.div className="modal-back"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}>
      <Dialog.Content asChild forceMount aria-describedby={undefined}
                      // start in the Name box rather than on the photo picker
                      onOpenAutoFocus={e => { e.preventDefault(); firstField.current?.focus(); }}>
      <motion.form className="modal" onSubmit={submit}
                   initial={{ opacity: 0, y: 28, scale: 0.98 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } }}
                   transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
        <p className="eyebrow">{editing ? 'Edit piece' : 'New piece'}</p>
        <Dialog.Title className="modal-title">
          {editing ? item.name : <>Add to <em>the closet</em></>}
        </Dialog.Title>

        <div className="form-grid">
          <label className="form-photo">
            <span className="form-label">Photo</span>
            <span className="form-photo-box">
              {preview
                ? <img src={preview} alt="" />
                : <span className="form-photo-empty">Choose a photo</span>}
            </span>
            <input type="file" accept="image/*" onChange={choosePhoto} />
            <span className="form-photo-hint">{preview ? 'Change photo' : 'JPG or PNG'}</span>
          </label>

          <div className="form-fields">
            <label>
              <span className="form-label">Name</span>
              <input ref={firstField} type="text" value={name} maxLength={100}
                     onChange={e => setName(e.target.value)} placeholder="Gray cropped trench coat" />
            </label>

            <label>
              <span className="form-label">Brand</span>
              <input type="text" value={brand} maxLength={50}
                     onChange={e => setBrand(e.target.value)} placeholder="Zara" />
            </label>

            <div className="form-row">
              <Picker label="Category" className="form-pick" labelClassName="form-label"
                      value={category} onChange={setCategory}
                      options={CATEGORIES.map(c => ({ value: c.value, label: c.card }))} />
              <Picker label="Season" className="form-pick" labelClassName="form-label"
                      value={season} onChange={setSeason} options={SEASONS} />
            </div>

            <div className="form-row">
              <Picker label="Color" className="form-pick" labelClassName="form-label"
                      value={color} onChange={setColor} placeholder="Choose a color"
                      options={colorNames.map(c => ({ value: c, label: c, swatch: colorHex(c) }))} />
              <label>
                <span className="form-label">Price paid ($)</span>
                <input type="number" min="0" step="0.01" value={price}
                       onChange={e => setPrice(e.target.value)} placeholder="120.00" />
              </label>
            </div>

            <label className="form-narrow">
              <span className="form-label">Times worn</span>
              <input type="number" min="0" step="1" value={timesWorn}
                     onChange={e => setTimesWorn(e.target.value)} />
            </label>
          </div>
        </div>

        {/* role="alert" makes screen readers read the message out */}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-dark" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add to closet'}
          </button>
        </div>
      </motion.form>
      </Dialog.Content>
        </motion.div>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
