import type { ReactNode, Ref } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import styles from "./ChoiceSheet.module.css";

interface Choice<T> {
  value: T;
  label: string;
}

interface Props<T> {
  ref: Ref<HTMLDialogElement>;
  id: string;
  title: string;
  /** Con «checkbox» se pueden marcar varias y la hoja no se cierra sola. */
  type?: "radio" | "checkbox";
  choices: Choice<T>[];
  isSelected: (value: T) => boolean;
  onChoose: (value: T) => void;
  /** Opción que pide algo más antes de cerrar, como el año concreto. */
  keepsOpen?: T;
  /** Lo que no es una opción más, como el campo del año. */
  children?: ReactNode;
}

/** Selector en hoja inferior: una lista de filas, con una marca en la elegida. */
export function ChoiceSheet<T extends string>({
  ref,
  id,
  title,
  type = "radio",
  choices,
  isSelected,
  onChoose,
  keepsOpen,
  children,
}: Props<T>) {
  const { t } = useLocale();
  return (
    <Sheet ref={ref} titleId={id}>
      <div className={styles.cabecera}>
        <h2 id={id}>{title}</h2>
        <form method="dialog">
          <button className={styles.listo}>{t.done}</button>
        </form>
      </div>
      <fieldset aria-labelledby={id}>
        {choices.map(({ value, label }) => (
          <label
            key={value}
            className={styles.fila}
            onClick={(event) => {
              // Con el teclado (detail 0) las flechas recorren las opciones sin cerrar la hoja.
              if (type === "radio" && value !== keepsOpen && event.detail > 0)
                event.currentTarget.closest("dialog")?.close();
            }}
          >
            <input
              className="solo-lector"
              type={type}
              name={id}
              checked={isSelected(value)}
              onChange={() => onChoose(value)}
            />
            <span>{label}</span>
            <Icon name="check" />
          </label>
        ))}
      </fieldset>
      {children}
    </Sheet>
  );
}
