import type { RoomState, PlayerAnswer, AnswerValue, Question, TimelineQuestion, MultipleChoiceQuestion, EitherOrQuestion } from '../types';

interface Props {
  roomState: RoomState;
  myPlayerId: string | null;
  onGrade: (playerId: string, isCorrect: boolean) => void;
  onNext: () => void;
  onEnd: () => void;
  onCastVote: (votedForPlayerId: string) => void;
  onNextWave: () => void;
}

export function renderAnswer(answer: AnswerValue, question?: Question): React.ReactNode {
  switch (answer.type) {
    case 'drawing':
      return <img src={answer.value} className="review-answer-img" alt="drawing" />;
    case 'image-url':
      return <img src={answer.value} className="review-answer-img" alt="submitted" />;
    case 'choice': {
      if (question?.type === 'multiple-choice') {
        const mc = question as MultipleChoiceQuestion;
        const text = mc.options[answer.value];
        if (text) return <span className="review-text-answer">{text}</span>;
      }
      return <span className="review-text-answer">Option {answer.value + 1}</span>;
    }
    case 'ab': {
      if (question?.type === 'either-or') {
        const eo = question as EitherOrQuestion;
        return <span className="review-text-answer">{answer.value === 'A' ? eo.optionA : eo.optionB}</span>;
      }
      return <span className="review-text-answer">{answer.value}</span>;
    }
    case 'text':
      return <span className="review-text-answer">{answer.value}</span>;
    case 'order': {
      const eventMap = question?.type === 'timeline'
        ? new Map((question as TimelineQuestion).events.map(e => [e.id, e.label]))
        : new Map<string, string>();
      return (
        <div className="review-order-answer">
          {answer.value.map((id, i) => (
            <div key={id} className="review-order-item">
              <span className="review-order-num">{i + 1}</span>
              {eventMap.get(id) ?? id}
            </div>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}

export default function ReviewPanel({ roomState, myPlayerId, onGrade, onNext, onEnd, onCastVote, onNextWave }: Props) {
  const cq = roomState.currentQuestion!;
  const q = cq.question;
  const players = roomState.players.filter(p => !p.isHost);
  const waveState = cq.waveState;
  const isWaveReview = waveState?.isReviewingWave ?? false;

  // ── Voting phase ──────────────────────────────────────────────────
  if (cq.phase === 'voting') {
    const allParticipants = roomState.players;
    const expectedVoters = allParticipants.filter(p =>
      cq.answers.some(a => a.playerId !== p.id)
    );
    const votesIn = cq.votesSubmitted?.length ?? 0;
    const totalVoters = expectedVoters.length;
    const hasVoted = cq.votesSubmitted?.includes(myPlayerId ?? '') ?? false;
    const winnerAnswer = cq.answers.find(a => a.isCorrect === true);

    return (
      <div className="review-panel">
        <div className="review-panel__header">
          <h3 className="review-title">🗳️ Voting</h3>
          <div className="review-progress">{votesIn} / {totalVoters} voted</div>
        </div>

        {q.type === 'memefy' && 'imageUrl' in q && (
          <img src={(q as any).imageUrl} className="review-question-img" alt="question" />
        )}

        {!winnerAnswer ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
              {hasVoted ? '✓ Your vote is in! Waiting for others…' : 'Click an answer to vote:'}
            </p>
            <div className="voting-gallery">
              {cq.answers.map(a => {
                const player = players.find(p => p.id === a.playerId);
                const isOwn = a.playerId === myPlayerId;
                const canVote = !hasVoted && !isOwn;
                return (
                  <div
                    key={a.playerId}
                    className={`voting-item${canVote ? ' voting-item--selectable' : ''}${isOwn ? ' voting-item--own' : ''}`}
                    style={{ cursor: canVote ? 'pointer' : 'default' }}
                    onClick={() => canVote && onCastVote(a.playerId)}
                  >
                    <div className="voting-player-name">{player?.name ?? '?'}</div>
                    <div className="voting-answer">{renderAnswer(a.answer, q)}</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="voting-gallery">
              {[...cq.answers].sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0)).map(a => {
                const player = players.find(p => p.id === a.playerId);
                const voteCount = a.votes?.length ?? 0;
                const isWinner = a.isCorrect === true;
                return (
                  <div key={a.playerId} className={`voting-item${isWinner ? ' winner' : ''}`}>
                    <div className="voting-player-name">{player?.name ?? '?'}</div>
                    <div className="voting-answer">{renderAnswer(a.answer, q)}</div>
                    <div className="voting-vote-count">{voteCount} vote{voteCount !== 1 ? 's' : ''}</div>
                    {isWinner && <div className="voting-winner-badge">🏆 Winner!</div>}
                  </div>
                );
              })}
            </div>
            <button className="btn btn--primary btn--lg" onClick={onEnd}>
              Continue Game →
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Wave review mode ──────────────────────────────────────────────
  if (isWaveReview && waveState) {
    const waveAnswers = cq.answers.filter(a => a.wave === waveState.currentWave);
    const idx = waveState.waveReviewIndex;
    const current = waveAnswers[idx];
    const currentPlayer = current ? players.find(p => p.id === current.playerId) : undefined;
    const allReviewed = idx >= waveAnswers.length;
    const moreWaves = waveState.currentWave + 1 < waveState.totalWaves;

    return (
      <div className="review-panel">
        <div className="review-panel__header">
          <h3 className="review-title">Wave {waveState.currentWave + 1} — Answers</h3>
          <div className="review-progress">{Math.max(0, idx) + 1} / {waveAnswers.length}</div>
        </div>

        {idx === -1 && (
          <div className="review-start">
            {waveAnswers.length === 0
              ? <p>No one buzzed this wave.</p>
              : <p>{waveAnswers.length} player{waveAnswers.length !== 1 ? 's' : ''} buzzed in. Review their answers:</p>
            }
            <button className="btn btn--primary btn--lg" onClick={waveAnswers.length === 0 ? (moreWaves ? onNextWave : onEnd) : onNext}>
              {waveAnswers.length === 0 ? (moreWaves ? 'Next Hint →' : 'End Question (No Winner)') : 'Show First →'}
            </button>
          </div>
        )}

        {!allReviewed && idx >= 0 && current && currentPlayer && (
          <div className="review-current">
            <div className="review-player-name">{currentPlayer.name}</div>
            <div className="review-answer-display">{renderAnswer(current.answer, q)}</div>
            {current.isCorrect === undefined ? (
              <div className="review-grade-btns">
                <button className="btn btn--success btn--lg" onClick={() => onGrade(current.playerId, true)}>
                  ✓ Correct — question ends!
                </button>
                <button className="btn btn--danger btn--lg" onClick={() => onGrade(current.playerId, false)}>
                  ✗ Wrong
                </button>
              </div>
            ) : (
              <div className={`review-grade-result ${current.isCorrect ? 'correct' : 'wrong'}`}>
                {current.isCorrect ? `✓ Correct! +${current.pointsAwarded} pts` : '✗ Wrong'}
                <button className="btn btn--secondary" onClick={onNext} style={{ marginLeft: 12 }}>
                  {idx + 1 < waveAnswers.length ? 'Next →' : 'Done'}
                </button>
              </div>
            )}
          </div>
        )}

        {allReviewed && (
          <div className="review-done">
            <p>All wave answers reviewed — no correct answer.</p>
            <div className="review-wave-actions">
              {moreWaves ? (
                <button className="btn btn--primary btn--lg" onClick={onNextWave}>
                  Next Hint →
                </button>
              ) : (
                <button className="btn btn--secondary btn--lg" onClick={onEnd}>
                  End Question (No Winner)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Standard final review ─────────────────────────────────────────
  const isAutoGraded = q.type === 'multiple-choice' || q.type === 'either-or' || q.type === 'timeline';
  const isHostPicks = q.type === 'memefy' || q.type === 'draw-this';
  const totalAnswers = cq.answers.length;
  const reviewIndex = cq.reviewIndex;
  const currentAnswer: PlayerAnswer | undefined = cq.answers[reviewIndex];
  const currentPlayer = currentAnswer ? players.find(p => p.id === currentAnswer.playerId) : undefined;
  const allSeen = reviewIndex >= totalAnswers - 1;

  let correctAnswerText = '';
  let correctAnswerNode: React.ReactNode = null;
  if (q.type === 'multiple-choice') correctAnswerText = q.options[q.correctAnswer] ?? '';
  else if (q.type === 'either-or') correctAnswerText = q.correctAnswer === 'A' ? q.optionA : q.optionB;
  else if (q.type === 'timeline') {
    correctAnswerNode = (
      <div className="review-order-answer">
        {q.events.map((e, i) => (
          <div key={e.id} className="review-order-item">
            <span className="review-order-num">{i + 1}</span>{e.label}
          </div>
        ))}
      </div>
    );
  } else if ('correctAnswer' in q) correctAnswerText = q.correctAnswer as string;

  return (
    <div className="review-panel">
      <div className="review-panel__header">
        <h3 className="review-title">Reviewing Answers</h3>
        <div className="review-progress">{reviewIndex + 1} / {totalAnswers}</div>
      </div>

      {(correctAnswerText || correctAnswerNode) && !isHostPicks && (
        <div className="review-correct-answer">
          <span className="review-correct-label">Correct answer:</span>
          {correctAnswerText
            ? <span className="review-correct-value">{correctAnswerText}</span>
            : correctAnswerNode}
        </div>
      )}

      {reviewIndex === -1 ? (
        <div className="review-start">
          {totalAnswers === 0
            ? <p>No answers submitted.</p>
            : <p>{totalAnswers} answer{totalAnswers !== 1 ? 's' : ''}. Review one by one.</p>
          }
          <button className="btn btn--primary btn--lg" onClick={totalAnswers === 0 ? onEnd : onNext}>
            {totalAnswers === 0 ? 'Continue →' : 'Show First →'}
          </button>
        </div>
      ) : currentAnswer && currentPlayer ? (
        <div className="review-current">
          {(q.type === 'memefy' || q.type === 'guess-image') && 'imageUrl' in q && (
            <img src={(q as any).imageUrl} className="review-question-img" alt="question" />
          )}
          <div className="review-player-name">{currentPlayer.name}</div>
          <div className="review-answer-display">{renderAnswer(currentAnswer.answer, q)}</div>

          {/* Manual grading */}
          {!isAutoGraded && !isHostPicks && currentAnswer.isCorrect === undefined && (
            <div className="review-grade-btns">
              <button className="btn btn--success btn--lg" onClick={() => onGrade(currentAnswer.playerId, true)}>
                ✓ Correct (+{q.points})
              </button>
              <button className="btn btn--danger btn--lg" onClick={() => onGrade(currentAnswer.playerId, false)}>
                ✗ Wrong
              </button>
            </div>
          )}

          {/* Host-picks: browse answers one by one, then start vote */}
          {isHostPicks && (
            <div className="review-grade-btns">
              {!allSeen ? (
                <button className="btn btn--secondary btn--lg" onClick={onNext}>Next →</button>
              ) : (
                <button className="btn btn--success btn--lg" onClick={onNext}>
                  🗳️ Start Voting →
                </button>
              )}
            </div>
          )}

          {/* Auto-graded */}
          {isAutoGraded && (
            <div className="review-grade-result-auto">
              {currentAnswer.isCorrect !== undefined && (
                <div className={`review-grade-result ${currentAnswer.isCorrect ? 'correct' : 'wrong'}`}>
                  {currentAnswer.isCorrect ? `✓ Correct — +${currentAnswer.pointsAwarded} pts` : '✗ Wrong — 0 pts'}
                </div>
              )}
              <button className="btn btn--secondary btn--lg" onClick={allSeen ? onEnd : onNext}>
                {allSeen ? 'Finish' : 'Next →'}
              </button>
            </div>
          )}

          {/* Manual-graded result */}
          {!isAutoGraded && !isHostPicks && currentAnswer.isCorrect !== undefined && (
            <div className={`review-grade-result ${currentAnswer.isCorrect ? 'correct' : 'wrong'}`}>
              {currentAnswer.isCorrect ? `✓ Correct — +${currentAnswer.pointsAwarded} pts` : '✗ Wrong — 0 pts'}
              <button className="btn btn--secondary" onClick={allSeen ? onEnd : onNext} style={{ marginLeft: 12 }}>
                {allSeen ? 'Finish' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      ) : allSeen ? (
        <div className="review-done">
          <p>All answers reviewed!</p>
          {isHostPicks ? (
            <button className="btn btn--success btn--lg" onClick={onNext}>
              🗳️ Start Voting →
            </button>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={onEnd}>Continue Game →</button>
          )}
        </div>
      ) : null}

      {!isHostPicks && !isAutoGraded && !allSeen && currentAnswer?.isCorrect !== undefined && (
        <button className="btn btn--ghost btn--sm" onClick={onEnd} style={{ marginTop: 8 }}>
          Skip to next question
        </button>
      )}
    </div>
  );
}
