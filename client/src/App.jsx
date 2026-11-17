// App.jsx - the frame around every signed-in screen.
// It loads who is logged in once, shows the top navigation and footer,
// and swaps the middle of the page depending on the address:
//   /app/closet    -> The Closet (built)
//   /app/today ... -> the other screens (placeholders until they're built)
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toast } from 'radix-ui';
import { MotionConfig } from 'motion/react';
import { getMe } from './api.js';
import NavBar from './components/NavBar.jsx';
import Footer from './components/Footer.jsx';
import Closet from './pages/Closet.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import { SCREENS } from './screens.js';

export default function App() {
  const [user, setUser] = useState(null);

  // Runs once when the app opens. If nobody is logged in, api.js sends
  // the browser to the login page.
  useEffect(() => {
    getMe().then(setUser).catch(() => {});
  }, []);

  return (
    // reducedMotion="user": if someone has "Reduce motion" turned on in their
    // computer or phone settings, the animations are switched off for them.
    <MotionConfig reducedMotion="user">
      {/* Toast.Provider lets any screen show a short message (see Closet.jsx) */}
      <Toast.Provider swipeDirection="right" label="Notification">
        <div className="app">
          <NavBar user={user} />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/closet" replace />} />
              <Route path="/closet" element={<Closet />} />
              {SCREENS.filter(s => s.path !== 'closet').map(s => (
                <Route key={s.path} path={`/${s.path}`} element={<ComingSoon screen={s} />} />
              ))}
              <Route path="*" element={<Navigate to="/closet" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
        {/* The messages appear here, in the bottom-right corner */}
        <Toast.Viewport className="toast-spot" />
      </Toast.Provider>
    </MotionConfig>
  );
}
