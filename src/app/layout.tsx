import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

const inter = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Untitled",
  description: "Dive into reality TV!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="w-full bg-gray-200"> 
            <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 mx-auto">
              <Navbar/>
            </div>
          </div>
          <div className="min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800">
            <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 mx-auto">
              {children}
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}