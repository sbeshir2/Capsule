// ItemCard.jsx - one piece of clothing in the closet grid.
// Shows the photo, season tag, name, brand · category, color and wear
// stats, with Edit and Delete buttons. Delete asks "are you sure" first.
import { useState } from 'react';
import { categoryLabel, seasonLabel, colorHex, costPerWear, money } from '../closetOptions.js';

export default function ItemCard({ item, onEdit, onDelete }) {
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
    <article className="item-card">
      <div className="item-photo">
        <img src={item.image_url} alt="" loading="lazy" />
        <span className="item-season">{seasonLabel(item.season)}</span>
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
    </article>
  );
}
