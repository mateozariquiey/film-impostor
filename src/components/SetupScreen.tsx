import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useGame } from "@/contexts/GameContext";
import { isValidYear, MIN_YEAR } from "@/lib/filters";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game";
import { RESERVE_MOVIES } from "@/lib/reserve";
import {
  loadSettings,
  saveSettings,
  settingsToFilters,
  type GameSettings,
} from "@/lib/settings";
import type { Decade, Hint, Popularity } from "@/types";
import { ChoiceSheet } from "./ChoiceSheet";
import { MovieListScreen } from "./MovieListScreen";
import { RulesSheet } from "./RulesSheet";
import { PlayerDots } from "./PlayerDots";
import styles from "./SetupScreen.module.css";

const EXACT_YEAR = "YEAR";
type EraChoice = Decade | typeof EXACT_YEAR;

const ERA_OPTIONS: { value: EraChoice; label: string }[] = [
  { value: "ALL", label: "Cualquiera" },
  { value: "80s", label: "Los 80" },
  { value: "90s", label: "Los 90" },
  { value: "00s", label: "Los 2000" },
  { value: "10s", label: "Los 2010" },
  { value: "20s", label: "Los 2020" },
  { value: EXACT_YEAR, label: "Un año concreto" },
];
const POPULARITY_OPTIONS: { value: Popularity; label: string }[] = [
  { value: "TOP_100", label: "Muy conocidas" },
  { value: "TOP_500", label: "Un poco de todo" },
  { value: "HARDCORE", label: "Para cinéfilos" },
  { value: "CLASSICS", label: "Clásicos populares" },
];
const HINT_OPTIONS: { value: Hint; label: string; short: string }[] = [
  { value: "GENRE", label: "Género", short: "género" },
  { value: "YEAR", label: "Año", short: "año" },
  { value: "KEYWORDS", label: "Palabras clave", short: "claves" },
];

const ERROR_MESSAGES = {
  offline: "No hay conexión, así que no se puede buscar una película.",
  server: "TMDB no responde, así que no se puede buscar una película.",
  "no-movies": "No hay películas con estos filtros. Prueba con otra época.",
};

function hintsSummary(hints: Hint[]): string {
  const names = HINT_OPTIONS.filter(({ value }) => hints.includes(value)).map(({ short }) => short);
  if (names.length === 0) return "Ninguna";
  const text = names.join(", ");
  return text[0].toUpperCase() + text.slice(1);
}

