// app/layout.tsx
import { Footer } from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import Providers from "@/components/Providers";
import { UserDataProvider } from "@/context/userDataContext"; // if this is a client provider move it inside Providers
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets : ['latin'] });

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
          <UserDataProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </UserDataProvider>
        </Providers>

        <div id="clerk-captcha" />
      </body>
    </html>
  );
}
