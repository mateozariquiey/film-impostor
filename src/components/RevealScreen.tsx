import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "./ui/Button";

export function RevealScreen() {
  const { players, currentPlayerIndex, movie, hints, nextPlayer } = useGame();
  const [isRevealed, setIsRevealed] = useState(false);
  const isImpostor = players[currentPlayerIndex].role === "impostor";
  const isLastPlayer = currentPlayerIndex === players.length - 1;
  return (
    <section className="turn-screen">
      <p className="turn-progress">
        Papel {currentPlayerIndex + 1} de {players.length}
      </p>
      <h1 className="screen-title">
        Jugador {currentPlayerIndex + 1},<br />
        este es tu papel.
      </h1>
      {!isRevealed ? (
        <button
          aria-label="Tocar para revelar"
          className="ticket sealed-ticket"
          onClick={() => setIsRevealed(true)}
        >
          <span className="sealed-symbol" aria-hidden>
            ?
          </span>
          <span>Tocar para revelar</span>
          <small>Asegúrate de que nadie más esté mirando.</small>
        </button>
      ) : (
        movie && (
          <div
            className={`ticket role-ticket ${isImpostor ? "impostor-ticket" : ""}`}
          >
            <p>
              {isImpostor ? "Te toca disimular." : "Tú conoces la película."}
            </p>
            <h2>{isImpostor ? "Eres el impostor." : movie.title}</h2>
            <div className="ticket-stub">
              {isImpostor ? (
                <>
                  {hints.length === 0 && (
                    <p>
                      Sin pistas esta vez. Escucha a los demás y sigue la
                      conversación.
                    </p>
                  )}
                  <dl className="hint-list">
                    {hints.includes("GENRE") && (
                      <div>
                        <dt>Género</dt>
                        <dd>{movie.genre}</dd>
                      </div>
                    )}
                    {hints.includes("YEAR") && (
                      <div>
                        <dt>Año</dt>
                        <dd>{movie.releaseYear ?? "Desconocido"}</dd>
                      </div>
                    )}
                    {hints.includes("KEYWORDS") && (
                      <div>
                        <dt>Palabras clave</dt>
                        <dd>
                          {movie.keywords.length
                            ? movie.keywords.slice(0, 3).join(", ")
                            : "Sin pistas disponibles"}
                        </dd>
                      </div>
                    )}
                  </dl>
                </>
              ) : (
                <p>
                  Recuerda el título. Da pistas sin ponérselo demasiado fácil al
                  impostor.
                </p>
              )}
            </div>
          </div>
        )
      )}
      {isRevealed && (
        <Button onClick={nextPlayer}>
          {isLastPlayer ? "Ocultar y empezar" : "Ocultar y pasar el móvil"}
        </Button>
      )}
      <p className="footnote">
        {isRevealed
          ? "Oculta tu papel antes de pasar el móvil."
          : "Tu papel solo aparece cuando tú lo decides."}
      </p>
    </section>
  );
}
