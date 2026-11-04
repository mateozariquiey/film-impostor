import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useGame } from "@/contexts/GameContext";
import { useLocale } from "@/contexts/LocaleContext";
import { isValidYear, MIN_YEAR } from "@/lib/filters";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game";
import { genreName, pickableGenres } from "@/lib/genres";
import { reserveMovies } from "@/lib/reserve";
import { TALK_MINUTES } from "@/lib/talkTimer";
import {
  loadSettings,
  saveSettings,
  settingsToFilters,
  type GameSettings,
} from "@/lib/settings";
import type { Decade, Hint, Popularity } from "@/types";
import type { Messages } from "@/messages/es";
import { ChoiceSheet } from "./ChoiceSheet";
import { MovieListScreen } from "./MovieListScreen";
import { NamesSheet } from "./NamesSheet";
import { RulesSheet } from "./RulesSheet";
import { PosterWall } from "./PosterWall";
import styles from "./SetupScreen.module.css";

const EXACT_YEAR = "YEAR";
type EraChoice = Decade | typeof EXACT_YEAR;

const ANY_GENRE = "ALL";

const ERAS: readonly EraChoice[] = ["ALL", "80s", "90s", "00s", "10s", "20s", EXACT_YEAR];
const POPULARITIES: readonly Popularity[] = ["TOP_100", "TOP_500", "HARDCORE", "CLASSICS"];
const HINTS: readonly Hint[] = ["GENRE", "YEAR", "KEYWORDS"];

