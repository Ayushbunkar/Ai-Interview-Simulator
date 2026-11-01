import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "InterviewForge AI — Technical Hiring Simulator & Speech Drill",
  description:
    "Enterprise-grade software engineering hiring simulator for FAANG, product, and tier-1 tech companies.",
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
                  var saved = localStorage.getItem('interviewforge-theme') || 'dark';
                  var isDark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.setAttribute('data-theme', 'dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                    root.setAttribute('data-theme', 'light');
                    root.style.colorScheme = 'light';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-500/20 selection:text-foreground transition-colors duration-150 flex flex-col">
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <footer className="border-t border-border bg-card/60 py-5 text-xs text-muted-foreground transition-colors mt-auto">
              <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">InterviewForge AI</span>
                  <span>© 2026. Built for realistic placement & tech hiring preparation.</span>
                </p>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Made with</span>
                  <span className="text-red-500 animate-pulse text-sm inline-block">❤️</span>
                  <span>by</span>
                  <span className="author-badge font-semibold px-2.5 py-0.5 rounded-full border border-border bg-background shadow-xs text-foreground">
                    Ayush Bunkar
                  </span>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
