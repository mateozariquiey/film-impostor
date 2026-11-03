import styles from "./PlayerDots.module.css";

interface Props {
  count: number;
  /** A quién le toca: los anteriores salen vistos y el acento es suyo. */
  current?: number;
  /** Quién es el impostor: el único punto hueco de la app. */
  impostor?: number;
}

/** Un punto por jugador. Es la misma forma del icono: cuatro puntos y uno hueco. */
export function PlayerDots({ count, current, impostor }: Props) {
  return (
    <div className={styles.puntos} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          data-estado={stateOf(index, current, impostor)}
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
