import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameStoreProvider } from './context/GameStoreContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Landing from './pages/Landing';
import GamesView from './pages/GamesView';
import GameEditor from './pages/GameEditor';
import HostRoom from './pages/HostRoom';
import NameEntry from './pages/NameEntry';
import PlayerRoom from './pages/PlayerRoom';

export default function App() {
  return (
    <GameStoreProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/host" element={<GamesView />} />
            <Route path="/host/game/:gameId" element={<GameEditor />} />
            <Route path="/host/room/:seed" element={<HostRoom />} />
            <Route path="/room/:seed/name" element={<NameEntry />} />
            <Route path="/room/:seed" element={<PlayerRoom />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </GameStoreProvider>
  );
}
