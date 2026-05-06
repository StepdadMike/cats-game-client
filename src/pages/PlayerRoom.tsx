import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWS } from '../context/WebSocketContext';
import Timer from '../components/Timer';
import PlayerCard from '../components/PlayerCard';
import QuestionDisplay from '../components/QuestionDisplay';
import AnswerInput from '../components/AnswerInput';
import AnswerSpotlight from '../components/AnswerSpotlight';
import GameOverScreen from '../components/GameOverScreen';
import { renderAnswer } from '../components/ReviewPanel';
import type { AnswerValue, RoomState } from '../types';

export default function PlayerRoom() {
  const { seed } = useParams<{ seed: string }>();
  const { roomState, myPlayerId, send, isConnected } = useWS();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomState?.seed ?? seed ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [roomState?.seed, seed]);

  useEffect(() => {
    if (!isConnected) return;

    const playerName = sessionStorage.getItem('party-game:playerName');

    // No name entered yet — go to name entry
    if (!playerName) {
      navigate(`/room/${seed}/name`, { replace: true });
      return;
    }

    // Already in the right room with a live state
    if (roomState?.seed === seed) return;

    const storedId = sessionStorage.getItem('party-game:playerId');
    const storedSeed = sessionStorage.getItem('party-game:roomSeed');
    const nameImageData = sessionStorage.getItem('party-game:nameImageData') ?? '';

    if (storedId && storedSeed === seed) {
      // Rejoin every time we connect (handles WS reconnects mid-game)
      send({ type: 'REJOIN_ROOM', roomSeed: seed!, playerId: storedId });
    } else {
      sessionStorage.setItem('party-game:roomSeed', seed!);
      send({ type: 'JOIN_ROOM', roomSeed: seed!, playerName, nameImageData });
    }
  }, [isConnected, seed, send, navigate, roomState]);

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
        <p>Joining room {seed}…</p>
      </div>
    );
  }

  if (roomState.phase === 'game-over') {
    return <GameOverScreen roomState={roomState} myPlayerId={myPlayerId} />;
  }

  const players = roomState.players.filter(p => !p.isHost);
  const isMyTurn = roomState.selectedPlayerId === myPlayerId;
  const isAnswering = roomState.phase === 'question-active';
  const isReviewing = roomState.phase === 'reviewing';
  const cq = roomState.currentQuestion;
  const myAnswer = cq?.answers.find(a => a.playerId === myPlayerId);
  const hasAnswered = !!myAnswer;
  const q = cq?.question;
  const isVoting = isReviewing && cq?.phase === 'voting';

  const handleSelectQuestion = (cellId: string) => {
    if (!isMyTurn || roomState.phase !== 'player-select') return;
    send({ type: 'SELECT_QUESTION', cellId });
  };

  const handleAnswer = (answer: AnswerValue) => {
    send({ type: 'SUBMIT_ANSWER', answer });
  };

  const waveState = cq?.waveState;
  const isLockedOut = (waveState?.lockedOutIds ?? []).includes(myPlayerId ?? '');
  const isAwaitingBuzzAnswer = (waveState?.awaitingBuzzAnswers ?? []).includes(myPlayerId ?? '');
  const hasGivenUpThisWave = (waveState?.givenUpThisWave ?? []).includes(myPlayerId ?? '');
  const isWaveReviewing = waveState?.isReviewingWave ?? false;

  // Phase label for topbar
  let phaseLabel = '';
  let phaseClass = '';
  if (roomState.phase === 'lobby') {
    phaseLabel = 'Waiting for host to start…';
  } else if (roomState.phase === 'player-select') {
    if (isMyTurn) {
      phaseLabel = 'Your turn — pick a question!';
      phaseClass = 'player-topbar__phase--myturn';
    } else {
      const chooser = players.find(p => p.id === roomState.selectedPlayerId);
      phaseLabel = chooser ? `${chooser.name} is choosing…` : 'Choosing…';
      phaseClass = 'player-topbar__phase--select';
    }
  } else if (roomState.phase === 'question-active') {
    phaseLabel = waveState?.isReviewingWave ? 'Reviewing wave answers…' : 'Players answering…';
    phaseClass = 'player-topbar__phase--answering';
  } else if (roomState.phase === 'reviewing') {
    phaseLabel = isVoting ? 'Voting time!' : 'Reviewing answers…';
  }

  return (
    <div className="player-room">
      {/* Topbar */}
      <div className="player-topbar">
        <div className="room-code">
          Room: <strong>{roomState.seed}</strong>
          <button className="btn btn--ghost btn--sm copy-code-btn" onClick={copyCode}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
        <div className={`player-topbar__phase ${phaseClass}`}>
          {phaseLabel}
        </div>
      </div>

      {roomState.isPaused && (
        <div className="pause-overlay">
          <div className="pause-overlay__text">⏸ PAUSED</div>
        </div>
      )}

      {/* Timer */}
      {(roomState.phase === 'player-select' || roomState.phase === 'question-active') && (
        <div className="player-timer">
          <Timer seconds={roomState.timerSeconds} maxSeconds={roomState.timerMax} />
        </div>
      )}

      {/* Lobby */}
      {roomState.phase === 'lobby' && (
        <div className="player-lobby">
          <p className="player-lobby__waiting">Waiting for the host to start the game…</p>
        </div>
      )}

      {/* Grid visible during player-select */}
      {roomState.phase === 'player-select' && (
        <div className="player-grid-view">
          {isMyTurn ? (
            <div className="your-turn-banner">Your turn — pick a question!</div>
          ) : (
            <div className="waiting-banner">
              {players.find(p => p.id === roomState.selectedPlayerId)?.name ?? '?'} is choosing…
            </div>
          )}
          <PlayerGrid
            roomState={roomState}
            isMyTurn={isMyTurn}
            onSelect={handleSelectQuestion}
          />
        </div>
      )}

      {/* Voting phase */}
      {isVoting && cq && (
        <div className="player-voting-area">
          <VotingView
            roomState={roomState}
            myPlayerId={myPlayerId}
            onVote={(pid) => send({ type: 'CAST_VOTE', votedForPlayerId: pid })}
          />
        </div>
      )}

      {/* Reviewing (non-voting): spotlight */}
      {isReviewing && !isVoting && (
        <div className="player-reviewing-area">
          <AnswerSpotlight roomState={roomState} />
        </div>
      )}

      {/* Active question answering */}
      {isAnswering && !isWaveReviewing && q && (
        <div className="player-question-area">
          <QuestionDisplay question={q} waveState={waveState} myPlayerId={myPlayerId} oddPlayerId={cq?.oddPlayerId ?? null} />

          {/* Answer input — normal questions */}
          {!hasAnswered && q.type !== 'guess-waves' && (
            <AnswerInput question={q} onSubmit={handleAnswer} />
          )}

          {/* Guess-waves controls */}
          {q.type === 'guess-waves' && (
            <>
              {isLockedOut && (
                <div className="answer-submitted">✓ Answer submitted! Waiting for results…</div>
              )}

              {!isLockedOut && isAwaitingBuzzAnswer && (
                <AnswerInput question={q} onSubmit={handleAnswer} />
              )}

              {!isLockedOut && !isAwaitingBuzzAnswer && !hasGivenUpThisWave && (
                <div className="wave-action-row">
                  <button className="buzz-btn" onClick={() => send({ type: 'BUZZ_IN' })}>
                    BUZZ IN!
                  </button>
                  <button className="btn btn--ghost give-up-btn" onClick={() => send({ type: 'GIVE_UP_WAVE' })}>
                    Skip this hint
                  </button>
                </div>
              )}

              {!isLockedOut && !isAwaitingBuzzAnswer && hasGivenUpThisWave && (
                <div className="wave-given-up">Skipped — waiting for next hint…</div>
              )}
            </>
          )}

          {hasAnswered && q.type !== 'guess-waves' && (
            <div className="answer-submitted">✓ Answer submitted! Waiting for others…</div>
          )}
        </div>
      )}

      {/* Players at bottom */}
      <div className="player-footer">
        {players.map(p => {
          const answer = cq?.answers.find(a => a.playerId === p.id);
          const reviewIndex = cq?.reviewIndex ?? -1;
          const answerIndex = answer ? cq!.answers.indexOf(answer) : -1;
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
              showAnswer={isFlipped}
              isMe={p.id === myPlayerId}
              question={cq?.question}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Voting view (players vote during memefy / draw-this) ──────────────────────

function VotingView({ roomState, myPlayerId, onVote }: {
  roomState: RoomState;
  myPlayerId: string | null;
  onVote: (playerId: string) => void;
}) {
  const cq = roomState.currentQuestion!;
  const q = cq.question;
  const players = roomState.players.filter(p => !p.isHost);

  const allParticipants = roomState.players;
  const expectedVoters = allParticipants.filter(p =>
    cq.answers.some(a => a.playerId !== p.id)
  );
  const votesIn = cq.votesSubmitted?.length ?? 0;
  const totalVoters = expectedVoters.length;
  const hasVoted = cq.votesSubmitted?.includes(myPlayerId ?? '') ?? false;
  const winnerAnswer = cq.answers.find(a => a.isCorrect === true);
  const iAmAnswerer = cq.answers.some(a => a.playerId === myPlayerId);

  return (
    <div className="voting-view">
      <div className="voting-view__header">
        <span className="voting-view__title">
          {q.type === 'odd-one-out' ? '🗳️ Vote for the Odd One Out!' : '🗳️ Vote for the Best!'}
        </span>
        <span className="voting-view__progress">{votesIn} / {totalVoters} voted</span>
      </div>

      {q.type === 'memefy' && 'imageUrl' in q && (
        <img src={(q as any).imageUrl} className="voting-view__question-img" alt="meme template" />
      )}

      {!winnerAnswer ? (
        <>
          {hasVoted ? (
            <div className="voting-view__voted-msg">✓ Vote cast! Waiting for others…</div>
          ) : (
            <p className="voting-view__subtitle">
              {q.type === 'odd-one-out'
                ? "Select the player you think got the odd question. You can't vote for yourself."
                : iAmAnswerer
                  ? "Pick your favourite — you can't vote for your own!"
                  : 'Pick the best answer!'}
            </p>
          )}
          <div className="voting-view__grid">
            {cq.answers.map(a => {
              const player = players.find(p => p.id === a.playerId);
              const isOwn = a.playerId === myPlayerId;
              const canVote = !hasVoted && !isOwn;
              return (
                <div
                  key={a.playerId}
                  className={`voting-item${canVote ? ' voting-item--selectable' : ''}${isOwn ? ' voting-item--own' : ''}`}
                  style={{ cursor: canVote ? 'pointer' : 'default' }}
                  onClick={() => canVote && onVote(a.playerId)}
                >
                  <div className="voting-player-name">
                    {player?.name ?? '?'}{isOwn ? ' (yours)' : ''}
                  </div>
                  <div className="voting-answer">{renderAnswer(a.answer, q)}</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="voting-view__grid">
          {[...cq.answers].sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0)).map(a => {
            const player = players.find(p => p.id === a.playerId);
            const voteCount = a.votes?.length ?? 0;
            const isWinner = a.isCorrect === true;
            return (
              <div key={a.playerId} className={`voting-item${isWinner ? ' winner' : ''}`}>
                <div className="voting-player-name">
                  {player?.name ?? '?'}{isWinner ? ' 🏆' : ''}
                </div>
                <div className="voting-answer">{renderAnswer(a.answer, q)}</div>
                <div className="voting-vote-count">{voteCount} vote{voteCount !== 1 ? 's' : ''}</div>
                {isWinner && <div className="voting-winner-badge">Winner!</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Player grid (question selection) ─────────────────────────────────────────

function PlayerGrid({ roomState, isMyTurn, onSelect }: {
  roomState: RoomState;
  isMyTurn: boolean;
  onSelect: (cellId: string) => void;
}) {
  const POINT_VALUES = [200, 400, 600, 800, 1000];
  const board = roomState.game.boards[roomState.currentBoardIndex] ?? roomState.game.boards[0];
  const totalBoards = roomState.game.boards.length;

  return (
    <div className="jeopardy-grid-wrapper">
      {totalBoards > 1 && (
        <div className="board-indicator">
          Board {roomState.currentBoardIndex + 1} of {totalBoards}
        </div>
      )}
      <div className="jeopardy-grid">
        {/* Headers */}
        <div className="grid-row grid-row--header">
          {board.categories.map((cat, i) => (
            <div key={i} className="grid-cell grid-cell--category">
              <span>{cat}</span>
            </div>
          ))}
        </div>
        {board.grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map(cell => (
              <div
                key={cell.id}
                className={`grid-cell grid-cell--player-q ${cell.played ? 'played' : ''} ${isMyTurn && !cell.played && cell.question ? 'selectable' : ''}`}
                onClick={() => !cell.played && isMyTurn && cell.question && onSelect(cell.id)}
              >
                {cell.played ? (
                  <span className="played-x">✕</span>
                ) : (
                  <span className="points-value">{POINT_VALUES[rowIndex]}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
