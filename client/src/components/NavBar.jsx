// NavBar.jsx - top bar shown on every signed-in screen:
// Capsule · the six screens · a circle with the user's initial.
import { NavLink } from 'react-router-dom';
import { SCREENS } from '../screens.js';

export default function NavBar({ user }) {
  const initial = user ? user.username.charAt(0).toUpperCase() : '';

  return (
    <header className="topbar">
      <NavLink to="/closet" className="topbar-brand">Capsule</NavLink>

      <nav className="topbar-links" aria-label="Main">
        {SCREENS.map(s => (
          // NavLink adds the "active" class to the link for the open screen
          <NavLink key={s.path} to={`/${s.path}`}>{s.label}</NavLink>
        ))}
      </nav>

      {/* The profile page is still the server's own page, so this is a normal link */}
      <a href="/profile" className="topbar-avatar"
         aria-label={user ? `Profile for ${user.username}` : 'Profile'}>
        {initial}
      </a>
    </header>
  );
}
