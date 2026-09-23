"use client";

import dynamic from "next/dynamic";

const Game = dynamic(
  () => import("@/components/Game").then((mod) => mod.Game),
  {
    ssr: false,
    loading: () => (
      <p className="loading-message" role="status">
        Preparando la sesión…
      </p>
    ),
  },
);

export default function Home() {
  return (
    <main className="app-shell">
      <Game />
    </main>
  );
}
