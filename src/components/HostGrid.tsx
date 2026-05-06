import type { RoomState } from '../types';
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_COLORS } from '../types';

interface Props {
  roomState: RoomState;
  onSelectQuestion?: (cellId: string) => void;
}

const POINT_VALUES = [200, 400, 600, 800, 1000];

export default function HostGrid({ roomState, onSelectQuestion }: Props) {
  const { game, phase, currentQuestion, currentBoardIndex } = roomState;
  const board = game.boards[currentBoardIndex] ?? game.boards[0];
  const totalBoards = game.boards.length;

  return (
    <div className="jeopardy-grid-wrapper">
      {totalBoards > 1 && (
        <div className="board-indicator">
          Board {currentBoardIndex + 1} of {totalBoards}
        </div>
      )}
      <div className="jeopardy-grid jeopardy-grid--host">
        {/* Category headers */}
        <div className="grid-row grid-row--header">
          <div className="grid-cell grid-cell--corner" />
          {board.categories.map((cat, i) => (
            <div key={i} className="grid-cell grid-cell--category">
              <span>{cat}</span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {board.grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            <div className="grid-cell grid-cell--points">{POINT_VALUES[rowIndex]}</div>
            {row.map(cell => {
              const isActive = currentQuestion?.cellId === cell.id;
              const color = cell.question ? QUESTION_TYPE_COLORS[cell.question.type] : undefined;

              return (
                <div
                  key={cell.id}
                  className={`grid-cell grid-cell--host-q ${cell.played ? 'played' : ''} ${!cell.question ? 'empty' : ''} ${isActive ? 'active' : ''}`}
                  style={color && !cell.played ? { borderColor: color } : undefined}
                  onClick={() => {
                    if (phase === 'player-select' && !cell.played && cell.question && onSelectQuestion) {
                      onSelectQuestion(cell.id);
                    }
                  }}
                >
                  {cell.played ? (
                    <span className="played-x">✕</span>
                  ) : !cell.question ? (
                    <span className="empty-label">Empty</span>
                  ) : (
                    <>
                      <span className="cell-type-tag" style={{ background: color }}>
                        {QUESTION_TYPE_LABELS[cell.question.type]}
                      </span>
                      <span className="cell-prompt">{cell.question.prompt.slice(0, 50)}{cell.question.prompt.length > 50 ? '…' : ''}</span>
                      <span className="cell-pts">{cell.question.points} pts</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
