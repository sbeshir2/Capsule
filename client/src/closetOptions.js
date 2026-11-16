// closetOptions.js - the fixed choices used by the closet filters,
// the item cards and the add/edit form. Change a label here and it
// changes everywhere.

// value = what is saved in the database, label = filter button,
// singular = what the card shows (ZARA · TOPS)
export const CATEGORIES = [
  { value: 'tops',        label: 'Top',         card: 'Tops' },
  { value: 'bottoms',     label: 'Bottoms',     card: 'Bottoms' },
  { value: 'dress',       label: 'Dresses',     card: 'Dresses' },
  { value: 'outerwear',   label: 'Outerwear',   card: 'Outerwear' },
  { value: 'shoes',       label: 'Shoes',       card: 'Shoes' },
  { value: 'accessories', label: 'Accessories', card: 'Accessories' }
];

// The database also allows 'coats'; the closet shows those under Outerwear.
export const categoryOf = item => (item.category === 'coats' ? 'outerwear' : item.category);
export const categoryLabel = item => {
  const found = CATEGORIES.find(c => c.value === categoryOf(item));
  return found ? found.card : item.category;
};

// Short codes are saved (the season column only holds 10 characters)
export const SEASONS = [
  { value: 'all', label: 'All seasons' },
  { value: 'fw',  label: 'Fall · Winter' },
  { value: 'ss',  label: 'Spring · Summer' }
];
export const seasonLabel = value => {
  const found = SEASONS.find(s => s.value === value);
  return found ? found.label : 'All seasons';
};

// Color names offered in the form, with the dot color shown on the card
export const COLORS = [
  { name: 'Black',       hex: '#0e0e0e' },
  { name: 'White',       hex: '#ffffff' },
  { name: 'Off-white',   hex: '#f1ede4' },
  { name: 'Cream',       hex: '#efe6cf' },
  { name: 'Beige',       hex: '#d8c3a5' },
  { name: 'Gray',        hex: '#8a8a8a' },
  { name: 'Light brown', hex: '#a98a63' },
  { name: 'Brown',       hex: '#5a3a1e' },
  { name: 'Navy',        hex: '#161a4f' },
  { name: 'Blue',        hex: '#2b3fa0' },
  { name: 'Light blue',  hex: '#a9c7e8' },
  { name: 'Green',       hex: '#4d6b45' },
  { name: 'Red',         hex: '#a82020' },
  { name: 'Burgundy',    hex: '#5e1425' },
  { name: 'Pink',        hex: '#e8b4c0' },
  { name: 'Purple',      hex: '#6b4a8c' },
  { name: 'Yellow',      hex: '#e6c94c' },
  { name: 'Orange',      hex: '#d9792b' }
];
export const colorHex = name => {
  const found = COLORS.find(c => c.name.toLowerCase() === String(name || '').toLowerCase());
  return found ? found.hex : '#bdbdbd';
};

// "$6.67/wear" - price divided by how many times it was worn
export function costPerWear(item) {
  const price = Number(item.price);
  const worn = Number(item.times_worn);
  if (!price || !worn) return null;
  return price / worn;
}
export const money = n => `$${Number(n).toFixed(2)}`;
