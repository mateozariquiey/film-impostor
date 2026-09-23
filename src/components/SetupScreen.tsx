"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { DECADES, POPULARITIES, isValidYear, MIN_YEAR } from "@/lib/filters";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game";
import {
  loadSettings,
  saveSettings,
  settingsToFilters,
  type GameSettings,
} from "@/lib/settings";
import type { Decade, Hint, Popularity } from "@/types";
import { Button } from "./ui/Button";
import { PoolSelectionScreen } from "./PoolSelectionScreen";

const DECADE_LABELS: Record<Decade, string> = {
  ALL: "Cualquier época",
  "80s": "Los 80",
  "90s": "Los 90",
  "00s": "Los 2000",
  "10s": "Los 2010",
  "20s": "Los 2020",
};
const POPULARITY_LABELS: Record<Popularity, string> = {
  TOP_100: "Muy conocidas",
  TOP_500: "Un poco de todo",
  HARDCORE: "Para cinéfilos",
  CLASSICS: "Clásicos populares",
};
const HINT_OPTIONS: { value: Hint; label: string }[] = [
  { value: "GENRE", label: "El género" },
  { value: "YEAR", label: "El año" },
  { value: "KEYWORDS", label: "Palabras clave" },
];

export function SetupScreen() {
  const { startGame, isLoading, error, customPool, setCustomPool } = useGame();
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showPoolSelection, setShowPoolSelection] = useState(false);
  const [exactYear, setExactYear] = useState(() => settings.year !== "");
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = (changes: Partial<GameSettings>) => {
    if ("decade" in changes || "popularity" in changes || "year" in changes)
      setCustomPool([]);
    setSettings((prev) => ({ ...prev, ...changes }));
  };
  const filters = useMemo(() => settingsToFilters(settings), [settings]);
  const yearIsValid =
    !exactYear ||
    (settings.year.trim() !== "" && isValidYear(Number(settings.year)));

  if (showPoolSelection)
    return (
      <PoolSelectionScreen
        filters={filters}
        onClose={() => setShowPoolSelection(false)}
      />
    );

  return (
    <div className="setup-layout">
      <div className="setup-intro">
        <h1 className="headline">
          Uno de
          <br />
          vosotros
          <br />
          no la ha visto.
        </h1>
        <p className="lead">
          Una película, un móvil y alguien que tendrá que disimular.
        </p>
      </div>
      <form
        className="setup-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (yearIsValid && !isLoading) void startGame(settings);
        }}
      >
        <fieldset disabled={isLoading} className="settings-fields">
          <legend className="sr-only">Configurar la partida</legend>
          <div className="ticket player-counter">
            <div>
              <span>¿Cuántos jugáis?</span>
              <small>
                Entre {MIN_PLAYERS} y {MAX_PLAYERS}
              </small>
            </div>
            <div className="counter-controls">
              <button
                type="button"
                aria-label="Quitar jugador"
                disabled={settings.playerCount <= MIN_PLAYERS}
                onClick={() =>
                  update({ playerCount: settings.playerCount - 1 })
                }
              >
                −
              </button>
              <output aria-label="Número de jugadores" aria-live="polite">
                {settings.playerCount}
              </output>
              <button
                type="button"
                aria-label="Añadir jugador"
                disabled={settings.playerCount >= MAX_PLAYERS}
                onClick={() =>
                  update({ playerCount: settings.playerCount + 1 })
                }
              >
                +
              </button>
            </div>
          </div>
          <div className="setting-row">
            <label htmlFor="decade">Películas de</label>
            <select
              id="decade"
              value={exactYear ? "EXACT" : settings.decade}
              onChange={(event) => {
                const exact = event.target.value === "EXACT";
                setExactYear(exact);
                update(
                  exact
                    ? { year: settings.year }
                    : { decade: event.target.value as Decade, year: "" },
                );
              }}
            >
              {DECADES.map((decade) => (
                <option key={decade} value={decade}>
                  {DECADE_LABELS[decade]}
                </option>
              ))}
              <option value="EXACT">Un año concreto</option>
            </select>
          </div>
          {exactYear && (
            <div className="year-setting">
              <div className="setting-row">
                <label htmlFor="year">Año exacto</label>
                <input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEAR}
                  max={new Date().getFullYear()}
                  placeholder="2001"
                  value={settings.year}
                  aria-invalid={!yearIsValid}
                  aria-describedby={!yearIsValid ? "year-error" : undefined}
                  onChange={(event) => update({ year: event.target.value })}
                />
              </div>
              {!yearIsValid && (
                <p className="field-error" id="year-error">
                  Elige un año entre {MIN_YEAR} y {new Date().getFullYear()}.
                </p>
              )}
            </div>
          )}
          <div className="setting-row">
            <label htmlFor="popularity">Qué tan conocidas</label>
            <select
              id="popularity"
              value={settings.popularity}
              onChange={(event) =>
                update({ popularity: event.target.value as Popularity })
              }
            >
              {POPULARITIES.map((popularity) => (
                <option key={popularity} value={popularity}>
                  {POPULARITY_LABELS[popularity]}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="hint-options">
            <legend>El impostor puede saber…</legend>
            <div className="pills">
              {HINT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={settings.hints.includes(value)}
                  onClick={() =>
                    update({
                      hints: settings.hints.includes(value)
                        ? settings.hints.filter((hint) => hint !== value)
                        : [...settings.hints, value],
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="review-link"
            disabled={!yearIsValid}
            onClick={() => setShowPoolSelection(true)}
          >
            <span>
              {customPool.length
                ? `Tu selección (${customPool.length})`
                : "Revisar las películas"}
            </span>
            <ArrowUpRight size={20} aria-hidden />
          </button>
          {customPool.length > 0 && (
            <div className="selection-note">
              <p>Cambiar los filtros borra esta selección.</p>
              <button
                type="button"
                className="text-button"
                onClick={() => setCustomPool([])}
              >
                Borrar la selección y usar todas
              </button>
            </div>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="error-message">
            {error}. Vuelve a intentarlo en un momento.
          </p>
        )}
        <Button type="submit" disabled={isLoading || !yearIsValid}>
          {isLoading ? "Buscando la película…" : "Repartir los papeles"}
        </Button>
        <p className="footnote">Después, pasad el móvil de uno en uno.</p>
      </form>
    </div>
  );
}
