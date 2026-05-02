"use client";

import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ToastContainer from "@/components/ToastContainer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} bg-gray-50 text-cashmere-black font-sans`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <LanguageProvider>
            {children}
            <ToastContainer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

