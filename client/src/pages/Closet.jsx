// Closet.jsx - "The Closet" screen.
// Loads the user's pieces from the server once, then does all the
// searching, filtering and sorting in the browser so it feels instant.
//
// UI libraries used here:
//   Radix (radix-ui)  - the dropdowns, the category buttons, the add/edit
//                       pop-up and the little "saved" messages
//   Motion (motion)   - cards sliding into place when the filters change,
//                       and the black highlight gliding between categories
import { useEffect, useMemo, useState } from 'react';
import { Dialog, Toast, ToggleGroup } from 'radix-ui';
import { AnimatePresence, motion } from 'motion/react';
import { getItems, deleteItem, saveNotes } from '../api.js';
import { CATEGORIES, SEASONS, categoryOf, colorHex, costPerWear } from '../closetOptions.js';
import ItemCard from '../components/ItemCard.jsx';
import ItemForm from '../components/ItemForm.jsx';
import Picker from '../components/Picker.jsx';

const SORTS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'most-worn',  label: 'Most worn' },
  { value: 'least-worn', label: 'Least worn' },
  { value: 'best-value', label: 'Lowest cost per wear' },
  { value: 'name',       label: 'Name A–Z' }
];

const SEASON_FILTERS = [
  { value: '', label: 'All seasons' },
  ...SEASONS.filter(s => s.value !== 'all'),
  { value: 'all', label: 'Year-round pieces' }
];

function sortItems(items, sort) {
  const list = [...items];
  if (sort === 'most-worn')  list.sort((a, b) => b.times_worn - a.times_worn);
  if (sort === 'least-worn') list.sort((a, b) => a.times_worn - b.times_worn);
  if (sort === 'name')       list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'best-value') {
    // pieces with no cost per wear yet (never worn / no price) go last
    list.sort((a, b) => (costPerWear(a) ?? Infinity) - (costPerWear(b) ?? Infinity));
  }
  return list; // 'newest' is the order the server already sends
}

// The black block behind the chosen category. Motion moves it from one
// button to the next because every copy shares the same layoutId.
const TabInk = () => (
  <motion.span layoutId="closet-tab-ink" className="tab-ink"
               transition={{ type: 'spring', stiffness: 520, damping: 42 }} />
);