function hintsSummary(hints: Hint[], t: Messages): string {
  const names = HINTS.filter((hint) => hints.includes(hint)).map((hint) => t.setup.hintShort[hint]);
  if (names.length === 0) return t.setup.noHints;
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
    gameExpired,
  } = useGame();
  const { locale, t, setLocale } = useLocale();
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [showList, setShowList] = useState(false);
  const [exactYear, setExactYear] = useState(() => settings.year !== "");
  const eraSheet = useRef<HTMLDialogElement>(null);
  const genreSheet = useRef<HTMLDialogElement>(null);
  const popularitySheet = useRef<HTMLDialogElement>(null);
  const hintsSheet = useRef<HTMLDialogElement>(null);
  const namesSheet = useRef<HTMLDialogElement>(null);
  const talkSheet = useRef<HTMLDialogElement>(null);
  const rules = useRef<HTMLDialogElement>(null);
  const foot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // En un móvil pequeño el aviso no cabe entero: se lleva a la vista con sus salidas. Espera a
  // dibujar porque, si se llega desde el resultado, `Screens` sube al principio justo después.
  useEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => foot.current?.scrollIntoView({ block: "end" }));
    return () => cancelAnimationFrame(frame);
  }, [error]);

  const update = (changes: Partial<GameSettings>) => {
    if ("decade" in changes || "popularity" in changes || "year" in changes || "genre" in changes) {
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
  const namedPlayers = settings.names.slice(0, playerCount).filter((name) => name.trim() !== "").length;
  const otherLocale = locale === "es" ? "en" : "es";
  const canUseReserve = error === "offline" || error === "server";
  const eraValue = exactYear
    ? yearIsValid
      ? settings.year
      : t.setup.yearMissing
    : t.setup.eraOptions[settings.decade];

  return (
    <div className={`pantalla ${styles.inicio}`}>
      <PosterWall players={playerCount} className={styles.pared} />

      <header className={styles.cabecera}>
        <h1 className={`cartelon ${styles.nombre}`}>Film Impostor</h1>
        <p className={styles.lema}>{t.meta.tagline}</p>
      </header>

      <div className={styles.jugadores} role="group" aria-labelledby="jugadores">
        <output aria-live="polite" aria-label={t.setup.playersCount(playerCount)}>
          <span key={playerCount} className={`cartelon ${styles.cifra}`}>
            {playerCount}
          </span>
        </output>
        <span id="jugadores" className={styles.etiqueta}>
          {t.setup.players}
        </span>
        <span className={styles.botones}>
          <button
            type="button"
            aria-label={t.setup.fewerPlayers}
            disabled={playerCount <= MIN_PLAYERS}
            onClick={() => update({ playerCount: playerCount - 1 })}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path d="M3 10h14" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={t.setup.morePlayers}
            disabled={playerCount >= MAX_PLAYERS}
            onClick={() => update({ playerCount: playerCount + 1 })}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path d="M3 10h14M10 3v14" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </span>
      </div>

      <ul className={styles.filas}>
        <Row label={t.setup.era} value={eraValue} sheet={eraSheet} />
        <Row
          label={t.setup.genre}
          value={settings.genre === null ? t.setup.anyGenre : genreName(settings.genre, locale)}
          sheet={genreSheet}
        />
        <Row
          label={t.setup.popularity}
          value={t.setup.popularityOptions[settings.popularity]}
          sheet={popularitySheet}
        />
        <Row label={t.setup.hints} value={hintsSummary(settings.hints, t)} sheet={hintsSheet} />
        <Row
          label={t.setup.removeMovies}
          value={customPool.length > 0 ? t.setup.moviesLeft(customPool.length) : t.setup.noneRemoved}
          disabled={!yearIsValid}
          onClick={() => setShowList(true)}
        />
        <Row
          label={t.setup.addNames}
          value={namedPlayers > 0 ? t.setup.namedCount(namedPlayers, playerCount) : t.setup.noNames}
          sheet={namesSheet}
        />
        <Row label={t.setup.talkTime} value={t.setup.talkTimeOptions(settings.talkMinutes)} sheet={talkSheet} />
      </ul>

      <div ref={foot} className={styles.pie}>
        {gameExpired && !error && (
          <p className={`secundario ${styles.caducada}`} role="status">
            {t.setup.expired}
          </p>
        )}
        {error && (
          <div className={styles.error} role="alert">
            <p>{t.setup.errors[error]}</p>
            {canUseReserve && (
              <>
                <p className="secundario">{t.setup.reserveNote(reserveMovies(locale).length)}</p>
                <button
                  type="button"
                  className="accion-sec"
                  onClick={() => startWithReserve(settings)}
                >
                  {t.setup.useReserve}
                </button>
              </>
            )}
          </div>
        )}
        <div className={styles.enlaces}>
          {/* Con un error hay menos sitio, y lo que no puede faltar es poder leerlo en otro idioma. */}
          {!error && (
            <button
              type="button"
              className="enlace"
              onClick={() => {
                rules.current?.showModal();
                rules.current?.querySelector("h2")?.focus();
              }}
            >
              {t.rules.title}
            </button>
          )}
          {/* Cada idioma se ofrece en su propio idioma, para que lo encuentre quien no entiende el otro. */}
          <button
            type="button"
            className="enlace"
            lang={otherLocale}
            onClick={() => {
              setCustomPool([]);
              setLocale(otherLocale);
            }}
          >
            {t.otherLanguage}
          </button>
        </div>
        <button
          type="button"
          className="accion accion-pie"
          disabled={!canStart}
          aria-busy={isLoading}
          onClick={() => void startGame(settings)}
        >
          {isLoading ? t.setup.searching : canUseReserve ? t.setup.retry : t.setup.start}
        </button>
      </div>

      <ChoiceSheet<EraChoice>
        ref={eraSheet}
        id="epoca"
        title={t.setup.era}
        choices={ERAS.map((value) => ({ value, label: t.setup.eraOptions[value] }))}
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
            <span>{t.setup.year}</span>
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
            {!yearIsValid && <small>{t.setup.yearRange(MIN_YEAR, new Date().getFullYear())}</small>}
          </label>
        )}
      </ChoiceSheet>
      <ChoiceSheet<string>
        ref={genreSheet}
        id="genero"
        title={t.setup.genre}
        choices={[
          { value: ANY_GENRE, label: t.setup.anyGenre },
          ...pickableGenres(locale).map(({ id, name }) => ({ value: String(id), label: name })),
        ]}
        isSelected={(value) => (settings.genre === null ? value === ANY_GENRE : value === String(settings.genre))}
        onChoose={(value) => update({ genre: value === ANY_GENRE ? null : Number(value) })}
      />
      <ChoiceSheet<Popularity>
        ref={popularitySheet}
        id="fama"
        title={t.setup.popularity}
        choices={POPULARITIES.map((value) => ({ value, label: t.setup.popularityOptions[value] }))}
        isSelected={(value) => settings.popularity === value}
        onChoose={(value) => update({ popularity: value })}
      />
      <ChoiceSheet<Hint>
        ref={hintsSheet}
        id="pistas"
        title={t.setup.hints}
        type="checkbox"
        choices={HINTS.map((value) => ({ value, label: t.setup.hintOptions[value] }))}
        isSelected={(value) => settings.hints.includes(value)}
        onChoose={(value) =>
          update({
            hints: settings.hints.includes(value)
              ? settings.hints.filter((hint) => hint !== value)
              : [...settings.hints, value],
          })
        }
      />
      <ChoiceSheet<string>
        ref={talkSheet}
        id="tiempo"
        title={t.setup.talkTime}
        choices={TALK_MINUTES.map((minutes) => ({
          value: String(minutes),
          label: t.setup.talkTimeOptions(minutes),
        }))}
        isSelected={(value) => settings.talkMinutes === Number(value)}
        onChoose={(value) => update({ talkMinutes: Number(value) })}
      />
      <NamesSheet
        ref={namesSheet}
        playerCount={playerCount}
        names={settings.names}
        onChange={(names) => update({ names })}
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
        <span className={styles.rotulo}>{label}</span>
        <span className={styles.valor}>
          {value}
          <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden>
            <path d="M1 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </button>
    </li>
  );
}
