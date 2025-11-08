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
  title: "Fatima Boutique",
  description: "Fatima Boutique ECom store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {/* Wrapping everything that needs client-only providers */}
        <Providers>
          <UserAssetsProvider>
            {/* Enhanced Animated Background Component */}
            <div className="fixed inset-0 -z-10">
              <AnimatedBackground />
            </div>

            {/* Main content with smooth transitions - removed motion wrappers */}
            <div className="relative z-10 min-h-screen flex flex-col">
              {/* Navbar */}
              <Navbar />
              
              {/* Main content */}
              <main className="flex-1">
                {children}
              </main>
              
              {/* Footer */}
              <Footer />
            </div>
          </UserAssetsProvider>
        </Providers>

        <div id="clerk-captcha" />
      </body>
    </html>
  );
}