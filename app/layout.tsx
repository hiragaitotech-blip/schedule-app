import Link from "next/link";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/src/components/layout/Navbar";
import { ToastProvider } from "@/src/contexts/ToastContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Interview Scheduler",
  description: "AIを使った面接日程調整SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gradient-to-br from-slate-50 via-white to-blue-50/30 antialiased`}
      >
        <ToastProvider>
          <div className="min-h-screen">
            <Navbar />
            <main>{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
