import type { Metadata, Viewport } from "next";
import { Anybody, Doto } from "next/font/google";
import "./globals.css";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Solo para los números de fotograma, que imitan la impresión del borde de la película.
const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: ["800"],
});

const title = "Film Impostor";
const description =
  "Todos ven la misma película, menos uno. Un juego de deducción para jugar en grupo con un solo móvil.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title,
  },
  openGraph: { title, description, type: "website", locale: "es_ES", siteName: title },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#140302",
};

// Aplica el tema guardado antes de pintar, para que no parpadee la luz roja.
const THEME_SCRIPT = `try{if(localStorage.getItem("film-impostor-theme")==="dia")document.documentElement.dataset.theme="dia"}catch{}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${anybody.variable} ${doto.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
