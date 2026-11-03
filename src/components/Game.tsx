"use client";

import { useEffect, useState } from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { useKeepScreenOn, useWarnBeforeLeaving } from "@/lib/browser";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";
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
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useKeepScreenOn(phase !== "SETUP");
  useWarnBeforeLeaving(phase === "TURN" || phase === "TABLE");

  useEffect(() => {
    applyTheme(theme, phase === "RESULT");
  }, [theme, phase]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  if (phase === "SETUP")
    return (
      <SetupScreen
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dia" ? "rojo" : "dia")}
      />
    );
  if (phase === "TABLE") return <TableScreen />;
  if (phase === "RESULT") return <ResultScreen />;
  // La clave reinicia el estado del turno: lo que vio un jugador no pasa al siguiente.
  return <TurnScreen key={currentPlayerIndex} />;
}
