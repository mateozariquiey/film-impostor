"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { GamePhase, Hint, Locale, Movie, Player } from '@/types';
import { createDeal, playersWithImpostor } from '@/lib/game';
import { ApiError, fetchKeywords, fetchRandomMovie, type ApiErrorKind } from '@/lib/api';
import { addRecentMovie, loadRecentMovies, pickFresh, saveRecentMovies } from '@/lib/recentMovies';
import { isReserveMovie, reserveMovies } from '@/lib/reserve';
import { canSaveGames, clearGame, loadGame, saveGame, type SavedGame } from '@/lib/savedGame';
import { cleanName, settingsToFilters, type GameSettings } from '@/lib/settings';
import { useLocale } from './LocaleContext';

interface GameState {
    phase: GamePhase;
    players: Player[];
    currentPlayerIndex: number;
    movie: Movie | null;
    /** Quien da la primera pista en la mesa. */
    firstPlayer: number;
    /** Los ajustes con los que se repartió, para «Otra película» y para retomar. */
    settings: GameSettings | null;
}

interface GameContextValue extends Omit<GameState, 'settings'> {
    hints: Hint[];
    /** El grupo eligió un género, así que la pista es otro además de ese. La reserva no aplica los filtros. */
    genreHintIsExtra: boolean;
    /** Nombre de cada jugador, vacío si no se ha escrito. */
    names: string[];
    isLoading: boolean;
    error: ApiErrorKind | null;
    /** Películas elegidas a mano. Si está vacía, se busca una al azar en TMDB. */
    customPool: Movie[];
    setCustomPool: (movies: Movie[]) => void;
    /** Hay una partida recuperada esperando a que el grupo decida si la sigue. */
    isResuming: boolean;
    continueGame: () => void;
    /** Había una partida guardada, pero ya era demasiado antigua. */
    gameExpired: boolean;
    /** Si recargar conserva la partida. */
    canResume: boolean;
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
    firstPlayer: 0,
    settings: null,
};

const GameContext = createContext<GameContextValue | null>(null);

async function chooseMovie(settings: GameSettings, customPool: Movie[], locale: Locale, recent: readonly number[]): Promise<Movie> {
    if (customPool.length === 0) return fetchRandomMovie(settingsToFilters(settings), locale, recent);

    // Las películas de la selección no traen palabras clave: se piden solo si hacen falta.
    const movie = pickFresh(customPool, recent);
    if (!settings.hints.includes('KEYWORDS')) return movie;
    // Son solo una pista: si no se pueden pedir, la partida sigue sin ellas.
    const keywords = await fetchKeywords(movie.id).catch(() => []);
    return { ...movie, keywords };
}

function restoreState(game: SavedGame): GameState {
    return {
        phase: game.phase,
        players: playersWithImpostor(game.settings.playerCount, game.impostor),
        currentPlayerIndex: game.currentPlayerIndex,
        movie: game.movie,
        firstPlayer: game.firstPlayer,
        settings: game.settings,
    };
}

export function GameProvider({ children }: { children: ReactNode }) {
    const { locale } = useLocale();
    const [restored] = useState(loadGame);
    const [state, setState] = useState<GameState>(() =>
        restored.status === 'ok' ? restoreState(restored.game) : INITIAL_STATE,
    );
    const [isResuming, setIsResuming] = useState(restored.status === 'ok');
    const [gameExpired, setGameExpired] = useState(restored.status === 'expired');
    const [canResume] = useState(canSaveGames);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiErrorKind | null>(null);
    const [customPool, setCustomPool] = useState<Movie[]>(() =>
        restored.status === 'ok' ? restored.game.customPool : [],
    );

    const [recentMovies, setRecentMovies] = useState(loadRecentMovies);

    const { phase } = state;
    const inGame = phase === 'TURN' || phase === 'TABLE';

    // Cada cambio de turno queda guardado. Al llegar al resultado se borra: ya no hay nada que retomar.
    useEffect(() => {
        // Mientras se decide si seguir, no se guarda: recargar en bucle no debe alargar el plazo.
        if (isResuming) return;
        const { phase: savedPhase, movie, settings } = state;
        if ((savedPhase === 'TURN' || savedPhase === 'TABLE') && movie && settings) {
            saveGame({
                phase: savedPhase,
                currentPlayerIndex: state.currentPlayerIndex,
                impostor: state.players.findIndex((player) => player.role === 'impostor'),
                firstPlayer: state.firstPlayer,
                movie,
                settings,
                customPool,
            });
        } else {
            clearGame();
        }
    }, [state, customPool, isResuming]);

    // Una pestaña en segundo plano no se recarga: la caducidad se comprueba también al volver a ella.
    useEffect(() => {
        if (!inGame) return;
        const checkExpiry = () => {
            if (document.visibilityState !== 'visible' || loadGame().status !== 'expired') return;
            setState(INITIAL_STATE);
            setIsResuming(false);
            setGameExpired(true);
        };
        document.addEventListener('visibilitychange', checkExpiry);
        window.addEventListener('pageshow', checkExpiry);
        return () => {
            document.removeEventListener('visibilitychange', checkExpiry);
            window.removeEventListener('pageshow', checkExpiry);
        };
    }, [inGame]);

    // Al volver atrás, el navegador puede restaurar la página tal como quedó, sin recargarla. Por eso
    // se deja ya sin secretos al salir, igual que quedaría al recargar. Tiene que ser síncrono: justo
    // después, la página se congela.
    useEffect(() => {
        const hideSecrets = () =>
            flushSync(() => {
                if (phase === 'RESULT') setState(INITIAL_STATE);
                else if (phase === 'TURN' || phase === 'TABLE') setIsResuming(true);
            });
        window.addEventListener('pagehide', hideSecrets);
        return () => window.removeEventListener('pagehide', hideSecrets);
    }, [phase]);

    const deal = (settings: GameSettings, movie: Movie) => {
        const recent = addRecentMovie(recentMovies, movie.id);
        setRecentMovies(recent);
        saveRecentMovies(recent);
        setGameExpired(false);
        setState({
            phase: 'TURN',
            currentPlayerIndex: 0,
            movie,
            ...createDeal(settings.playerCount),
            settings: { ...settings, names: settings.names.map(cleanName) },
        });
    };

    const startGame = async (settings: GameSettings) => {
        setIsLoading(true);
        setError(null);
        try {
            deal(settings, await chooseMovie(settings, customPool, locale, recentMovies));
        } catch (err) {
            setState(INITIAL_STATE);
            setError(err instanceof ApiError ? err.kind : 'server');
        } finally {
            setIsLoading(false);
        }
    };

    const startWithReserve = (settings: GameSettings) => {
        setError(null);
        deal(settings, pickFresh(reserveMovies(locale), recentMovies));
    };

    const playAgain = async () => {
        const { movie, settings } = state;
        if (!settings) return;
        // Quien juega con la reserva suele estar sin conexión: no se le devuelve a un error.
        if (movie && isReserveMovie(movie)) startWithReserve(settings);
        else await startGame(settings);
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
        setIsResuming(false);
        setGameExpired(false);
        setError(null);
    };

    const { settings, ...game } = state;

    return (
        <GameContext.Provider
            value={{
                ...game,
                hints: settings?.hints ?? [],
                genreHintIsExtra: settings?.genre != null && game.movie !== null && !isReserveMovie(game.movie),
                names: settings?.names ?? [],
                isLoading,
                error,
                customPool,
                setCustomPool,
                isResuming,
                continueGame: () => setIsResuming(false),
                gameExpired,
                canResume,
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
