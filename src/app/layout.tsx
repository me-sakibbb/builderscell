import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter_Tight } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

/** Reserved for codes, IDs and figures - never for body copy or labels. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Builders' Cell | Robotics community in Bangladesh",
  description:
    "Robotics bootcamp, a nine-month robotics lab and a genuine-parts shop. Bangladesh's robotics revolution starts in one room.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#07090a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${interTight.variable} ${plexMono.variable} antialiased`}
    >
      <body className="grain">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
