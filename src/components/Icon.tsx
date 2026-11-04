const PATHS = {
  minus: "M3 10h14",
  plus: "M3 10h14M10 3v14",
  chevron: "M7.5 4.5l5.5 5.5-5.5 5.5",
  close: "M4 4l12 12M16 4L4 16",
  check: "M3 10.5l4.5 4.5L17 5.5",
  /** Otra vez: una flecha que vuelve a su sitio. */
  again: "M16.5 10a6.5 6.5 0 1 1-2-4.7M15 1.5v4.2h-4.2",
} as const;

/** Todos los iconos, con la misma rejilla y el mismo trazo que las letras gruesas: puntas rectas y 2 px. */
export function Icon({ name }: { name: keyof typeof PATHS | "hold" }) {
  return (
    <svg
      width={name === "hold" ? 24 : 20}
      height={name === "hold" ? 24 : 20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {name === "hold" ? (
        // Un dedo apoyado: un punto que se queda dentro de su círculo.
        <>
          <circle cx="10" cy="10" r="8" />
          <circle cx="10" cy="10" r="3.5" fill="currentColor" stroke="none" />
        </>
      ) : (
        <path d={PATHS[name]} />
      )}
    </svg>
  );
}
