import styles from "./PlayerSlots.module.css";

interface Props {
  count: number;
  /** A quién le toca: los anteriores salen vistos y el acento es suyo. */
  current?: number;
  /** Quién es el impostor: el único hueco de la app. */
  impostor?: number;
  /** Quién da la primera pista en la mesa: también es «a quien le toca». */
  starts?: number;
}

/** Un cartel en miniatura por jugador, como la pared del inicio: el vacío es siempre el impostor. */
export function PlayerSlots({ count, current, impostor, starts }: Props) {
  return (
    <div className={styles.huecos} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          data-estado={index === starts ? "turno" : stateOf(index, current, impostor)}
          style={{ "--i": index, "--n": count } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function stateOf(index: number, current?: number, impostor?: number) {
  if (index === impostor) return "impostor";
  if (current === undefined) return "jugador";
  if (index === current) return "turno";
  return index < current ? "visto" : "pendiente";
}
