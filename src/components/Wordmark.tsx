import { useState } from "react";
import { randomIndex } from "@/lib/game";
import styles from "./Wordmark.module.css";

const LETTERS = [..."IMPOSTOR"];

/** La tira de la marca. Cada vez que se abre, el fotograma en negativo es otro. */
export function Wordmark() {
  const [negative] = useState(() => randomIndex(LETTERS.length));
  return (
    <h1 className={styles.marca} aria-label="Film Impostor">
      <span className={styles.film} aria-hidden>
        Film
      </span>
      <span className={styles.tira} aria-hidden>
        {LETTERS.map((letter, index) => (
          <span key={index} data-negativo={index === negative || undefined}>
            {letter}
          </span>
        ))}
      </span>
    </h1>
  );
}
