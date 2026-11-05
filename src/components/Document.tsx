import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";
import { LOCALE_PATHS, MANIFEST_PATHS } from "@/lib/locale";
import { MESSAGES } from "@/messages";
import type { Locale } from "@/types";
import "@/app/globals.css";

// Variable también en anchura: la misma familia hace el texto normal y los titulares estrechos de cartel.
const fuente = Archivo({ subsets: ["latin"], variable: "--fuente", axes: ["wdth"] });

const title = "Film Impostor";

/** Cada idioma tiene su dirección porque quien lee los metadatos, al compartir un enlace, no ejecuta JavaScript. */
export function siteMetadata(locale: Locale): Metadata {
  const { description } = MESSAGES[locale].meta;
  return {
    title,
    description,
    applicationName: title,
    manifest: MANIFEST_PATHS[locale],
    alternates: {
      canonical: LOCALE_PATHS[locale],
      languages: { es: LOCALE_PATHS.es, en: LOCALE_PATHS.en },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
      alternateLocale: locale === "es" ? "en_US" : "es_ES",
      siteName: title,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export function Document({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={fuente.variable}>
      <body>{children}</body>
    </html>
  );
}
