import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-bg-grid" />
      <div className="landing-content">
        <div className="landing-logo">
          <span className="logo-text">CAT'S</span>
          <span className="logo-text logo-text--accent">GAME</span>
        </div>
        <p className="landing-subtitle">The ultimate party experience</p>

        <div className="landing-buttons">
          <button className="btn btn--primary btn--xl" onClick={() => navigate('/host')}>
            <span className="btn-icon">🎮</span>
            Host Game
          </button>
          <div className="landing-divider">
            <span>or</span>
          </div>
          <JoinSection />
        </div>
      </div>
    </div>
  );
}

function JoinSection() {
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = (fd.get('code') as string)?.trim().toUpperCase();
    if (code && code.length === 5) {
      navigate(`/room/${code}/name`);
    }
  };

  return (
    <form className="join-form" onSubmit={handleJoin}>
      <input
        name="code"
        className="join-input"
        placeholder="ENTER ROOM CODE"
        maxLength={5}
        autoComplete="off"
        style={{ textTransform: 'uppercase' }}
      />
      <button type="submit" className="btn btn--secondary btn--xl">
        Join Game
      </button>
    </form>
  );
}
