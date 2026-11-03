"use client";

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GamePhase, Hint, Movie, Player } from '@/types';
import { createPlayers, pickRandom } from '@/lib/game';
import { ApiError, fetchKeywords, fetchRandomMovie, type ApiErrorKind } from '@/lib/api';
import { RESERVE_MOVIES } from '@/lib/reserve';
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
    error: ApiErrorKind | null;
    /** Películas elegidas a mano. Si está vacía, se busca una al azar en TMDB. */
    customPool: Movie[];
    setCustomPool: (movies: Movie[]) => void;
    startGame: (settings: GameSettings) => Promise<void>;
    startWithReserve: (settings: GameSettings) => void;
    /** Reparte otra película con los ajustes de la partida que acaba de terminar. */
    playAgain: () => Promise<void>;
    nextPlayer: () => void;
    revealImpostor: () => void;
    resetGame: () => void;
    clearError: () => void;
}

const INITIAL_STATE: GameState = {
    phase: 'SETUP',
    players: [],
    currentPlayerIndex: 0,
    movie: null,
    hints: [],
};

const GameContext = createContext<GameContextValue | null>(null);

/** Elige al azar evitando repetir la película anterior si hay alternativa. */
function pickOther(movies: readonly Movie[], previous: Movie | null): Movie {
    const others = movies.filter((movie) => movie.id !== previous?.id);
    return pickRandom(others.length > 0 ? others : movies);
}

async function chooseMovie(settings: GameSettings, customPool: Movie[], previous: Movie | null): Promise<Movie> {
    if (customPool.length === 0) return fetchRandomMovie(settingsToFilters(settings));

    // Las películas de la selección no traen palabras clave: se piden solo si hacen falta.
    const movie = pickOther(customPool, previous);
    if (!settings.hints.includes('KEYWORDS')) return movie;
    // Son solo una pista: si no se pueden pedir, la partida sigue sin ellas.
    const keywords = await fetchKeywords(movie.id).catch(() => []);
    return { ...movie, keywords };
}

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GameState>(INITIAL_STATE);
    const [lastSettings, setLastSettings] = useState<GameSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiErrorKind | null>(null);
    const [customPool, setCustomPool] = useState<Movie[]>([]);

    const deal = (settings: GameSettings, movie: Movie) => {
        setLastSettings(settings);
        setState({
            phase: 'TURN',
            players: createPlayers(settings.playerCount),
            currentPlayerIndex: 0,
            movie,
            hints: settings.hints,
        });
    };

    const startGame = async (settings: GameSettings) => {
        setIsLoading(true);
        setError(null);
        try {
            deal(settings, await chooseMovie(settings, customPool, state.movie));
        } catch (err) {
            setState(INITIAL_STATE);
            setError(err instanceof ApiError ? err.kind : 'server');
        } finally {
            setIsLoading(false);
        }
    };

    const startWithReserve = (settings: GameSettings) => {
        setError(null);
        deal(settings, pickOther(RESERVE_MOVIES, state.movie));
    };

    const playAgain = async () => {
        if (lastSettings) await startGame(lastSettings);
    };

    const nextPlayer = () => {
        setState((prev) => {
            const next = prev.currentPlayerIndex + 1;
            return next < prev.players.length
                ? { ...prev, currentPlayerIndex: next }
                : { ...prev, phase: 'TABLE' };
        });
    };

    const revealImpostor = () => setState((prev) => ({ ...prev, phase: 'RESULT' }));

    const resetGame = () => {
        setState(INITIAL_STATE);
        setError(null);
    };

    return (
        <GameContext.Provider
            value={{
                ...state,
                isLoading,
                error,
                customPool,
                setCustomPool,
                startGame,
                startWithReserve,
                playAgain,
                nextPlayer,
                revealImpostor,
                resetGame,
                clearError: () => setError(null),
            }}
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
