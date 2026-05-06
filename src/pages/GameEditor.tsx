import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../context/GameStoreContext';
import { createEmptyBoard } from '../context/GameStoreContext';
import type { Game, Board, GridCell, Question, QuestionType } from '../types';
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_COLORS } from '../types';
import QuestionEditorModal from '../components/editors/QuestionEditorModal';

export default function GameEditor() {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGame, updateGame } = useGameStore();
  const navigate = useNavigate();

  const game = getGame(gameId!);
  if (!game) return <div className="page"><p>Game not found</p></div>;

  return <Editor game={game} onSave={updateGame} onBack={() => navigate('/host')} />;
}

function Editor({ game: initialGame, onSave, onBack }: {
  game: Game;
  onSave: (g: Game) => void;
  onBack: () => void;
}) {
  const [game, setGame] = useState<Game>(initialGame);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);
  const [editingCell, setEditingCell] = useState<GridCell | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [dragType, setDragType] = useState<QuestionType | null>(null);

  const activeBoard = game.boards[activeBoardIndex] ?? game.boards[0];

  const updateGame = useCallback((updated: Game) => {
    setGame(updated);
    onSave(updated);
  }, [onSave]);

  const updateBoard = useCallback((boardId: string, updated: Board) => {
    updateGame({
      ...game,
      boards: game.boards.map(b => b.id === boardId ? updated : b),
    });
  }, [game, updateGame]);

  const handleCategoryChange = (colIndex: number, value: string) => {
    const cats = [...activeBoard.categories] as Board['categories'];
    cats[colIndex] = value;
    updateBoard(activeBoard.id, { ...activeBoard, categories: cats });
  };

  const handleCellClick = (cell: GridCell) => {
    setEditingCell(cell);
  };

  const handleSaveQuestion = (question: Question | null) => {
    if (!editingCell) return;
    const newGrid = activeBoard.grid.map(row =>
      row.map(cell => cell.id === editingCell.id ? { ...cell, question } : cell)
    );
    updateBoard(activeBoard.id, { ...activeBoard, grid: newGrid });
    setEditingCell(null);
  };

  const handleRowPointsChange = (rowIndex: number, value: number) => {
    const pts = Math.max(0, value || 0);
    const newRowPoints = [...activeBoard.rowPoints] as Board['rowPoints'];
    newRowPoints[rowIndex] = pts;
    // Sync points on all existing questions in this row
    const newGrid = activeBoard.grid.map((row, rIdx) =>
      rIdx !== rowIndex ? row : row.map(cell =>
        cell.question ? { ...cell, question: { ...cell.question, points: pts } } : cell
      )
    );
    updateBoard(activeBoard.id, { ...activeBoard, rowPoints: newRowPoints, grid: newGrid });
  };

  const handleDragStart = (type: QuestionType) => setDragType(type);

  const handleDrop = (cell: GridCell) => {
    if (!dragType) return;
    setDragOverCell(null);
    setEditingCell(cell);
  };

  const handleAddBoard = () => {
    const newBoard = createEmptyBoard();
    const updated = { ...game, boards: [...game.boards, newBoard] };
    updateGame(updated);
    setActiveBoardIndex(updated.boards.length - 1);
  };

  const handleDeleteBoard = (index: number) => {
    if (game.boards.length <= 1) return;
    const updated = {
      ...game,
      boards: game.boards.filter((_, i) => i !== index),
    };
    updateGame(updated);
    setActiveBoardIndex(Math.min(index, updated.boards.length - 1));
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <h1 className="page-title">Editing: {game.name}</h1>
        <span className="save-indicator">Auto-saved</span>
      </div>

      <div className="editor-layout">
        {/* Sidebar */}
        <aside className="editor-sidebar">
          <h3 className="sidebar-title">Question Types</h3>
          <p className="sidebar-hint">Drag onto grid or click a cell</p>
          <div className="question-palette">
            {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([type, label]) => (
              <div
                key={type}
                className="palette-item"
                style={{ borderColor: QUESTION_TYPE_COLORS[type] }}
                draggable
                onDragStart={() => handleDragStart(type)}
              >
                <span className="palette-item__dot" style={{ background: QUESTION_TYPE_COLORS[type] }} />
                {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Grid area */}
        <div className="editor-grid-wrapper">
          {/* Board tabs */}
          <div className="board-tabs">
            {game.boards.map((board, i) => (
              <div key={board.id} className={`board-tab ${i === activeBoardIndex ? 'board-tab--active' : ''}`}>
                <button
                  className="board-tab__label"
                  onClick={() => setActiveBoardIndex(i)}
                >
                  Board {i + 1}
                </button>
                {game.boards.length > 1 && (
                  <button
                    className="board-tab__delete"
                    title="Delete this board"
                    onClick={() => handleDeleteBoard(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button className="board-tab board-tab--add" onClick={handleAddBoard}>
              + Add Board
            </button>
          </div>

          <div className="jeopardy-grid">
            {/* Category headers */}
            <div className="grid-row grid-row--header">
              <div className="grid-cell grid-cell--corner" />
              {activeBoard.categories.map((cat, i) => (
                <div key={i} className="grid-cell grid-cell--category">
                  <input
                    className="category-input"
                    value={cat}
                    onChange={e => handleCategoryChange(i, e.target.value)}
                    placeholder={`Category ${i + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Question rows */}
            {activeBoard.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                <div className="grid-cell grid-cell--points grid-cell--points-edit">
                  <input
                    className="points-edit-input"
                    type="number"
                    min={0}
                    step={100}
                    value={activeBoard.rowPoints[rowIndex]}
                    onChange={e => handleRowPointsChange(rowIndex, parseInt(e.target.value, 10))}
                  />
                </div>
                {row.map(cell => (
                  <div
                    key={cell.id}
                    className={`grid-cell grid-cell--question ${dragOverCell === cell.id ? 'drag-over' : ''} ${cell.question ? 'has-question' : ''}`}
                    onClick={() => handleCellClick(cell)}
                    onDragOver={e => { e.preventDefault(); setDragOverCell(cell.id); }}
                    onDragLeave={() => setDragOverCell(null)}
                    onDrop={() => handleDrop(cell)}
                  >
                    {cell.question ? (
                      <div className="cell-filled" style={{ background: QUESTION_TYPE_COLORS[cell.question.type] }}>
                        <span className="cell-type-label">{QUESTION_TYPE_LABELS[cell.question.type]}</span>
                        <span className="cell-preview">{cell.question.prompt.slice(0, 40)}{cell.question.prompt.length > 40 ? '…' : ''}</span>
                      </div>
                    ) : (
                      <div className="cell-empty"><span>+</span></div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingCell && (
        <QuestionEditorModal
          cell={editingCell}
          initialType={dragType ?? editingCell.question?.type ?? 'multiple-choice'}
          points={activeBoard.rowPoints[editingCell.rowIndex] ?? 200}
          onSave={handleSaveQuestion}
          onClose={() => { setEditingCell(null); setDragType(null); }}
        />
      )}
    </div>
  );
}
