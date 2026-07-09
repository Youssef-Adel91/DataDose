import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Data Dose — Smart Clinical Decision Support System",
  description:
    "A modern AI-powered clinical decision support system that helps doctors and pharmacists analyze prescriptions, detect drug interactions, and suggest safer alternatives.",
  keywords: [
    "CDSS",
    "clinical decision support",
    "drug interactions",
    "AI healthcare",
    "prescription safety",
  ],
};

import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Global toast notifications — wired to Kafka FDA alerts in Sprint 2 */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 6000,
            style: { fontFamily: "var(--font-inter)" },
          }}
        />
      </body>
    </html>
  );
}
