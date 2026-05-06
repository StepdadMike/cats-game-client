import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Whiteboard, { WhiteboardHandle } from '../components/Whiteboard';

export default function NameEntry() {
  const { seed } = useParams<{ seed: string }>();
  const navigate = useNavigate();
  const [nameImageData, setNameImageData] = useState<string>(''); // eslint-disable-line
  const [playerName, setPlayerName] = useState('');
  const whiteboardRef = useRef<WhiteboardHandle>(null);

  const handleSubmit = () => {
    const name = playerName.trim();
    if (!name) return;
    const imgData = whiteboardRef.current?.getImageData() ?? '';
    // Store in session
    sessionStorage.setItem('party-game:playerName', name);
    sessionStorage.setItem('party-game:nameImageData', imgData);
    navigate(`/room/${seed}`);
  };

  return (
    <div className="page page--center">
      <div className="name-entry-card">
        <h2 className="name-entry-title">Write your name</h2>
        <p className="name-entry-subtitle">Draw it on the whiteboard — this is your nametag!</p>

        <div className="name-entry-whiteboard">
          <Whiteboard
            ref={whiteboardRef}
            width={400}
            height={160}
            penColor="#1a1a2e"
            background="#f5f0e8"
            onDraw={data => setNameImageData(data)}
          />
        </div>

        <div className="name-entry-text-row">
          <input
            className="input"
            placeholder="Also type your name (required)"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="name-entry-actions">
          <button className="btn btn--ghost" onClick={() => whiteboardRef.current?.clear()}>
            Clear
          </button>
          <button
            className="btn btn--primary btn--lg"
            onClick={handleSubmit}
            disabled={!playerName.trim()}
          >
            Join Room {seed}
          </button>
        </div>

        <button className="btn btn--ghost" onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>
    </div>
  );
}
