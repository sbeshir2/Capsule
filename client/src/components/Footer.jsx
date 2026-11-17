// Footer.jsx - thin line at the bottom of every signed-in screen
export default function Footer() {
  return (
    <footer className="app-foot">
      <span>{new Date().getFullYear()} Capsule</span>
      <span>Your real wardrobe, organized</span>
    </footer>
  );
}
