import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import type { Theme } from "@/lib/theme";
import type { Decade, Hint, Popularity } from "@/types";
import { ContactSheet } from "./ContactSheet";
import { RulesSheet } from "./RulesSheet";
import { Wordmark } from "./Wordmark";
import styles from "./SetupScreen.module.css";

const DECADE_OPTIONS: { value: Decade; label: string }[] = [
  { value: "ALL", label: "Cualquiera" },
  { value: "80s", label: "Los 80" },
  { value: "90s", label: "Los 90" },
  { value: "00s", label: "2000" },
  { value: "10s", label: "2010" },
  { value: "20s", label: "2020" },
];
const POPULARITY_OPTIONS: { value: Popularity; label: string }[] = [
  { value: "TOP_100", label: "Muy conocidas" },
  { value: "TOP_500", label: "Un poco de todo" },
  { value: "HARDCORE", label: "Para cinéfilos" },
  { value: "CLASSICS", label: "Clásicos populares" },
];
const HINT_OPTIONS: { value: Hint; label: string }[] = [
  { value: "GENRE", label: "Género" },
  { value: "YEAR", label: "Año" },
  { value: "KEYWORDS", label: "Palabras clave" },
];

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
}

export function SetupScreen({ theme, onToggleTheme }: Props) {
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
  const [showSheet, setShowSheet] = useState(false);
  const [exactYear, setExactYear] = useState(() => settings.year !== "");
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
    !exactYear ||
    (settings.year.trim() !== "" && isValidYear(Number(settings.year)));

  if (showSheet)
    return (
      <ContactSheet filters={filters} onClose={() => setShowSheet(false)} />
    );

  const { playerCount } = settings;
  const canStart = !isLoading && yearIsValid;
  const canUseReserve = error === "offline" || error === "server";

  return (
    <div className={`pantalla ${styles.setup}`}>
      <div className={styles.cabecera}>
        <button
          type="button"
          className="enlace"
          onClick={() => rules.current?.showModal()}
        >
          Cómo se juega
        </button>
        <button
          type="button"
          className={styles.luz}
          aria-pressed={theme === "dia"}
          aria-label="Encender la luz de la sala"
          onClick={onToggleTheme}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <Wordmark />
      <p className={styles.lema}>Todos ven la misma película, menos uno.</p>

      <section aria-labelledby="jugadores">
        <h2 id="jugadores" className={styles.seccion}>
          Cuántos jugáis
        </h2>
        <div className={styles.contador}>
          <button
            type="button"
            aria-label="Un jugador menos"
            disabled={playerCount <= MIN_PLAYERS}
            onClick={() => update({ playerCount: playerCount - 1 })}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
              <path d="M4 12h16" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </button>
          <output aria-live="polite" aria-label={`${playerCount} jugadores`}>
            {playerCount}
          </output>
          <button
            type="button"
            aria-label="Un jugador más"
            disabled={playerCount >= MAX_PLAYERS}
            onClick={() => update({ playerCount: playerCount + 1 })}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
              <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </button>
        </div>
        {/* Atajo táctil: el contador de arriba ya cubre el teclado y los lectores. */}
        <div className={styles.fotos} aria-hidden>
          {Array.from({ length: MAX_PLAYERS }, (_, index) => (
            <button
              type="button"
              key={index}
              tabIndex={-1}
              data-on={index < playerCount || undefined}
              onClick={() =>
                update({ playerCount: Math.max(index + 1, MIN_PLAYERS) })
              }
            />
          ))}
        </div>
      </section>

      <fieldset className={styles.grupo}>
        <legend className={styles.seccion}>De qué época</legend>
        <div className={styles.opciones}>
          {DECADE_OPTIONS.map(({ value, label }) => (
            <Option
              key={value}
              name="decada"
              checked={!exactYear && settings.decade === value}
              onChange={() => {
                setExactYear(false);
                update({ decade: value, year: "" });
              }}
            >
              {label}
            </Option>
          ))}
          <Option
            name="decada"
            checked={exactYear}
            onChange={() => {
              setExactYear(true);
              setCustomPool([]);
            }}
          >
            Un año
          </Option>
        </div>
        {exactYear && (
          <label className={styles.anio}>
            <span>Año exacto</span>
            <input
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
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend className={styles.seccion}>Cómo de conocidas</legend>
        <div className={styles.opciones}>
          {POPULARITY_OPTIONS.map(({ value, label }) => (
            <Option
              key={value}
              name="fama"
              checked={settings.popularity === value}
              onChange={() => update({ popularity: value })}
            >
              {label}
            </Option>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend className={styles.seccion}>Pistas para el impostor</legend>
        <div className={styles.opciones}>
          {HINT_OPTIONS.map(({ value, label }) => (
            <Option
              key={value}
              type="checkbox"
              name="pistas"
              checked={settings.hints.includes(value)}
              onChange={() =>
                update({
                  hints: settings.hints.includes(value)
                    ? settings.hints.filter((hint) => hint !== value)
                    : [...settings.hints, value],
                })
              }
            >
              {label}
            </Option>
          ))}
        </div>
      </fieldset>

      <div className={styles.lista}>
        {customPool.length > 0 ? (
          <>
            <p>Jugáis con {customPool.length} películas de vuestra lista.</p>
            <button
              type="button"
              className="enlace"
              onClick={() => setShowSheet(true)}
            >
              Cambiar la lista
            </button>
          </>
        ) : (
          <button
            type="button"
            className="enlace"
            disabled={!yearIsValid}
            onClick={() => setShowSheet(true)}
          >
            Revisar la lista de películas
          </button>
        )}
      </div>

      <div className={styles.pie}>
        {error && (
          <div className={styles.error} role="alert">
            <p>{ERROR_MESSAGES[error]}</p>
            {canUseReserve && (
              <button
                type="button"
                className="accion-sec"
                onClick={() => startWithReserve(settings)}
              >
                Jugar con la lista de reserva
              </button>
            )}
            {canUseReserve && (
              <small>
                {RESERVE_MOVIES.length} películas muy conocidas, sin carteles. No
                se aplican vuestros filtros.
              </small>
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
          {isLoading ? "Buscando película…" : error ? "Reintentar" : "Empezar"}
        </button>
      </div>

      <RulesSheet ref={rules} />
    </div>
  );
}

const ERROR_MESSAGES = {
  offline: "No hay conexión, así que no se puede buscar una película.",
  server: "TMDB no responde, así que no se puede buscar una película.",
  "no-movies": "No hay películas con estos filtros. Prueba con otra época.",
};

function Option({
  type = "radio",
  name,
  checked,
  onChange,
  children,
}: {
  type?: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className={styles.opcion}>
      <input type={type} name={name} checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}
