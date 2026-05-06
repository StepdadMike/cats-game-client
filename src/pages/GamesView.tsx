import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../context/GameStoreContext';
import { useWS } from '../context/WebSocketContext';
import type { Game } from '../types';

export default function GamesView() {
  const { games, createGame, deleteGame } = useGameStore();
  const { send, lastMessage } = useWS();
  const navigate = useNavigate();
  const [newGameName, setNewGameName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (lastMessage?.type === 'ROOM_CREATED') {
      navigate(`/host/room/${lastMessage.roomSeed}`);
    }
  }, [lastMessage, navigate]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGameName.trim();
    if (!name) return;
    const game = createGame(name);
    setNewGameName('');
    navigate(`/host/game/${game.id}`);
  };

  const handleHost = (game: Game) => {
    send({ type: 'CREATE_ROOM', gameData: game });
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteGame(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn--ghost" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Your Games</h1>
      </div>

      <div className="games-view">
        {/* Create new game */}
        <form className="new-game-form" onSubmit={handleCreate}>
          <input
            className="input"
            value={newGameName}
            onChange={e => setNewGameName(e.target.value)}
            placeholder="New game name…"
          />
          <button type="submit" className="btn btn--primary">+ Add Game</button>
        </form>

        {/* Games list */}
        {games.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🎯</div>
            <p>No games yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="games-list">
            {games.map(game => (
              <div key={game.id} className="game-card">
                <div className="game-card__info">
                  <h3 className="game-card__name">{game.name}</h3>
                  <p className="game-card__meta">
                    {game.boards.reduce((sum, b) => sum + b.grid.flat().filter(c => c.question).length, 0)} / {game.boards.length * 25} questions filled
                    &nbsp;·&nbsp;
                    {game.boards.length} board{game.boards.length !== 1 ? 's' : ''}
                    &nbsp;·&nbsp;
                    Updated {new Date(game.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="game-card__actions">
                  <button
                    className="btn btn--success"
                    onClick={() => handleHost(game)}
                  >
                    Host Game
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => navigate(`/host/game/${game.id}`)}
                  >
                    Edit
                  </button>
                  {confirmDelete === game.id ? (
                    <div className="delete-confirm">
                      <span className="delete-confirm__warning">Cannot be undone!</span>
                      <button
                        className="btn btn--danger"
                        onClick={() => handleDelete(game.id)}
                      >
                        Confirm Delete
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--danger-ghost"
                      onClick={() => setConfirmDelete(game.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
