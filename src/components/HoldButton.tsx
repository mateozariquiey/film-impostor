import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

interface Props {
  className?: string;
  ariaLabel?: string;
  /** Milisegundos que hay que mantener para completar. */
  durationMs: number;
  onHoldChange?: (held: boolean) => void;
  /** Avisa al soltar, y dice si se llegó a completar. */
  onRelease?: (completed: boolean) => void;
  onComplete: () => void;
  children?: ReactNode;
}

const vibrate = () => navigator.vibrate?.(12);

/**
 * Botón de «mantener pulsado»: funciona con el dedo, el ratón y el teclado (Espacio o Intro).
 * Se suelta también si el navegador cancela el gesto o la app pasa a segundo plano,
 * para que nada secreto se quede a la vista. El aspecto lo pone quien lo usa, con `data-held`.
 */
export function HoldButton({
  className,
  ariaLabel,
  durationMs,
  onHoldChange,
  onRelease,
  onComplete,
  children,
}: Props) {
  const [held, setHeld] = useState(false);
  const holding = useRef(false);
  const completed = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const start = () => {
    if (holding.current) return;
    holding.current = true;
    completed.current = false;
    setHeld(true);
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
    onHoldChange?.(false);
    onRelease?.(completed.current);
  };
  const stopFromWindow = useEffectEvent(stop);

  useEffect(() => {
    const onHidden = () => {
      // Tiene que ser síncrono: React dejaría este cambio para luego, y justo después la página puede congelarse con el papel a la vista.
      if (document.visibilityState === "hidden") flushSync(stopFromWindow);
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
      className={className}
      aria-label={ariaLabel}
      data-held={held || undefined}
      style={{ "--duracion": `${durationMs}ms` } as React.CSSProperties}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // La captura mantiene el gesto aunque el dedo resbale fuera del botón.
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerUp={stop}
      // Sin esto, al soltar salta un clic en lo que haya aparecido bajo el dedo, como «Pasar el móvil».
      onTouchEnd={(event) => event.preventDefault()}
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
      {children}
    </button>
  );
}
