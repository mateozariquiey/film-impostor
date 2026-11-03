import type { ReactNode, Ref } from "react";
import styles from "./Sheet.module.css";

interface Props {
  ref: Ref<HTMLDialogElement>;
  titleId: string;
  children: ReactNode;
}

/** Hoja modal sobre el <dialog> nativo: gestiona el foco y la tecla Esc por nosotros. */
export function Sheet({ ref, titleId, children }: Props) {
  return (
    <dialog
      ref={ref}
      className={styles.hoja}
      aria-labelledby={titleId}
      onClick={(event) => {
        // Un toque en el fondo cae sobre el propio <dialog>.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className={styles.contenido}>{children}</div>
    </dialog>
  );
}
