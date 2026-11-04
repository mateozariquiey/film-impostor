import styles from "./PlayerSlots.module.css";

interface Props {
  count: number;
  /** A quién le toca: los anteriores salen vistos y el acento es suyo. */
  current?: number;
  /** Quiénes son los impostores: los únicos de color de la fila. */
  impostors?: readonly number[];
  /** Quién da la primera pista en la mesa: también es «a quien le toca». */
  starts?: number;
}

/** Un cartel en miniatura por jugador, como la pared del inicio: el de color es siempre el impostor. */
export function PlayerSlots({ count, current, impostors, starts }: Props) {
  return (
    <div className={styles.huecos} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          data-estado={index === starts ? "turno" : stateOf(index, current, impostors)}
          style={{ "--i": index, "--n": count } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function stateOf(index: number, current?: number, impostors?: readonly number[]) {
  if (impostors?.includes(index)) return "impostor";
  if (current === undefined) return "jugador";
  if (index === current) return "turno";
  return index < current ? "visto" : "pendiente";
}
