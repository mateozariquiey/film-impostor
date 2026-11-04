import type { ReactNode } from "react";
import { Document, siteMetadata, siteViewport } from "@/components/Document";

export const metadata = siteMetadata("es");
export const viewport = siteViewport;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <Document locale="es">{children}</Document>;
}
