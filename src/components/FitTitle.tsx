import { useLayoutEffect, useRef } from "react";
import styles from "./FitTitle.module.css";

interface Props {
  text: string;
  /** Tamaño máximo en píxeles. */
  max?: number;
}

const MIN_SIZE = 16;

/** Ajusta el texto al mayor tamaño que quepa en su caja, sin partir palabras. */
export function FitTitle({ text, max = 104 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const boxEl = box.current;
    const titleEl = title.current;
    if (!boxEl || !titleEl) return;

    const fits = (size: number) => {
      titleEl.style.fontSize = `${size}px`;
      return titleEl.scrollWidth <= boxEl.clientWidth && titleEl.offsetHeight <= boxEl.clientHeight;
    };
    const fit = () => {
      let low = MIN_SIZE;
      let high = max;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (fits(middle)) low = middle;
        else high = middle - 1;
      }
      titleEl.style.fontSize = `${low}px`;
    };

    fit();
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(boxEl);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [text, max]);

  return (
    <div ref={box} className={styles.caja}>
      <p ref={title} className={styles.titulo}>
        {text}
      </p>
    </div>
  );
}
