// ComingSoon.jsx - stand-in for the screens that aren't built yet.
// Each one gets its own real page in src/pages when it's ready.
import { Link } from 'react-router-dom';

export default function ComingSoon({ screen }) {
  return (
    <section className="soon">
      <p className="eyebrow">Not built yet</p>
      <h1 className="page-title">{screen.label}</h1>
      <p className="soon-text">{screen.about}</p>
      <Link to="/closet" className="btn btn-outline">Back to The Closet</Link>
    </section>
  );
}
