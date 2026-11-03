import type { Ref } from "react";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game";
import { Sheet } from "./Sheet";
import styles from "./RulesSheet.module.css";

export function RulesSheet({ ref }: { ref: Ref<HTMLDialogElement> }) {
  return (
    <Sheet ref={ref} titleId="reglas">
      <h2 id="reglas" className="titular">
        Cómo se juega
      </h2>
      <p>
        De {MIN_PLAYERS} a {MAX_PLAYERS} personas, un solo móvil y una película
        secreta.
      </p>
      <ol className={styles.pasos}>
        <li>
          Pasaos el móvil. Cada uno mantiene el dedo para revelar su papel y, al
          soltar, desaparece. Todos ven el título menos el impostor.
        </li>
        <li>
          Dad pistas y haced preguntas sin decir el título. Después, votad quién
          está disimulando.
        </li>
        <li>
          Antes de revelar, el impostor puede intentar adivinar la película. Si
          acierta, gana. Si no, el grupo gana al acertar la votación.
        </li>
      </ol>
      <p className={styles.credito}>
        Títulos, géneros y carteles de{" "}
        <a href="https://www.themoviedb.org/">The Movie Database</a>. Este
        producto usa la API de TMDB, pero TMDB no lo respalda ni lo certifica.
      </p>
      <form method="dialog">
        <button className="accion">Entendido</button>
      </form>
    </Sheet>
  );
}
