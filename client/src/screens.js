// screens.js - the screens in the top navigation, in wireframe order.
// To build the next screen: make a page in src/pages, then swap it in
// for <ComingSoon /> in App.jsx.
export const SCREENS = [
  { path: 'today',     label: 'Today',          about: 'Today’s outfit, picked for the weather and your calendar.' },
  { path: 'closet',    label: 'The Closet',     about: 'Every piece you own, in one place.' },
  { path: 'builder',   label: 'Outfit Builder', about: 'Put pieces from your closet together into outfits.' },
  { path: 'planner',   label: 'Planner',        about: 'Plan outfits on a calendar around your events and the weather.' },
  { path: 'analytics', label: 'Analytics',      about: 'What you wear most, what you barely wear, and your cost per wear.' },
  { path: 'wishlist',  label: 'Wishlist',       about: 'Pieces you’re thinking of buying, checked against your closet.' }
];
