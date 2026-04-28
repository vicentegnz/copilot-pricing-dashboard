import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fontCalSans = localFont({
  src: "../../../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal-sans",
});

export const metadata: Metadata = {
  title: "Copilot-Pricing-Dashboard",
  description: "GitHub Copilot CLI Analytics Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontCalSans.variable} dark`}
    >
      <body className="bg-background text-foreground min-h-screen flex">
        <TooltipProvider>
          <Sidebar />
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
