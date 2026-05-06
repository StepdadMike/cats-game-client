import type { Player, PlayerAnswer, AnswerValue, Question, MultipleChoiceQuestion, EitherOrQuestion } from '../types';

interface Props {
  player: Player;
  isSelected?: boolean;
  isCurrent?: boolean;
  hasAnswered?: boolean;
  isFlipped?: boolean;
  answer?: PlayerAnswer;
  showAnswer?: boolean;
  isMe?: boolean;
  question?: Question;
}

function renderAnswerPreview(answer: AnswerValue, question?: Question): React.ReactNode {
  switch (answer.type) {
    case 'drawing':
      return <img src={answer.value} className="wb-answer-img" alt="answer" />;
    case 'image-url':
      return <img src={answer.value} className="wb-answer-img" alt="answer" />;
    case 'choice': {
      if (question?.type === 'multiple-choice') {
        const mc = question as MultipleChoiceQuestion;
        const text = mc.options[answer.value];
        if (text) return <span className="wb-answer-text">{text}</span>;
      }
      return <span className="wb-answer-text">Option {answer.value + 1}</span>;
    }
    case 'ab': {
      if (question?.type === 'either-or') {
        const eo = question as EitherOrQuestion;
        return <span className="wb-answer-text">{answer.value === 'A' ? eo.optionA : eo.optionB}</span>;
      }
      return <span className="wb-answer-text">{answer.value}</span>;
    }
    case 'text':
      return <span className="wb-answer-text">{answer.value}</span>;
    default:
      return null;
  }
}

export default function PlayerCard({
  player,
  isSelected,
  isCurrent,
  hasAnswered,
  isFlipped,
  answer,
  showAnswer,
  isMe,
  question,
}: Props) {
  return (
    <div
      className={`player-card ${isSelected ? 'player-card--selected' : ''} ${isCurrent ? 'player-card--current' : ''} ${isMe ? 'player-card--me' : ''} ${!player.isConnected ? 'player-card--disconnected' : ''}`}
    >
      <div className={`whiteboard ${isFlipped ? 'whiteboard--flipped' : ''}`}>
        <div className="whiteboard__inner">
          {/* Front: name */}
          <div className="whiteboard__face whiteboard__face--front">
            <div className="whiteboard__frame">
              {player.nameImageData ? (
                <img src={player.nameImageData} className="wb-name-img" alt={player.name} />
              ) : (
                <span className="wb-name-text">{player.name}</span>
              )}
            </div>
          </div>
          {/* Back: answer */}
          <div className="whiteboard__face whiteboard__face--back">
            <div className="whiteboard__frame whiteboard__frame--answer">
              {answer ? (
                <>
                  {renderAnswerPreview(answer.answer, question)}
                  {answer.isCorrect !== undefined && (
                    <div className={`answer-result ${answer.isCorrect ? 'answer-result--correct' : 'answer-result--wrong'}`}>
                      {answer.isCorrect ? `+${answer.pointsAwarded}` : '✗'}
                    </div>
                  )}
                </>
              ) : (
                <span className="wb-no-answer">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info below card */}
      <div className="player-card__info">
        <div className="player-card__name">{player.name}{isMe ? ' (you)' : ''}</div>
        <div className="player-card__score">{player.score} pts</div>
        {hasAnswered && !isFlipped && (
          <div className="player-card__badge player-card__badge--answered">✓</div>
        )}
        {!player.isConnected && (
          <div className="player-card__badge player-card__badge--disconnected">⚡ offline</div>
        )}
      </div>
    </div>
  );
}
