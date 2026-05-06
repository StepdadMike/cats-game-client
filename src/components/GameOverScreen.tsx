import type { RoomState } from '../types';

interface Props {
  roomState: RoomState;
  myPlayerId?: string | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = ['180px', '140px', '100px'];
const PODIUM_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

export default function GameOverScreen({ roomState, myPlayerId }: Props) {
  const top3 = roomState.rankings.slice(0, 3);
  const rest = roomState.rankings.slice(3);

  // Podium order: 2nd, 1st, 3rd for visual height
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumPositions = [1, 0, 2]; // indices in top3

  return (
    <div className="game-over">
      <div className="game-over__bg" />
      <div className="game-over__content">
        <h1 className="game-over__title">Game Over!</h1>

        {/* Podium */}
        <div className="podium">
          {podiumOrder.map((player, vi) => {
            const rank = podiumPositions[vi];
            const isMe = player?.id === myPlayerId;
            if (!player) return null;
            return (
              <div key={player.id} className={`podium-slot podium-slot--${rank + 1} ${isMe ? 'podium-slot--me' : ''}`}>
                <div className="podium-player">
                  <div className="podium-medal">{MEDALS[rank]}</div>
                  <div className="podium-name">
                    {player.nameImageData
                      ? <img src={player.nameImageData} className="podium-name-img" alt={player.name} />
                      : <span>{player.name}</span>
                    }
                  </div>
                  <div className="podium-score">{player.score} pts</div>
                </div>
                <div
                  className="podium-block"
                  style={{
                    height: PODIUM_HEIGHTS[rank],
                    background: PODIUM_COLORS[rank],
                  }}
                >
                  <span className="podium-rank">#{rank + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of rankings */}
        {rest.length > 0 && (
          <div className="game-over__rest">
            {rest.map((player, i) => (
              <div key={player.id} className={`rest-row ${player.id === myPlayerId ? 'rest-row--me' : ''}`}>
                <span className="rest-rank">#{i + 4}</span>
                <span className="rest-name">{player.name}</span>
                <span className="rest-score">{player.score} pts</span>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn btn--primary btn--lg"
          onClick={() => window.location.href = '/'}
          style={{ marginTop: 32 }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
