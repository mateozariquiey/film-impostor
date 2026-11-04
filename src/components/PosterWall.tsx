import { posterUrl } from "@/lib/posters";
import wall from "@/lib/wall.json";
import styles from "./PosterWall.module.css";

interface Props {
  /** Cuántos carteles se encienden, uno por jugador. El último de ellos es el hueco. Sin esto, la pared está apagada. */
  players?: number;
  className?: string;
}

/**
 * La pared de carteles. Tiene doce, el máximo de jugadores: cada uno enciende el suyo y el último de la
 * fila se queda en hueco, el impostor. Son siempre las mismas películas, así que no dicen nada de la partida.
 * Sin conexión y antes de cargar se ve el color medio de cada cartel.
 */
export function PosterWall({ players, className = "" }: Props) {
  return (
    <div className={`${styles.pared} ${className}`} aria-hidden>
      {wall.map(({ path, color }, index) => {
        const state =
          players === undefined || index >= players ? "apagado" : index === players - 1 ? "hueco" : "encendido";
        return (
          <div key={path} className={styles.cartel} data-estado={state} style={{ backgroundColor: color }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- son archivos ya pequeños de TMDB, sin optimizar como los demás carteles */}
            <img
              src={posterUrl(path, "w342")}
              alt=""
              decoding="async"
              // Sin esto se vería el icono de imagen rota sobre el color medio.
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
