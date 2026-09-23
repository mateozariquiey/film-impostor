"use client";

import { useRef, useState } from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { SetupScreen } from "./SetupScreen";
import { PassDeviceScreen } from "./PassDeviceScreen";
import { RevealScreen } from "./RevealScreen";
import { PlayingScreen } from "./PlayingScreen";

export function Game() {
  const rules = useRef<HTMLDialogElement>(null);
  return (
    <GameProvider>
      <header className="site-header">
        <span className="brand">Film Impostor</span>
        <button
          className="help-button"
          onClick={() => rules.current?.showModal()}
        >
          Cómo jugar
        </button>
      </header>
      <GameScreens />
      <dialog
        className="rules-dialog"
        ref={rules}
        aria-labelledby="rules-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) rules.current?.close();
        }}
      >
        <h2 id="rules-title">El arte de disimular.</h2>
        <p>De 3 a 12 personas, un solo móvil y una película secreta.</p>
        <ol>
          <li>
            Pasad el móvil. Cada persona mira su papel en privado. Todos ven el
            título salvo el impostor.
          </li>
          <li>
            Dad pistas y haced preguntas sin decir el título. Después, votad
            quién está disimulando.
          </li>
          <li>
            Antes de revelar, el impostor puede intentar adivinar la película.
            Si acierta, gana. Si no, el grupo gana al acertar la votación.
          </li>
        </ol>
        <p>La conversación y la votación se hacen en persona.</p>
        <form method="dialog">
          <button className="button button-primary">Entendido</button>
        </form>
      </dialog>
    </GameProvider>
  );
}

function GameScreens() {
  const { phase, currentPlayerIndex } = useGame();
  if (phase === "SETUP") return <SetupScreen />;
  if (phase === "PLAYING") return <PlayingScreen />;
  return <PlayerTurn key={currentPlayerIndex} />;
}

function PlayerTurn() {
  const [ready, setReady] = useState(false);
  return ready ? (
    <RevealScreen />
  ) : (
    <PassDeviceScreen onReady={() => setReady(true)} />
  );
}
