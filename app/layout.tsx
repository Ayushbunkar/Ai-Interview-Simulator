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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('interviewforge-theme');
                  var theme = saved === 'light' ? 'light' : 'dark';
                  var root = document.documentElement;
                  if (theme === 'light') {
                    root.classList.add('light');
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                  } else {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-600 selection:text-white transition-colors duration-150">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/[0.08] bg-slate-950/70 py-6 text-center text-xs text-slate-400 transition-colors">
              <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p>InterviewForge AI © 2026. Built for realistic placement & tech hiring preparation.</p>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>Production AI Ready</span>
                  <span>•</span>
                  <span>Interactive Speech Drill</span>
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
