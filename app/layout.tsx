import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-gray-100 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}