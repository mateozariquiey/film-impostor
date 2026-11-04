import type { KeyboardEvent, Ref } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { MAX_NAME_LENGTH } from "@/lib/settings";
import { Sheet } from "./Sheet";
import choice from "./ChoiceSheet.module.css";
import styles from "./NamesSheet.module.css";

interface Props {
  ref: Ref<HTMLDialogElement>;
  playerCount: number;
  names: string[];
  onChange: (names: string[]) => void;
}

/** Nombres opcionales: un campo por jugador, y el que se deja vacío sigue siendo «Jugador N». */
export function NamesSheet({ ref, playerCount, names, onChange }: Props) {
  const { t } = useLocale();
  const setName = (index: number, name: string) => {
    const next = Array.from({ length: Math.max(names.length, index + 1) }, (_, i) => names[i] ?? "");
    next[index] = name;
    onChange(next);
  };

  // Intro lleva al siguiente campo, y en el último cierra, igual que el botón del teclado.
  const onEnter = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const dialog = event.currentTarget.closest("dialog");
    const next = dialog?.querySelector<HTMLInputElement>(`[data-jugador="${index + 1}"]`);
    if (next) next.focus();
    else dialog?.close();
  };

  return (
    <Sheet ref={ref} titleId="nombres">
      <div className={choice.cabecera}>
        <h2 id="nombres">{t.names.title}</h2>
        <form method="dialog">
          <button className={choice.listo}>{t.done}</button>
        </form>
      </div>
      <p className={`secundario ${styles.nota}`}>{t.names.note}</p>
      <div>
        {Array.from({ length: playerCount }, (_, index) => {
          const label = t.playerName(index, []);
          return (
            <label key={index} className={styles.fila}>
              <span className="solo-lector">{label}</span>
              <input
                data-jugador={index}
                value={names[index] ?? ""}
                placeholder={label}
                maxLength={MAX_NAME_LENGTH}
                autoCapitalize="words"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint={index === playerCount - 1 ? "done" : "next"}
                onChange={(event) => setName(index, event.target.value)}
                onKeyDown={(event) => onEnter(event, index)}
              />
            </label>
          );
        })}
      </div>
      {names.some((name) => name.trim() !== "") && (
        <button type="button" className={`enlace ${styles.borrar}`} onClick={() => onChange([])}>
          {t.names.clear}
        </button>
      )}
    </Sheet>
  );
}
