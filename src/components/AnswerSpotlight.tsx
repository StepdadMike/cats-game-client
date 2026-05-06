import type { RoomState } from '../types';
import { renderAnswer } from './ReviewPanel';

interface Props {
  roomState: RoomState;
  onCastVote?: (votedForPlayerId: string) => void;
  myPlayerId?: string;
}

export default function AnswerSpotlight({ roomState, onCastVote, myPlayerId }: Props) {
  const cq = roomState.currentQuestion;
  if (!cq) return null;

  const players = roomState.players.filter(p => !p.isHost);
  const currentPlayerId = myPlayerId || '';
  const waveState = cq.waveState;
  const isWaveReview = waveState?.isReviewingWave ?? false;
  const isVotingPhase = cq.phase === 'voting';

  let answer: import('../types').PlayerAnswer | undefined;
  let player: import('../types').Player | undefined;

  if (isWaveReview && waveState) {
    const waveAnswers = cq.answers.filter(a => a.wave === waveState.currentWave);
    answer = waveAnswers[waveState.waveReviewIndex];
    player = answer ? players.find(p => p.id === answer!.playerId) : undefined;
  } else if (isVotingPhase) {
    // In voting phase, show voting interface for all answers
    const hasVoted = cq.votesSubmitted?.includes(currentPlayerId) ?? false;
    const hasWinner = cq.answers.some(a => a.isCorrect === true);

    return (
      <div className="answer-spotlight">
        <div className="spotlight-label">Vote for the Best Answer</div>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>You can't vote for your own answer</p>
        <div className="voting-answers">
          {cq.answers.map(a => {
            const answerPlayer = players.find(p => p.id === a.playerId);
            const canVote = a.playerId !== currentPlayerId && !hasVoted;
            const voted = a.votes?.includes(currentPlayerId);
            const isWinner = a.isCorrect === true;
            
            return (
              <div key={a.playerId} className={`voting-answer-item ${voted ? 'voted' : ''} ${isWinner ? 'winner' : ''}`}>
                <div className="voting-answer-content">
                  {renderAnswer(a.answer, cq.question)}
                </div>
                <div className="voting-answer-info">
                  <div className="voting-player-name">{answerPlayer?.name ?? '?'}</div>
                  <div className="voting-vote-count">{a.votes?.length ?? 0} {(a.votes?.length ?? 0) === 1 ? 'vote' : 'votes'}</div>
                </div>
                {isWinner ? (
                  <div className="voting-winner-badge">🏆 Winner!</div>
                ) : canVote ? (
                  <button className="btn btn--success btn--sm" onClick={() => onCastVote?.(a.playerId)}>
                    Vote
                  </button>
                ) : voted ? (
                  <div className="voting-voted-badge">✓ Voted</div>
                ) : null}
              </div>
            );
          })}
        </div>
        {hasWinner && (
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12 }}>Voting complete! Waiting for host to continue...</p>
        )}
      </div>
    );
  } else if (roomState.phase === 'reviewing') {
    answer = cq.answers[cq.reviewIndex];
    player = answer ? players.find(p => p.id === answer!.playerId) : undefined;
  }

  if (!answer || !player) {
    return (
      <div className="answer-spotlight answer-spotlight--waiting">
        <div className="spotlight-label">Reviewing answers…</div>
        {cq.question.type === 'odd-one-out' && roomState.phase === 'reviewing' && (
          <div className="spotlight-odd-prompts">
            <div className="spotlight-odd-prompts__row">
              <strong>The question:</strong> {cq.question.prompt}
            </div>
          </div>
        )}
        {isWaveReview && waveState && (
          <div className="spotlight-wave">Wave {waveState.currentWave + 1} of {waveState.totalWaves}</div>
        )}
      </div>
    );
  }

  return (
    <div className="answer-spotlight">
      <div className="spotlight-label">
        {isWaveReview ? `Wave ${(waveState?.currentWave ?? 0) + 1} answer` : 'Reviewing'}
      </div>

      {/* Show the question prompt for odd-one-out during reviewing */}
      {cq.question.type === 'odd-one-out' && roomState.phase === 'reviewing' && (
        <div className="spotlight-odd-prompts">
          <div className="spotlight-odd-prompts__row">
            <strong>The question:</strong> {cq.question.prompt}
          </div>
        </div>
      )}

      {/* Original question image for memefy questions */}
      {cq.question.type === 'memefy' && 'imageUrl' in cq.question && (
        <img src={(cq.question as any).imageUrl} className="review-question-img" alt="meme template" />
      )}

      {/* Player nametag */}
      <div className="spotlight-player">
        {player.nameImageData
          ? <img src={player.nameImageData} className="spotlight-name-img" alt={player.name} />
          : <span className="spotlight-name-text">{player.name}</span>
        }
      </div>

      {/* Their answer — shown prominently */}
      <div className="spotlight-answer-card">
        <div className="spotlight-answer-inner">
          {renderAnswer(answer.answer, cq.question)}
        </div>

        {/* Grade result, if already decided */}
        {answer.isCorrect !== undefined && (
          <div className={`spotlight-result ${answer.isCorrect ? 'correct' : 'wrong'}`}>
            {answer.isCorrect ? `✓ Correct! +${answer.pointsAwarded} pts` : '✗ Wrong'}
          </div>
        )}
      </div>
    </div>
  );
}
