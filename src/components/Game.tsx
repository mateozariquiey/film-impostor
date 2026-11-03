"use client";

import { useEffect } from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { useDimScreen, useKeepScreenOn, useWarnBeforeLeaving } from "@/lib/browser";
import { ResultScreen } from "./ResultScreen";
import { SetupScreen } from "./SetupScreen";
import { TableScreen } from "./TableScreen";
import { TurnScreen } from "./TurnScreen";

export function Game() {
  return (
    <GameProvider>
      <Screens />
    </GameProvider>
  );
}

function Screens() {
  const { phase, currentPlayerIndex } = useGame();

  useKeepScreenOn(phase !== "SETUP");
  useWarnBeforeLeaving(phase === "TURN" || phase === "TABLE");
  useDimScreen(phase === "TURN" || phase === "TABLE");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  if (phase === "SETUP") return <SetupScreen />;
  if (phase === "TABLE") return <TableScreen />;
  if (phase === "RESULT") return <ResultScreen />;
  // La clave reinicia el estado del turno: lo que vio un jugador no pasa al siguiente.
  return <TurnScreen key={currentPlayerIndex} />;
}
