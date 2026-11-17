// NavBar.jsx - top bar shown on every signed-in screen:
// Capsule · the six screens · a circle with the user's initial.
// The circle opens a small Radix DropdownMenu with Profile and Log out.
import { NavLink } from 'react-router-dom';
import { DropdownMenu } from 'radix-ui';
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

      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger className="topbar-avatar"
                              aria-label={user ? `Account menu for ${user.username}` : 'Account menu'}>
          {initial}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="account-menu" align="end" sideOffset={10} collisionPadding={12}>
            {user && (
              <DropdownMenu.Label className="account-name">
                Signed in as <strong>{user.username}</strong>
              </DropdownMenu.Label>
            )}
            {/* Profile and Log out are still the server's own pages, so these are normal links */}
            <DropdownMenu.Item asChild className="account-item">
              <a href="/profile">Profile</a>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="account-line" />
            <DropdownMenu.Item asChild className="account-item">
              <a href="/logout">Log out</a>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
