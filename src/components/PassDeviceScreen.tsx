import { useGame } from "@/contexts/GameContext";
import { Button } from "./ui/Button";

export function PassDeviceScreen({ onReady }: { onReady: () => void }) {
  const { currentPlayerIndex, players } = useGame();
  return (
    <section className="turn-screen">
      <p className="turn-progress">
        Papel {currentPlayerIndex + 1} de {players.length}
      </p>
      <h1 className="screen-title">
        Pasa el móvil.
        <br />
        Que nadie mire.
      </h1>
      <div className="ticket role-ticket">
        <p>Esta entrada es para</p>
        <h2>Jugador {currentPlayerIndex + 1}</h2>
        <div className="ticket-stub">Tu papel sigue siendo un secreto.</div>
      </div>
      <Button onClick={onReady}>Ver mi papel</Button>
      <p className="footnote">Solo tú debes ver la siguiente pantalla.</p>
    </section>
  );
}
