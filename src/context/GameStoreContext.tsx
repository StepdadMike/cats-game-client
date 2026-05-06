import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Game, Board, GridCell } from '../types';

const STORAGE_KEY = 'party-game:games';

export function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({
      id: uuidv4(),
      rowIndex: row,
      colIndex: col,
      question: null,
      played: false,
    }))
  );
}

const DEFAULT_ROW_POINTS: [number, number, number, number, number] = [200, 400, 600, 800, 1000];

export function createEmptyBoard(): Board {
  return {
    id: uuidv4(),
    categories: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'],
    grid: createEmptyGrid(),
    rowPoints: [...DEFAULT_ROW_POINTS] as [number, number, number, number, number],
  };
}

function migrateBoard(raw: any): Board {
  return {
    id: raw.id ?? uuidv4(),
    categories: raw.categories,
    grid: raw.grid,
    rowPoints: raw.rowPoints ?? ([...DEFAULT_ROW_POINTS] as [number, number, number, number, number]),
  };
}

// Migrate games saved in the old format (categories + grid at top level)
function migrateGame(raw: any): Game {
  if (raw.boards) {
    return { ...raw, boards: raw.boards.map(migrateBoard) } as Game;
  }
  return {
    id: raw.id,
    name: raw.name,
    boards: [migrateBoard({ id: uuidv4(), categories: raw.categories, grid: raw.grid })],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function loadGames(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: any[] = raw ? JSON.parse(raw) : [];
    return parsed.map(migrateGame);
  } catch {
    return [];
  }
}

function saveGames(games: Game[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

interface GameStoreCtx {
  games: Game[];
  createGame: (name: string) => Game;
  updateGame: (game: Game) => void;
  deleteGame: (id: string) => void;
  getGame: (id: string) => Game | undefined;
}

const GameStoreContext = createContext<GameStoreCtx | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>(() => loadGames());

  const createGame = useCallback((name: string): Game => {
    const game: Game = {
      id: uuidv4(),
      name,
      boards: [createEmptyBoard()],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setGames(prev => {
      const next = [...prev, game];
      saveGames(next);
      return next;
    });
    return game;
  }, []);

  const updateGame = useCallback((game: Game) => {
    setGames(prev => {
      const next = prev.map(g => g.id === game.id ? { ...game, updatedAt: Date.now() } : g);
      saveGames(next);
      return next;
    });
  }, []);

  const deleteGame = useCallback((id: string) => {
    setGames(prev => {
      const next = prev.filter(g => g.id !== id);
      saveGames(next);
      return next;
    });
  }, []);

  const getGame = useCallback((id: string) => games.find(g => g.id === id), [games]);

  return (
    <GameStoreContext.Provider value={{ games, createGame, updateGame, deleteGame, getGame }}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
  return ctx;
}
