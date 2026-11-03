import styles from "./FilmStrip.module.css";

interface Props {
  count: number;
  /** Fotogramas ya pasados. */
  done?: number;
  /** Fotograma actual o marcado. */
  current?: number;
  inverted?: boolean;
}

/** Una tira con un fotograma por jugador. Es decorativa: quien la use debe dar el dato en texto. */
export function FilmStrip({ count, done = 0, current, inverted }: Props) {
  return (
    <ol className={styles.tira} aria-hidden data-grande={inverted || undefined}>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          data-estado={index === current ? (inverted ? "negativo" : "ahora") : index < done ? "hecho" : undefined}
        >
          {index + 1}
        </li>
      ))}
    </ol>
  );
}
