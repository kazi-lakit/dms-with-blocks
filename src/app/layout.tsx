import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vault — Document Management",
  description: "Store, organize, and share your files.",
};

// Runs before paint, before React hydrates — sets data-theme synchronously so there's
// no flash of the wrong theme. Static, inline-authored string (no user input), so this
// dangerouslySetInnerHTML is safe.
const SET_INITIAL_THEME = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_INITIAL_THEME }} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
