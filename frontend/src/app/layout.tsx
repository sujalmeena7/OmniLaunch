import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { RootErrorBoundary } from "@/components/ui/ErrorBoundary";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "OmniLaunch — Launch Everywhere, Sound Like You",
  description:
    "Clone your writing voice. Turn one product description into perfectly compliant, human-sounding posts for Reddit, Hacker News, IndieHackers, and Product Hunt.",
  keywords: ["product launch", "SaaS", "AI writing", "voice cloning", "Reddit", "Hacker News", "Product Hunt"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  var stored = null;
  try { stored = localStorage.getItem('omnilaunch_theme'); } catch(e) {}
  var theme = (stored === 'dark' || stored === 'light')
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.add('no-transition');
})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <RootErrorBoundary>
            {children}
          </RootErrorBoundary>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
