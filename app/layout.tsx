import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fhenix Confidential Portal",
  description: "Next.js Confidential dApp on Fhenix Helium Testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#0b0f19] text-slate-100 flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
