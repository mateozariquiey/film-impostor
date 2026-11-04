"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { LOCALE_PATHS } from "@/lib/locale";
import { MESSAGES } from "@/messages";

function Loading() {
  const locale = usePathname() === LOCALE_PATHS.en ? "en" : "es";
  return (
    <p className="preparando" role="status">
      {MESSAGES[locale].loading}
    </p>
  );
}

// Los ajustes viven en el navegador, así que el juego solo se pinta allí.
const Game = dynamic(() => import("@/components/Game").then((mod) => mod.Game), {
  ssr: false,
  loading: Loading,
});

export function Home() {
  return (
    <main>
      <Game />
    </main>
  );
}
