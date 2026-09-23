import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { Button } from "./ui/Button";

export function PlayingScreen() {
  const { resetGame, players, movie } = useGame();
  const [finished, setFinished] = useState(false);
  const impostor =
    players.findIndex((player) => player.role === "impostor") + 1;
  return (
    <section className="turn-screen">
      <h1 className="screen-title">
        {finished ? (
          <>
            Se acabó
            <br />
            la actuación.
          </>
        ) : (
          <>
            Ahora toca
            <br />
            disimular.
          </>
        )}
      </h1>
      {finished ? (
        <div className="ticket role-ticket" role="status">
          <p>El impostor era</p>
          <h2>Jugador {impostor}</h2>
          <div className="ticket-stub">
            <p>Y la película…</p>
            <h3 className="result-movie">{movie?.title}</h3>
          </div>
        </div>
      ) : (
        <>
          <p className="lead">
            El móvil puede descansar. Mirad a los demás: alguien no sabe de qué
            habláis.
          </p>
          <ol className="play-instructions">
            <li>Dad una pista cada uno, sin decir el título.</li>
            <li>Haced preguntas y votad quién es el impostor.</li>
            <li>
              Antes de revelar, el impostor puede intentar adivinar la película.
            </li>
          </ol>
          <p className="game-rule">
            Si adivina el título o falla vuestra votación, gana el impostor. Si
            no, ganáis los demás.
          </p>
          <Button onClick={() => setFinished(true)}>Revelar al impostor</Button>
        </>
      )}
      <Button onClick={resetGame} variant={finished ? "primary" : "secondary"}>
        Nueva partida
      </Button>
    </section>
  );
}
