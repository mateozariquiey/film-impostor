"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadLocale, LOCALE_PATHS, MANIFEST_PATHS, saveLocale } from "@/lib/locale";
import { MESSAGES } from "@/messages";
import type { Messages } from "@/messages/es";
import type { Locale } from "@/types";

interface LocaleContextValue {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * El idioma que ve el grupo. La página llega en el de su dirección, y aquí se alinea con el de
 * verdad (lo elegido o el del navegador), de modo que el enlace que se copie enseñe a quien lo
 * reciba la tarjeta en ese idioma.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.querySelector('link[rel="manifest"]')?.setAttribute("href", MANIFEST_PATHS[locale]);
    if (window.location.pathname !== LOCALE_PATHS[locale]) {
      window.history.replaceState(window.history.state, "", LOCALE_PATHS[locale]);
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    saveLocale(next);
    setLocaleState(next);
  };

  return (
    <LocaleContext.Provider value={{ locale, t: MESSAGES[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale debe usarse dentro de LocaleProvider");
  return context;
}
