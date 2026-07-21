// Root layout is a passthrough shell; <html>/<body> are rendered by the
// [locale] layout so that lang/dir can be set from the active locale.
// CSS import order matters: Tailwind first, then LTR design, then RTL overrides.
import "./globals.css";
import "./design.css";
import "./rtl.css";
import type { ReactNode, ReactElement } from "react";

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children as ReactElement;
}
