// Closet.jsx - "The Closet" screen.
// Loads the user's pieces from the server once, then does all the
// searching, filtering and sorting in the browser so it feels instant.
import { useEffect, useMemo, useState } from 'react';
import { getItems, deleteItem } from '../api.js';
import { CATEGORIES, SEASONS, categoryOf, costPerWear } from '../closetOptions.js';
import ItemCard from '../components/ItemCard.jsx';
import ItemForm from '../components/ItemForm.jsx';

const SORTS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'most-worn',  label: 'Most worn' },
  { value: 'least-worn', label: 'Least worn' },
  { value: 'best-value', label: 'Lowest cost per wear' },
  { value: 'name',       label: 'Name A–Z' }
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
    setItems(list => {
      const exists = list.some(i => i.item_id === saved.item_id);
      return exists
        ? list.map(i => (i.item_id === saved.item_id ? saved : i))
        : [saved, ...list];
    });
    setFormFor(null);
  }

  async function handleDelete(item) {
    setError('');
    try {
      await deleteItem(item.item_id);
      setItems(list => list.filter(i => i.item_id !== item.item_id));
    } catch (err) {
      setError(err.message);
      throw err; // lets the card go back to its normal buttons
    }
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
          <label className="filter">
            <span className="filter-label">Color</span>
            <select value={color} onChange={e => setColor(e.target.value)}>
              <option value="">All colors</option>
              {colors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="filter">
            <span className="filter-label">Brand</span>
            <select value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="">All brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="filter">
            <span className="filter-label">Season</span>
            <select value={season} onChange={e => setSeason(e.target.value)}>
              <option value="">All seasons</option>
              {SEASONS.filter(s => s.value !== 'all').map(s =>
                <option key={s.value} value={s.value}>{s.label}</option>)}
              <option value="all">Year-round pieces</option>
            </select>
          </label>
          <label className="filter">
            <span className="filter-label">Sort</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="tabs" role="group" aria-label="Category">
          <button type="button" className={category === 'all' ? 'tab is-on' : 'tab'}
                  aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
            All <span className="tab-count">{matching.length}</span>
          </button>
          {CATEGORIES.map(c => (
            <button key={c.value} type="button" className={category === c.value ? 'tab is-on' : 'tab'}
                    aria-pressed={category === c.value} onClick={() => setCategory(c.value)}>
              {c.label} <span className="tab-count">{countIn(c.value)}</span>
            </button>
          ))}
        </div>
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
          {shown.map(item => (
            <ItemCard key={item.item_id} item={item} onEdit={setFormFor} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {formFor && (
        <ItemForm
          item={formFor === 'new' ? null : formFor}
          onSaved={handleSaved}
          onClose={() => setFormFor(null)}
        />
      )}
    </section>
  );
}
