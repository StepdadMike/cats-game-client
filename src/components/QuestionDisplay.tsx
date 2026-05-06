import type { Question, WaveState } from '../types';

interface Props {
  question: Question;
  waveState?: WaveState;
  myPlayerId?: string | null;
}

export default function QuestionDisplay({ question, waveState, myPlayerId }: Props) {
  return (
    <div className="question-display">
      <div className="question-prompt">{question.prompt}</div>
      <div className="question-points">{question.points} points</div>
      <QuestionBody question={question} waveState={waveState} myPlayerId={myPlayerId} />
    </div>
  );
}

function QuestionBody({ question, waveState, myPlayerId }: Props) {
  switch (question.type) {
    case 'multiple-choice':
      return question.imageUrl ? (
        <div className="guess-image-display">
          <img src={question.imageUrl} className="question-image" alt="question" />
        </div>
      ) : null;

    case 'either-or':
      return null; // options are shown directly in AnswerInput

    case 'guess-image':
      return (
        <div className="guess-image-display">
          <img src={question.imageUrl} className="question-image" alt="question" />
        </div>
      );

    case 'guess-audio':
      return (
        <div className="guess-audio-display">
          <div className="audio-icon">🎵</div>
          <audio controls src={question.audioUrl} className="question-audio" />
        </div>
      );

    case 'guess-waves':
      if (!waveState) return null;
      const currentHint = question.hints[waveState.currentWave];
      if (!currentHint) return <div className="wave-no-hint">No more hints</div>;
      return (
        <div className="wave-hint-display">
          <div className="wave-counter">Hint {waveState.currentWave + 1} / {question.hints.length}</div>
          {currentHint.type === 'image' && (
            <img src={currentHint.content} className="question-image" alt={`hint ${waveState.currentWave + 1}`} />
          )}
          {currentHint.type === 'audio' && (
            <audio controls src={currentHint.content} className="question-audio" />
          )}
          {currentHint.type === 'drawing' && (
            <img src={currentHint.content} className="question-image wb-hint" alt="drawing hint" />
          )}
          <div className="buzz-indicator">
            {(waveState.awaitingBuzzAnswers ?? []).includes(myPlayerId ?? '')
              ? <span className="buzzed-badge">You buzzed in — answer now!</span>
              : (waveState.lockedOutIds ?? []).includes(myPlayerId ?? '')
              ? <span className="buzzed-badge">You answered this wave</span>
              : <span className="buzz-prompt">Press BUZZ to answer now!</span>
            }
          </div>
        </div>
      );

    case 'draw-this':
      return (
        <div className="draw-this-display">
          <div className="draw-icon">✏️</div>
          <p>Draw on your whiteboard!</p>
        </div>
      );

    case 'memefy':
      return (
        <div className="memefy-display">
          <img src={question.imageUrl} className="question-image meme-image" alt="meme template" />
          <p className="memefy-hint">Write your funniest caption on your whiteboard!</p>
        </div>
      );

    case 'timeline':
      return (
        <div className="timeline-display">
          <p className="timeline-display-hint">📅 Arrange the events in chronological order below.</p>
        </div>
      );

    default:
      return null;
  }
}
