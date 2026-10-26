import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "InterviewForge AI — Software Engineering Hiring Simulator",
  description:
    "Production-quality AI interview simulator simulating 4 realistic technical and behavioral hiring rounds for TCS, Capgemini, service, and product-based companies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0f17] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-gray-800/80 bg-gray-950/60 py-6 text-center text-xs text-gray-500">
              <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p>InterviewForge AI © 2026. Built for realistic placement & tech hiring preparation.</p>
                <div className="flex items-center gap-4 text-gray-400">
                  <span>Groq AI Ready</span>
                  <span>•</span>
                  <span>OnlineCompiler.io Enabled</span>
                  <span>•</span>
                  <span>Offline Seeded Bank</span>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
