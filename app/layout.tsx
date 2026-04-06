import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drinkbro-app.vercel.app"),
  title: "DrinkBro",
  description: "Order your drink, bro",
  openGraph: {
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fdf6ec",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full`}>
      <body className="min-h-full">
        <div className="min-h-full max-w-md mx-auto shadow-xl flex flex-col">
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="px-5 py-4 text-center bg-brew">
            <a
              href="https://github.com/vadim6/drinkbro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-bark transition-colors"
            >
              Made with 🤍 by Vadim Freger
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
