import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AppShell from "@/components/AppShell";
import { Poppins } from "next/font/google";

export const metadata: Metadata = {
  title: "Yachtdrop",
  description: "Mobile-first online chandlery",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b1220",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yachtdrop",
  },
  icons: {
    icon: "/icons/icon.png",
    apple: "/icons/icon.png",
  },
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
