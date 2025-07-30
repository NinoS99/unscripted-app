import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "unscripted",
  description: "Dive into reality TV!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen bg-gray-900">
            <div className=" bg-gray-900"> 
              <div className="lg:px-16 xl:px-32 2xl:px-64 mx-auto w-full">
                <Navbar/>
              </div>
            </div>
            <div className="flex-grow">
              <div className="md:px-8 lg:px-16 xl:px-32 2xl:px-64 mx-auto w-full">
                {children}
              </div>
            </div>
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}