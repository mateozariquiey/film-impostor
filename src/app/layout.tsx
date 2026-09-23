import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Film Impostor",
  description:
    "Juego de deducción con películas para jugar en grupo con un solo móvil.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Film Impostor",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff5c9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${archivo.variable} antialiased`}>{children}</body>
    </html>
  );
}