export function SetupScreen() {
  const {
    startGame,
    startWithReserve,
    isLoading,
    error,
    clearError,
    customPool,
    setCustomPool,
  } = useGame();
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showList, setShowList] = useState(false);
  const [exactYear, setExactYear] = useState(() => settings.year !== "");
  const eraSheet = useRef<HTMLDialogElement>(null);
  const popularitySheet = useRef<HTMLDialogElement>(null);
  const hintsSheet = useRef<HTMLDialogElement>(null);
  const rules = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = (changes: Partial<GameSettings>) => {
    if ("decade" in changes || "popularity" in changes || "year" in changes) {
      setCustomPool([]);
      clearError();
    }
    setSettings((prev) => ({ ...prev, ...changes }));
  };
  const filters = useMemo(() => settingsToFilters(settings), [settings]);
  const yearIsValid =
    !exactYear || (settings.year.trim() !== "" && isValidYear(Number(settings.year)));

  if (showList)
    return <MovieListScreen filters={filters} onClose={() => setShowList(false)} />;

  const { playerCount } = settings;
  const canStart = !isLoading && yearIsValid;
  const canUseReserve = error === "offline" || error === "server";
  const eraValue = exactYear
    ? yearIsValid
      ? settings.year
      : "Falta el año"
    : ERA_OPTIONS.find(({ value }) => value === settings.decade)?.label;

  return (
    <div className="pantalla">
      <div className={`franja ${styles.portada}`} data-compacta={error ? true : undefined}>
        <header>
          <h1 className={styles.nombre}>Film Impostor</h1>
          <p className="secundario">Todos ven la misma película, menos uno.</p>
        </header>

        <div className={styles.jugadores} role="group" aria-labelledby="jugadores">
          <span id="jugadores" className="secundario">
            Cuántos jugáis
          </span>
          <div className={styles.contador}>
            <output aria-live="polite" aria-label={`${playerCount} jugadores`}>
              <span key={playerCount} className={`numeral ${styles.cifra}`}>
                {playerCount}
              </span>
            </output>
            <span className={styles.botones}>
              <button
                type="button"
                aria-label="Un jugador menos"
                disabled={playerCount <= MIN_PLAYERS}
                onClick={() => update({ playerCount: playerCount - 1 })}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                  <path d="M3 10h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Un jugador más"
                disabled={playerCount >= MAX_PLAYERS}
                onClick={() => update({ playerCount: playerCount + 1 })}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                  <path
                    d="M3 10h14M10 3v14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </span>
          </div>
          <PlayerDots count={playerCount} impostor={playerCount - 1} />
        </div>
      </div>

      <ul className={styles.filas}>
        <Row label="De qué época" value={eraValue} sheet={eraSheet} />
        <Row
          label="Cómo de conocidas"
          value={POPULARITY_OPTIONS.find(({ value }) => value === settings.popularity)?.label}
          sheet={popularitySheet}
        />
        <Row label="Pistas del impostor" value={hintsSummary(settings.hints)} sheet={hintsSheet} />
        <Row
          label="Quitar películas"
          value={customPool.length > 0 ? `Quedan ${customPool.length}` : undefined}
          disabled={!yearIsValid}
          onClick={() => setShowList(true)}
        />
      </ul>

      <div className={styles.pie}>
        {error && (
          <div className={styles.error} role="alert">
            <p>{ERROR_MESSAGES[error]}</p>
            {canUseReserve && (
              <>
                <p className="secundario">
                  La lista de reserva son {RESERVE_MOVIES.length} películas muy conocidas, sin
                  carteles ni filtros.
                </p>
                <button
                  type="button"
                  className="accion-sec"
                  onClick={() => startWithReserve(settings)}
                >
                  Jugar con la lista de reserva
                </button>
              </>
            )}
          </div>
        )}
        <button
          type="button"
          className="accion"
          disabled={!canStart}
          aria-busy={isLoading}
          onClick={() => void startGame(settings)}
        >
          {isLoading ? "Buscando película…" : canUseReserve ? "Reintentar" : "Empezar"}
        </button>
        {!error && (
          <button
            type="button"
            className={`enlace ${styles.reglas}`}
            onClick={() => rules.current?.showModal()}
          >
            Cómo se juega
          </button>
        )}
      </div>

      <ChoiceSheet<EraChoice>
        ref={eraSheet}
        id="epoca"
        title="De qué época"
        choices={ERA_OPTIONS}
        keepsOpen={EXACT_YEAR}
        isSelected={(value) =>
          value === EXACT_YEAR ? exactYear : !exactYear && settings.decade === value
        }
        onChoose={(value) => {
          if (value === EXACT_YEAR) {
            setExactYear(true);
            setCustomPool([]);
          } else {
            setExactYear(false);
            update({ decade: value, year: "" });
          }
        }}
      >
        {exactYear && (
          <label className={styles.anio}>
            <span>Año</span>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="1994"
              aria-invalid={!yearIsValid}
              value={settings.year}
              onChange={(event) => update({ year: event.target.value })}
            />
            {!yearIsValid && (
              <small>
                Escribe un año entre {MIN_YEAR} y {new Date().getFullYear()}.
              </small>
            )}
          </label>
        )}
      </ChoiceSheet>
      <ChoiceSheet<Popularity>
        ref={popularitySheet}
        id="fama"
        title="Cómo de conocidas"
        choices={POPULARITY_OPTIONS}
        isSelected={(value) => settings.popularity === value}
        onChoose={(value) => update({ popularity: value })}
      />
      <ChoiceSheet<Hint>
        ref={hintsSheet}
        id="pistas"
        title="Pistas del impostor"
        type="checkbox"
        choices={HINT_OPTIONS}
        isSelected={(value) => settings.hints.includes(value)}
        onChoose={(value) =>
          update({
            hints: settings.hints.includes(value)
              ? settings.hints.filter((hint) => hint !== value)
              : [...settings.hints, value],
          })
        }
      />
      <RulesSheet ref={rules} />
    </div>
  );
}

function Row({
  label,
  value,
  sheet,
  disabled,
  onClick,
}: {
  label: string;
  value?: ReactNode;
  sheet?: RefObject<HTMLDialogElement | null>;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.fila}
        aria-haspopup={sheet ? "dialog" : undefined}
        disabled={disabled}
        onClick={onClick ?? (() => sheet?.current?.showModal())}
      >
        <span>{label}</span>
        <span className={styles.valor}>{value}</span>
        <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden>
          <path
            d="M1 1l5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
}
