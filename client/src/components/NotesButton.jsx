// NotesButton.jsx - the little notes icon in the top-right corner of each
// piece's photo. Clicking it opens a small pop-up (Radix Popover) where
// the user can write notes about the piece. The notes stay hidden until
// the icon is clicked again.
//
// Saving: notes are saved when the pop-up closes (Done, the ×, Esc or a
// click outside) - but only if they changed. If saving fails, the pop-up
// stays open with the message so nothing typed is lost.
//
// The icon is filled black when the piece already has notes.
import { useRef, useState } from 'react';
import { Popover } from 'radix-ui';

const MAX_NOTES = 2000; // same limit as the server

const NoteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 3h10l4 4v14H5z" />
    <path d="M14 3v5h5" />
    <path d="M8.5 12.5h7M8.5 16h5" />
  </svg>
);

export default function NotesButton({ item, onSave }) {
  const saved = item.notes || '';
  const hasNotes = saved.trim() !== '';

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const box = useRef(null);

  // Saves (if anything changed) and then closes
  async function close() {
    if (saving) return;
    if (draft.trim() === saved.trim()) { setOpen(false); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(item, draft);
      setOpen(false);
    } catch (err) {
      setError(err.message);       // stay open so the note isn't lost
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(next) {
    if (next) {
      setDraft(saved);             // start from what's saved
      setError('');
      setOpen(true);
    } else {
      close();
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger className={hasNotes ? 'note-btn has-notes' : 'note-btn'}
                       aria-label={hasNotes ? `Notes for ${item.name}` : `Add a note to ${item.name}`}
                       title={hasNotes ? 'Notes' : 'Add a note'}>
        <NoteIcon />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="note-pop" side="bottom" align="end" sideOffset={8} collisionPadding={12}
                         aria-label={`Notes for ${item.name}`}
                         onOpenAutoFocus={e => {
                           // put the cursor at the end of the notes
                           e.preventDefault();
                           const el = box.current;
                           if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
                         }}>
          <p className="note-eyebrow">Notes</p>
          <p className="note-title">{item.name}</p>

          <textarea ref={box} className="note-text" rows={6} maxLength={MAX_NOTES}
                    value={draft} onChange={e => setDraft(e.target.value)}
                    placeholder="Fit, care, what to wear it with…"
                    aria-label={`Notes for ${item.name}`}
                    // Cmd/Ctrl + Enter saves and closes
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); close(); } }} />

          {error && <p className="note-error" role="alert">{error}</p>}

          <div className="note-foot">
            <span className="note-count">{draft.length}/{MAX_NOTES}</span>
            <button type="button" className="btn btn-dark note-done" onClick={close} disabled={saving}>
              {saving ? 'Saving…' : 'Done'}
            </button>
          </div>

          <Popover.Close className="note-x" aria-label="Close notes">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </Popover.Close>
          <Popover.Arrow className="note-arrow" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
