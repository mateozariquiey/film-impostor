import type { ReactNode } from "react";
import { Document, siteMetadata, siteViewport } from "@/components/Document";

export const metadata = siteMetadata("en");
export const viewport = siteViewport;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <Document locale="en">{children}</Document>;
}
