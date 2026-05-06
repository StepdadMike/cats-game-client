import {
  createContext, useContext, useEffect, useRef, useState,
  useCallback, ReactNode,
} from 'react';
import type { ClientMessage, ServerMessage, RoomState, Player } from '../types';

const SERVER_URL = import.meta.env.VITE_WS_URL;
const WS_URL = SERVER_URL
  ? SERVER_URL
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:3001/ws`;

interface WSCtx {
  isConnected: boolean;
  roomState: RoomState | null;
  myPlayerId: string | null;
  send: (msg: ClientMessage) => void;
  lastMessage: ServerMessage | null;
}

const WebSocketContext = createContext<WSCtx | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() =>
    sessionStorage.getItem('party-game:playerId')
  );
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    let socket: WebSocket;
    try {
      socket = new WebSocket(WS_URL);
    } catch {
      setTimeout(connect, 5000);
      return;
    }
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2s
      setTimeout(connect, 2000);
    };

    socket.onmessage = (event) => {
      let msg: ServerMessage;
      try { msg = JSON.parse(event.data); } catch { return; }

      setLastMessage(msg);

      switch (msg.type) {
        case 'ROOM_CREATED':
          setMyPlayerId(msg.playerId);
          sessionStorage.setItem('party-game:playerId', msg.playerId);
          sessionStorage.setItem('party-game:roomSeed', msg.roomSeed);
          setRoomState(msg.roomState);
          break;
        case 'ROOM_JOINED':
          setMyPlayerId(msg.playerId);
          sessionStorage.setItem('party-game:playerId', msg.playerId);
          setRoomState(msg.roomState);
          break;
        case 'ROOM_STATE_UPDATE':
          setRoomState(msg.roomState);
          break;
        case 'TIMER_TICK':
          setRoomState(prev => prev ? { ...prev, timerSeconds: msg.timeLeft } : prev);
          break;
        case 'GAME_OVER':
          setRoomState(prev => prev ? { ...prev, phase: 'game-over', rankings: msg.rankings } : prev);
          break;
      }
    };

    socket.onerror = () => socket.close();
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, roomState, myPlayerId, send, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWS() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWS must be used within WebSocketProvider');
  return ctx;
}
