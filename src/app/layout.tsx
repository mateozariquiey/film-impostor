import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
