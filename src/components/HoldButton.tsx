import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import styles from "./HoldButton.module.css";

interface Props {
  label: ReactNode;
  heldLabel?: ReactNode;
  hint?: ReactNode;
  /** Se muestra si alguien suelta antes de tiempo. */
  tooShort?: ReactNode;
  /** Milisegundos que hay que mantener para completar. */
  durationMs: number;
  /** Dibuja un anillo que se llena mientras se mantiene. */
  showProgress?: boolean;
  onHoldChange?: (held: boolean) => void;
  onComplete: () => void;
}

const vibrate = () => navigator.vibrate?.(12);

/**
 * Botón de «mantener pulsado»: funciona con el dedo, el ratón y el teclado (Espacio o Intro).
 * Se suelta también si el navegador cancela el gesto o la app pasa a segundo plano,
 * para que nada secreto se quede a la vista.
 */
export function HoldButton({
  label,
  heldLabel,
  hint,
  tooShort,
  durationMs,
  showProgress,
  onHoldChange,
  onComplete,
}: Props) {
  const [held, setHeld] = useState(false);
  const [released, setReleased] = useState<"early" | "done" | null>(null);
  const holding = useRef(false);
  const completed = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const start = () => {
    if (holding.current) return;
    holding.current = true;
    completed.current = false;
    setHeld(true);
    setReleased(null);
    onHoldChange?.(true);
    vibrate();
    timer.current = window.setTimeout(() => {
      completed.current = true;
      vibrate();
      onComplete();
    }, durationMs);
  };

  const stop = () => {
    if (!holding.current) return;
    holding.current = false;
    window.clearTimeout(timer.current);
    setHeld(false);
    setReleased(completed.current ? "done" : "early");
    onHoldChange?.(false);
  };
  const stopFromWindow = useEffectEvent(stop);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") stopFromWindow();
    };
    const onBlur = () => stopFromWindow();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", onBlur);
      window.clearTimeout(timer.current);
    };
  }, []);

  const isHoldKey = (key: string) => key === " " || key === "Enter";

  return (
    <button
      type="button"
      className={styles.hold}
      data-held={held || undefined}
      style={{ "--duracion": `${durationMs}ms` } as React.CSSProperties}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // La captura mantiene el gesto aunque el dedo resbale fuera del botón.
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (!isHoldKey(event.key)) return;
        event.preventDefault();
        if (!event.repeat) start();
      }}
      onKeyUp={(event) => {
        if (!isHoldKey(event.key)) return;
        event.preventDefault();
        stop();
      }}
      onBlur={stop}
    >
      <span className={styles.disco} aria-hidden>
        {showProgress && held && (
          <svg className={styles.anillo} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="47" pathLength="100" />
          </svg>
        )}
      </span>
      <span className={styles.texto}>
        <strong>{held && heldLabel ? heldLabel : label}</strong>
        {released === "early" && tooShort ? (
          <small role="status">{tooShort}</small>
        ) : (
          hint && !held && <small>{hint}</small>
        )}
      </span>
    </button>
  );
}
