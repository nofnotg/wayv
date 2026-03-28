import type { Metadata } from "next";
import { Newsreader, Noto_Sans_KR } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { getViewerContext } from "@/lib/services/viewer-service";

import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader"
});

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr"
});

export const metadata: Metadata = {
  title: "wayv",
  description: "실패를 말해도 되는 흐름으로 바꾸는 경험 공유 플랫폼"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewerContext();

  return (
    <html lang="ko">
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased`}>
        <AppShell viewer={viewer}>{children}</AppShell>
      </body>
    </html>
  );
}
