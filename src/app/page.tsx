"use client";

import dynamic from "next/dynamic";

// Los ajustes viven en el navegador, así que el juego solo se pinta allí.
const Game = dynamic(
  () => import("@/components/Game").then((mod) => mod.Game),
  {
    ssr: false,
    loading: () => (
      <p className="preparando" role="status">
        Cargando…
      </p>
    ),
  },
);

export default function Home() {
  return (
    <main>
      <Game />
    </main>
  );
}
