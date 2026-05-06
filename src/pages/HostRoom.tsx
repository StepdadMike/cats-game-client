import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWS } from '../context/WebSocketContext';
import Timer from '../components/Timer';
import PlayerCard from '../components/PlayerCard';
import HostGrid from '../components/HostGrid';
import ReviewPanel from '../components/ReviewPanel';
import GameOverScreen from '../components/GameOverScreen';

export default function HostRoom() {
  const { seed } = useParams<{ seed: string }>();
  const { roomState, myPlayerId, send, isConnected, lastMessage } = useWS();
  const navigate = useNavigate();
  const [roomError, setRoomError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomState?.seed ?? seed ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [roomState?.seed, seed]);

  // When connected and roomState is missing, try to rejoin via sessionStorage.
  // Runs every time isConnected flips to true so WS reconnects mid-game work.
  useEffect(() => {
    if (!isConnected || roomState) return;

    const storedId = sessionStorage.getItem('party-game:playerId');
    const storedSeed = sessionStorage.getItem('party-game:roomSeed');

    if (storedId && (storedSeed === seed || !storedSeed)) {
      sessionStorage.setItem('party-game:roomSeed', seed!);
      send({ type: 'REJOIN_ROOM', roomSeed: seed!, playerId: storedId });
    } else {
      setRoomError('Room not found. The server may have restarted.');
    }
  }, [isConnected, roomState, seed, send]);

  // Handle server errors (e.g. room no longer exists)
  useEffect(() => {
    if (lastMessage?.type === 'ERROR') {
      setRoomError(lastMessage.message);
    }
  }, [lastMessage]);

  if (roomError) {
    return (
      <div className="page page--center">
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ color: 'var(--danger)' }}>{roomError}</h2>
        <p>Create a new game from the host menu.</p>
        <button className="btn btn--primary btn--lg" onClick={() => navigate('/host')}>
          ← Back to Games
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="page page--center">
        <div className="connecting-spinner" />
        <p>Connecting to server…</p>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="page page--center">
        <div className="connecting-spinner" />
        <p style={{ color: 'var(--text2)', marginBottom: 8 }}>Waiting for players…</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 48, color: 'var(--accent)', letterSpacing: '0.15em' }}>
            {seed}
          </div>
          <button className="btn btn--ghost btn--sm copy-code-btn" onClick={copyCode}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
    );
  }

  if (roomState.phase === 'game-over') {
    return <GameOverScreen roomState={roomState} />;
  }

  const players = roomState.players.filter(p => !p.isHost);
  const isReviewing = roomState.phase === 'reviewing';
  const isAnswering = roomState.phase === 'question-active';

  return (
    <div className="host-room">
      {/* Top bar */}
      <div className="host-topbar">
        <div className="room-code">
          Room: <strong>{roomState.seed}</strong>
          <button className="btn btn--ghost btn--sm copy-code-btn" onClick={copyCode}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
        <div className="host-topbar__center">
          {roomState.phase === 'lobby' && (
            <span className="phase-label">Waiting for players…</span>
          )}
          {roomState.phase === 'player-select' && (
            <span className="phase-label phase-label--select">
              {roomState.selectedPlayerId
                ? `${players.find(p => p.id === roomState.selectedPlayerId)?.name ?? '?'} is choosing…`
                : 'Pick a question from the grid'}
            </span>
          )}
          {(isAnswering || isReviewing) && roomState.currentQuestion && (
            <span className="phase-label phase-label--question">
              {isReviewing ? 'Reviewing answers' : 'Players answering…'}
            </span>
          )}
        </div>
        <div className="host-controls">
          {roomState.phase === 'lobby' && (
            <button className="btn btn--success btn--lg" onClick={() => send({ type: 'START_GAME' })}>
              ▶ Start Game
            </button>
          )}
          {roomState.phase !== 'lobby' && !roomState.isPaused && (
            <button className="btn btn--warning" onClick={() => send({ type: 'PAUSE_GAME' })}>
              ⏸ Pause
            </button>
          )}
          {roomState.isPaused && (
            <button className="btn btn--success" onClick={() => send({ type: 'RESUME_GAME' })}>
              ▶ Resume
            </button>
          )}
        </div>
      </div>

      {/* Pause overlay */}
      {roomState.isPaused && (
        <div className="pause-overlay">
          <div className="pause-overlay__text">⏸ PAUSED</div>
          <div className="pause-overlay__resume">
            <button className="btn btn--success btn--lg" onClick={() => send({ type: 'RESUME_GAME' })}>
              ▶ Resume
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="host-main">
        {/* Timer */}
        {(roomState.phase === 'player-select' || roomState.phase === 'question-active') && (
          <div className="host-timer-area">
            <Timer seconds={roomState.timerSeconds} maxSeconds={roomState.timerMax} />
          </div>
        )}

        {/* Grid */}
        <div className="host-grid-area">
          <HostGrid
            roomState={roomState}
            onSelectQuestion={cellId => send({ type: 'SELECT_QUESTION', cellId })}
          />
        </div>

        {/* Review panel */}
        {isReviewing && roomState.currentQuestion && (
          <ReviewPanel
            roomState={roomState}
            myPlayerId={myPlayerId}
            onGrade={(playerId, isCorrect) => send({ type: 'GRADE_ANSWER', playerId, isCorrect })}
            onNext={() => send({ type: 'NEXT_REVIEW' })}
            onEnd={() => send({ type: 'END_QUESTION' })}
            onCastVote={votedForPlayerId => send({ type: 'CAST_VOTE', votedForPlayerId })}
            onNextWave={() => send({ type: 'NEXT_WAVE' })}
          />
        )}
      </div>

      {/* Player list */}
      <div className="host-players">
        {players.length === 0 ? (
          <div className="waiting-hint">
            Players join at: <strong>http://{window.location.host}/room/{seed}</strong>
          </div>
        ) : (
          <div className="player-list">
            {players.map((p) => {
              const answer = roomState.currentQuestion?.answers.find(a => a.playerId === p.id);
              const reviewIndex = roomState.currentQuestion?.reviewIndex ?? -1;
              const answerIndex = answer ? roomState.currentQuestion!.answers.indexOf(answer) : -1;
              const isFlipped = isReviewing && answerIndex !== -1 && answerIndex <= reviewIndex;

              return (
                <PlayerCard
                  key={p.id}
                  player={p}
                  isSelected={p.id === roomState.selectedPlayerId}
                  isCurrent={p.id === roomState.selectedPlayerId && roomState.phase === 'player-select'}
                  hasAnswered={!!answer}
                  isFlipped={isFlipped}
                  answer={answer}
                  showAnswer
                  question={roomState.currentQuestion?.question}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
