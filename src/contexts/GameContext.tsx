"use client";

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GamePhase, Hint, Movie, Player } from '@/types';
import { createPlayers, pickRandom } from '@/lib/game';
import { fetchKeywords, fetchRandomMovie } from '@/lib/api';
import { settingsToFilters, type GameSettings } from '@/lib/settings';

interface GameState {
    phase: GamePhase;
    players: Player[];
    currentPlayerIndex: number;
    movie: Movie | null;
    hints: Hint[];
}

interface GameContextValue extends GameState {
    isLoading: boolean;
    error: string | null;
    /** Películas elegidas a mano. Si está vacía, se busca una al azar en TMDB. */
    customPool: Movie[];
    setCustomPool: (movies: Movie[]) => void;
    startGame: (settings: GameSettings) => Promise<void>;
    nextPlayer: () => void;
    resetGame: () => void;
}

const INITIAL_STATE: GameState = {
    phase: 'SETUP',
    players: [],
    currentPlayerIndex: 0,
    movie: null,
    hints: [],
};

const GameContext = createContext<GameContextValue | null>(null);

async function chooseMovie(settings: GameSettings, customPool: Movie[]): Promise<Movie> {
    if (customPool.length === 0) return fetchRandomMovie(settingsToFilters(settings));

    // Las películas de la selección no traen palabras clave: se piden solo si hacen falta.
    const movie = pickRandom(customPool);
    if (!settings.hints.includes('KEYWORDS')) return movie;
    return { ...movie, keywords: await fetchKeywords(movie.id) };
}

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GameState>(INITIAL_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customPool, setCustomPool] = useState<Movie[]>([]);

    const startGame = async (settings: GameSettings) => {
        setIsLoading(true);
        setError(null);
        try {
            const movie = await chooseMovie(settings, customPool);
            setState({
                phase: 'PASS_DEVICE',
                players: createPlayers(settings.playerCount),
                currentPlayerIndex: 0,
                movie,
                hints: settings.hints,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se ha podido cargar la película');
        } finally {
            setIsLoading(false);
        }
    };

    const nextPlayer = () => {
        setState((prev) => {
            const next = prev.currentPlayerIndex + 1;
            return next < prev.players.length
                ? { ...prev, currentPlayerIndex: next }
                : { ...prev, phase: 'PLAYING' };
        });
    };

    const resetGame = () => {
        setState(INITIAL_STATE);
        setError(null);
    };

    return (
        <GameContext.Provider
            value={{ ...state, isLoading, error, customPool, setCustomPool, startGame, nextPlayer, resetGame }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame debe usarse dentro de GameProvider');
    return context;
}