export default function Closet() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [season, setSeason] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('all');

  // The pop-up form: null = closed, 'new' = adding, or the item being edited
  const [formFor, setFormFor] = useState(null);

  // The short message in the bottom corner ("Added to your closet")
  const [toast, setToast] = useState(null);
  const notify = text => setToast({ text, id: Date.now() });

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Choices for the Color and Brand menus come from what's in the closet
  const colors = useMemo(() => [...new Set(items.map(i => i.color).filter(Boolean))].sort(), [items]);
  const brands = useMemo(() => [...new Set(items.map(i => i.brand).filter(Boolean))].sort(), [items]);

  // Everything except the category buttons, so their counts stay in step
  // with the search and menus
  const matching = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i =>
      (!q || i.name.toLowerCase().includes(q) || (i.brand || '').toLowerCase().includes(q)) &&
      (!color || i.color === color) &&
      (!brand || i.brand === brand) &&
      (!season || (i.season || 'all') === season)
    );
  }, [items, search, color, brand, season]);

  const shown = useMemo(() => {
    const inCategory = category === 'all' ? matching : matching.filter(i => categoryOf(i) === category);
    return sortItems(inCategory, sort);
  }, [matching, category, sort]);

  const countIn = value => matching.filter(i => categoryOf(i) === value).length;

  // Called by the form after a successful save
  function handleSaved(saved) {
    const isNew = !items.some(i => i.item_id === saved.item_id);
    setItems(list => isNew
      ? [saved, ...list]
      : list.map(i => (i.item_id === saved.item_id ? saved : i)));
    setFormFor(null);
    notify(isNew ? `Added “${saved.name}” to your closet` : `Saved changes to “${saved.name}”`);
  }

  async function handleDelete(item) {
    setError('');
    try {
      await deleteItem(item.item_id);
      setItems(list => list.filter(i => i.item_id !== item.item_id));
      notify(`Deleted “${item.name}”`);
    } catch (err) {
      setError(err.message);
      throw err; // lets the card go back to its normal buttons
    }
  }

  // Called by a card's notes pop-up when it closes with changed notes.
  // Throws on failure so the pop-up can stay open and show the message.
  async function handleSaveNotes(item, notes) {
    const updated = await saveNotes(item.item_id, notes);
    setItems(list => list.map(i => (i.item_id === updated.item_id ? updated : i)));
    notify(updated.notes ? `Note saved for “${item.name}”` : `Note removed from “${item.name}”`);
  }

  const filtering = search || color || brand || season || category !== 'all';
  function clearFilters() {
    setSearch(''); setColor(''); setBrand(''); setSeason(''); setCategory('all');
  }

  return (
    <section className="closet">
      <header className="closet-head">
        <div>
          <p className="eyebrow">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} you own · {shown.length} shown
          </p>
          <h1 className="page-title">The <em>Closet</em></h1>
        </div>
        <button type="button" className="btn btn-dark btn-add" onClick={() => setFormFor('new')}>
          + Add item
        </button>
      </header>

      <div className="filters">
        <div className="filters-row">
          <label className="filter filter-search">
            <span className="filter-label">Search</span>
            <input type="search" value={search} placeholder="Search by name or brand"
                   onChange={e => setSearch(e.target.value)} />
          </label>
          <Picker label="Color" value={color} onChange={setColor}
                  options={[{ value: '', label: 'All colors' },
                            ...colors.map(c => ({ value: c, label: c, swatch: colorHex(c) }))]} />
          <Picker label="Brand" value={brand} onChange={setBrand}
                  options={[{ value: '', label: 'All brands' }, ...brands.map(b => ({ value: b, label: b }))]} />
          <Picker label="Season" value={season} onChange={setSeason} options={SEASON_FILTERS} />
          <Picker label="Sort" value={sort} onChange={setSort} options={SORTS} />
        </div>

        {/* Radix ToggleGroup: one category on at a time, arrow keys move between them */}
        <ToggleGroup.Root type="single" className="tabs" aria-label="Category" value={category}
                          onValueChange={v => { if (v) setCategory(v); }}>
          <ToggleGroup.Item value="all" className="tab">
            {category === 'all' && <TabInk />}
            <span className="tab-text">All <span className="tab-count">{matching.length}</span></span>
          </ToggleGroup.Item>
          {CATEGORIES.map(c => (
            <ToggleGroup.Item key={c.value} value={c.value} className="tab">
              {category === c.value && <TabInk />}
              <span className="tab-text">{c.label} <span className="tab-count">{countIn(c.value)}</span></span>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {loading ? (
        <p className="closet-note">Loading your closet…</p>
      ) : items.length === 0 ? (
        <div className="closet-empty">
          <h2>Your closet is empty</h2>
          <p>Add your first piece with a photo, and it will show up here.</p>
          <button type="button" className="btn btn-dark" onClick={() => setFormFor('new')}>+ Add item</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="closet-empty">
          <h2>Nothing matches</h2>
          <p>No pieces fit these filters.</p>
          {filtering && <button type="button" className="btn btn-outline" onClick={clearFilters}>Clear filters</button>}
        </div>
      ) : (
        <div className="closet-grid">
          {/* popLayout: cards leaving fade out while the rest slide into their new spots */}
          <AnimatePresence mode="popLayout">
            {shown.map(item => (
              <ItemCard key={item.item_id} item={item} onEdit={setFormFor} onDelete={handleDelete}
                        onSaveNotes={handleSaveNotes} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Radix Dialog: traps the keyboard inside the pop-up, closes on Esc or
          a click outside, and stops the page behind it from scrolling */}
      <Dialog.Root open={formFor !== null} onOpenChange={open => { if (!open) setFormFor(null); }}>
        <AnimatePresence>
          {formFor && (
            <ItemForm
              key={formFor === 'new' ? 'new' : formFor.item_id}
              item={formFor === 'new' ? null : formFor}
              onSaved={handleSaved}
              onClose={() => setFormFor(null)}
            />
          )}
        </AnimatePresence>
      </Dialog.Root>

      {/* Radix Toast: shows in the bottom corner, hides itself after a few
          seconds, and can be swiped away. A new message replaces the old one. */}
      {toast && (
        <Toast.Root key={toast.id} className="toast" duration={3500}>
          <Toast.Description className="toast-text">{toast.text}</Toast.Description>
          <Toast.Close className="toast-close" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </Toast.Close>
        </Toast.Root>
      )}
    </section>
  );
}
