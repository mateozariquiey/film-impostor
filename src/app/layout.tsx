import type { Metadata, Viewport } from "next";
import { Chivo } from "next/font/google";
import "./globals.css";

const fuente = Chivo({ subsets: ["latin"], variable: "--fuente" });

const title = "Film Impostor";
const description =
  "Todos ven la misma película, menos uno. Un juego de deducción para jugar en grupo con un solo móvil.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title,
  },
  openGraph: { title, description, type: "website", locale: "es_ES", siteName: title },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eeeee8" },
    { media: "(prefers-color-scheme: dark)", color: "#1b2220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={fuente.variable}>
      <body>{children}</body>
    </html>
  );
}
