// app/layout.tsx
import { AnimatedBackground } from "@/components/common/AnimatedBackground";
import { Footer } from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import Providers from "@/components/Providers";
import { UserAssetsProvider } from "@/context/userDataContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Fatima Botique",
  description: "Fatima Botique ECom store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrapping everything that needs client-only providers */}
        <Providers>
          <UserAssetsProvider>
            {/* Animated Background Component */}
            <AnimatedBackground />

            {/* Main content with relative positioning */}
            <div className="relative z-10 min-h-screen flex flex-col md:overflow-y-hidden">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </UserAssetsProvider>
        </Providers>

        <div id="clerk-captcha" />
      </body>
    </html>
  );
}