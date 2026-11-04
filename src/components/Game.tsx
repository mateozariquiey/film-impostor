"use client";

import { useEffect } from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { useDimScreen, useKeepScreenOn, useServiceWorker, useWarnBeforeLeaving } from "@/lib/browser";
import { ResultScreen } from "./ResultScreen";
import { ResumeScreen } from "./ResumeScreen";
import { SetupScreen } from "./SetupScreen";
import { TableScreen } from "./TableScreen";
import { TurnScreen } from "./TurnScreen";

export function Game() {
  return (
    <LocaleProvider>
      <GameProvider>
        <Screens />
      </GameProvider>
    </LocaleProvider>
  );
}

function Screens() {
  const { phase, currentPlayerIndex, isResuming, canResume } = useGame();
  const inGame = phase === "TURN" || phase === "TABLE";

  useServiceWorker();
  useKeepScreenOn(phase !== "SETUP");
  useWarnBeforeLeaving(inGame && !canResume);
  useDimScreen(inGame);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, isResuming]);

  if (isResuming) return <ResumeScreen />;
  if (phase === "SETUP") return <SetupScreen />;
  if (phase === "TABLE") return <TableScreen />;
  if (phase === "RESULT") return <ResultScreen />;
  // La clave reinicia el estado del turno: lo que vio un jugador no pasa al siguiente.
  return <TurnScreen key={currentPlayerIndex} />;
}
