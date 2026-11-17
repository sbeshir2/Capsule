// ItemCard.jsx - one piece of clothing in the closet grid.
// Shows the photo, season tag, name, brand · category, color and wear
// stats, with Edit and Delete buttons. Delete asks "are you sure" first.
//
// The card is a Motion element: `layout` makes it glide to its new spot
// when the grid is filtered or sorted, and initial/animate/exit fade it
// in and out. `ref` is passed in by <AnimatePresence> in Closet.jsx.
import { useState } from 'react';
import { motion } from 'motion/react';
import { categoryLabel, seasonLabel, colorHex, costPerWear, money } from '../closetOptions.js';
import NotesButton from './NotesButton.jsx';

const appear = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
  transition: { type: 'spring', stiffness: 380, damping: 34 }
};

export default function ItemCard({ item, onEdit, onDelete, onSaveNotes, ref }) {
  const [confirming, setConfirming] = useState(false); // showing "Delete this piece?"
  const [busy, setBusy] = useState(false);             // delete request in progress

  const perWear = costPerWear(item);
  const worn = Number(item.times_worn) || 0;
  const stats = worn === 0
    ? 'Not worn yet'
    : `Worn ${worn}x${perWear ? ` · ${money(perWear)}/wear` : ''}`;

  async function confirmDelete() {
    setBusy(true);
    try {
      await onDelete(item);          // the card disappears when this succeeds
    } catch {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <motion.article ref={ref} layout className="item-card" {...appear}>
      <div className="item-photo">
        <img src={item.image_url} alt="" loading="lazy" />
        <span className="item-season">{seasonLabel(item.season)}</span>
        <NotesButton item={item} onSave={onSaveNotes} />
      </div>

      <h2 className="item-name">{item.name}</h2>
      <p className="item-meta">
        {[item.brand, categoryLabel(item)].filter(Boolean).join(' · ')}
      </p>
      {item.color && (
        <p className="item-color">
          <span className="item-dot" style={{ background: colorHex(item.color) }} />
          {item.color}
        </p>
      )}
      <p className="item-stats">{stats}</p>

      {confirming ? (
        <div className="item-actions">
          <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)} disabled={busy}>
            Keep
          </button>
          <button type="button" className="btn btn-dark" onClick={confirmDelete} disabled={busy}>
            {busy ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      ) : (
        <div className="item-actions">
          <button type="button" className="btn btn-outline" onClick={() => onEdit(item)}
                  aria-label={`Edit ${item.name}`}>
            Edit
          </button>
          <button type="button" className="btn btn-faint" onClick={() => setConfirming(true)}
                  aria-label={`Delete ${item.name}`}>
            Delete
          </button>
        </div>
      )}
    </motion.article>
  );
}
